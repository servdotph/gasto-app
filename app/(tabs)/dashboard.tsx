import { MaterialIcons } from "@expo/vector-icons";
import { Redirect } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  UIManager,
  View,
} from "react-native";

import { BOTTOM_NAVBAR_HEIGHT } from "@/components/bottom-navbar";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { EXPENSE_CATEGORIES } from "@/constants/expense-categories";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  deleteExpense,
  formatCurrencyPHP,
  formatShortDate,
  getExpenseRows,
  refreshExpenses,
  subscribeAddedExpenses,
  type ExpenseRow,
} from "@/lib/expenses-store";
import { fetchProfileById } from "@/lib/profiles";
import { supabase } from "@/lib/supabase";

type DashboardState = {
  loading: boolean;
  error: string | null;
  isAuthed: boolean;
  name: string;
};

type CategoryFilter = "ALL" | (typeof EXPENSE_CATEGORIES)[number];

export default function DashboardScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];

  const [state, setState] = useState<DashboardState>({
    loading: true,
    error: null,
    isAuthed: false,
    name: "",
  });

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("ALL");
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);

  const [expenseRows, setExpenseRows] = useState<ExpenseRow[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(false);

  useEffect(() => {
    if (Platform.OS === "android") {
      // Enable LayoutAnimation on Android.
      if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
      }
    }
  }, []);

  useEffect(() => {
    setExpenseRows(getExpenseRows());
    return subscribeAddedExpenses(() => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setExpenseRows(getExpenseRows());
    });
  }, []);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const { data, error } = await supabase.auth.getUser();
      if (!mounted) return;

      if (error) {
        setState({
          loading: false,
          error: error.message,
          isAuthed: false,
          name: "",
        });
        return;
      }

      const user = data.user;
      if (!user) {
        setState({ loading: false, error: null, isAuthed: false, name: "" });
        return;
      }

      let displayName = "";
      try {
        const profile = await fetchProfileById(user.id);
        displayName = profile?.full_name ?? "";
      } catch {
        displayName = "";
      }

      setState({
        loading: false,
        error: null,
        isAuthed: true,
        name: displayName,
      });
    }

    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const greetingName = useMemo(() => {
    const trimmed = state.name.trim();
    if (!trimmed) return "";
    return trimmed.split(/\s+/)[0] ?? trimmed;
  }, [state.name]);

  useEffect(() => {
    let mounted = true;
    async function loadExpenses() {
      if (!state.isAuthed) return;
      setExpensesLoading(true);
      try {
        await refreshExpenses();
      } finally {
        if (mounted) setExpensesLoading(false);
      }
    }

    void loadExpenses();
    return () => {
      mounted = false;
    };
  }, [state.isAuthed]);

  const searchNormalized = useMemo(() => search.trim().toLowerCase(), [search]);

  const filteredRecent = useMemo(() => {
    const byCategory =
      categoryFilter === "ALL"
        ? expenseRows
        : expenseRows.filter((e) => e.category === categoryFilter);

    if (!searchNormalized) return byCategory;
    return byCategory.filter((e) => {
      const d = e.description.toLowerCase();
      const c = (e.category ?? "").toLowerCase();
      return d.includes(searchNormalized) || c.includes(searchNormalized);
    });
  }, [categoryFilter, expenseRows, searchNormalized]);

  const todayTotal = useMemo(() => {
    const todayKey = dateKeyLocal(new Date());
    return expenseRows
      .filter((e) => dateKeyLocal(parseISOTimestampLocal(e.created_at)) === todayKey)
      .reduce((sum, e) => sum + (Number.isFinite(e.amount) ? e.amount : 0), 0);
  }, [expenseRows]);

  const weekTotal = useMemo(() => {
    const start = startOfWeekLocal(new Date(), 1);
    const end = endOfDayLocal(new Date());
    return expenseRows
      .filter((e) => {
        const d = startOfDayLocal(parseISOTimestampLocal(e.created_at));
        return d >= start && d <= end;
      })
      .reduce((sum, e) => sum + (Number.isFinite(e.amount) ? e.amount : 0), 0);
  }, [expenseRows]);

  const weekCategoryStats = useMemo(() => {
    const start = startOfWeekLocal(new Date(), 1);
    const end = endOfDayLocal(new Date());

    const inWeek = expenseRows.filter((e) => {
      const d = startOfDayLocal(parseISOTimestampLocal(e.created_at));
      return d >= start && d <= end;
    });

    const totals = new Map<string, number>();
    let total = 0;
    for (const e of inWeek) {
      const amt = Number.isFinite(e.amount) ? e.amount : 0;
      total += amt;
      const cat = normalizeCategoryLabel(e.category);
      totals.set(cat, (totals.get(cat) ?? 0) + amt);
    }

    const rows = [...totals.entries()]
      .map(([category, amount]) => ({
        category,
        amount,
        share: total > 0 ? amount / total : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    return { total, rows };
  }, [expenseRows]);

  if (!state.loading && !state.isAuthed && !state.error) {
    return <Redirect href="/landing" />;
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: BOTTOM_NAVBAR_HEIGHT + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.morningRow}>
            <ThemedText
              style={[styles.morningText, { color: themeColors.textSecondary }]}
            >
              Good Morning,
            </ThemedText>
          </View>

          <View style={styles.nameRow}>
            <ThemedText style={styles.nameText}>{greetingName}</ThemedText>
            <ThemedText style={styles.wave}>👋</ThemedText>
          </View>

          <View style={styles.titleBlock}>
            <ThemedText style={styles.appTitle}>Expense Tracker</ThemedText>
            <ThemedText
              style={[styles.appSubtitle, { color: themeColors.textSecondary }]}
            >
              Add expenses and let AI automatically detect the category. Simple,
              fast, and intelligent.
            </ThemedText>
          </View>
        </View>

        {state.loading ? (
          <ThemedText style={styles.bodyText}>Loading...</ThemedText>
        ) : state.error ? (
          <ThemedText style={styles.bodyText}>{state.error}</ThemedText>
        ) : (
          <>
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Total Spent</ThemedText>
              <View style={styles.totalGrid}>
                <View
                  style={[
                    styles.totalCard,
                    { backgroundColor: themeColors.primary },
                  ]}
                >
                  <ThemedText style={styles.totalLabel}>Today</ThemedText>
                  <ThemedText style={styles.totalValue}>
                    {formatCurrencyPHP(todayTotal)}
                  </ThemedText>
                </View>
                <View
                  style={[
                    styles.totalCard,
                    { backgroundColor: themeColors.primary },
                  ]}
                >
                  <ThemedText style={styles.totalLabel}>This Week</ThemedText>
                  <ThemedText style={styles.totalValue}>
                    {formatCurrencyPHP(weekTotal)}
                  </ThemedText>
                </View>
              </View>
              {expensesLoading ? (
                <ThemedText
                  style={[styles.bodyText, { marginTop: 10, opacity: 0.7 }]}
                >
                  Syncing expenses...
                </ThemedText>
              ) : null}
            </View>

            <View style={styles.section}>
              <View
                style={[
                  styles.categoryCard,
                  { backgroundColor: themeColors.surface },
                ]}
              >
                <View style={styles.categoryHeader}>
                  <MaterialIcons
                    name="label"
                    size={18}
                    color={colorScheme === "dark" ? "#FFFFFF" : "#1F2937"}
                    style={{ transform: [{ rotate: "-45deg" }] }}
                  />
                  <ThemedText style={styles.categoryTitle}>
                    By Category
                  </ThemedText>
                </View>

                {weekCategoryStats.rows.length === 0 ? (
                  <ThemedText
                    style={[styles.bodyText, { color: themeColors.textSecondary }]}
                  >
                    No expenses yet this week.
                  </ThemedText>
                ) : (
                  weekCategoryStats.rows.map((row) => (
                    <CategoryRow
                      key={row.category}
                      label={row.category}
                      amount={formatCurrencyPHP(row.amount)}
                      fillPct={row.share}
                      theme={themeColors}
                    />
                  ))
                )}
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.recentHeader}>
                <ThemedText style={styles.sectionTitle}>
                  Recent Expenses
                </ThemedText>
                <Pressable
                  disabled
                  style={({ pressed }) => [{ opacity: pressed ? 0.6 : 0.5 }]}
                >
                  <View style={styles.viewAllRow}>
                    <ThemedText
                      style={[
                        styles.viewAllText,
                        { color: themeColors.textSecondary },
                      ]}
                    >
                      View all
                    </ThemedText>
                    <MaterialIcons
                      name="chevron-right"
                      size={18}
                      color={themeColors.textSecondary}
                    />
                  </View>
                </Pressable>
              </View>

              <View style={styles.filtersRow}>
                <View style={styles.searchWrap}>
                  <MaterialIcons
                    name="search"
                    size={22}
                    color={themeColors.textSecondary}
                    style={styles.searchIcon}
                  />
                  <TextInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search Expenses..."
                    placeholderTextColor={themeColors.textSecondary}
                    style={[
                      styles.searchInput,
                      {
                        backgroundColor:
                          colorScheme === "dark"
                            ? themeColors.surface
                            : "#FFFFFF",
                        borderColor:
                          colorScheme === "dark" ? "#4B5563" : "#D1D5DB",
                        color: themeColors.text,
                      },
                    ]}
                  />
                </View>

                <Pressable
                  onPress={() => setCategoryPickerOpen(true)}
                  style={({ pressed }) => [
                    styles.filterButton,
                    {
                      backgroundColor:
                        colorScheme === "dark"
                          ? themeColors.surface
                          : "#FFFFFF",
                      borderColor:
                        colorScheme === "dark" ? "#4B5563" : "#D1D5DB",
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <MaterialIcons
                    name="label"
                    size={18}
                    color={themeColors.textSecondary}
                    style={{ transform: [{ rotate: "-45deg" }] }}
                  />
                  <ThemedText style={styles.filterText}>
                    {categoryFilter === "ALL" ? "All Categories" : categoryFilter}
                  </ThemedText>
                  <MaterialIcons
                    name="expand-more"
                    size={18}
                    color={themeColors.textSecondary}
                  />
                </Pressable>
              </View>

              <View style={styles.recentList}>
                {filteredRecent.length === 0 ? (
                  <ThemedText
                    style={[styles.bodyText, { color: themeColors.textSecondary }]}
                  >
                    No matching expenses.
                  </ThemedText>
                ) : (
                  filteredRecent.map((item) => (
                    <RecentExpenseRow key={item.id} item={item} />
                  ))
                )}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {categoryPickerOpen ? (
        <CategoryFilterModal
          theme={themeColors}
          value={categoryFilter}
          onClose={() => setCategoryPickerOpen(false)}
          onChange={(next) => {
            setCategoryFilter(next);
            setCategoryPickerOpen(false);
          }}
        />
      ) : null}
    </ThemedView>
  );
}

function CategoryRow({
  label,
  amount,
  fillPct,
  theme,
}: {
  label: string;
  amount: string;
  fillPct: number;
  theme: typeof Colors.light;
}) {
  const accent = getCategoryAccent(label);
  return (
    <View style={styles.catBlock}>
      <View style={styles.catTopRow}>
        <View style={styles.catLeft}>
          <MaterialIcons name={accent.icon} size={14} color={accent.iconColor} />
          <ThemedText style={[styles.catLabel, { color: theme.textSecondary }]}>
            {label}
          </ThemedText>
        </View>
        <ThemedText style={styles.catAmount}>{amount}</ThemedText>
      </View>

      <View
        style={[
          styles.progressTrack,
          { backgroundColor: theme.inputBackground },
        ]}
      >
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: accent.fillColor,
              width: `${Math.round(fillPct * 100)}%`,
            },
          ]}
        />
      </View>
    </View>
  );
}

function RecentExpenseRow({ item }: { item: ExpenseRow }) {
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];

  const categoryLabel = normalizeCategoryLabel(item.category);
  const accent = getCategoryAccent(categoryLabel);

  const bg =
    colorScheme === "dark" ? accent.darkBg : accent.lightBg;
  const fg = colorScheme === "dark" ? accent.darkFg : accent.lightFg;
  const chipBg = colorScheme === "dark" ? accent.chipDarkBg : accent.chipLightBg;
  const chipText =
    colorScheme === "dark" ? accent.chipDarkText : accent.chipLightText;

  return (
    <View style={[styles.recentRow, { backgroundColor: themeColors.surface }]}>
      <View style={styles.recentLeft}>
        <View style={[styles.recentIconWrap, { backgroundColor: bg }]}>
          <MaterialIcons name={accent.icon} size={20} color={fg} />
        </View>

        <View>
          <ThemedText style={styles.recentTitle}>{item.description}</ThemedText>
          <View style={styles.recentMetaRow}>
            <View style={[styles.chip, { backgroundColor: chipBg }]}>
              <ThemedText style={[styles.chipText, { color: chipText }]}>
                {categoryLabel}
              </ThemedText>
            </View>
            <ThemedText
              style={[styles.metaText, { color: themeColors.textSecondary }]}
            >
              {formatShortDate(parseISOTimestampLocal(item.created_at))}
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.recentRight}>
        <ThemedText style={styles.recentAmount}>
          {formatCurrencyPHP(item.amount)}
        </ThemedText>
        <Pressable
          onPress={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            void deleteExpense(item.id);
          }}
          style={({ pressed }) => [
            { opacity: pressed ? 0.7 : 0.4, marginTop: 6 },
          ]}
        >
          <MaterialIcons
            name="delete"
            size={16}
            color={themeColors.textSecondary}
          />
        </Pressable>
      </View>
    </View>
  );
}

