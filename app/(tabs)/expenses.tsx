import { MaterialIcons } from "@expo/vector-icons";
import { Redirect } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { BOTTOM_NAVBAR_HEIGHT } from "@/components/bottom-navbar";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  formatCurrencyPHP,
  getAddedExpenses,
  subscribeAddedExpenses,
  type AddedExpense,
} from "@/lib/expenses-store";
import { supabase } from "@/lib/supabase";

type Mode = "weekly" | "monthly";

type ExpenseItem = {
  id: string;
  title: string;
  category: "Travel" | "Shopping";
  dateLabel: string;
  amountLabel: string;
  emoji: string;
  colorKey: "indigo" | "pink";
};

type DaySection = {
  key: string;
  dayLabel: string;
  dateLabel: string;
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
};

export default function ExpensesScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];

  const [mode, setMode] = useState<Mode>("weekly");

  const [authed, setAuthed] = useState<boolean | null>(null);
  React.useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data, error }) => {
      if (!mounted) return;
      setAuthed(!error && !!data.user);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const weekLabel = "First Week of Jan, 2026";
  const monthLabel = "January 2026";

  const baseWeeklySections: DaySection[] = useMemo(
    () => [
      {
        key: "mon",
        dayLabel: "Mon",
        dateLabel: "Jan 5",
        totalLabel: "₱46.00",
        items: [
          {
            id: "mon-1",
            title: "Picnic",
            category: "Travel",
            dateLabel: "Jan 4",
            amountLabel: "₱23.00",
            emoji: "✈️",
            colorKey: "indigo",
          },
          {
            id: "mon-2",
            title: "Clothes",
            category: "Shopping",
            dateLabel: "Jan 4",
            amountLabel: "₱23.00",
            emoji: "🛍️",
            colorKey: "pink",
          },
        ],
      },
      {
        key: "tue",
        dayLabel: "Tue",
        dateLabel: "Jan 6",
        totalLabel: "₱0.00",
        items: [],
      },
      {
        key: "wed",
        dayLabel: "Wed",
        dateLabel: "Jan 7",
        totalLabel: "₱0.00",
        items: [],
      },
      {
        key: "thu",
        dayLabel: "Thur",
        dateLabel: "Jan 8",
        totalLabel: "₱0.00",
        items: [],
      },
      {
        key: "fri",
        dayLabel: "Fri",
        dateLabel: "Jan 9",
        totalLabel: "₱0.00",
        items: [],
      },
    ],
    []
  );

  const [added, setAdded] = useState<AddedExpense[]>([]);
  useEffect(() => {
    setAdded(getAddedExpenses());
    return subscribeAddedExpenses(() => {
      setAdded(getAddedExpenses());
    });
  }, []);

  const weeklySections: DaySection[] = useMemo(() => {
    if (added.length === 0) return baseWeeklySections;

    // Minimal integration: prepend added expenses into the first day section.
    const first = baseWeeklySections[0];
    if (!first) return baseWeeklySections;

    const addedItems: ExpenseItem[] = added.map((e) => ({
      id: e.id,
      title: e.description,
      category: "Shopping",
      dateLabel: e.dateLabel,
      amountLabel: formatCurrencyPHP(e.amount),
      emoji: "🛍️",
      colorKey: "pink",
    }));

    const mergedFirstItems = [...addedItems, ...first.items];
    const mergedTotal = mergedFirstItems.reduce((sum, item) => {
      const normalized = item.amountLabel.replace(/[^0-9.]/g, "");
      const value = Number.parseFloat(normalized);
      return sum + (Number.isFinite(value) ? value : 0);
    }, 0);

    const mergedFirst: DaySection = {
      ...first,
      items: mergedFirstItems,
      totalLabel: formatCurrencyPHP(mergedTotal),
    };

    return [mergedFirst, ...baseWeeklySections.slice(1)];
  }, [added, baseWeeklySections]);

  const monthlyCategories: MonthlyCategory[] = useMemo(
    () => [
      {
        key: "travel",
        label: "Travel",
        emoji: "✈️",
        bgColor: "#A5A6F6",
        amountLabel: "₱23.00",
        pctLabel: "38%",
        countLabel: "1 transactions",
      },
      {
        key: "shopping",
        label: "Shopping",
        emoji: "🛍️",
        bgColor: "#F68D99",
        amountLabel: "₱23.00",
        pctLabel: "38%",
        countLabel: "1 transactions",
      },
      {
        key: "transpo",
        label: "Transpo",
        emoji: "🚗",
        bgColor: "#833471",
        amountLabel: "₱23.00",
        pctLabel: "38%",
        countLabel: "1 transactions",
      },
      {
        key: "food",
        label: "Food",
        emoji: "🍔",
        bgColor: "#F7B731",
        amountLabel: "₱23.00",
        pctLabel: "38%",
        countLabel: "1 transactions",
      },
      {
        key: "entertainment",
        label: "Entertainment",
        emoji: "🎬",
        bgColor: "#20BF6B",
        amountLabel: "₱23.00",
        pctLabel: "38%",
        countLabel: "1 transactions",
      },
    ],
    []
  );

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
                disabled
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
                disabled
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
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
              <Pressable disabled>
                <MaterialIcons
                  name="chevron-left"
                  size={26}
                  color={themeColors.text}
                />
              </Pressable>
              <ThemedText style={styles.periodText}>{monthLabel}</ThemedText>
              <Pressable disabled>
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
                    ₱ 23.00
                  </ThemedText>
                  <ThemedText style={styles.monthSummarySub}>
                    5 transactions
                  </ThemedText>
                </View>

                <View style={styles.trendIcon}>
                  <Text style={styles.trendLine}>↗</Text>
                </View>
              </View>
            </View>

            <View style={styles.monthCatWrap}>
              <ThemedText style={styles.monthCatTitle}>By Category</ThemedText>
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

  const bg = item.colorKey === "indigo" ? "#C7D2FE" : "#FBCFE8";

  const chipBg = item.colorKey === "indigo" ? "#A5B4FC" : "#FCA5A5";
  const chipText = item.colorKey === "indigo" ? "#312E81" : "#7F1D1D";

  return (
    <View style={[styles.weekItem, { backgroundColor: themeColors.surface }]}>
      <View style={styles.weekItemLeft}>
        <View style={[styles.emojiBox, { backgroundColor: bg }]}>
          <Text style={styles.emojiText}>{item.emoji}</Text>
        </View>

        <View>
          <ThemedText style={styles.weekTitle}>{item.title}</ThemedText>
          <View style={styles.weekMetaRow}>
            <View style={[styles.chip, { backgroundColor: chipBg }]}>
              <ThemedText style={[styles.chipText, { color: chipText }]}>
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
        <Pressable
          disabled
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
