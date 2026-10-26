import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, layout, typography } from "../constants/theme";

export default function Screen({
  children,
  scroll = true,
  contentContainerStyle,
  style,
  edges = ["top", "left", "right"],
  refreshControl,
}) {
  return (
    <SafeAreaView edges={edges} style={[layout.screen, style]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[layout.content, contentContainerStyle]}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          refreshControl={refreshControl}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        children
      )}
    </SafeAreaView>
  );
}

export function PageHeader({ eyebrow, title, subtitle, accessory }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        {eyebrow ? <Text style={typography.eyebrow}>{eyebrow}</Text> : null}
        <Text accessibilityRole="header" style={typography.display}>
          {title}
        </Text>
        {subtitle ? <Text style={typography.body}>{subtitle}</Text> : null}
      </View>
      {accessory ? <View>{accessory}</View> : null}
    </View>
  );
}

export function SectionTitle({ title, actionLabel, onAction }) {
  return (
    <View style={styles.sectionTitle}>
      <Text accessibilityRole="header" style={typography.heading}>
        {title}
      </Text>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={onAction}
          hitSlop={8}
        >
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function InlineNotice({ icon = "information-circle-outline", children }) {
  return (
    <View style={styles.notice}>
      <Ionicons name={icon} size={19} color={colors.ocean} />
      <Text style={styles.noticeText}>{children}</Text>
    </View>
  );
}

export function LoadingState({ label = "Loading…" }) {
  return (
    <View style={styles.stateCard}>
      <ActivityIndicator color={colors.primary} />
      <Text style={typography.body}>{label}</Text>
    </View>
  );
}

export function ErrorState({ title = "Something went wrong", message, onRetry }) {
  return (
    <View style={styles.stateCard}>
      <View style={styles.stateIcon}>
        <Ionicons name="alert-circle-outline" size={24} color={colors.danger} />
      </View>
      <Text style={typography.heading}>{title}</Text>
      <Text style={typography.body}>{message}</Text>
      {onRetry ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Try again"
          onPress={onRetry}
          style={styles.retry}
        >
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function EmptyState({ icon = "water-outline", title, message, action }) {
  return (
    <View style={styles.stateCard}>
      <View style={styles.stateIcon}>
        <Ionicons name={icon} size={25} color={colors.primary} />
      </View>
      <Text style={typography.heading}>{title}</Text>
      <Text style={typography.body}>{message}</Text>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 14,
    paddingTop: 8,
    marginBottom: 2,
  },
  headerText: {
    flex: 1,
    gap: 8,
  },
  sectionTitle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 4,
  },
  action: {
    color: colors.ocean,
    fontSize: 13,
    fontWeight: "700",
  },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 13,
  },
  noticeText: {
    flex: 1,
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  stateCard: {
    ...layout.card,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 26,
    gap: 10,
  },
  stateIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceStrong,
  },
  retry: {
    marginTop: 2,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  retryText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 13,
  },
});
