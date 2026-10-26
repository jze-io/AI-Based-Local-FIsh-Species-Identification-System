import React from "react";
import { Image } from "react-native";

const SOURCES = {
  original: require("../assets/ofishx-logo.png"),
  teal: require("../assets/ofishx-mark-teal.png"),
  white: require("../assets/ofishx-mark-white.png"),
  deep: require("../assets/ofishx-mark-deep.png"),
};

/**
 * OFishx mark. The default variant is the original orange/navy/gold logo;
 * the flat teal/white/deep variants exist for small or dark placements where
 * the full logo would lose contrast.
 */
export default function BrandLogo({
  size = 42,
  variant = "original",
  accessibilityLabel = "OFishx logo",
}) {
  return (
    <Image
      source={SOURCES[variant] || SOURCES.original}
      accessibilityLabel={accessibilityLabel}
      resizeMode="contain"
      style={{ width: size * 1.237, height: size }}
    />
  );
}
