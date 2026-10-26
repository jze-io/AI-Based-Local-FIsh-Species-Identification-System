import React, { useEffect, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
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
  const target = Math.max(0.02, numeric);
  const background =
    tone ||
    (numeric >= 0.85
      ? colors.primary
      : numeric >= LOW_CONFIDENCE_THRESHOLD
        ? colors.ocean
        : colors.turquoise);

  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(progress, {
      toValue: target,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, target]);

  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.wrap}>
      <View style={[styles.track, { height }]}>
        <Animated.View
          style={[
            styles.fill,
            {
              width,
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