function CategoryFilterModal({
  theme,
  value,
  onClose,
  onChange,
}: {
  theme: typeof Colors.light;
  value: CategoryFilter;
  onClose: () => void;
  onChange: (next: CategoryFilter) => void;
}) {
  return (
    <View style={styles.modalOverlay}>
      <Pressable style={styles.modalBackdrop} onPress={onClose} />
      <View style={[styles.modalSheet, { backgroundColor: theme.surface }]}>
        <View style={styles.modalHeaderRow}>
          <ThemedText style={styles.modalTitle}>Filter Category</ThemedText>
          <Pressable onPress={onClose} hitSlop={10}>
            <MaterialIcons name="close" size={18} color={theme.textSecondary} />
          </Pressable>
        </View>

        <Pressable
          onPress={() => onChange("ALL")}
          style={({ pressed }) => [
            styles.modalItem,
            {
              backgroundColor:
                value === "ALL"
                  ? theme.primary
                  : pressed
                  ? theme.inputBackground
                  : "transparent",
            },
          ]}
        >
          <ThemedText style={styles.modalItemText}>All Categories</ThemedText>
        </Pressable>

        {EXPENSE_CATEGORIES.map((c) => (
          <Pressable
            key={c}
            onPress={() => onChange(c)}
            style={({ pressed }) => [
              styles.modalItem,
              {
                backgroundColor:
                  value === c
                    ? theme.primary
                    : pressed
                    ? theme.inputBackground
                    : "transparent",
              },
            ]}
          >
            <ThemedText style={styles.modalItemText}>{c}</ThemedText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function parseISOTimestampLocal(input: string) {
  const parsed = new Date(input);
  return Number.isFinite(parsed.getTime()) ? parsed : new Date();
}

function normalizeCategoryLabel(category: string | null) {
  const trimmed = (category ?? "").trim();
  return trimmed ? trimmed : "Uncategorized";
}

function dateKeyLocal(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function startOfDayLocal(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDayLocal(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function startOfWeekLocal(date: Date, weekStartsOn: 0 | 1) {
  // weekStartsOn: 0 = Sunday, 1 = Monday
  const d = startOfDayLocal(date);
  const day = d.getDay();
  const diff = (day - weekStartsOn + 7) % 7;
  d.setDate(d.getDate() - diff);
  return d;
}

function getCategoryAccent(category: string) {
  const key = category.trim().toLowerCase();
  if (key === "travel") {
    return {
      icon: "flight" as const,
      iconColor: "#60A5FA",
      fillColor: "#818CF8",
      lightBg: "#E0E7FF",
      lightFg: "#6366F1",
      darkBg: "rgba(99,102,241,0.2)",
      darkFg: "#C7D2FE",
      chipLightBg: "#C7D2FE",
      chipLightText: "#3730A3",
      chipDarkBg: "#312E81",
      chipDarkText: "#E0E7FF",
    };
  }
  if (key === "shopping") {
    return {
      icon: "shopping-bag" as const,
      iconColor: "#EC4899",
      fillColor: "#F87171",
      lightBg: "#FEE2E2",
      lightFg: "#EF4444",
      darkBg: "rgba(239,68,68,0.2)",
      darkFg: "#FECACA",
      chipLightBg: "#FECACA",
      chipLightText: "#7F1D1D",
      chipDarkBg: "#7F1D1D",
      chipDarkText: "#FEE2E2",
    };
  }
  if (key === "food" || key === "groceries") {
    return {
      icon: "restaurant" as const,
      iconColor: "#F59E0B",
      fillColor: "#F59E0B",
      lightBg: "#FEF3C7",
      lightFg: "#D97706",
      darkBg: "rgba(245,158,11,0.2)",
      darkFg: "#FCD34D",
      chipLightBg: "#FDE68A",
      chipLightText: "#92400E",
      chipDarkBg: "#78350F",
      chipDarkText: "#FEF3C7",
    };
  }
  if (key === "bills") {
    return {
      icon: "receipt" as const,
      iconColor: "#10B981",
      fillColor: "#10B981",
      lightBg: "#D1FAE5",
      lightFg: "#059669",
      darkBg: "rgba(16,185,129,0.2)",
      darkFg: "#A7F3D0",
      chipLightBg: "#A7F3D0",
      chipLightText: "#065F46",
      chipDarkBg: "#064E3B",
      chipDarkText: "#D1FAE5",
    };
  }
  return {
    icon: "label" as const,
    iconColor: "#94A3B8",
    fillColor: "#94A3B8",
    lightBg: "#E5E7EB",
    lightFg: "#475569",
    darkBg: "rgba(148,163,184,0.18)",
    darkFg: "#CBD5E1",
    chipLightBg: "#E5E7EB",
    chipLightText: "#334155",
    chipDarkBg: "#334155",
    chipDarkText: "#E2E8F0",
  };
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  header: {
    paddingBottom: 8,
  },
  morningRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  morningText: {
    fontSize: 13,
    fontWeight: "600",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  nameText: {
    fontSize: 22,
    fontWeight: "800",
  },
  wave: {
    fontSize: 22,
  },
  titleBlock: {
    marginTop: 18,
  },
  appTitle: {
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  appSubtitle: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 18,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 12,
  },
  totalGrid: {
    flexDirection: "row",
    gap: 12,
  },
  totalCard: {
    flex: 1,
    borderRadius: 24,
    padding: 18,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: "600",
    opacity: 0.85,
    color: "#111111",
  },
  totalValue: {
    marginTop: 6,
    fontSize: 22,
    fontWeight: "900",
    color: "#111111",
  },
  categoryCard: {
    borderRadius: 24,
    padding: 20,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 18,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: "900",
  },
  catBlock: {
    marginBottom: 16,
  },
  catTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  catLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  catLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  catAmount: {
    fontSize: 14,
    fontWeight: "800",
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: 10,
    borderRadius: 999,
  },
  recentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  viewAllRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: "600",
  },
  filtersRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
    marginBottom: 18,
  },
  searchWrap: {
    flex: 1,
    position: "relative",
    justifyContent: "center",
  },
  searchIcon: {
    position: "absolute",
    left: 12,
    zIndex: 1,
  },
  searchInput: {
    height: 44,
    borderRadius: 14,
    paddingLeft: 44,
    paddingRight: 12,
    fontSize: 13,
    borderWidth: 1,
  },
  filterButton: {
    height: 44,
    borderRadius: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  filterText: {
    fontSize: 13,
    fontWeight: "600",
  },
  recentList: {
    gap: 12,
  },
  recentRow: {
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recentLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  recentIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  recentTitle: {
    fontSize: 15,
    fontWeight: "900",
  },
  recentMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  chip: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  chipText: {
    fontSize: 10,
    fontWeight: "800",
  },
  metaText: {
    fontSize: 12,
    fontWeight: "600",
  },
  recentRight: {
    alignItems: "flex-end",
  },
  recentAmount: {
    fontSize: 14,
    fontWeight: "900",
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  modalSheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 20,
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "900",
  },
  modalItem: {
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  modalItemText: {
    fontSize: 14,
    fontWeight: "800",
  },
});
