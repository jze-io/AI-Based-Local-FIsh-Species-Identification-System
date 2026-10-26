import React from "react";
import { Image } from "react-native";

const SOURCES = {
  ocean: require("../assets/ofishx-logo-ocean.png"),
  teal: require("../assets/ofishx-mark-teal.png"),
  white: require("../assets/ofishx-mark-white.png"),
  deep: require("../assets/ofishx-mark-deep.png"),
};

/**
 * Trimmed OFishx mark. The original logo asset is preserved in the project as
 * assets/ofishx-logo.png; this component uses recoloured copies so the mark
 * fits the app's teal/ocean palette. The "ocean" variant keeps the logo's
 * multi-tone fish detail; the flat variants are for small or dark placements.
 */
export default function BrandLogo({
  size = 42,
  variant = "ocean",
  accessibilityLabel = "OFishx logo",
}) {
  return (
    <Image
      source={SOURCES[variant] || SOURCES.ocean}
      accessibilityLabel={accessibilityLabel}
      resizeMode="contain"
      style={{ width: size * 1.237, height: size }}
    />
  );
}
