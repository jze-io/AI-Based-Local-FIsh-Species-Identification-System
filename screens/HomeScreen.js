import React, { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Screen, {
  EmptyState,
  InlineNotice,
  PageHeader,
  SectionTitle,
} from "../components/Screen";
import BrandLogo from "../components/BrandLogo";
import AppButton from "../components/AppButton";
import HistoryCard from "../components/HistoryCard";
import { loadScans } from "../services/scanHistory";
import { colors, radius, typography } from "../constants/theme";

const STEPS = [
  {
    icon: "camera-outline",
    title: "Photograph the fish",
    body: "Use the camera or choose an existing photo. Keep the whole fish in frame.",
  },
  {
    icon: "scan-outline",
    title: "Let the model look",
    body: "The photo goes to the OFishx server on your PC, which runs the trained model.",
  },
  {
    icon: "reader-outline",
    title: "Check the result",
    body: "Review the match, its score, and the species notes before deciding what to do.",
  },
];

export default function HomeScreen({ navigation }) {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyError, setHistoryError] = useState(null);

  const refreshHistory = useCallback(() => {
    let alive = true;
    setLoading(true);
    loadScans()
      .then((rows) => {
        if (!alive) return;
        setScans(rows);
        setHistoryError(null);
      })
      .catch((error) => {
        if (!alive) return;
        setHistoryError(error.message);
        setScans([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  useFocusEffect(refreshHistory);

  return (
    <Screen>
      <View style={styles.topbar}>
        <View style={styles.brand}>
          <BrandLogo size={31} />
          <Text style={styles.brandText}>OFishx</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="About OFishx"
          onPress={() => navigation.navigate("About")}
          style={({ pressed }) => [
            styles.topButton,
            { opacity: pressed ? 0.65 : 1 },
          ]}
        >
          <Ionicons
            name="information-circle-outline"
            size={22}
            color={colors.primary}
          />
        </Pressable>
      </View>

      <View style={styles.hero}>
        <View style={styles.ringLarge} />
        <View style={styles.ringSmall} />
        <View style={styles.heroContent}>
          <Text style={styles.heroEyebrow}>PHILIPPINE FISH IDENTIFIER</Text>
          <Text style={styles.heroTitle}>Know your catch.</Text>
          <Text style={styles.heroBody}>
            Photograph a local fish and get a model-based match from ten
            Philippine species, with useful context to check.
          </Text>
          <View style={styles.heroMeta}>
            <View style={styles.metaPill}>
              <Ionicons name="fish-outline" size={14} color={colors.white} />
              <Text style={styles.metaText}>10 species</Text>
            </View>
            <View style={styles.metaPill}>
              <Ionicons name="sparkles-outline" size={14} color={colors.white} />
              <Text style={styles.metaText}>Photo based</Text>
            </View>
          </View>
          <AppButton
            title="Scan a fish"
            icon="camera"
            variant="white"
            onPress={() => navigation.navigate("Scan")}
          />
          <Text style={styles.heroFootnote}>
            A suggestion from the model, not a guaranteed identification.
          </Text>
        </View>
      </View>

      <View style={styles.quickRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Browse the fish field guide"
          onPress={() => navigation.navigate("Fish Information")}
          style={({ pressed }) => [
            styles.quickCard,
            { opacity: pressed ? 0.75 : 1 },
          ]}
        >
          <View style={styles.quickIcon}>
            <Ionicons name="book-outline" size={20} color={colors.primary} />
          </View>
          <View style={styles.quickText}>
            <Text style={styles.quickTitle}>Field guide</Text>
            <Text style={styles.quickBody}>Browse the 10 classes</Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={17}
            color={colors.mutedLight}
          />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open scan history"
          onPress={() => navigation.navigate("History")}
          style={({ pressed }) => [
            styles.quickCard,
            { opacity: pressed ? 0.75 : 1 },
          ]}
        >
          <View style={styles.quickIcon}>
            <Ionicons name="time-outline" size={20} color={colors.primary} />
          </View>
          <View style={styles.quickText}>
            <Text style={styles.quickTitle}>History</Text>
            <Text style={styles.quickBody}>
              {scans.length ? `${scans.length} saved` : "No saved scans"}
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={17}
            color={colors.mutedLight}
          />
        </Pressable>
      </View>

      <View style={styles.stepsCard}>
        <Text style={[typography.eyebrow, { color: colors.ocean }]}>
          HOW IT WORKS
        </Text>
        {STEPS.map((step, index) => (
          <View key={step.title} style={styles.step}>
            <View style={styles.stepIcon}>
              <Ionicons name={step.icon} size={19} color={colors.primary} />
            </View>
            <View style={styles.stepText}>
              <Text style={typography.bodyStrong}>{step.title}</Text>
              <Text style={typography.caption}>{step.body}</Text>
            </View>
            <Text style={styles.stepNumber}>0{index + 1}</Text>
          </View>
        ))}
      </View>

      <SectionTitle
        title="Recent scans"
        actionLabel={scans.length ? "View all" : undefined}
        onAction={scans.length ? () => navigation.navigate("History") : undefined}
      />

      {loading ? (
        <View style={styles.loadingRow}>
          <Ionicons name="ellipsis-horizontal" size={18} color={colors.muted} />
          <Text style={typography.caption}>Loading saved scans…</Text>
        </View>
      ) : historyError ? (
        <InlineNotice icon="alert-circle-outline">
          {historyError} Open History to clear damaged data.
        </InlineNotice>
      ) : scans.length ? (
        <View style={{ gap: 10 }}>
          {scans.slice(0, 2).map((scan) => (
            <HistoryCard
              key={scan.id}
              scan={scan}
              onPress={() =>
                navigation.navigate("Results", { scanId: scan.id })
              }
            />
          ))}
        </View>
      ) : (
        <EmptyState
          icon="fish-outline"
          title="Your first catch goes here"
          message="Scan a fish and save the result. Saved scans and photos stay on this phone."
          action={
            <AppButton
              title="Start scanning"
              icon="camera-outline"
              variant="secondary"
              compact
              onPress={() => navigation.navigate("Scan")}
            />
          }
        />
      )}

      <View style={styles.serverNote}>
        <Ionicons name="wifi-outline" size={18} color={colors.ocean} />
        <Text style={styles.serverNoteText}>
          OFishx uses the trained model through the local server on your PC.
          Phone and PC must be on the same Wi-Fi.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 2,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  brandText: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  topButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hero: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    overflow: "hidden",
    padding: 22,
  },
  heroContent: {
    gap: 13,
    zIndex: 2,
  },
  ringLarge: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 38,
    borderColor: "rgba(46,196,182,0.12)",
    right: -120,
    top: -110,
  },
  ringSmall: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    right: 24,
    bottom: 38,
  },
  heroEyebrow: {
    color: "#9EE9E2",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.6,
  },
  heroTitle: {
    color: colors.white,
    fontSize: 35,
    lineHeight: 40,
    fontWeight: "800",
    letterSpacing: -1,
  },
  heroBody: {
    color: "#D7ECEC",
    fontSize: 14,
    lineHeight: 21,
  },
  heroMeta: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 2,
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  metaText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "700",
  },
  heroFootnote: {
    color: "#B7D9D9",
    fontSize: 10,
    lineHeight: 15,
    textAlign: "center",
  },
  quickRow: {
    flexDirection: "row",
    gap: 10,
  },
  quickCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.white,
  },
  quickIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceStrong,
  },
  quickText: {
    flex: 1,
    gap: 1,
  },
  quickTitle: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "700",
  },
  quickBody: {
    color: colors.muted,
    fontSize: 10,
  },
  stepsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 17,
    gap: 15,
  },
  step: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  stepIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  stepText: {
    flex: 1,
    gap: 2,
    paddingRight: 4,
  },
  stepNumber: {
    color: colors.borderStrong,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 20,
    justifyContent: "center",
  },
  serverNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    paddingHorizontal: 4,
  },
  serverNoteText: {
    flex: 1,
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
  },
});
