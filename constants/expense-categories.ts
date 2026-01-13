export const EXPENSE_CATEGORIES = [
  "Food",
  "Travel",
  "Shopping",
  "Bills",
  "Transportation",
  "Entertainment",
  "Health",
  "Education",
  "Groceries",
  "Other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
