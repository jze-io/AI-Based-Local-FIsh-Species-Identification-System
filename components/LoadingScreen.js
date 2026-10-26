import React from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import FishPattern from "./FishPattern";
import { colors, typography } from "../constants/theme";

/**
 * Branded launch screen. Shown once while the app preloads its image assets,
 * then fades away to reveal the navigator underneath.
 */
export default function LoadingScreen({ onLayout }) {
  return (
    <View
      accessibilityLabel="OFishx is starting"
      onLayout={onLayout}
      style={styles.container}
    >
      <FishPattern color={colors.primary} strength={0.045} />

      <View style={styles.brand}>
        <View style={styles.markWrap}>
          <Image
            accessibilityLabel="OFishx logo"
            resizeMode="contain"
            source={require("../assets/ofishx-logo-ocean.png")}
            style={styles.mark}
          />
        </View>
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
            color={colors.ocean}
            name="fish"
            size={18}
            style={{ opacity: 0.5, transform: [{ scaleX: -1 }] }}
          />
          <Ionicons
            color={colors.turquoise}
            name="fish"
            size={10}
            style={{ opacity: 0.55 }}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <ActivityIndicator color={colors.ocean} size="small" />
        <Text style={styles.status}>Preparing the scanner…</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
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
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  mark: {
    width: 94,
    height: 76,
  },
  wordmark: {
    color: colors.ink,
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  tagline: {
    ...typography.caption,
    color: colors.mutedLight,
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
    color: colors.mutedLight,
    fontSize: 12,
    letterSpacing: 0.2,
  },
});
