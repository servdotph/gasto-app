import { Image, type ImageSource } from "expo-image";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

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

type SocialButtonProps = {
  label: string;
  onPress: () => void;
  iconSource: ImageSource;
};

export function AuthGoogleButton({
  label,
  onPress,
  iconSource,
}: SocialButtonProps) {
  const background = "#000000";
  const text = "#FFFFFF";

  return (
    <Pressable
      style={({ pressed }) => [
        styles.socialButton,
        { backgroundColor: background, opacity: pressed ? 0.92 : 1 },
      ]}
      onPress={onPress}
    >
      <View style={styles.socialRow}>
        <Image
          source={iconSource}
          style={styles.socialIcon}
          contentFit="contain"
          transition={0}
          cachePolicy="memory-disk"
        />
        <ThemedText
          lightColor={text}
          darkColor={text}
          style={styles.socialText}
        >
          {label}
        </ThemedText>
      </View>
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
  socialButton: {
    height: 56,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  socialRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  socialIcon: {
    width: 20,
    height: 20,
  },
  socialText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
