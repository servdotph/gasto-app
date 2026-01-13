import { supabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ExpenseRow = {
  id: string;
  description: string;
  amount: number;
  category_id?: string | null;
  category: string | null;
  created_at: string;
};

// Backwards-compatible alias used by existing UI.
export type AddedExpense = {
  id: string;
  description: string;
  amount: number;
  dateLabel: string;
  createdAt: number;
  category?: string | null;
};

type Listener = () => void;

let expenseRows: ExpenseRow[] = [];
let lastError: string | null = null;
let hydrated = false;
let hydrating = false;
let realtimeStarted = false;

// When the optional `category` column doesn't exist yet, we still want the UI to
// reflect what the user selected during this session (even across refreshes).
//
// NOTE: The preferred storage is `expenses.category_id` (FK -> categories.id).
// These caches are only used as a best-effort UI fallback if the backend schema
// is missing columns/relationships or if category lookup fails.
const transientCategoryById = new Map<string, string>();

// Persisted fallback for app reloads (used when the backend column is missing).
const CATEGORY_CACHE_KEY = "gasto.expenseCategoryById.v1";
let persistedCategoryById: Record<string, string> | null = null;

type CategoryRow = { id: string; name: string };

let detectedCategoryTable: "categories" | "category" | null = null;

function isMissingTableError(message: string) {
  const m = message.toLowerCase();
  return (
    m.includes("does not exist") ||
    m.includes("relation") ||
    m.includes("schema cache")
  );
}

async function detectCategoryTableName() {
  if (detectedCategoryTable) return detectedCategoryTable;

  // Common names: `categories` (plural) or `category` (singular)
  const candidates: Array<"categories" | "category"> = [
    "categories",
    "category",
  ];

  for (const table of candidates) {
    const probe = await supabase.from(table).select("id").limit(1);
    if (!probe.error) {
      detectedCategoryTable = table;
      return table;
    }
  }

  // Default to plural; callers will surface the actual error.
  detectedCategoryTable = "categories";
  return detectedCategoryTable;
}

async function resolveCategoryIdByName(categoryName: string) {
  const trimmed = categoryName.trim();
  if (!trimmed) return { ok: true as const, id: null as string | null };

  const table = await detectCategoryTableName();

  // Try exact match first.
  const exact = await supabase
    .from(table)
    .select("id, name")
    .eq("name", trimmed)
    .limit(1)
    .maybeSingle();

  if (exact.error) {
    // If the table name is wrong, surface a clearer error.
    if (isMissingTableError(exact.error.message)) {
      return {
        ok: false as const,
        error:
          "Category table not found in Supabase. Expected a `categories` or `category` table with columns (id, name).",
      };
    }
    return { ok: false as const, error: exact.error.message };
  }
  if (exact.data?.id) return { ok: true as const, id: String(exact.data.id) };

  // Fallback to case-insensitive match.
  const ilike = await supabase
    .from(table)
    .select("id, name")
    .ilike("name", trimmed)
    .limit(1)
    .maybeSingle();

  if (ilike.error) return { ok: false as const, error: ilike.error.message };
  if (ilike.data?.id) return { ok: true as const, id: String(ilike.data.id) };

  return {
    ok: false as const,
    error:
      "Selected category was not found in the database. Make sure the category names in Supabase match the app's category list.",
  };
}

async function fetchCategoryNamesById(ids: string[]) {
  const unique = Array.from(new Set(ids.map((x) => x.trim()).filter(Boolean)));
  if (!unique.length)
    return { ok: true as const, map: new Map<string, string>() };

  const table = await detectCategoryTableName();
  const res = await supabase.from(table).select("id, name").in("id", unique);

  if (res.error) {
    return { ok: false as const, error: res.error.message };
  }

  const map = new Map<string, string>();
  for (const row of (res.data ?? []) as unknown as CategoryRow[]) {
    const id = String(row.id);
    const name = typeof row.name === "string" ? row.name : "";
    if (id && name) map.set(id, name);
  }

  return { ok: true as const, map };
}

async function getPersistedCategoryMap() {
  if (persistedCategoryById) return persistedCategoryById;
  try {
    const raw = await AsyncStorage.getItem(CATEGORY_CACHE_KEY);
    if (!raw) {
      persistedCategoryById = {};
      return persistedCategoryById;
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") {
      persistedCategoryById = {};
      return persistedCategoryById;
    }

    // Only keep string values.
    const safe: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v === "string" && v.trim()) safe[String(k)] = v;
    }
    persistedCategoryById = safe;
    return persistedCategoryById;
  } catch {
    persistedCategoryById = {};
    return persistedCategoryById;
  }
}

