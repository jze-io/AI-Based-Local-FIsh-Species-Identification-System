import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Screen, {
  InlineNotice,
  PageHeader,
  SectionTitle,
} from "../components/Screen";
import AppButton from "../components/AppButton";
import FishPattern from "../components/FishPattern";
import { MODEL_LABELS } from "../constants/labels";
import {
  FISH_INFO_DISCLAIMER,
  FISH_INFORMATION_LIST,
  getFishInformation,
  statusLabel,
} from "../services/fishInformation";
import { colors, layout, radius, typography } from "../constants/theme";

function statusColor(status) {
  if (status === "confirmed") {
    return { background: colors.successSoft, border: "#CAEBDD", text: colors.success };
  }
  if (status === "probable") {
    return {
      background: colors.surfaceStrong,
      border: colors.borderStrong,
      text: colors.ocean,
    };
  }
  return {
    background: colors.warningSoft,
    border: "#F0DCB0",
    text: colors.warning,
  };
}

function StatusPill({ status }) {
  const tone = statusColor(status);
  return (
    <View
      style={[
        styles.statusPill,
        { backgroundColor: tone.background, borderColor: tone.border },
      ]}
    >
      <Text style={[styles.statusText, { color: tone.text }]}>
        {statusLabel(status)}
      </Text>
    </View>
  );
}

