import { Image, type ImageSource } from "expo-image";
import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";

type AuthScreenShellProps = {
  imageSource: ImageSource;
  children: React.ReactNode;
  cardStyle?: ViewStyle;
};

export function AuthScreenShell({
  imageSource,
  children,
  cardStyle,
}: AuthScreenShellProps) {
  return (
    <View style={styles.root}>
      <Image
        source={imageSource}
        style={styles.bgImage}
        contentFit="cover"
        transition={0}
        cachePolicy="memory-disk"
      />
      <View style={styles.bgOverlay} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroSpacer} />

          <View style={[styles.card, cardStyle]}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  flex: {
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
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  heroSpacer: {
    height: "35%",
  },
  card: {
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 36,
    backgroundColor: "#FFFFFF",
  },
});
