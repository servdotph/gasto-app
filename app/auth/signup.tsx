import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

import { AuthPrimaryButton } from "@/components/auth/auth-buttons";
import { AuthScreenShell } from "@/components/auth/auth-screen-shell";
import { AuthTextField } from "@/components/auth/auth-text-field";
import { ThemedText } from "@/components/themed-text";
import { upsertProfileById } from "@/lib/profiles";
import { supabase } from "@/lib/supabase";

export default function SignupScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const text = "#000000";
  const muted = "#4B5563";
  const linkYellow = "#D6C94A";

  async function onSignup() {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password || !confirmPassword) {
      Alert.alert("Missing details", "Please fill email and password fields.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Password mismatch", "Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            full_name: fullName,
            phone,
            address,
          },
        },
      });

      if (error) {
        Alert.alert("Signup failed", error.message);
        return;
      }

      if (data.session) {
        // Store additional details in the profiles table.
        // Schema: profiles.id = auth.uid()
        const userId = data.session.user.id;

        try {
          await upsertProfileById(userId, {
            full_name: fullName || null,
            phone: phone || null,
            address: address || null,
          });
        } catch (e: any) {
          Alert.alert("Profile save failed", e?.message ?? String(e));
        }

        router.replace("/dashboard");
        return;
      }

      Alert.alert(
        "Account created",
        "Please check your email to confirm your account, then log in."
      );
      router.replace("/auth/login");
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
          Get Started
        </ThemedText>
        <ThemedText
          lightColor={muted}
          darkColor={muted}
          style={styles.subtitle}
        >
          Create and Access your account, and enjoy Seamless Convenience
        </ThemedText>
      </View>

      <View style={styles.form}>
        <AuthTextField
          label="Full Name:"
          value={fullName}
          onChangeText={setFullName}
          icon="person"
          autoCapitalize="words"
          density="compact"
        />

        <View style={styles.row}>
          <View style={styles.half}>
            <AuthTextField
              label="Phone:"
              value={phone}
              onChangeText={setPhone}
              icon="phone"
              keyboardType="phone-pad"
              density="compact"
            />
          </View>
          <View style={styles.half}>
            <AuthTextField
              label="Address:"
              value={address}
              onChangeText={setAddress}
              icon="home"
              autoCapitalize="words"
              density="compact"
            />
          </View>
        </View>

        <AuthTextField
          label="Email:"
          value={email}
          onChangeText={setEmail}
          icon="email"
          keyboardType="email-address"
          autoCapitalize="none"
          density="compact"
        />

        <AuthTextField
          label="Password:"
          value={password}
          onChangeText={setPassword}
          icon="lock"
          secureTextEntry
          autoCapitalize="none"
          density="compact"
        />

        <AuthTextField
          label="Confirm Password:"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          icon="lock"
          secureTextEntry
          autoCapitalize="none"
          density="compact"
        />

        <AuthPrimaryButton
          label={isSubmitting ? "Registering..." : "Register"}
          onPress={isSubmitting ? () => {} : onSignup}
        />

        <View style={styles.footer}>
          <ThemedText style={[styles.footerText, { color: muted }]}>
            Already have an account?{" "}
          </ThemedText>
          <Link href="./login" asChild>
            <ThemedText
              lightColor={linkYellow}
              darkColor={linkYellow}
              style={styles.footerLink}
            >
              Sign In
            </ThemedText>
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
    textAlign: "center",
    marginTop: 6,
    maxWidth: 300,
    lineHeight: 18,
  },
  form: {
    gap: 8,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  half: {
    flex: 1,
  },
  orRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(148,163,184,0.5)",
  },
  orLabel: {
    paddingHorizontal: 12,
    fontSize: 12,
    fontWeight: "700",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 4,
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
