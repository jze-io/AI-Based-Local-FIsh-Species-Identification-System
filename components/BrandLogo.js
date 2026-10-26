import React from "react";
import { Image } from "react-native";

const SOURCES = {
  teal: require("../assets/ofishx-mark-teal.png"),
  white: require("../assets/ofishx-mark-white.png"),
  deep: require("../assets/ofishx-mark-deep.png"),
};

/**
 * Trimmed OFishx mark. The original logo asset is preserved in the project as
 * assets/ofishx-logo.png; this component uses recoloured copies so the mark
 * fits the app's teal/ocean palette.
 */
export default function BrandLogo({
  size = 42,
  variant = "teal",
  accessibilityLabel = "OFishx logo",
}) {
  return (
    <Image
      source={SOURCES[variant] || SOURCES.teal}
      accessibilityLabel={accessibilityLabel}
      resizeMode="contain"
      style={{ width: size * 1.237, height: size }}
    />
  );
}