async function persistCategoryForId(id: string, category: string) {
  const trimmedId = id.trim();
  const trimmedCategory = category.trim();
  if (!trimmedId || !trimmedCategory) return;

  try {
    const map = await getPersistedCategoryMap();
    if (map[trimmedId] === trimmedCategory) return;
    map[trimmedId] = trimmedCategory;
    await AsyncStorage.setItem(CATEGORY_CACHE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

async function removePersistedCategoryForId(id: string) {
  const trimmedId = id.trim();
  if (!trimmedId) return;

  try {
    const map = await getPersistedCategoryMap();
    if (!(trimmedId in map)) return;
    delete map[trimmedId];
    await AsyncStorage.setItem(CATEGORY_CACHE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener();
}

function sortExpensesNewestFirst(items: ExpenseRow[]) {
  return [...items].sort((a, b) => {
    const ac = Date.parse(a.created_at);
    const bc = Date.parse(b.created_at);
    if (Number.isFinite(ac) && Number.isFinite(bc) && bc !== ac) return bc - ac;
    return String(b.id).localeCompare(String(a.id));
  });
}

export function getExpensesError() {
  return lastError;
}

export function getExpenseRows() {
  return expenseRows;
}

// Compatibility: existing screens read from this.
export function getAddedExpenses(): AddedExpense[] {
  return expenseRows.map((row) => ({
    id: row.id,
    description: row.description,
    amount: row.amount,
    dateLabel: formatShortDate(new Date(row.created_at)),
    createdAt: Date.parse(row.created_at) || Date.now(),
    category: row.category,
  }));
}

export function subscribeAddedExpenses(listener: Listener) {
  listeners.add(listener);
  // Lazy-init when the first subscriber appears.
  void ensureExpensesHydrated();
  void ensureRealtime();
  return () => {
    listeners.delete(listener);
  };
}

export function clearAddedExpenses() {
  // Kept for compatibility. In Supabase mode, this only clears local cache.
  expenseRows = [];
  hydrated = true;
  lastError = null;
  emit();
}

export async function refreshExpenses() {
  try {
    lastError = null;
    const first = await supabase
      .from("expenses")
      .select("id, description, amount, category_id, created_at")
      .order("created_at", { ascending: false })
      .limit(250);

    if (first.error) {
      // If the project hasn't added `category_id` yet, fallback to a select
      // that doesn't reference it, and use the local cache as a best-effort UI
      // fallback.
      if (isMissingColumnError(first.error.message, "category_id")) {
        const existingCategoryById = new Map(
          expenseRows.map((r) => [String(r.id), r.category] as const)
        );
        const persisted = await getPersistedCategoryMap();

        const fallback = await supabase
          .from("expenses")
          .select("id, description, amount, created_at")
          .order("created_at", { ascending: false })
          .limit(250);

        if (fallback.error) {
          lastError = fallback.error.message;
          return { ok: false as const, error: fallback.error.message };
        }

        const rows = (fallback.data ?? []).map((r) => {
          const row = r as Omit<ExpenseRow, "category">;
          const id = String((row as unknown as { id: string }).id);
          const existingCategory = existingCategoryById.get(id);
          const transientCategory = transientCategoryById.get(id);
          return {
            ...(row as unknown as Omit<ExpenseRow, "category">),
            category:
              existingCategory ?? transientCategory ?? persisted[id] ?? null,
          } as ExpenseRow;
        });
        expenseRows = sortExpensesNewestFirst(rows as ExpenseRow[]);
      } else {
        lastError = first.error.message;
        return { ok: false as const, error: first.error.message };
      }
    } else {
      const rowsRaw = (first.data ?? []) as Array<
        Omit<ExpenseRow, "category"> & { category_id?: string | null }
      >;

      const categoryIds = rowsRaw
        .map((r) => (r.category_id ? String(r.category_id) : ""))
        .filter(Boolean);
      const nameLookup = await fetchCategoryNamesById(categoryIds);

      const persisted = await getPersistedCategoryMap();

      expenseRows = sortExpensesNewestFirst(
        rowsRaw.map((r) => {
          const id = String(r.id);
          const catId = r.category_id ? String(r.category_id) : null;

          // Prefer DB lookup via category_id.
          const fromDb =
            catId && nameLookup.ok ? nameLookup.map.get(catId) : undefined;

          // Fallback (only if lookup fails / categories table missing)
          const transient = transientCategoryById.get(id);
          const cached = persisted[id];

          return {
            ...(r as unknown as Omit<ExpenseRow, "category">),
            category_id: catId,
            category: fromDb ?? transient ?? cached ?? null,
          } as ExpenseRow;
        })
      );
    }

    hydrated = true;
    emit();
    return { ok: true as const };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch expenses";
    lastError = message;
    return { ok: false as const, error: message };
  }
}

async function ensureExpensesHydrated() {
  if (hydrated || hydrating) return;
  hydrating = true;
  try {
    await refreshExpenses();
  } finally {
    hydrating = false;
  }
}

async function ensureRealtime() {
  if (realtimeStarted) return;
  realtimeStarted = true;

  // Best-effort realtime. If Realtime isn't enabled for the table,
  // the app still functions via manual refresh after writes.
  try {
    const channel = supabase
      .channel("expenses-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expenses" },
        () => {
          void refreshExpenses();
        }
      );

    // Fire-and-forget; caller doesn't need to await.
    channel.subscribe();
  } catch {
    // ignore
  }
}

export async function addExpense(input: {
  description: string;
  amount: number;
  category?: string | null;
}) {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) {
    lastError = authError.message;
    return { ok: false as const, error: authError.message };
  }
  const user = authData.user;
  if (!user) {
    const message = "You must be signed in to add expenses.";
    lastError = message;
    return { ok: false as const, error: message };
  }

  const description = input.description.trim() || "Expense";
  const amount = Number.isFinite(input.amount) ? input.amount : 0;
  const categoryTrimmed = (input.category ?? "").trim();

  let resolvedCategoryId: string | null = null;
  if (categoryTrimmed) {
    const resolved = await resolveCategoryIdByName(categoryTrimmed);
    if (!resolved.ok) {
      lastError = resolved.error;
      return { ok: false as const, error: resolved.error };
    }
    resolvedCategoryId = resolved.id;
  }

  const payload: {
    description: string;
    amount: number;
    user_id: string;
    category_id?: string | null;
  } = {
    description,
    amount,
    user_id: user.id,
  };
  // Store category FK when provided.
  // Omit the column when empty so inserts still succeed.
  if (resolvedCategoryId) payload.category_id = resolvedCategoryId;

  // First try (with category if provided)
  let data: ExpenseRow | null = null;
  const first = await supabase
    .from("expenses")
    .insert(payload)
    .select("id, description, amount, category_id, created_at")
    .single();

  if (first.error) {
    // If the category_id column isn't created yet, retry without it.
    if (isMissingColumnError(first.error.message, "category_id")) {
      const retryPayload = { description, amount, user_id: user.id };
      const retry = await supabase
        .from("expenses")
        .insert(retryPayload)
        .select("id, description, amount, created_at")
        .single();

      if (retry.error) {
        lastError = retry.error.message;
        return { ok: false as const, error: retry.error.message };
      }

      data = {
        ...(retry.data as unknown as Omit<ExpenseRow, "category">),
        // Even if the backend column isn't available yet, keep the user's
        // chosen category in-memory so the UI reflects what they selected.
        category: categoryTrimmed ? categoryTrimmed : null,
      } as ExpenseRow;

      if (data?.id && categoryTrimmed) {
        transientCategoryById.set(String(data.id), categoryTrimmed);
        await persistCategoryForId(String(data.id), categoryTrimmed);
      }
    } else {
      lastError = first.error.message;
      return { ok: false as const, error: first.error.message };
    }
  } else {
    const row = first.data as unknown as Omit<ExpenseRow, "category"> & {
      category_id?: string | null;
    };
    data = {
      ...row,
      category_id: row.category_id ? String(row.category_id) : null,
      // We already know what the user selected; this is display-only.
      // On refresh, we hydrate from categories table via category_id.
      category: categoryTrimmed ? categoryTrimmed : null,
    } as ExpenseRow;
  }

  // If a category was chosen but the backend didn't store/return it,
  // persist locally so it survives app reloads.
  if (data?.id && categoryTrimmed && !data.category) {
    transientCategoryById.set(String(data.id), categoryTrimmed);
    await persistCategoryForId(String(data.id), categoryTrimmed);
  }

  if (data) {
    expenseRows = sortExpensesNewestFirst([data as ExpenseRow, ...expenseRows]);
    hydrated = true;
    emit();
  } else {
    void refreshExpenses();
  }

  return { ok: true as const, id: data?.id as string | undefined };
}

function isMissingColumnError(message: string, columnName: string) {
  const m = message.toLowerCase();
  const c = columnName.toLowerCase();
  return (
    (m.includes("schema cache") && m.includes(c)) ||
    (m.includes("does not exist") && m.includes(c)) ||
    (m.includes("column") && m.includes(c) && m.includes("does not exist"))
  );
}

export async function deleteExpense(id: string) {
  const trimmed = id.trim();
  if (!trimmed) return { ok: false as const, error: "Missing expense id" };

  transientCategoryById.delete(trimmed);
  void removePersistedCategoryForId(trimmed);

  const previous = expenseRows;
  expenseRows = expenseRows.filter((e) => e.id !== trimmed);
  emit();

  const { error } = await supabase.from("expenses").delete().eq("id", trimmed);
  if (error) {
    // rollback
    expenseRows = previous;
    emit();
    lastError = error.message;
    return { ok: false as const, error: error.message };
  }

  return { ok: true as const };
}

export function parseAmount(input: string) {
  // Accept values like "$23.2", "₱ 23", "23.00".
  const normalized = input.replace(/[^0-9.]/g, "");
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : 0;
}

export function normalizeAmountInput(input: string) {
  // Keep only digits and a single dot, and clamp to 2 decimals.
  const cleaned = input.replace(/[^0-9.]/g, "");
  const firstDot = cleaned.indexOf(".");
  if (firstDot === -1) return cleaned;
  const before = cleaned.slice(0, firstDot);
  const afterRaw = cleaned.slice(firstDot + 1).replace(/\./g, "");
  const after = afterRaw.slice(0, 2);
  return `${before}.${after}`;
}

export function formatCurrencyInputPHP(input: string) {
  const normalized = normalizeAmountInput(input);
  if (!normalized) return "";
  const value = Number.parseFloat(normalized);
  if (!Number.isFinite(value)) return "";

  // If user is still typing decimals, preserve that state.
  if (normalized.endsWith(".")) {
    return `₱${formatNumberWithCommas(normalized.slice(0, -1))}.`;
  }
  const dot = normalized.indexOf(".");
  if (dot >= 0) {
    const intPart = normalized.slice(0, dot);
    const decPart = normalized.slice(dot + 1);
    return `₱${formatNumberWithCommas(intPart)}.${decPart}`;
  }
  return `₱${formatNumberWithCommas(normalized)}`;
}

function formatNumberWithCommas(digits: string) {
  const safe = digits.replace(/^0+(\d)/, "$1");
  return safe.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function formatCurrencyPHP(amount: number) {
  const safe = Number.isFinite(amount) ? amount : 0;
  try {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      currencyDisplay: "symbol",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(safe);
  } catch {
    return `₱${safe.toFixed(2)}`;
  }
}

export function formatShortDate(date: Date) {
  // Jan 14
  const parts = date
    .toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
    .split(" ");
  return parts.join(" ");
}

export function formatISODate(date: Date) {
  // YYYY-MM-DD in local time.
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}
