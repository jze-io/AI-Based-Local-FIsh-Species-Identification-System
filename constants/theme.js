import { StyleSheet } from "react-native";

/**
 * OFishx palette: white canvas, dark teal/ocean-blue structure, and a small
 * amount of turquoise for status accents. Orange/gold from the older
 * prototype is intentionally left out of the app chrome.
 */
export const colors = {
  background: "#FFFFFF",
  surface: "#F4FAFA",
  surfaceStrong: "#EAF5F5",
  card: "#FFFFFF",
  ink: "#0B2E33",
  primary: "#0F4C5C",
  primaryDark: "#083B47",
  ocean: "#126E7A",
  turquoise: "#2EC4B6",
  turquoiseSoft: "#E4F8F5",
  muted: "#5B7277",
  mutedLight: "#8FA4A8",
  border: "#DCE9E9",
  borderStrong: "#C7DEDE",
  white: "#FFFFFF",
  danger: "#A63D4A",
  dangerSoft: "#FDEEF0",
  warning: "#8A5A00",
  warningSoft: "#FFF6DF",
  success: "#176B54",
  successSoft: "#E7F7F0",
  overlay: "rgba(6, 40, 47, 0.72)",
  transparent: "transparent",
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 26,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 36,
};

export const shadow = {
  shadowColor: colors.ink,
  shadowOpacity: 0.06,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
};

export const typography = StyleSheet.create({
  eyebrow: {
    color: colors.ocean,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.7,
    textTransform: "uppercase",
  },
  display: {
    color: colors.ink,
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -1,
    lineHeight: 39,
  },
  title: {
    color: colors.ink,
    fontSize: 25,
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: 31,
  },
  heading: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 24,
  },
  body: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 23,
  },
  bodyStrong: {
    color: colors.ink,
    fontSize: 15,
    lineHeight: 23,
    fontWeight: "600",
  },
  caption: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  small: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
  },
});

export const layout = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 36,
    gap: 18,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    gap: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  spread: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
});
