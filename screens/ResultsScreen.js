import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Screen, {
  ErrorState,
  InlineNotice,
  LoadingState,
  PageHeader,
} from "../components/Screen";
import AppButton from "../components/AppButton";
import ConfidenceBar from "../components/ConfidenceBar";
import { loadScans, saveScan } from "../services/scanHistory";
import { getFishInformation, statusLabel } from "../services/fishInformation";
import {
  confidenceDescriptor,
  formatDateTime,
  formatPercent,
} from "../utils/format";
import { LOW_CONFIDENCE_THRESHOLD } from "../constants/config";
import { colors, layout, radius, typography } from "../constants/theme";

function scanToResult(scan) {
  return {
    topPrediction: scan.topPrediction,
    predictions: scan.predictions,
    lowConfidence: scan.lowConfidence,
    inferenceMs: scan.inferenceMs,
    model: scan.model,
  };
}

export default function ResultsScreen({ navigation, route }) {
  const routeScanId = route.params?.scanId;
  const incomingResult = route.params?.result;
  const incomingImageUri = route.params?.imageUri;

  const [loadedScan, setLoadedScan] = useState(null);
  const [loading, setLoading] = useState(Boolean(routeScanId));
  const [loadError, setLoadError] = useState(null);
  const [savedScan, setSavedScan] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [imageFailed, setImageFailed] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageOpacity] = useState(() => new Animated.Value(0));
  const saveLock = useRef(false);

  useEffect(() => {
    if (!routeScanId) return undefined;
    let alive = true;
    setLoading(true);
    setLoadError(null);
    loadScans()
      .then((rows) => {
        if (!alive) return;
        const found = rows.find((item) => item.id === routeScanId);
        if (!found) {
          throw new Error(
            "This scan is no longer in history. It may have been deleted.",
          );
        }
        setLoadedScan(found);
      })
      .catch((error) => {
        if (alive) setLoadError(error.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [routeScanId]);

  const activeScan = savedScan || loadedScan;
  const result = activeScan ? scanToResult(activeScan) : incomingResult;
  const imageUri = activeScan?.imageUri || incomingImageUri;
  const isSaved = Boolean(activeScan);

  useEffect(() => {
    if (!imageUri) return;
    setImageFailed(false);
    setImageLoading(true);
    imageOpacity.setValue(0);
  }, [imageUri, imageOpacity]);

  if (routeScanId && loading) {
    return (
      <Screen edges={["top", "bottom", "left", "right"]}>
        <LoadingState label="Loading saved scan…" />
      </Screen>
    );
  }

  if (routeScanId && loadError && !activeScan) {
    return (
      <Screen edges={["top", "bottom", "left", "right"]}>
        <PageHeader eyebrow="SCAN RESULT" title="Scan unavailable" />
        <ErrorState
          title="Could not open this scan"
          message={loadError}
          onRetry={() => {
            setLoadError(null);
            setLoading(true);
            loadScans()
              .then((rows) => {
                const found = rows.find((item) => item.id === routeScanId);
                if (!found) {
                  throw new Error("This scan is no longer in history.");
                }
                setLoadedScan(found);
              })
              .catch((error) => setLoadError(error.message))
              .finally(() => setLoading(false));
          }}
        />
        <AppButton
          title="Back"
          variant="secondary"
          onPress={() => navigation.goBack()}
        />
      </Screen>
    );
  }

  if (!result?.topPrediction || !imageUri) {
    return (
      <Screen edges={["top", "bottom", "left", "right"]}>
        <PageHeader eyebrow="SCAN RESULT" title="Nothing to show" />
        <ErrorState
          title="No identification data"
          message="This result was not passed correctly. Start a new scan and try again."
        />
        <AppButton
          title="Back"
          variant="secondary"
          onPress={() => navigation.goBack()}
        />
      </Screen>
    );
  }

  const top = result.topPrediction;
  const info = getFishInformation(top.label);
  const predictions = result.predictions.slice(0, 5);
  const low = Number(top.confidence) < LOW_CONFIDENCE_THRESHOLD;

  async function handleSave() {
    if (saveLock.current || saving || isSaved) return;
    saveLock.current = true;
    setSaving(true);
    setSaveError(null);
    try {
      const scan = await saveScan({
        imageUri,
        mimeType: route.params?.mimeType,
        result,
      });
      setSavedScan(scan);
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      ).catch(() => {});
    } catch (error) {
      setSaveError(error.message);
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Error,
      ).catch(() => {});
    } finally {
      saveLock.current = false;
      setSaving(false);
    }
  }

  function scanAnother() {
    navigation.popToTop();
    navigation.navigate("MainTabs", {
      screen: "Scan",
      params: { resetAt: Date.now() },
    });
  }

  return (
    <Screen edges={["top", "bottom", "left", "right"]}>
      <View style={styles.topbar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => navigation.goBack()}
          hitSlop={8}
          style={({ pressed }) => [
            styles.backButton,
            { opacity: pressed ? 0.65 : 1 },
          ]}
        >
          <Ionicons name="arrow-back" size={21} color={colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.topbarTitle}>Scan result</Text>
        <View style={styles.topbarSpacer} />
      </View>

      <View style={styles.imageFrame}>
        {imageFailed ? (
          <View style={styles.imageFallback}>
            <Ionicons
              name="image-outline"
              size={34}
              color={colors.mutedLight}
            />
            <Text style={typography.caption}>
              The saved photo could not be displayed.
            </Text>
          </View>
        ) : (
          <>
            <Animated.Image
              source={{ uri: imageUri }}
              accessibilityLabel={`Photo identified as ${top.label}`}
              resizeMode="contain"
              onError={() => {
                setImageFailed(true);
                setImageLoading(false);
              }}
              onLoad={() => {
                setImageLoading(false);
                Animated.timing(imageOpacity, {
                  toValue: 1,
                  duration: 260,
                  easing: Easing.out(Easing.cubic),
                  useNativeDriver: true,
                }).start();
              }}
              style={[styles.image, { opacity: imageOpacity }]}
            />
            {imageLoading ? (
              <View pointerEvents="none" style={styles.imageLoading}>
                <ActivityIndicator color={colors.white} size="small" />
              </View>
            ) : null}
          </>
        )}
        {isSaved ? (
          <View style={styles.savedBadge}>
            <Ionicons
              name="bookmark"
              size={12}
              color={colors.white}
              backgroundColor="transparent"
            />
            <Text style={styles.savedBadgeText}>Saved on this phone</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.identityCard}>
        <View style={styles.identityTop}>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={typography.eyebrow}>MODEL MATCH</Text>
            <Text style={styles.speciesName}>{top.label}</Text>
            <Text style={typography.caption}>{info.englishName}</Text>
          </View>
          <View
            style={[
              styles.confidencePill,
              low ? styles.confidencePillLow : styles.confidencePillOk,
            ]}
          >
            <Text
              style={[
                styles.confidencePillText,
                { color: low ? colors.warning : colors.success },
              ]}
            >
              {confidenceDescriptor(top.confidence)}
            </Text>
          </View>
        </View>

        <View style={styles.confidenceBlock}>
          <View style={styles.confidenceLabelRow}>
            <Text style={typography.caption}>Top-1 confidence</Text>
            <Text style={styles.bigPercent}>{formatPercent(top.confidence)}</Text>
          </View>
          <ConfidenceBar
            value={top.confidence}
            showLabel={false}
            height={10}
            tone={low ? colors.turquoise : colors.primary}
          />
        </View>

        {low ? (
          <View style={styles.warning}>
            <Ionicons
              name="help-circle-outline"
              size={20}
              color={colors.warning}
            />
            <Text style={styles.warningText}>
              The model is not confident about this photo. Treat it as an
              uncertain suggestion, try a clearer picture, and do not use this
              result where the exact species matters.
            </Text>
          </View>
        ) : null}

        <Text style={styles.confidenceNote}>
          The score is the model's output for the best class, not a guarantee
          that the identification is correct.
        </Text>
      </View>

      {saveError ? (
        <InlineNotice icon="alert-circle-outline">{saveError}</InlineNotice>
      ) : null}

      {savedScan ? (
        <View style={styles.savedNotice}>
          <Ionicons
            name="checkmark-circle"
            size={20}
            color={colors.success}
          />
          <Text style={styles.savedNoticeText}>
            Saved to history on {formatDateTime(savedScan.createdAt)}.
          </Text>
        </View>
      ) : null}

      <AppButton
        title={
          isSaved ? "Saved to history" : saving ? "Saving…" : "Save this scan"
        }
        icon={isSaved ? "checkmark-circle-outline" : "bookmark-outline"}
        variant={isSaved ? "secondary" : "primary"}
        onPress={handleSave}
        loading={saving}
        disabled={isSaved}
      />

      <View style={styles.predictionsCard}>
        <Text style={typography.heading}>Top model scores</Text>
        <Text style={typography.caption}>
          All classes are ranked by the model. A close group means the model is
          less certain, even when the top score looks high.
        </Text>
        <View style={styles.predictionRows}>
          {predictions.map((prediction, index) => (
            <View key={prediction.label} style={styles.predictionRow}>
              <View style={styles.rank}>
                <Text style={styles.rankText}>{index + 1}</Text>
              </View>
              <View style={styles.predictionMain}>
                <View style={styles.predictionTop}>
                  <Text style={styles.predictionLabel}>
                    {prediction.label}
                  </Text>
                  <Text style={styles.predictionPercent}>
                    {formatPercent(prediction.confidence)}
                  </Text>
                </View>
                <ConfidenceBar
                  value={prediction.confidence}
                  showLabel={false}
                  height={6}
                  tone={index === 0 ? colors.primary : colors.borderStrong}
                />
              </View>
            </View>
          ))}
        </View>
        {result.inferenceMs ? (
          <Text style={styles.technical}>
            Server inference: {Math.round(result.inferenceMs)} ms
          </Text>
        ) : null}
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <View style={styles.infoIcon}>
            <Ionicons name="book-outline" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={typography.heading}>{info.label}</Text>
            <Text style={styles.infoEnglish}>{info.englishName}</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Scientific name</Text>
          <Text style={styles.infoValue}>{info.scientificName}</Text>
        </View>
        <View
          style={[
            styles.statusPill,
            info.scientificStatus === "confirmed"
              ? styles.statusOk
              : info.scientificStatus === "probable"
                ? styles.statusProbable
                : styles.statusUnclear,
          ]}
        >
          <Text style={styles.statusText}>{statusLabel(info.scientificStatus)}</Text>
        </View>
        <Text style={typography.body}>{info.description}</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Habitat</Text>
          <Text style={styles.infoValue}>{info.habitat}</Text>
        </View>
        <AppButton
          title="Read full field guide"
          icon="arrow-forward"
          variant="secondary"
          compact
          onPress={() =>
            navigation.navigate("MainTabs", {
              screen: "Fish Information",
              params: { species: top.label, openAt: Date.now() },
            })
          }
        />
      </View>

      <AppButton
        title="Scan another fish"
        icon="scan-outline"
        variant="secondary"
        onPress={scanAnother}
      />
      <AppButton
        title="View scan history"
        variant="ghost"
        onPress={() => {
          navigation.popToTop();
          navigation.navigate("MainTabs", { screen: "History" });
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 2,
    minHeight: 38,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minWidth: 72,
    minHeight: 38,
  },
  backText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  topbarTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800",
  },
  topbarSpacer: {
    width: 72,
  },
  imageFrame: {
    width: "100%",
    aspectRatio: 1.08,
    borderRadius: radius.xl,
    overflow: "hidden",
    backgroundColor: colors.primaryDark,
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageLoading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryDark,
  },
  imageFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 20,
  },
  savedBadge: {
    position: "absolute",
    left: 12,
    bottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(5,31,37,0.8)",
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  savedBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "700",
  },
  identityCard: {
    ...layout.card,
    padding: 19,
    gap: 13,
  },
  identityTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  speciesName: {
    color: colors.ink,
    fontSize: 31,
    lineHeight: 36,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  confidencePill: {
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
  },
  confidencePillOk: {
    backgroundColor: colors.successSoft,
    borderColor: "#CAEBDD",
  },
  confidencePillLow: {
    backgroundColor: colors.warningSoft,
    borderColor: "#F0DCB0",
  },
  confidencePillText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  confidenceBlock: {
    gap: 7,
  },
  confidenceLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bigPercent: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  warning: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    backgroundColor: colors.warningSoft,
    borderRadius: radius.md,
    padding: 12,
  },
  warningText: {
    flex: 1,
    color: colors.warning,
    fontSize: 12,
    lineHeight: 18,
  },
  confidenceNote: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
  },
  savedNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: colors.successSoft,
    borderRadius: radius.md,
    padding: 12,
  },
  savedNoticeText: {
    flex: 1,
    color: colors.success,
    fontSize: 12,
    fontWeight: "600",
  },
  predictionsCard: {
    ...layout.card,
    gap: 11,
  },
  predictionRows: {
    gap: 13,
    paddingTop: 3,
  },
  predictionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  rank: {
    width: 25,
    height: 25,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceStrong,
  },
  rankText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
  },
  predictionMain: {
    flex: 1,
    gap: 5,
  },
  predictionTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  predictionLabel: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "700",
  },
  predictionPercent: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  technical: {
    color: colors.mutedLight,
    fontSize: 10,
    marginTop: 2,
  },
  infoCard: {
    ...layout.card,
    gap: 11,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceStrong,
  },
  infoEnglish: {
    color: colors.muted,
    fontSize: 12,
  },
  infoRow: {
    gap: 3,
  },
  infoLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  infoValue: {
    color: colors.ink,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
  },
  statusPill: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderWidth: 1,
  },
  statusOk: {
    backgroundColor: colors.successSoft,
    borderColor: "#CAEBDD",
  },
  statusProbable: {
    backgroundColor: colors.surfaceStrong,
    borderColor: colors.borderStrong,
  },
  statusUnclear: {
    backgroundColor: colors.warningSoft,
    borderColor: "#F0DCB0",
  },
  statusText: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
});
