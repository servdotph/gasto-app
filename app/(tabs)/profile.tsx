import { MaterialIcons } from "@expo/vector-icons";
import { Redirect, useRouter } from "expo-router";
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
import { fetchProfileById, upsertProfileById } from "@/lib/profiles";
import { supabase } from "@/lib/supabase";

type ProfileState = {
  loading: boolean;
  saving: boolean;
  error: string | null;
  saveError: string | null;
  isAuthed: boolean;
  userId: string | null;
  email: string | null;
  profile: {
    full_name: string | null;
    phone: string | null;
    address: string | null;
  } | null;
};

export default function ProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];

  const [state, setState] = useState<ProfileState>({
    loading: true,
    saving: false,
    error: null,
    saveError: null,
    isAuthed: false,
    userId: null,
    email: null,
    profile: null,
  });

  const [fullName, setFullName] = useState<string>("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      const { data, error } = await supabase.auth.getUser();
      if (!mounted) return;

      if (error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error.message,
          isAuthed: false,
          userId: null,
          email: null,
          profile: null,
        }));
        return;
      }

      const user = data.user;
      if (!user) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: null,
          isAuthed: false,
          userId: null,
          email: null,
          profile: null,
        }));
        return;
      }

      let profile = null;
      try {
        profile = await fetchProfileById(user.id);
      } catch (e: any) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: e?.message ?? String(e),
          isAuthed: true,
          userId: user.id,
          email: user.email ?? null,
          profile: null,
        }));
        return;
      }

      const normalizedProfile = profile
        ? {
            full_name: profile.full_name,
            phone: profile.phone,
            address: profile.address,
          }
        : null;

      setState((prev) => ({
        ...prev,
        loading: false,
        error: null,
        isAuthed: true,
        userId: user.id,
        email: user.email ?? null,
        profile: normalizedProfile,
      }));

      setFullName(normalizedProfile?.full_name ?? "");
    }

    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      load();
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const displayName = useMemo(() => {
    const value = fullName.trim();
    if (value.length > 0) return value;
    return "Your Name";
  }, [fullName]);

  if (!state.loading && !state.profile && !state.error) {
    // Only redirect if the user is not logged in.
    // A missing profiles row should not kick the user out.
    if (!state.isAuthed) return <Redirect href="/landing" />;
  }

  async function onSave() {
    if (!state.userId) return;

    setState((prev) => ({ ...prev, saving: true, saveError: null }));

    try {
      await upsertProfileById(state.userId, {
        full_name: fullName.trim().length > 0 ? fullName.trim() : null,
        phone: state.profile?.phone ?? null,
        address: state.profile?.address ?? null,
      });

      // Refresh local profile state (preserve hidden fields).
      setState((prev) => ({
        ...prev,
        saving: false,
        saveError: null,
        profile: {
          full_name: fullName.trim().length > 0 ? fullName.trim() : null,
          phone: prev.profile?.phone ?? null,
          address: prev.profile?.address ?? null,
        },
      }));
    } catch (e: any) {
      setState((prev) => ({
        ...prev,
        saving: false,
        saveError: e?.message ?? String(e),
      }));
    }
  }

  const totalThisMonth = "₱0.00";

  async function onLogout() {
    try {
      await supabase.auth.signOut({ scope: "local" });
    } finally {
      router.replace("/landing");
    }
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
          <View style={styles.headerRow}>
            <ThemedText style={styles.headerTitle}>Profile</ThemedText>

            <Pressable
              onPress={onLogout}
              accessibilityRole="button"
              accessibilityLabel="Logout"
              hitSlop={12}
              style={({ pressed }) => [
                styles.logoutIconButton,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <MaterialIcons
                name="logout"
                size={22}
                color={themeColors.textSecondary}
              />
            </Pressable>
          </View>

          <ThemedText
            style={[
              styles.headerSubtitle,
              { color: themeColors.textSecondary },
            ]}
          >
            Manage your settings
          </ThemedText>
        </View>

        {state.loading ? (
          <ThemedText style={styles.bodyText}>Loading...</ThemedText>
        ) : state.error ? (
          <ThemedText style={styles.bodyText}>{state.error}</ThemedText>
        ) : (
          <>
            <View
              style={[
                styles.profileCard,
                {
                  backgroundColor: themeColors.surface,
                  shadowColor: "#000000",
                },
              ]}
            >
              <View style={styles.profileTopRow}>
                <View
                  style={[
                    styles.avatar,
                    {
                      backgroundColor:
                        colorScheme === "dark" ? "#3A3A3A" : "#D1D5DB",
                    },
                  ]}
                >
                  <MaterialIcons
                    name="person-outline"
                    size={30}
                    color={colorScheme === "dark" ? "#E5E7EB" : "#4B5563"}
                  />
                </View>

                <View style={styles.profileTopText}>
                  <ThemedText style={styles.profileName}>
                    {displayName}
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.profileEmail,
                      { color: themeColors.textSecondary },
                    ]}
                  >
                    {state.email ?? ""}
                  </ThemedText>
                </View>
              </View>

              <View
                style={[
                  styles.divider,
                  {
                    backgroundColor:
                      colorScheme === "dark" ? "#3A3A3A" : "#D1D5DB",
                  },
                ]}
              />

              <View>
                <ThemedText
                  style={[
                    styles.smallLabel,
                    { color: themeColors.textSecondary },
                  ]}
                >
                  Total This Month
                </ThemedText>
                <ThemedText style={styles.totalValue}>
                  {totalThisMonth}
                </ThemedText>
              </View>
            </View>

            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>
                Personal Information
              </ThemedText>

              <View
                style={[
                  styles.sectionCard,
                  {
                    backgroundColor: themeColors.surface,
                    shadowColor: "#000000",
                  },
                ]}
              >
                <View style={styles.fieldBlock}>
                  <View style={styles.fieldLabelRow}>
                    <MaterialIcons
                      name="person-outline"
                      size={14}
                      color={themeColors.textSecondary}
                    />
                    <ThemedText style={styles.fieldLabel}>Full Name</ThemedText>
                  </View>

                  <TextInput
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Full name"
                    placeholderTextColor={themeColors.textSecondary}
                    style={[
                      styles.input,
                      {
                        backgroundColor: themeColors.inputBackground,
                        color: themeColors.text,
                      },
                    ]}
                    autoCapitalize="words"
                    returnKeyType="done"
                  />
                </View>

                <View style={styles.fieldBlock}>
                  <View style={styles.fieldLabelRow}>
                    <MaterialIcons
                      name="mail-outline"
                      size={14}
                      color={themeColors.textSecondary}
                    />
                    <ThemedText style={styles.fieldLabel}>Email</ThemedText>
                  </View>

                  <TextInput
                    value={state.email ?? ""}
                    editable={false}
                    style={[
                      styles.input,
                      {
                        backgroundColor: themeColors.inputBackground,
                        color: themeColors.textSecondary,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>

            {state.saveError ? (
              <ThemedText style={styles.errorText}>
                {state.saveError}
              </ThemedText>
            ) : null}

            <Pressable
              onPress={onSave}
              disabled={state.saving}
              style={({ pressed }) => [
                styles.saveButton,
                {
                  backgroundColor: themeColors.primary,
                  opacity: state.saving ? 0.6 : pressed ? 0.9 : 1,
                },
              ]}
            >
              <MaterialIcons name="save" size={18} color="#000000" />
              <ThemedText style={styles.saveText}>
                {state.saving ? "Saving..." : "Save Changes"}
              </ThemedText>
            </Pressable>
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 48,
  },
  header: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  logoutIconButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    marginTop: 6,
    fontSize: 13,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 20,
  },
  profileCard: {
    borderRadius: 24,
    padding: 20,
    marginTop: 8,
    marginBottom: 24,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },
  profileTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  profileTopText: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "800",
  },
  profileEmail: {
    marginTop: 2,
    fontSize: 13,
  },
  divider: {
    height: 1,
    marginBottom: 14,
  },
  smallLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: "800",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  sectionCard: {
    borderRadius: 24,
    padding: 18,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 1,
    gap: 16,
  },
  fieldBlock: {
    gap: 8,
  },
  fieldLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  input: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  selectButton: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectText: {
    fontSize: 14,
    fontWeight: "500",
  },
  saveButton: {
    height: 56,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 2,
  },
  saveText: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "800",
  },
  errorText: {
    marginBottom: 12,
    fontSize: 13,
    lineHeight: 18,
    color: "#B00020",
  },
});