export default function FishInformationScreen({ navigation, route }) {
  const requestedSpecies = route.params?.species;
  const requestedAt = route.params?.openAt;

  const [selected, setSelected] = useState(() =>
    MODEL_LABELS.includes(requestedSpecies) ? requestedSpecies : null,
  );

  useEffect(() => {
    if (MODEL_LABELS.includes(requestedSpecies)) {
      setSelected(requestedSpecies);
    }
  }, [requestedSpecies, requestedAt]);

  if (selected) {
    const info = getFishInformation(selected);
    const classNumber = MODEL_LABELS.indexOf(selected) + 1;

    return (
      <Screen>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to all fish"
          onPress={() => setSelected(null)}
          hitSlop={8}
          style={({ pressed }) => [
            styles.backRow,
            { opacity: pressed ? 0.65 : 1 },
          ]}
        >
          <Ionicons name="arrow-back" size={18} color={colors.primary} />
          <Text style={styles.backText}>All fish</Text>
        </Pressable>

        <View style={styles.hero}>
          <View style={styles.heroRing} />
          <FishPattern color={colors.white} strength={0.1} />
          <View style={styles.heroContent}>
            <Text style={styles.heroEyebrow}>
              MODEL CLASS {String(classNumber).padStart(2, "0")} OF{" "}
              {MODEL_LABELS.length}
            </Text>
            <Text accessibilityRole="header" style={styles.heroTitle}>
              {info.label}
            </Text>
            <Text style={styles.heroSubtitle}>{info.englishName}</Text>
            <View style={styles.heroPills}>
              <View style={styles.heroPill}>
                <Ionicons name="fish-outline" size={13} color={colors.white} />
                <Text style={styles.heroPillText}>Model label</Text>
              </View>
              {info.aliases?.length ? (
                <View style={styles.heroPill}>
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={13}
                    color={colors.white}
                  />
                  <Text style={styles.heroPillText}>
                    {info.aliases.join(" · ")}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.identityCard}>
          <View style={styles.identityTop}>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={styles.detailLabel}>Scientific name</Text>
              <Text style={styles.scientific}>{info.scientificName}</Text>
            </View>
            <Ionicons name="library-outline" size={20} color={colors.ocean} />
          </View>
          <StatusPill status={info.scientificStatus} />
          <Text style={styles.statusNote}>
            This label describes how confidently the app can state a scientific
            name for the local fish name. It is not the model's confidence score.
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={typography.heading}>About this fish</Text>
          <Text style={typography.body}>{info.description}</Text>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="water-outline" size={19} color={colors.primary} />
            </View>
            <Text style={typography.heading}>Where it is found</Text>
          </View>
          <Text style={typography.body}>{info.habitat}</Text>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="eye-outline" size={19} color={colors.primary} />
            </View>
            <Text style={typography.heading}>What to look for</Text>
          </View>
          <Text style={typography.body}>{info.distinctive}</Text>
        </View>

        <View style={styles.noteCard}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={colors.ocean}
          />
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={styles.noteTitle}>About this name</Text>
            <Text style={styles.noteBody}>{info.note}</Text>
          </View>
        </View>

        <InlineNotice>{FISH_INFO_DISCLAIMER}</InlineNotice>

        <AppButton
          title="Scan a fish"
          icon="camera-outline"
          onPress={() => navigation.navigate("Scan")}
        />
        <AppButton
          title="Back to all fish"
          icon="grid-outline"
          variant="secondary"
          onPress={() => setSelected(null)}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeader
        eyebrow="FIELD GUIDE"
        title="Fish information"
        subtitle="Background for the ten classes this model can return. Tap a fish to read more."
      />

      <InlineNotice>{FISH_INFO_DISCLAIMER}</InlineNotice>

      <SectionTitle title={`All ${FISH_INFORMATION_LIST.length} model classes`} />

      <View style={{ gap: 10 }}>
        {FISH_INFORMATION_LIST.map((info, index) => {
          const tone = statusColor(info.scientificStatus);
          return (
            <Pressable
              key={info.label}
              accessibilityRole="button"
              accessibilityLabel={`Open information about ${info.label}`}
              onPress={() => setSelected(info.label)}
              style={({ pressed }) => [
                styles.listCard,
                { opacity: pressed ? 0.75 : 1 },
              ]}
            >
              <View style={styles.listNumber}>
                <Text style={styles.listNumberText}>
                  {String(index + 1).padStart(2, "0")}
                </Text>
              </View>
              <View style={styles.listText}>
                <Text style={styles.listTitle}>{info.label}</Text>
                <Text style={styles.listEnglish}>{info.englishName}</Text>
                <View
                  style={[
                    styles.listBadge,
                    {
                      backgroundColor: tone.background,
                      borderColor: tone.border,
                    },
                  ]}
                >
                  <Text style={[styles.listBadgeText, { color: tone.text }]}>
                    {statusLabel(info.scientificStatus)}
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.mutedLight}
              />
            </Pressable>
          );
        })}
      </View>

      <View style={styles.guideNote}>
        <Ionicons name="school-outline" size={18} color={colors.ocean} />
        <Text style={styles.guideNoteText}>
          The guide follows the trained model&apos;s class order. A class label
          is not a verified species identification; always check the fish
          yourself when the exact species matters.
        </Text>
      </View>

      <AppButton
        title="Scan a fish"
        icon="camera-outline"
        variant="secondary"
        onPress={() => navigation.navigate("Scan")}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: 36,
    alignSelf: "flex-start",
  },
  backText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  hero: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    overflow: "hidden",
    padding: 21,
  },
  heroRing: {
    position: "absolute",
    width: 230,
    height: 230,
    borderRadius: 115,
    borderWidth: 34,
    borderColor: "rgba(46,196,182,0.13)",
    right: -105,
    top: -115,
  },
  heroContent: {
    gap: 7,
    zIndex: 2,
  },
  heroEyebrow: {
    color: "#9EE9E2",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  heroTitle: {
    color: colors.white,
    fontSize: 33,
    lineHeight: 38,
    fontWeight: "800",
    letterSpacing: -0.9,
  },
  heroSubtitle: {
    color: "#D7ECEC",
    fontSize: 14,
    lineHeight: 20,
  },
  heroPills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 5,
  },
  heroPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 5,
    maxWidth: "100%",
  },
  heroPillText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "600",
    flexShrink: 1,
  },
  identityCard: {
    ...layout.card,
    gap: 9,
  },
  identityTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  detailLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  scientific: {
    color: colors.ink,
    fontSize: 19,
    lineHeight: 25,
    fontWeight: "700",
    fontStyle: "italic",
  },
  statusPill: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.35,
    textTransform: "uppercase",
  },
  statusNote: {
    color: colors.mutedLight,
    fontSize: 10,
    lineHeight: 15,
  },
  sectionCard: {
    ...layout.card,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceStrong,
  },
  noteCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 14,
  },
  noteTitle: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "800",
  },
  noteBody: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  listCard: {
    ...layout.card,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 13,
  },
  listNumber: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceStrong,
  },
  listNumberText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  listText: {
    flex: 1,
    gap: 2,
    alignItems: "flex-start",
  },
  listTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "800",
  },
  listEnglish: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
  },
  listBadge: {
    marginTop: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  listBadgeText: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  guideNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    paddingHorizontal: 4,
  },
  guideNoteText: {
    flex: 1,
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
  },
});
