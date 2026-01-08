import { Redirect, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { fetchProfileById } from "@/lib/profiles";
import { supabase } from "@/lib/supabase";

type ProfileState = {
  loading: boolean;
  error: string | null;
  isAuthed: boolean;
  profile: {
    full_name: string | null;
    phone: string | null;
    address: string | null;
  } | null;
};

export default function ProfileScreen() {
  const router = useRouter();
  const [state, setState] = useState<ProfileState>({
    loading: true,
    error: null,
    isAuthed: false,
    profile: null,
  });

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
          profile: null,
        });
        return;
      }

      const user = data.user;

      if (!user) {
        setState({
          loading: false,
          error: null,
          isAuthed: false,
          profile: null,
        });
        return;
      }

      let profile = null;
      try {
        profile = await fetchProfileById(user.id);
      } catch (e: any) {
        setState({
          loading: false,
          error: e?.message ?? String(e),
          isAuthed: true,
          profile: null,
        });
        return;
      }

      setState({
        loading: false,
        error: null,
        isAuthed: true,
        profile: profile
          ? {
              full_name: profile.full_name,
              phone: profile.phone,
              address: profile.address,
            }
          : null,
      });
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

  const lines = useMemo(() => {
    return [
      `full_name: ${state.profile?.full_name ?? ""}`,
      `phone: ${state.profile?.phone ?? ""}`,
      `address: ${state.profile?.address ?? ""}`,
    ];
  }, [state.profile]);

  async function onLogout() {
    await supabase.auth.signOut();
    router.replace("/landing");
  }

  if (!state.loading && !state.profile && !state.error) {
    // Only redirect if the user is not logged in.
    // A missing profiles row should not kick the user out.
    if (!state.isAuthed) return <Redirect href="/landing" />;
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="subtitle" style={styles.title}>
          Profile
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Logged-in user details (plain text)
        </ThemedText>
      </View>

      {state.loading ? (
        <ThemedText style={styles.bodyText}>Loading...</ThemedText>
      ) : state.error ? (
        <ThemedText style={styles.bodyText}>{state.error}</ThemedText>
      ) : (
        <View style={styles.block}>
          {lines.map((line, idx) => (
            <ThemedText key={`${idx}-${line}`} style={styles.bodyText}>
              {line}
            </ThemedText>
          ))}
        </View>
      )}

      <Pressable style={styles.logoutButton} onPress={onLogout}>
        <ThemedText style={styles.logoutText}>Logout</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
  },
  subtitle: {
    marginTop: 4,
    opacity: 0.7,
  },
  block: {
    gap: 6,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 20,
  },
  logoutButton: {
    marginTop: 24,
    height: 52,
    borderRadius: 999,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
});
