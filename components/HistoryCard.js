import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, layout, radius, typography } from "../constants/theme";
import { confidenceDescriptor, formatDate, formatPercent } from "../utils/format";

/**
 * A compact saved-scan row. The delete action is a separate sibling button so
 * tapping it never opens the result by accident.
 */
export default function HistoryCard({ scan, onPress, onDelete, deleting }) {
  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${scan.topPrediction.label} scan from ${formatDate(scan.createdAt)}`}
        onPress={onPress}
        style={({ pressed }) => [styles.main, { opacity: pressed ? 0.78 : 1 }]}
      >
        <View style={styles.photoWrap}>
          <Image
            source={{ uri: scan.imageUri }}
            accessibilityLabel={`Saved photo of ${scan.topPrediction.label}`}
            style={styles.photo}
            resizeMode="cover"
          />
          <View style={styles.badge}>
            <Ionicons name="checkmark-circle" size={12} color={colors.primary} />
            <Text style={styles.badgeText}>Saved</Text>
          </View>
        </View>

        <View style={styles.info}>
          <Text style={typography.bodyStrong} numberOfLines={1}>
            {scan.topPrediction.label}
          </Text>
          <Text style={styles.confidence}>
            {confidenceDescriptor(scan.topPrediction.confidence)} ·{" "}
            {formatPercent(scan.topPrediction.confidence)}
          </Text>
          <Text style={styles.date}>{formatDate(scan.createdAt)}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.mutedLight} />
      </Pressable>

      {onDelete ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Delete ${scan.topPrediction.label} scan`}
          accessibilityState={{ disabled: deleting, busy: deleting }}
          disabled={deleting}
          onPress={onDelete}
          hitSlop={10}
          style={({ pressed }) => [
            styles.delete,
            { opacity: deleting ? 0.4 : pressed ? 0.6 : 1 },
          ]}
        >
          <Ionicons
            name={deleting ? "hourglass-outline" : "trash-outline"}
            size={18}
            color={colors.danger}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...layout.card,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    paddingRight: 12,
  },
  main: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  photoWrap: {
    width: 76,
    height: 82,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.surfaceStrong,
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  badge: {
    position: "absolute",
    left: 6,
    bottom: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  badgeText: {
    color: colors.primary,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  info: {
    flex: 1,
    gap: 3,
  },
  confidence: {
    color: colors.ocean,
    fontSize: 12,
    fontWeight: "600",
  },
  date: {
    color: colors.muted,
    fontSize: 11,
  },
  delete: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
});
