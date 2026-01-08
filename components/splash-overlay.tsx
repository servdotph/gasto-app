import MaskedView from "@react-native-masked-view/masked-view";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from "react-native";

import { MaterialIcons } from "@expo/vector-icons";

type Props = {
  reveal: React.ReactNode;
  onFinished: () => void;
};

const REVEAL_CIRCLE_SIZE = 16;

export function SplashOverlay({ reveal, onFinished }: Props) {
  const [containerWidth, setContainerWidth] = useState(
    Dimensions.get("window").width
  );
  const [containerHeight, setContainerHeight] = useState(
    Dimensions.get("window").height
  );

  const logoScale = useRef(new Animated.Value(0.9)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(8)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const exitProgress = useRef(new Animated.Value(0)).current;

  const onLayout = (event: LayoutChangeEvent) => {
    const { width: nextWidth, height: nextHeight } = event.nativeEvent.layout;
    if (Number.isFinite(nextWidth) && nextWidth > 0)
      setContainerWidth(nextWidth);
    if (Number.isFinite(nextHeight) && nextHeight > 0)
      setContainerHeight(nextHeight);
  };

  const progressWidth = useMemo(() => {
    return progress.interpolate({
      inputRange: [0, 1],
      outputRange: ["0%", "100%"],
    });
  }, [progress]);

  const revealScaleTarget = useMemo(() => {
    const radius = Math.sqrt(
      Math.pow(containerWidth / 2, 2) + Math.pow(containerHeight / 2, 2)
    );
    return (radius * 2) / REVEAL_CIRCLE_SIZE;
  }, [containerHeight, containerWidth]);

  const revealScale = useMemo(() => {
    return exitProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [0.001, revealScaleTarget],
    });
  }, [exitProgress, revealScaleTarget]);

  const splashFade = useMemo(() => {
    return exitProgress.interpolate({
      inputRange: [0, 0.15, 1],
      outputRange: [1, 0, 0],
    });
  }, [exitProgress]);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    pulse.start();

    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        damping: 12,
        stiffness: 160,
        mass: 0.7,
        useNativeDriver: true,
      }),
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 450,
        delay: 120,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(titleTranslateY, {
        toValue: 0,
        duration: 450,
        delay: 120,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(progress, {
        toValue: 1,
        duration: 2600,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: false,
      }),
    ]).start(({ finished }) => {
      if (!finished) return;

      Animated.timing(exitProgress, {
        toValue: 1,
        duration: 650,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished: exitFinished }) => {
        if (exitFinished) onFinished();
      });
    });

    return () => {
      pulse.stop();
      progress.stopAnimation();
      logoOpacity.stopAnimation();
      logoScale.stopAnimation();
      titleOpacity.stopAnimation();
      titleTranslateY.stopAnimation();
      glowPulse.stopAnimation();
      exitProgress.stopAnimation();
    };
  }, [
    exitProgress,
    glowPulse,
    logoOpacity,
    logoScale,
    onFinished,
    progress,
    titleOpacity,
    titleTranslateY,
  ]);

  return (
    <View style={styles.root} onLayout={onLayout} pointerEvents="auto">
      {/* Splash overlay */}
      <View style={styles.overlay}>
        <Animated.View style={[styles.splashContent, { opacity: splashFade }]}>
          <View style={styles.glowContainer}>
            <Animated.View
              style={[
                styles.bigGlow,
                {
                  transform: [
                    {
                      scale: glowPulse.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.06],
                      }),
                    },
                  ],
                  opacity: glowPulse.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.45, 0.65],
                  }),
                },
              ]}
            />
            <Animated.View
              style={[
                styles.smallGlow,
                {
                  transform: [
                    {
                      scale: glowPulse.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.12],
                      }),
                    },
                  ],
                  opacity: glowPulse.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.35, 0.55],
                  }),
                },
              ]}
            />
          </View>

          <View style={styles.content}>
            <Animated.View
              style={[
                styles.logoContainer,
                { opacity: logoOpacity, transform: [{ scale: logoScale }] },
              ]}
            >
              <MaterialIcons
                name="account-balance-wallet"
                size={48}
                color="#000000"
              />
            </Animated.View>

            <Animated.Text
              style={[
                styles.title,
                {
                  opacity: titleOpacity,
                  transform: [{ translateY: titleTranslateY }],
                },
              ]}
            >
              Gasto
            </Animated.Text>

            <Animated.Text style={[styles.tagline, { opacity: titleOpacity }]}>
              Smart Expense Tracking
            </Animated.Text>
          </View>

          <View style={styles.footer}>
            <View style={styles.loadingBar}>
              <Animated.View
                style={[styles.loadingProgress, { width: progressWidth }]}
              />
            </View>
            <Text style={styles.versionText}>v1.0</Text>
          </View>
        </Animated.View>
      </View>

      {/* Circular reveal of the underlying content */}
      <MaskedView
        pointerEvents="none"
        style={styles.revealLayer}
        maskElement={
          <View style={styles.maskContainer}>
            <Animated.View
              style={[
                styles.revealCircle,
                {
                  transform: [{ scale: revealScale }],
                },
              ]}
            />
          </View>
        }
      >
        {reveal}
      </MaskedView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#FFD500",
  },
  revealLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  maskContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  revealCircle: {
    width: REVEAL_CIRCLE_SIZE,
    height: REVEAL_CIRCLE_SIZE,
    borderRadius: REVEAL_CIRCLE_SIZE / 2,
    backgroundColor: "black",
  },
  splashContent: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  glowContainer: {
    position: "absolute",
    inset: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  bigGlow: {
    position: "absolute",
    width: 500,
    height: 500,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 250,
    top: "50%",
    left: "50%",
    transform: [{ translateX: -250 }, { translateY: -250 }],
    opacity: 0.5,
  },
  smallGlow: {
    position: "absolute",
    width: 200,
    height: 200,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 100,
    top: "33%",
    left: "50%",
    transform: [{ translateX: -100 }, { translateY: -100 }],
    opacity: 0.5,
  },
  content: {
    alignItems: "center",
    zIndex: 10,
  },
  logoContainer: {
    marginBottom: 32,
    height: 96,
    width: 96,
    borderRadius: 32,
    backgroundColor: "rgba(0,0,0,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 40,
    fontWeight: "800",
    color: "#000000",
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: "#4B4B4B",
    opacity: 0.8,
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 48,
    alignItems: "center",
  },
  loadingBar: {
    width: 128,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(0,0,0,0.1)",
    overflow: "hidden",
    marginBottom: 8,
  },
  loadingProgress: {
    width: "33%",
    height: "100%",
    backgroundColor: "#000000",
    borderRadius: 2,
  },
  versionText: {
    fontSize: 12,
    color: "rgba(0,0,0,0.6)",
    textTransform: "uppercase",
  },
});
