export const EXPENSE_CATEGORIES = [
  "Food",
  "Transport",
  "Utilities",
  "School",
  "Entertainment",
  "Shopping",
  "Health",
  "Others",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
