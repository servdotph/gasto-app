import { MaterialIcons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

type NavKey =
  | "home"
  | "calendar"
  | "add"
  | "expenses"
  | "statistics"
  | "profile";

type BottomNavbarProps = {
  onAddPress?: () => void;
};

export function BottomNavbar({ onAddPress }: BottomNavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];

  const isHomeActive = useMemo(() => pathname === "/dashboard", [pathname]);
  const isExpensesActive = useMemo(() => pathname === "/expenses", [pathname]);
  const isStatisticsActive = useMemo(
    () => pathname === "/statistics",
    [pathname]
  );
  const isProfileActive = useMemo(() => pathname === "/profile", [pathname]);

  function onPress(key: NavKey) {
    switch (key) {
      case "home":
        router.push("/dashboard");
        return;
      case "expenses":
        router.push("/expenses");
        return;
      case "statistics":
        router.push("/statistics");
        return;
      case "profile":
        router.push("/profile");
        return;
      // These routes aren't implemented yet; keep them inert.
      case "calendar":
      case "add":
      default:
        return;
    }
  }

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <View
        pointerEvents="box-none"
        style={[
          styles.container,
          {
            paddingBottom: Math.max(insets.bottom, 10),
          },
        ]}
      >
        <View style={styles.frame}>
          <View
            style={[
              styles.bar,
              {
                backgroundColor: themeColors.navBackground,
              },
            ]}
          >
            <NavIcon
              icon="home"
              isActive={isHomeActive}
              onPress={() => onPress("home")}
            />
            <NavIcon
              icon="calendar-today"
              isActive={isExpensesActive}
              onPress={() => onPress("expenses")}
            />

            <View style={styles.centerSpacer} />

            <NavIcon
              icon="query-stats"
              isActive={isStatisticsActive}
              onPress={() => onPress("statistics")}
            />
            <NavIcon
              icon="person"
              isActive={isProfileActive}
              onPress={() => onPress("profile")}
            />
          </View>

          <View style={styles.fabWrap} pointerEvents="box-none">
            <Pressable
              onPress={onAddPress}
              style={({ pressed }) => [
                styles.fab,
                {
                  backgroundColor: themeColors.primary,
                  borderColor: themeColors.background,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <MaterialIcons name="add" size={30} color="#111111" />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

function NavIcon({
  icon,
  onPress,
  isActive,
  disabled,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  onPress: () => void;
  isActive: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      hitSlop={12}
      style={({ pressed }) => [
        styles.navButton,
        {
          opacity: disabled ? 0.35 : pressed ? 0.75 : isActive ? 1 : 0.55,
        },
      ]}
    >
      <MaterialIcons name={icon} size={26} color="#FFFFFF" />
    </Pressable>
  );
}

export const BOTTOM_NAVBAR_HEIGHT = 80;

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
  },
  frame: {
    width: "100%",
    maxWidth: 420,
  },
  bar: {
    height: BOTTOM_NAVBAR_HEIGHT,
    width: "100%",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 26,
    paddingTop: 10,
  },
  navButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  centerSpacer: {
    width: 72,
  },
  fabWrap: {
    position: "absolute",
    top: -28,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 6,
  },
});
