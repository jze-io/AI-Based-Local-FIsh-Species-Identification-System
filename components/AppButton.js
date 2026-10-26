import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius } from "../constants/theme";

const VARIANTS = {
  primary: {
    background: colors.primary,
    border: colors.primary,
    text: colors.white,
  },
  secondary: {
    background: colors.white,
    border: colors.borderStrong,
    text: colors.primary,
  },
  light: {
    background: "rgba(255,255,255,0.12)",
    border: "rgba(255,255,255,0.38)",
    text: colors.white,
  },
  white: {
    background: colors.white,
    border: colors.white,
    text: colors.primary,
  },
  ghost: {
    background: "transparent",
    border: "transparent",
    text: colors.primary,
  },
  danger: {
    background: colors.dangerSoft,
    border: "#F2CCD2",
    text: colors.danger,
  },
};

export default function AppButton({
  title,
  onPress,
  icon,
  variant = "primary",
  loading = false,
  disabled = false,
  compact = false,
  style,
  accessibilityHint,
}) {
  const palette = VARIANTS[variant] || VARIANTS.primary;
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        compact && styles.compact,
        {
          backgroundColor: palette.background,
          borderColor: palette.border,
          opacity: inactive ? 0.5 : pressed ? 0.82 : 1,
        },
        style,
      ]}
    >
      <View style={styles.inner}>
        {loading ? (
          <ActivityIndicator color={palette.text} size="small" />
        ) : icon ? (
          <Ionicons name={icon} size={compact ? 17 : 20} color={palette.text} />
        ) : null}
        <Text
          style={[
            styles.label,
            compact && styles.compactLabel,
            { color: palette.text },
          ]}
        >
          {title}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 54,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 14,
    justifyContent: "center",
  },
  compact: {
    minHeight: 42,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.sm,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.1,
  },
  compactLabel: {
    fontSize: 13,
  },
});
