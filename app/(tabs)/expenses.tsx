import { MaterialIcons } from "@expo/vector-icons";
import { Redirect } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { BOTTOM_NAVBAR_HEIGHT } from "@/components/bottom-navbar";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { EXPENSE_CATEGORIES } from "@/constants/expense-categories";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  formatCurrencyPHP,
  getExpenseRows,
  subscribeAddedExpenses,
  type ExpenseRow,
} from "@/lib/expenses-store";
import { supabase } from "@/lib/supabase";

type Mode = "weekly" | "monthly";

type ExpenseItem = {
  id: string;
  title: string;
  category: string;
  dateLabel: string;
  amountLabel: string;
  amount: number;
  emoji: string;
  bgColor: string;
  chipBg: string;
  chipText: string;
};

type DaySection = {
  key: string;
  dayLabel: string;
  dateLabel: string;
  date: Date;
  totalLabel: string;
  items: ExpenseItem[];
};

type MonthlyCategory = {
  key: string;
  label: string;
  emoji: string;
  bgColor: string;
  amountLabel: string;
  pctLabel: string;
  countLabel: string;
  total: number;
};

// Category styling map
const CATEGORY_STYLES: Record<
  string,
  { emoji: string; bgColor: string; chipBg: string; chipText: string }
> = {
  Food: {
    emoji: "🍔",
    bgColor: "#FEF3C7",
    chipBg: "#FDE68A",
    chipText: "#92400E",
  },
  Transport: {
    emoji: "🚗",
    bgColor: "#E0E7FF",
    chipBg: "#A5B4FC",
    chipText: "#312E81",
  },
  Utilities: {
    emoji: "💡",
    bgColor: "#DBEAFE",
    chipBg: "#93C5FD",
    chipText: "#1E40AF",
  },
  School: {
    emoji: "📚",
    bgColor: "#FCE7F3",
    chipBg: "#F9A8D4",
    chipText: "#9D174D",
  },
  Entertainment: {
    emoji: "🎬",
    bgColor: "#D1FAE5",
    chipBg: "#6EE7B7",
    chipText: "#065F46",
  },
  Shopping: {
    emoji: "🛍️",
    bgColor: "#FBCFE8",
    chipBg: "#FCA5A5",
    chipText: "#7F1D1D",
  },
  Health: {
    emoji: "💊",
    bgColor: "#CCFBF1",
    chipBg: "#5EEAD4",
    chipText: "#115E59",
  },
  Others: {
    emoji: "📦",
    bgColor: "#E5E7EB",
    chipBg: "#9CA3AF",
    chipText: "#1F2937",
  },
};

const DEFAULT_STYLE = {
  emoji: "💰",
  bgColor: "#E5E7EB",
  chipBg: "#9CA3AF",
  chipText: "#1F2937",
};

function getCategoryStyle(category: string | null) {
  if (!category) return DEFAULT_STYLE;
  return CATEGORY_STYLES[category] ?? DEFAULT_STYLE;
}

function formatShortDate(date: Date): string {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

function getWeekDays(weekOffset: number): Date[] {
  const now = new Date();
  const startOfWeek = new Date(now);
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  startOfWeek.setDate(diff + weekOffset * 7);
  startOfWeek.setHours(0, 0, 0, 0);

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    days.push(d);
  }
  return days;
}

function getMonthRange(monthOffset: number): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + monthOffset + 1, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function formatWeekLabel(days: Date[]): string {
  if (days.length === 0) return "";
  const first = days[0];
  const last = days[days.length - 1];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  if (first.getMonth() === last.getMonth()) {
    return `${
      months[first.getMonth()]
    } ${first.getDate()} - ${last.getDate()}, ${first.getFullYear()}`;
  }
  return `${months[first.getMonth()]} ${first.getDate()} - ${
    months[last.getMonth()]
  } ${last.getDate()}, ${first.getFullYear()}`;
}

