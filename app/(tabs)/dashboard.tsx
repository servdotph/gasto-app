import { MaterialIcons } from "@expo/vector-icons";
import { Redirect } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { BOTTOM_NAVBAR_HEIGHT } from "@/components/bottom-navbar";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { fetchProfileById } from "@/lib/profiles";
import { supabase } from "@/lib/supabase";

type DashboardState = {
  loading: boolean;
  error: string | null;
  isAuthed: boolean;
  name: string;
};

type RecentExpense = {
  id: string;
  title: string;
  category: "Travel" | "Shopping";
  dateLabel: string;
  amountLabel: string;
};

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

  const recent: RecentExpense[] = useMemo(
    () => [
      {
        id: "1",
        title: "Picnic",
        category: "Travel",
        dateLabel: "Jan 4",
        amountLabel: "₱23.00",
      },
      {
        id: "2",
        title: "Clothes",
        category: "Shopping",
        dateLabel: "Jan 4",
        amountLabel: "₱23.00",
      },
      {
        id: "3",
        title: "T-shirt",
        category: "Shopping",
        dateLabel: "Jan 4",
        amountLabel: "₱23.00",
      },
    ],
    []
  );

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
                  <ThemedText style={styles.totalLabel}>This Week</ThemedText>
                  <ThemedText style={styles.totalValue}>₱ 12.3</ThemedText>
                </View>
                <View
                  style={[
                    styles.totalCard,
                    { backgroundColor: themeColors.primary },
                  ]}
                >
                  <ThemedText style={styles.totalLabel}>This Week</ThemedText>
                  <ThemedText style={styles.totalValue}>₱ 120.23</ThemedText>
                </View>
              </View>
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

                <CategoryRow
                  icon="flight"
                  iconColor="#60A5FA"
                  label="Travel"
                  amount="₱23.00"
                  fillColor="#818CF8"
                  fillPct={0.7}
                  theme={themeColors}
                />

                <CategoryRow
                  icon="shopping-bag"
                  iconColor="#EC4899"
                  label="Shopping"
                  amount="₱3.00"
                  fillColor="#F87171"
                  fillPct={0.3}
                  theme={themeColors}
                />
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
                  disabled
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
                    All Categories
                  </ThemedText>
                  <MaterialIcons
                    name="expand-more"
                    size={18}
                    color={themeColors.textSecondary}
                  />
                </Pressable>
              </View>

              <View style={styles.recentList}>
                {recent.map((item) => (
                  <RecentExpenseRow key={item.id} item={item} />
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

function CategoryRow({
  icon,
  iconColor,
  label,
  amount,
  fillColor,
  fillPct,
  theme,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  iconColor: string;
  label: string;
  amount: string;
  fillColor: string;
  fillPct: number;
  theme: typeof Colors.light;
}) {
  return (
    <View style={styles.catBlock}>
      <View style={styles.catTopRow}>
        <View style={styles.catLeft}>
          <MaterialIcons name={icon} size={14} color={iconColor} />
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
              backgroundColor: fillColor,
              width: `${Math.round(fillPct * 100)}%`,
            },
          ]}
        />
      </View>
    </View>
  );
}

function RecentExpenseRow({ item }: { item: RecentExpense }) {
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];

  const icon = item.category === "Travel" ? "flight" : "shopping-bag";
  const bg =
    item.category === "Travel"
      ? colorScheme === "dark"
        ? "rgba(99,102,241,0.2)"
        : "#E0E7FF"
      : colorScheme === "dark"
      ? "rgba(239,68,68,0.2)"
      : "#FEE2E2";
  const fg =
    item.category === "Travel"
      ? colorScheme === "dark"
        ? "#C7D2FE"
        : "#6366F1"
      : colorScheme === "dark"
      ? "#FECACA"
      : "#EF4444";

  const chipBg =
    item.category === "Travel"
      ? colorScheme === "dark"
        ? "#312E81"
        : "#C7D2FE"
      : colorScheme === "dark"
      ? "#7F1D1D"
      : "#FECACA";
  const chipText =
    item.category === "Travel"
      ? colorScheme === "dark"
        ? "#E0E7FF"
        : "#3730A3"
      : colorScheme === "dark"
      ? "#FEE2E2"
      : "#7F1D1D";

  return (
    <View style={[styles.recentRow, { backgroundColor: themeColors.surface }]}>
      <View style={styles.recentLeft}>
        <View style={[styles.recentIconWrap, { backgroundColor: bg }]}>
          <MaterialIcons name={icon} size={20} color={fg} />
        </View>

        <View>
          <ThemedText style={styles.recentTitle}>{item.title}</ThemedText>
          <View style={styles.recentMetaRow}>
            <View style={[styles.chip, { backgroundColor: chipBg }]}>
              <ThemedText style={[styles.chipText, { color: chipText }]}>
                {item.category}
              </ThemedText>
            </View>
            <ThemedText
              style={[styles.metaText, { color: themeColors.textSecondary }]}
            >
              {item.dateLabel}
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.recentRight}>
        <ThemedText style={styles.recentAmount}>{item.amountLabel}</ThemedText>
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
});
