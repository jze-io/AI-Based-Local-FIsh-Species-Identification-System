import React, { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import Constants from "expo-constants";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Screen, { PageHeader, SectionTitle } from "../components/Screen";
import BrandLogo from "../components/BrandLogo";
import AppButton from "../components/AppButton";
import FishPattern from "../components/FishPattern";
import { API_BASE_URL } from "../constants/config";
import { MODEL_LABELS } from "../constants/labels";
import { checkBackend } from "../services/fishClassifier";
import { colors, layout, radius, typography } from "../constants/theme";

const LIMITS = [
  "A confidence score is the model's output for one class, not proof that the fish is that species.",
  "Philippine local names can cover several species. Scientific names marked probable or unconfirmed are context, not verified identification.",
  "Poor light, glare, clutter, partial fish, or more than one fish can produce a wrong match.",
  "Identification needs the OFishx server running on your PC. Expo Go cannot run the TFLite model by itself.",
  "Do not use OFishx for food safety, conservation, regulatory, or medical decisions.",
];

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function AboutScreen({ navigation }) {
  const [connection, setConnection] = useState({
    state: "checking",
    message: "Checking the OFishx server on your PC…",
    classes: 0,
  });

  const checkServer = useCallback(async () => {
    setConnection({
      state: "checking",
      message: "Checking the OFishx server on your PC…",
      classes: 0,
    });
    try {
      const result = await checkBackend();
      setConnection({
        state: "ok",
        message: "The PC server is reachable.",
        classes: result.classes.length,
      });
    } catch (error) {
      setConnection({
        state: "error",
        message: error.message,
        classes: 0,
      });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      checkServer();
    }, [checkServer]),
  );

  const statusTone =
    connection.state === "ok"
      ? { color: colors.success, background: colors.successSoft }
      : connection.state === "error"
        ? { color: colors.danger, background: colors.dangerSoft }
        : { color: colors.ocean, background: colors.surfaceStrong };

  return (
    <Screen>
      <PageHeader
        eyebrow="ABOUT"
        title="OFishx"
        subtitle="A local fish identifier for ten Philippine species, built around a trained image model."
      />

      <View style={styles.hero}>
        <View style={styles.heroRing} />
        <FishPattern color={colors.white} strength={0.1} />
        <View style={styles.heroContent}>
          <BrandLogo size={52} variant="white" />
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={styles.heroTitle}>OFishx</Text>
            <Text style={styles.heroSubtitle}>
              Know your catch, then check it.
            </Text>
          </View>
          <View style={styles.versionPill}>
            <Text style={styles.versionText}>
              v{Constants.expoConfig?.version || "1.0.0"}
            </Text>
          </View>
        </View>
        <Text style={styles.heroBody}>
          Photograph a fish, send the photo to the model running on your own
          computer, and read the result alongside cautious local fish notes.
        </Text>
      </View>

      <View style={styles.statusCard}>
        <View style={styles.statusTop}>
          <View
            style={[styles.statusIcon, { backgroundColor: statusTone.background }]}
          >
            {connection.state === "checking" ? (
              <ActivityIndicator size="small" color={colors.ocean} />
            ) : (
              <Ionicons
                name={
                  connection.state === "ok"
                    ? "checkmark-circle"
                    : "cloud-offline"
                }
                size={21}
                color={statusTone.color}
              />
            )}
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.statusTitle}>
              {connection.state === "ok"
                ? "Model server connected"
                : connection.state === "error"
                  ? "Model server unavailable"
                  : "Checking model server"}
            </Text>
            <Text style={styles.statusMessage}>{connection.message}</Text>
          </View>
        </View>
        {connection.state === "ok" ? (
          <Text style={styles.statusMeta}>
            {connection.classes} classes reported by the backend.
          </Text>
        ) : null}
        <View style={styles.endpoint}>
          <Ionicons name="link-outline" size={14} color={colors.ocean} />
          <Text selectable style={styles.endpointText}>
            {API_BASE_URL}
          </Text>
        </View>
        <AppButton
          title={connection.state === "checking" ? "Checking…" : "Check again"}
          icon="refresh-outline"
          variant="secondary"
          compact
          loading={connection.state === "checking"}
          onPress={checkServer}
        />
      </View>

      <View style={styles.card}>
        <Text style={typography.heading}>What it does</Text>
        <Text style={typography.body}>
          OFishx compares one fish photo against a model trained on ten
          Philippine fish classes. It shows the model&apos;s best match, the
          percentage score, and the next highest scores so you can see how
          clearly the model separated them. You can save results to a local scan
          history and browse background notes for every class.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={typography.heading}>The model</Text>
        <InfoRow label="Classifier" value="OFishx Philippine fish classifier" />
        <View style={styles.divider} />
        <InfoRow label="Classes" value={`${MODEL_LABELS.length} fish labels`} />
        <View style={styles.divider} />
        <InfoRow label="Input" value="224 × 224 RGB photo" />
        <View style={styles.divider} />
        <InfoRow label="Runs on" value="Your PC, reached over local Wi-Fi" />
        <View style={styles.divider} />
        <InfoRow
          label="Model classes"
          value={MODEL_LABELS.join(" · ")}
        />
      </View>

      <View style={styles.card}>
        <Text style={typography.heading}>How identification works</Text>
        <Text style={typography.body}>
          The app sends your photo to the Flask server at the address above. The
          server resizes the image, runs the supplied TFLite model, and returns
          the real class scores. The app does not invent a prediction or fall
          back to a guess when the server is offline. The phone and PC must be on
          the same Wi-Fi network.
        </Text>
      </View>

      <SectionTitle title="Important limits" />
      <View style={styles.limitsCard}>
        {LIMITS.map((limit) => (
          <View key={limit} style={styles.limitRow}>
            <Ionicons
              name="alert-circle-outline"
              size={17}
              color={colors.warning}
            />
            <Text style={styles.limitText}>{limit}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <View style={styles.privacyHeader}>
          <View style={styles.privacyIcon}>
            <Ionicons name="lock-closed-outline" size={19} color={colors.primary} />
          </View>
          <Text style={typography.heading}>Privacy</Text>
        </View>
        <Text style={typography.body}>
          Photos are sent only to your own PC over your local network. The
          inference server processes the upload in memory and does not store it.
          Saved scans and their photos stay in this app&apos;s storage on this
          phone and can be deleted from the History screen. OFishx has no user
          account and sends nothing to a third-party service.
        </Text>
      </View>

      <View style={styles.quickLinks}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open the fish field guide"
          onPress={() => navigation.navigate("Fish Information")}
          style={({ pressed }) => [
            styles.quickLink,
            { opacity: pressed ? 0.75 : 1 },
          ]}
        >
          <Ionicons name="book-outline" size={19} color={colors.primary} />
          <Text style={styles.quickLinkText}>Field guide</Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.mutedLight}
          />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open scan history"
          onPress={() => navigation.navigate("History")}
          style={({ pressed }) => [
            styles.quickLink,
            { opacity: pressed ? 0.75 : 1 },
          ]}
        >
          <Ionicons name="time-outline" size={19} color={colors.primary} />
          <Text style={styles.quickLinkText}>Scan history</Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.mutedLight}
          />
        </Pressable>
      </View>

      <View style={styles.footer}>
        <BrandLogo size={22} />
        <Text style={styles.footerText}>
          OFishx · A model-based field companion for Philippine fish
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.primaryDark,
    borderRadius: radius.xl,
    overflow: "hidden",
    padding: 21,
    gap: 14,
  },
  heroRing: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 36,
    borderColor: "rgba(46,196,182,0.12)",
    right: -110,
    bottom: -120,
  },
  heroContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    zIndex: 2,
  },
  heroTitle: {
    color: colors.white,
    fontSize: 29,
    fontWeight: "800",
    letterSpacing: -0.7,
  },
  heroSubtitle: {
    color: "#C6DEDE",
    fontSize: 11,
    lineHeight: 16,
  },
  versionPill: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  versionText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  heroBody: {
    color: "#D7ECEC",
    fontSize: 13,
    lineHeight: 20,
    zIndex: 2,
  },
  statusCard: {
    ...layout.card,
    gap: 11,
  },
  statusTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  statusTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800",
  },
  statusMessage: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
  },
  statusMeta: {
    color: colors.success,
    fontSize: 11,
    fontWeight: "600",
  },
  endpoint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  endpointText: {
    flex: 1,
    color: colors.ocean,
    fontSize: 11,
    fontWeight: "600",
  },
  card: {
    ...layout.card,
    gap: 11,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 14,
    paddingVertical: 2,
  },
  infoLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
    flexShrink: 0,
  },
  infoValue: {
    flex: 1,
    color: colors.ink,
    fontSize: 11,
    lineHeight: 17,
    fontWeight: "600",
    textAlign: "right",
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  limitsCard: {
    ...layout.card,
    gap: 12,
  },
  limitRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
  },
  limitText: {
    flex: 1,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  privacyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  privacyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceStrong,
  },
  quickLinks: {
    flexDirection: "row",
    gap: 10,
  },
  quickLink: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 11,
    paddingVertical: 12,
  },
  quickLinkText: {
    flex: 1,
    color: colors.ink,
    fontSize: 11,
    fontWeight: "700",
  },
  footer: {
    alignItems: "center",
    gap: 7,
    paddingTop: 6,
    paddingBottom: 8,
  },
  footerText: {
    color: colors.mutedLight,
    fontSize: 10,
    textAlign: "center",
  },
});
