import { MaterialIcons } from "@expo/vector-icons";
import { Redirect } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

import { BOTTOM_NAVBAR_HEIGHT } from "@/components/bottom-navbar";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { supabase } from "@/lib/supabase";

type CategorySlice = {
  key: string;
  label: string;
  color: string;
};

export default function StatisticsScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];

  const [authed, setAuthed] = useState<boolean | null>(null);
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

  if (authed === false) return <Redirect href="/landing" />;

  const primary = themeColors.primary;

  const donutRadius = 40;
  const donutStroke = 12;
  const donutCx = 50;
  const donutCy = 50;
  const donutCircumference = 2 * Math.PI * donutRadius;

  const slices: { slice: CategorySlice; pct: number }[] = [
    { slice: { key: "travel", label: "Travel", color: "#B4AEF1" }, pct: 0.15 },
    {
      slice: { key: "transpo", label: "Transpo", color: "#6D214F" },
      pct: 0.15,
    },
    {
      slice: { key: "entertainment", label: "Entertainment", color: "#109536" },
      pct: 0.1,
    },
    {
      slice: { key: "shopping", label: "Shopping", color: "#FE8686" },
      pct: 0.4,
    },
    { slice: { key: "food", label: "Food", color: "#D39215" }, pct: 0.1 },
  ];

  let offset = 0;

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
          <ThemedText style={styles.headerTitle}>Statistics</ThemedText>
          <ThemedText
            style={[
              styles.headerSubtitle,
              { color: themeColors.textSecondary },
            ]}
          >
            Your spending insights
          </ThemedText>
        </View>

        <View style={[styles.card, { backgroundColor: themeColors.surface }]}>
          <View style={styles.totalLeft}>
            <ThemedText
              style={[styles.cardLabel, { color: themeColors.textSecondary }]}
            >
              Total This Month
            </ThemedText>
            <ThemedText style={styles.totalValue}>₱ 23.00</ThemedText>
          </View>

          <View>
            <MaterialIcons
              name="trending-up"
              size={40}
              color={themeColors.text}
            />
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: themeColors.surface }]}>
          <ThemedText
            style={[styles.cardLabel, { color: themeColors.textSecondary }]}
          >
            Weekly Trend
          </ThemedText>

          <View style={styles.chartWrap}>
            <Svg width="100%" height="100%" viewBox="0 0 300 80">
              <Path
                d="M0,0 C50,80 150,80 200,40 S 300,50 300,60"
                fill="none"
                stroke={primary}
                strokeWidth={2}
                strokeLinecap="round"
                transform="scale(1, -1) translate(0, -80)"
              />
            </Svg>

            <View
              style={[styles.chartLabelsRow, { paddingHorizontal: 16 }]}
              pointerEvents="none"
            >
              <ThemedText
                style={[
                  styles.chartLabel,
                  { color: themeColors.textSecondary },
                ]}
              >
                tue
              </ThemedText>
              <ThemedText
                style={[
                  styles.chartLabel,
                  { color: themeColors.textSecondary },
                ]}
              >
                wed
              </ThemedText>
              <ThemedText
                style={[
                  styles.chartLabel,
                  { color: themeColors.textSecondary },
                ]}
              >
                thu
              </ThemedText>
              <ThemedText
                style={[
                  styles.chartLabel,
                  { color: themeColors.textSecondary },
                ]}
              >
                fri
              </ThemedText>
              <ThemedText
                style={[
                  styles.chartLabel,
                  { color: themeColors.textSecondary },
                ]}
              >
                sat
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: themeColors.surface }]}>
          <ThemedText
            style={[styles.cardLabel, { color: themeColors.textSecondary }]}
          >
            Monthly Trend
          </ThemedText>

          <View style={styles.chartWrap}>
            <Svg width="100%" height="100%" viewBox="0 0 300 80">
              <Path
                d="M0,20 C80,-20 180,40 300,30"
                fill="none"
                stroke={primary}
                strokeWidth={2}
                strokeLinecap="round"
                transform="scale(1, -1) translate(0, -80)"
              />
            </Svg>

            <View
              style={[styles.chartLabelsRow, { paddingHorizontal: 22 }]}
              pointerEvents="none"
            >
              <ThemedText
                style={[
                  styles.chartLabel,
                  { color: themeColors.textSecondary },
                ]}
              >
                feb
              </ThemedText>
              <ThemedText
                style={[
                  styles.chartLabel,
                  { color: themeColors.textSecondary },
                ]}
              >
                mar
              </ThemedText>
              <ThemedText
                style={[
                  styles.chartLabel,
                  { color: themeColors.textSecondary },
                ]}
              >
                apr
              </ThemedText>
              <ThemedText
                style={[
                  styles.chartLabel,
                  { color: themeColors.textSecondary },
                ]}
              >
                may
              </ThemedText>
              <ThemedText
                style={[
                  styles.chartLabel,
                  { color: themeColors.textSecondary },
                ]}
              >
                jun
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: themeColors.surface }]}>
          <ThemedText
            style={[styles.catTitle, { color: themeColors.textSecondary }]}
          >
            Spending by Category
          </ThemedText>

          <View style={styles.catCenter}>
            <View style={styles.donutWrap}>
              <Svg width="100%" height="100%" viewBox="0 0 100 100">
                <Circle
                  cx={donutCx}
                  cy={donutCy}
                  r={donutRadius}
                  fill="transparent"
                  stroke={themeColors.text}
                  strokeOpacity={0.12}
                  strokeWidth={donutStroke}
                />

                {slices.map(({ slice, pct }) => {
                  const dash = donutCircumference * pct;
                  const gap = donutCircumference - dash;
                  const dasharray = `${dash} ${gap}`;
                  const dashoffset = -offset;

                  offset += dash;

                  return (
                    <Circle
                      key={slice.key}
                      cx={donutCx}
                      cy={donutCy}
                      r={donutRadius}
                      fill="transparent"
                      stroke={slice.color}
                      strokeWidth={donutStroke}
                      strokeDasharray={dasharray}
                      strokeDashoffset={dashoffset}
                      transform="rotate(-90 50 50)"
                    />
                  );
                })}
              </Svg>
            </View>

            <View style={styles.legendGrid}>
              <LegendItem
                color="#B4AEF1"
                label="Travel"
                textColor={themeColors.text}
              />
              <LegendItem
                color="#109536"
                label="Entertainment"
                textColor={themeColors.text}
              />
              <LegendItem
                color="#D39215"
                label="Food"
                textColor={themeColors.text}
              />
              <LegendItem
                color="#FE8686"
                label="Shopping"
                textColor={themeColors.text}
              />
              <View style={styles.legendSpan2}>
                <LegendItem
                  color="#6D214F"
                  label="Transpo"
                  textColor={themeColors.text}
                />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

function LegendItem({
  color,
  label,
  textColor,
}: {
  color: string;
  label: string;
  textColor: string;
}) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.legendText, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingTop: 32,
    gap: 14,
  },
  header: {
    paddingHorizontal: 8,
    marginBottom: 2,
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
  card: {
    borderRadius: 20,
    padding: 20,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  totalLeft: {
    flex: 1,
    paddingRight: 12,
  },
  totalValue: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  chartWrap: {
    height: 96,
    width: "100%",
    position: "relative",
    justifyContent: "flex-end",
    marginTop: 6,
  },
  chartLabelsRow: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    transform: [{ translateY: 18 }],
  },
  chartLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "lowercase",
  },
  catTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 12,
  },
  catCenter: {
    alignItems: "center",
    justifyContent: "center",
  },
  donutWrap: {
    width: 132,
    height: 132,
    marginBottom: 18,
  },
  legendGrid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
  },
  legendItem: {
    width: "32%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendSpan2: {
    width: "66%",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  legendText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
