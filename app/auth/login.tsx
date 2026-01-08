import { MaterialIcons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";

import {
  AuthGoogleButton,
  AuthPrimaryButton,
} from "@/components/auth/auth-buttons";
import { AuthScreenShell } from "@/components/auth/auth-screen-shell";
import { AuthTextField } from "@/components/auth/auth-text-field";
import { ThemedText } from "@/components/themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";
import { ensureProfileFromUserMetadata } from "@/lib/profiles";
import { supabase } from "@/lib/supabase";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const text = "#000000";
  const muted = "#4B5563";
  const primary = useThemeColor({ light: "#F8E759", dark: "#F8E759" }, "text");
  const linkYellow = "#D6C94A";
  const divider = useThemeColor({ light: "#D1D5DB", dark: "#4B5563" }, "text");

  async function onLogin() {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      Alert.alert("Missing details", "Please enter email and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) {
        Alert.alert("Login failed", error.message);
        return;
      }

      // If email-confirmation is enabled, signup may have stored details in metadata.
      // Ensure `profiles` row exists before navigating.
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (!userError && userData.user) {
        try {
          await ensureProfileFromUserMetadata(
            userData.user.id,
            (userData.user.user_metadata as Record<string, unknown> | null) ??
              null
          );
        } catch (e: any) {
          // Don't block login; surface the problem so it's debuggable.
          Alert.alert("Profile sync failed", e?.message ?? String(e));
        }
      }

      router.replace("/profile");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthScreenShell imageSource={require("@/assets/images/auth_bg.png")}>
      <View style={styles.header}>
        <ThemedText
          lightColor={text}
          darkColor={text}
          type="subtitle"
          style={styles.title}
        >
          Welcome Back
        </ThemedText>
        <ThemedText
          lightColor={muted}
          darkColor={muted}
          style={styles.subtitle}
        >
          Enter your details below
        </ThemedText>
      </View>

      <View style={styles.form}>
        <AuthTextField
          label="Email:"
          placeholder="Email Address"
          icon="email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          density="compact"
        />

        <AuthTextField
          label="Password:"
          placeholder="Password"
          icon="lock"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          density="compact"
        />

        <View style={styles.rowBetween}>
          <Pressable
            style={styles.rememberRow}
            onPress={() => setRememberMe((v) => !v)}
          >
            <View
              style={[
                styles.checkbox,
                {
                  borderColor: divider,
                  backgroundColor: rememberMe ? primary : "transparent",
                },
              ]}
            >
              {rememberMe ? (
                <MaterialIcons name="check" size={16} color="#111111" />
              ) : null}
            </View>
            <ThemedText style={[styles.rememberText, { color: muted }]}>
              Remember me
            </ThemedText>
          </Pressable>

          <Pressable onPress={() => {}}>
            <ThemedText style={[styles.forgotText, { color: muted }]}>
              Forget Password?
            </ThemedText>
          </Pressable>
        </View>

        <AuthPrimaryButton
          label={isSubmitting ? "Logging in..." : "Login"}
          onPress={isSubmitting ? () => {} : onLogin}
        />

        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: divider }]} />
          <ThemedText style={[styles.dividerLabel, { color: muted }]}>
            OR
          </ThemedText>
          <View style={[styles.dividerLine, { backgroundColor: divider }]} />
        </View>

        <AuthGoogleButton
          label="Google"
          onPress={() => {}}
          iconSource={require("@/assets/images/google.png")}
        />

        <View style={styles.footer}>
          <ThemedText style={[styles.footerText, { color: muted }]}>
            Don’t Have Account?{" "}
          </ThemedText>
          <Link href="./signup" asChild>
            <Pressable>
              <ThemedText
                lightColor={linkYellow}
                darkColor={linkYellow}
                style={styles.footerLink}
              >
                Sign Up
              </ThemedText>
            </Pressable>
          </Link>
        </View>
      </View>
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    marginBottom: 18,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 13,
    marginTop: 6,
  },
  form: {
    gap: 8,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
    marginBottom: 6,
  },
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  rememberText: {
    fontSize: 13,
    fontWeight: "600",
  },
  forgotText: {
    fontSize: 13,
    fontWeight: "600",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 6,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerLabel: {
    paddingHorizontal: 12,
    fontSize: 12,
    fontWeight: "700",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 6,
  },
  footerText: {
    fontSize: 13,
    fontWeight: "600",
  },
  footerLink: {
    fontSize: 13,
    fontWeight: "800",
  },
});
