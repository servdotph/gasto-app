export type AddedExpense = {
  id: string;
  description: string;
  amount: number;
  dateLabel: string;
  createdAt: number;
};

type Listener = () => void;

let addedExpenses: AddedExpense[] = [];
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener();
}

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getAddedExpenses() {
  return addedExpenses;
}

export function subscribeAddedExpenses(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function clearAddedExpenses() {
  addedExpenses = [];
  emit();
}

export function addExpense(input: {
  description: string;
  amount: number;
  dateLabel: string;
}) {
  const description = input.description.trim() || "Expense";
  const amount = Number.isFinite(input.amount) ? input.amount : 0;
  const dateLabel = input.dateLabel.trim() || formatShortDate(new Date());

  const next: AddedExpense = {
    id: makeId(),
    description,
    amount,
    dateLabel,
    createdAt: Date.now(),
  };

  // Newest first.
  addedExpenses = [next, ...addedExpenses];
  emit();

  return next;
}

export function parseAmount(input: string) {
  // Accept values like "$23.2", "₱ 23", "23.00".
  const normalized = input.replace(/[^0-9.]/g, "");
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : 0;
}

export function formatCurrencyPHP(amount: number) {
  const safe = Number.isFinite(amount) ? amount : 0;
  return `₱${safe.toFixed(2)}`;
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