function formatMonthLabel(date: Date): string {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

function getDayLabel(date: Date): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days[date.getDay()];
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export default function ExpensesScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];

  const [mode, setMode] = useState<Mode>("weekly");
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);

  const [authed, setAuthed] = useState<boolean | null>(null);
  const [expenseRows, setExpenseRows] = useState<ExpenseRow[]>([]);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data, error }) => {
      if (!mounted) return;
      setAuthed(!error && !!data.user);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setExpenseRows(getExpenseRows());
    return subscribeAddedExpenses(() => {
      setExpenseRows(getExpenseRows());
    });
  }, []);

  // Weekly data
  const weekDays = useMemo(() => getWeekDays(weekOffset), [weekOffset]);
  const weekLabel = useMemo(() => formatWeekLabel(weekDays), [weekDays]);

  const weeklySections: DaySection[] = useMemo(() => {
    return weekDays.map((day) => {
      const dayExpenses = expenseRows.filter((expense) => {
        const expenseDate = new Date(expense.created_at);
        return isSameDay(expenseDate, day);
      });

      const items: ExpenseItem[] = dayExpenses.map((expense) => {
        const style = getCategoryStyle(expense.category);
        return {
          id: expense.id,
          title: expense.description,
          category: expense.category || "Others",
          dateLabel: formatShortDate(new Date(expense.created_at)),
          amountLabel: formatCurrencyPHP(expense.amount),
          amount: expense.amount,
          emoji: style.emoji,
          bgColor: style.bgColor,
          chipBg: style.chipBg,
          chipText: style.chipText,
        };
      });

      const total = items.reduce((sum, item) => sum + item.amount, 0);

      return {
        key: day.toISOString(),
        dayLabel: getDayLabel(day),
        dateLabel: formatShortDate(day),
        date: day,
        totalLabel: formatCurrencyPHP(total),
        items,
      };
    });
  }, [weekDays, expenseRows]);

  // Monthly data
  const monthRange = useMemo(() => getMonthRange(monthOffset), [monthOffset]);
  const monthLabel = useMemo(
    () => formatMonthLabel(monthRange.start),
    [monthRange]
  );

  const monthlyExpenses = useMemo(() => {
    return expenseRows.filter((expense) => {
      const expenseDate = new Date(expense.created_at);
      return expenseDate >= monthRange.start && expenseDate <= monthRange.end;
    });
  }, [expenseRows, monthRange]);

  const monthlyTotal = useMemo(() => {
    return monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [monthlyExpenses]);

  const monthlyCategories: MonthlyCategory[] = useMemo(() => {
    const categoryTotals: Record<string, { total: number; count: number }> = {};

    for (const cat of EXPENSE_CATEGORIES) {
      categoryTotals[cat] = { total: 0, count: 0 };
    }

    for (const expense of monthlyExpenses) {
      const cat = expense.category || "Others";
      if (!categoryTotals[cat]) {
        categoryTotals[cat] = { total: 0, count: 0 };
      }
      categoryTotals[cat].total += expense.amount;
      categoryTotals[cat].count += 1;
    }

    return Object.entries(categoryTotals)
      .filter(([_, data]) => data.count > 0)
      .map(([cat, data]) => {
        const style = getCategoryStyle(cat);
        const pct =
          monthlyTotal > 0 ? Math.round((data.total / monthlyTotal) * 100) : 0;
        return {
          key: cat,
          label: cat,
          emoji: style.emoji,
          bgColor: style.bgColor,
          amountLabel: formatCurrencyPHP(data.total),
          pctLabel: `${pct}%`,
          countLabel: `${data.count} transaction${data.count !== 1 ? "s" : ""}`,
          total: data.total,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [monthlyExpenses, monthlyTotal]);

  if (authed === false) return <Redirect href="/landing" />;

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
          <ThemedText style={styles.headerTitle}>Expenses</ThemedText>
          <ThemedText
            style={[
              styles.headerSubtitle,
              { color: themeColors.textSecondary },
            ]}
          >
            Track your spending history
          </ThemedText>
        </View>

        <View
          style={[
            styles.segment,
            {
              backgroundColor: themeColors.primary,
            },
          ]}
        >
          <View
            style={[
              styles.segmentActiveBg,
              {
                left: mode === "weekly" ? 4 : "52%",
              },
            ]}
          />

          <Pressable
            style={styles.segmentBtn}
            onPress={() => setMode("weekly")}
          >
            <ThemedText
              style={
                mode === "weekly"
                  ? styles.segmentActiveText
                  : styles.segmentInactiveText
              }
            >
              Weekly
            </ThemedText>
          </Pressable>

          <Pressable
            style={styles.segmentBtn}
            onPress={() => setMode("monthly")}
          >
            <ThemedText
              style={
                mode === "monthly"
                  ? styles.segmentActiveText
                  : styles.segmentInactiveText
              }
            >
              Monthly
            </ThemedText>
          </Pressable>
        </View>

        {mode === "weekly" ? (
          <>
            <View
              style={[
                styles.periodCard,
                { backgroundColor: themeColors.surface },
              ]}
            >
              <Pressable
                onPress={() => setWeekOffset((prev) => prev - 1)}
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              >
                <MaterialIcons
                  name="chevron-left"
                  size={30}
                  color={themeColors.text}
                />
              </Pressable>
              <ThemedText style={styles.periodText}>{weekLabel}</ThemedText>
              <Pressable
                onPress={() => setWeekOffset((prev) => prev + 1)}
                disabled={weekOffset >= 0}
                style={({ pressed }) => [
                  { opacity: pressed ? 0.7 : weekOffset >= 0 ? 0.3 : 1 },
                ]}
              >
                <MaterialIcons
                  name="chevron-right"
                  size={30}
                  color={themeColors.text}
                />
              </Pressable>
            </View>

            <View style={styles.weekList}>
              {weeklySections.map((section) => (
                <View key={section.key} style={styles.dayBlock}>
                  <View style={styles.dayHeader}>
                    <View style={styles.dayHeaderLeft}>
                      <ThemedText style={styles.dayName}>
                        {section.dayLabel}
                      </ThemedText>
                      <ThemedText
                        style={[
                          styles.dayDate,
                          { color: themeColors.textSecondary },
                        ]}
                      >
                        {section.dateLabel}
                      </ThemedText>
                    </View>
                    <ThemedText style={styles.dayTotal}>
                      {section.totalLabel}
                    </ThemedText>
                  </View>

                  {section.items.length === 0 ? (
                    <View
                      style={[
                        styles.emptyCard,
                        { backgroundColor: themeColors.surface },
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.emptyText,
                          { color: themeColors.textSecondary },
                        ]}
                      >
                        No expenses
                      </ThemedText>
                    </View>
                  ) : (
                    <View style={styles.itemsList}>
                      {section.items.map((item) => (
                        <WeeklyExpenseRow key={item.id} item={item} />
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          </>
        ) : (
          <>
            <View
              style={[
                styles.periodCardSmall,
                { backgroundColor: themeColors.surface },
              ]}
            >
              <Pressable
                onPress={() => setMonthOffset((prev) => prev - 1)}
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              >
                <MaterialIcons
                  name="chevron-left"
                  size={26}
                  color={themeColors.text}
                />
              </Pressable>
              <ThemedText style={styles.periodText}>{monthLabel}</ThemedText>
              <Pressable
                onPress={() => setMonthOffset((prev) => prev + 1)}
                disabled={monthOffset >= 0}
                style={({ pressed }) => [
                  { opacity: pressed ? 0.7 : monthOffset >= 0 ? 0.3 : 1 },
                ]}
              >
                <MaterialIcons
                  name="chevron-right"
                  size={26}
                  color={themeColors.text}
                />
              </Pressable>
            </View>

            <View style={styles.monthSummaryWrap}>
              <View
                style={[
                  styles.monthSummary,
                  { backgroundColor: themeColors.primary },
                ]}
              >
                <View>
                  <ThemedText style={styles.monthSummaryLabel}>
                    Total Spending
                  </ThemedText>
                  <ThemedText style={styles.monthSummaryValue}>
                    {formatCurrencyPHP(monthlyTotal)}
                  </ThemedText>
                  <ThemedText style={styles.monthSummarySub}>
                    {monthlyExpenses.length} transaction
                    {monthlyExpenses.length !== 1 ? "s" : ""}
                  </ThemedText>
                </View>

                <View style={styles.trendIcon}>
                  <Text style={styles.trendLine}>↗</Text>
                </View>
              </View>
            </View>

            <View style={styles.monthCatWrap}>
              <ThemedText style={styles.monthCatTitle}>By Category</ThemedText>
              {monthlyCategories.length === 0 ? (
                <View
                  style={[
                    styles.emptyCard,
                    { backgroundColor: themeColors.surface },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.emptyText,
                      { color: themeColors.textSecondary },
                    ]}
                  >
                    No expenses this month
                  </ThemedText>
                </View>
              ) : (
                <View style={styles.monthCatList}>
                  {monthlyCategories.map((cat) => (
                    <View
                      key={cat.key}
                      style={[
                        styles.monthCatRow,
                        { backgroundColor: themeColors.surface },
                      ]}
                    >
                      <View style={styles.monthCatLeft}>
                        <View
                          style={[
                            styles.monthCatIcon,
                            { backgroundColor: cat.bgColor },
                          ]}
                        >
                          <Text style={styles.monthCatEmoji}>{cat.emoji}</Text>
                        </View>
                        <View>
                          <ThemedText style={styles.monthCatLabel}>
                            {cat.label}
                          </ThemedText>
                          <ThemedText
                            style={[
                              styles.monthCatCount,
                              { color: themeColors.textSecondary },
                            ]}
                          >
                            {cat.countLabel}
                          </ThemedText>
                        </View>
                      </View>

                      <View style={styles.monthCatRight}>
                        <ThemedText style={styles.monthCatAmount}>
                          {cat.amountLabel}
                        </ThemedText>
                        <ThemedText
                          style={[
                            styles.monthCatPct,
                            { color: themeColors.textSecondary },
                          ]}
                        >
                          {cat.pctLabel}
                        </ThemedText>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

function WeeklyExpenseRow({ item }: { item: ExpenseItem }) {
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];

  return (
    <View style={[styles.weekItem, { backgroundColor: themeColors.surface }]}>
      <View style={styles.weekItemLeft}>
        <View style={[styles.emojiBox, { backgroundColor: item.bgColor }]}>
          <Text style={styles.emojiText}>{item.emoji}</Text>
        </View>

        <View>
          <ThemedText style={styles.weekTitle}>{item.title}</ThemedText>
          <View style={styles.weekMetaRow}>
            <View style={[styles.chip, { backgroundColor: item.chipBg }]}>
              <ThemedText style={[styles.chipText, { color: item.chipText }]}>
                {item.category}
              </ThemedText>
            </View>
            <ThemedText
              style={[
                styles.weekMetaText,
                { color: themeColors.textSecondary },
              ]}
            >
              {item.dateLabel}
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.weekItemRight}>
        <ThemedText style={styles.weekAmount}>{item.amountLabel}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: "500",
  },
  segment: {
    borderRadius: 16,
    padding: 4,
    flexDirection: "row",
    position: "relative",
    overflow: "hidden",
    marginBottom: 18,
  },
  segmentActiveBg: {
    position: "absolute",
    top: 4,
    bottom: 4,
    width: "48%",
    backgroundColor: "rgba(0,0,0,0.06)",
    borderRadius: 12,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  segmentActiveText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111111",
  },
  segmentInactiveText: {
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(0,0,0,0.7)",
  },
  periodCard: {
    borderRadius: 24,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  periodCardSmall: {
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  periodText: {
    fontSize: 16,
    fontWeight: "700",
  },
  weekList: {
    gap: 18,
  },
  dayBlock: {
    gap: 10,
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  dayHeaderLeft: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 10,
  },
  dayName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111111",
  },
  dayDate: {
    fontSize: 13,
    fontWeight: "500",
  },
  dayTotal: {
    fontSize: 13,
    fontWeight: "900",
  },
  emptyCard: {
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 13,
    fontWeight: "600",
  },
  itemsList: {
    gap: 10,
  },
  weekItem: {
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  weekItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    paddingRight: 8,
  },
  emojiBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiText: {
    fontSize: 22,
  },
  weekTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  weekMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  chipText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  weekMetaText: {
    fontSize: 12,
    fontWeight: "600",
  },
  weekItemRight: {
    alignItems: "flex-end",
  },
  weekAmount: {
    fontSize: 16,
    fontWeight: "900",
  },
  monthSummaryWrap: {
    marginBottom: 20,
  },
  monthSummary: {
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  monthSummaryLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(0,0,0,0.65)",
  },
  monthSummaryValue: {
    fontSize: 28,
    fontWeight: "900",
    color: "#111111",
    marginTop: 6,
  },
  monthSummarySub: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(0,0,0,0.6)",
    marginTop: 4,
  },
  trendIcon: {
    width: 54,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  trendLine: {
    fontSize: 34,
    color: "#111111",
    fontWeight: "900",
  },
  monthCatWrap: {
    marginBottom: 4,
  },
  monthCatTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 12,
  },
  monthCatList: {
    gap: 10,
  },
  monthCatRow: {
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  monthCatLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  monthCatIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  monthCatEmoji: {
    fontSize: 18,
  },
  monthCatLabel: {
    fontSize: 15,
    fontWeight: "800",
  },
  monthCatCount: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  monthCatRight: {
    alignItems: "flex-end",
  },
  monthCatAmount: {
    fontSize: 14,
    fontWeight: "800",
  },
  monthCatPct: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
});
