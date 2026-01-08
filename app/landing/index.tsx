import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

function LandingContent() {
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      <Image
        source={require("@/assets/images/landing_bg.png")}
        style={styles.bgImage}
        contentFit="cover"
        transition={0}
        cachePolicy="memory-disk"
      />
      <View style={styles.bgOverlay} />

      <View style={styles.hero}>
        <View style={styles.heroSpacer} />
      </View>

      <View style={styles.card}>
        <ThemedText type="subtitle" style={styles.title}>
          Let’s get started
        </ThemedText>

        <View style={styles.buttonStack}>
          <Pressable
            style={[styles.button, styles.primaryButton]}
            onPress={() => router.push("../auth/login")}
          >
            <ThemedText style={[styles.buttonText, styles.primaryButtonText]}>
              Login
            </ThemedText>
          </Pressable>

          <Pressable
            style={[styles.button, styles.secondaryButton]}
            onPress={() => router.push("../auth/signup")}
          >
            <ThemedText style={[styles.buttonText, styles.secondaryButtonText]}>
              Registration
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </ThemedView>
  );
}

export default function LandingScreen() {
  return <LandingContent />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bgImage: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
  },
  bgOverlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  hero: {
    flex: 1,
  },
  heroSpacer: {
    flex: 1,
  },
  card: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 36,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    backgroundColor: "#FFFFFF",
  },
  title: {
    textAlign: "center",
    color: "#000000",
  },
  buttonStack: {
    marginTop: 24,
    gap: 12,
  },
  button: {
    height: 56,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    backgroundColor: "#F3E659",
  },
  secondaryButton: {
    backgroundColor: "#1F1F1F",
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  primaryButtonText: {
    color: "#111111",
  },
  secondaryButtonText: {
    color: "#FFFFFF",
  },
});
