import React, { useEffect, useState } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import FishPattern from "./FishPattern";
import { colors, typography } from "../constants/theme";

/**
 * Branded launch screen. Shown once while the app preloads its image assets,
 * then fades away to reveal the navigator underneath.
 *
 * Motion: the brand block eases in, the logo breathes gently, and the fish
 * pattern drifts sideways. All loops are skipped when the OS asks for
 * reduced motion.
 */
export default function LoadingScreen({ onLayout }) {
  const [intro] = useState(() => new Animated.Value(0));
  const [breathe] = useState(() => new Animated.Value(0));
  const [drift] = useState(() => new Animated.Value(0));

  useEffect(() => {
    let mounted = true;

    Animated.timing(intro, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    let breatheLoop = null;
    let driftLoop = null;

    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduceMotion) => {
        if (!mounted || reduceMotion) {
          return;
        }

        breatheLoop = Animated.loop(
          Animated.sequence([
            Animated.timing(breathe, {
              toValue: 1,
              duration: 1700,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(breathe, {
              toValue: 0,
              duration: 1700,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
        );

        driftLoop = Animated.loop(
          Animated.sequence([
            Animated.timing(drift, {
              toValue: 1,
              duration: 3600,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(drift, {
              toValue: 0,
              duration: 3600,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
        );

        breatheLoop.start();
        driftLoop.start();
      });

    return () => {
      mounted = false;
      if (breatheLoop) breatheLoop.stop();
      if (driftLoop) driftLoop.stop();
    };
  }, [intro, breathe, drift]);

  const brandStyle = {
    opacity: intro,
    transform: [
      {
        translateY: intro.interpolate({
          inputRange: [0, 1],
          outputRange: [12, 0],
        }),
      },
    ],
  };

  const logoScale = breathe.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.045],
  });

  const driftX = drift.interpolate({
    inputRange: [0, 1],
    outputRange: [-7, 7],
  });

  return (
    <View
      accessibilityLabel="OFishx is starting"
      onLayout={onLayout}
      style={styles.container}
    >
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { transform: [{ translateX: driftX }] }]}
      >
        <FishPattern color={colors.white} strength={0.07} />
      </Animated.View>

      <Animated.View style={[styles.brand, brandStyle]}>
        <Animated.View style={[styles.markWrap, { transform: [{ scale: logoScale }] }]}>
          <Image
            accessibilityLabel="OFishx logo"
            resizeMode="contain"
            source={require("../assets/ofishx-logo.png")}
            style={styles.mark}
          />
        </Animated.View>
        <Text style={styles.wordmark}>OFishx</Text>
        <Text style={styles.tagline}>Philippine fish identification</Text>

        <View style={styles.school} accessibilityElementsHidden>
          <Ionicons
            color={colors.turquoise}
            name="fish"
            size={12}
            style={{ opacity: 0.75 }}
          />
          <Ionicons
            color="#9EE9E2"
            name="fish"
            size={18}
            style={{ opacity: 0.6, transform: [{ scaleX: -1 }] }}
          />
          <Ionicons
            color={colors.turquoise}
            name="fish"
            size={10}
            style={{ opacity: 0.55 }}
          />
        </View>
      </Animated.View>

      <Animated.View style={[styles.footer, { opacity: intro }]}>
        <ActivityIndicator color={colors.turquoise} size="small" />
        <Text style={styles.status}>Preparing the scanner…</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryDark,
    paddingHorizontal: 32,
  },
  brand: {
    alignItems: "center",
    gap: 14,
  },
  markWrap: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 70,
    backgroundColor: colors.white,
  },
  mark: {
    width: 94,
    height: 76,
  },
  wordmark: {
    color: colors.white,
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  tagline: {
    ...typography.caption,
    color: "#A9CBCB",
    letterSpacing: 0.2,
  },
  school: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  footer: {
    position: "absolute",
    bottom: 56,
    alignItems: "center",
    gap: 10,
  },
  status: {
    color: "#8FB5B5",
    fontSize: 12,
    letterSpacing: 0.2,
  },
});
