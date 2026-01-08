import { Link } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";

import {
  AuthGoogleButton,
  AuthPrimaryButton,
} from "@/components/auth/auth-buttons";
import { AuthScreenShell } from "@/components/auth/auth-screen-shell";
import { AuthTextField } from "@/components/auth/auth-text-field";
import { ThemedText } from "@/components/themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";

export default function SignupScreen() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const text = "#000000";
  const muted = "#4B5563";
  const primary = useThemeColor({ light: "#F8E759", dark: "#F8E759" }, "text");
  const linkYellow = "#D6C94A";

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

        <AuthPrimaryButton label="Register" onPress={() => {}} />

        <View style={styles.orRow}>
          <View style={styles.orLine} />
          <ThemedText style={[styles.orLabel, { color: muted }]}>OR</ThemedText>
          <View style={styles.orLine} />
        </View>

        <AuthGoogleButton
          label="Google"
          onPress={() => {}}
          iconUri="https://lh3.googleusercontent.com/aida-public/AB6AXuBOeh4q6ET9FtESwbleQ_TJxsxC9iy72bgLReanKQH4qmlCBAa7Nd8vPJKIjdkvPPZhsK_tP2Kyy_9TErkYU2UiyYsmNy0Bj6O5lD4gLyrcOPEYvUtTpN6Styb_ijUTNsK-J1imy7fYwBIxCjlMRpMf3HdPtN-C0ZwzsmC04bfItpw-7LcPdX0fFVx0vSpxeMLmtlkqBDxXRh_WB8Q4GVIC4u7PcHJrD96GaQFD4ZogV4KksTkVaXGzvUKlP18XOEfeE1cQ8I86BoLJ"
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
