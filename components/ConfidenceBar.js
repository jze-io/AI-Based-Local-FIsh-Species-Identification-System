import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LOW_CONFIDENCE_THRESHOLD } from "../constants/config";
import { colors, radius } from "../constants/theme";
import { formatPercent } from "../utils/format";

export default function ConfidenceBar({
  value,
  showLabel = true,
  height = 8,
  tone,
}) {
  const numeric = Math.max(0, Math.min(1, Number(value) || 0));
  const background =
    tone ||
    (numeric >= 0.85
      ? colors.primary
      : numeric >= LOW_CONFIDENCE_THRESHOLD
        ? colors.ocean
        : colors.turquoise);

  return (
    <View style={styles.wrap}>
      <View style={[styles.track, { height }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${Math.max(2, numeric * 100)}%`,
              height,
              backgroundColor: background,
            },
          ]}
        />
      </View>
      {showLabel ? (
        <Text style={styles.label}>{formatPercent(numeric)}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  track: {
    flex: 1,
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  fill: {
    borderRadius: radius.pill,
  },
  label: {
    minWidth: 48,
    textAlign: "right",
    color: colors.ink,
    fontSize: 12,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
});
