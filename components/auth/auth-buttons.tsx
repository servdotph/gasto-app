import React from "react";
import { Pressable, StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
};

export function AuthPrimaryButton({ label, onPress }: PrimaryButtonProps) {
  const primary = "#F8E759";

  return (
    <Pressable
      style={({ pressed }) => [
        styles.primaryButton,
        { backgroundColor: primary, opacity: pressed ? 0.92 : 1 },
      ]}
      onPress={onPress}
    >
      <ThemedText style={styles.primaryButtonText}>{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  primaryButton: {
    height: 60,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: "#111111",
    textTransform: "uppercase",
  },
});
