import React, { useCallback, useState } from "react";
import { Alert, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Screen, {
  EmptyState,
  ErrorState,
  InlineNotice,
  LoadingState,
  PageHeader,
} from "../components/Screen";
import AppButton from "../components/AppButton";
import HistoryCard from "../components/HistoryCard";
import { clearScans, deleteScan, loadScans } from "../services/scanHistory";
import { colors, layout, radius, typography } from "../constants/theme";

export default function HistoryScreen({ navigation }) {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [clearing, setClearing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      loadScans()
        .then((rows) => {
          if (!active) return;
          setScans(rows);
          setError(null);
        })
        .catch((loadError) => {
          if (!active) return;
          setError(loadError.message);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, []),
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setNotice(null);
    try {
      const rows = await loadScans();
      setScans(rows);
      setError(null);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setRefreshing(false);
    }
  }, []);

  async function removeScan(id) {
    if (deletingId || clearing) return;
    setDeletingId(id);
    setNotice(null);
    try {
      const warning = await deleteScan(id);
      setScans((current) => current.filter((item) => item.id !== id));
      if (warning) setNotice(warning);
    } catch (removeError) {
      setNotice(removeError.message);
    } finally {
      setDeletingId(null);
    }
  }

  function confirmDelete(scan) {
    Alert.alert(
      "Delete this scan?",
      `${scan.topPrediction.label} will be removed from this phone, including its saved photo.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => removeScan(scan.id),
        },
      ],
    );
  }

  async function clearAll() {
    if (clearing || deletingId) return;
    setClearing(true);
    setNotice(null);
    try {
      const warning = await clearScans();
      setScans([]);
      setError(null);
      if (warning) setNotice(warning);
    } catch (clearError) {
      setNotice(clearError.message);
    } finally {
      setClearing(false);
    }
  }

  function confirmClear() {
    Alert.alert(
      "Clear all saved scans?",
      "Every saved result and photo will be deleted from this phone. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear all",
          style: "destructive",
          onPress: clearAll,
        },
      ],
    );
  }

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      <PageHeader
        eyebrow="SCAN HISTORY"
        title="Saved scans"
        subtitle="Results you chose to keep. The scan data and photos stay in this app's storage on this phone."
        accessory={
          !loading && scans.length ? (
            <View style={styles.countBadge}>
              <Text style={styles.countNumber}>{scans.length}</Text>
              <Text style={styles.countLabel}>
                {scans.length === 1 ? "scan" : "scans"}
              </Text>
            </View>
          ) : undefined
        }
      />

      {notice ? (
        <InlineNotice icon="information-circle-outline">{notice}</InlineNotice>
      ) : null}

      {loading ? (
        <LoadingState label="Loading saved scans…" />
      ) : error ? (
        <View style={{ gap: 12 }}>
          <ErrorState
            title="Could not read scan history"
            message={error}
            onRetry={refresh}
          />
          <AppButton
            title="Clear damaged history"
            icon="trash-outline"
            variant="danger"
            onPress={confirmClear}
            loading={clearing}
            disabled={refreshing}
          />
          <Text style={styles.helper}>
            Clearing removes local scan records and saved photos. It does not
            contact the OFishx server.
          </Text>
        </View>
      ) : scans.length === 0 ? (
        <EmptyState
          icon="time-outline"
          title="No saved scans yet"
          message="Identify a fish and tap Save this scan on the result. It will appear here for later reference."
          action={
            <AppButton
              title="Scan a fish"
              icon="camera-outline"
              variant="secondary"
              compact
              onPress={() => navigation.navigate("Scan")}
            />
          }
        />
      ) : (
        <View style={{ gap: 14 }}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <Ionicons
                name="phone-portrait-outline"
                size={20}
                color={colors.primary}
              />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={typography.bodyStrong}>Stored only on this phone</Text>
              <Text style={typography.caption}>
                Tap a scan to reopen its full result. Remove scans you no longer
                need to free up space.
              </Text>
            </View>
          </View>

          <View style={{ gap: 10 }}>
            {scans.map((scan) => (
              <HistoryCard
                key={scan.id}
                scan={scan}
                deleting={deletingId === scan.id}
                onPress={() =>
                  navigation.navigate("Results", { scanId: scan.id })
                }
                onDelete={() => confirmDelete(scan)}
              />
            ))}
          </View>

          <AppButton
            title={clearing ? "Clearing…" : "Clear all saved scans"}
            icon="trash-outline"
            variant="danger"
            compact
            onPress={confirmClear}
            loading={clearing}
            disabled={deletingId !== null}
          />

          <View style={styles.serverNote}>
            <Ionicons name="shield-checkmark-outline" size={17} color={colors.ocean} />
            <Text style={styles.serverNoteText}>
              Saved scans are not uploaded anywhere by OFishx. The inference
              server only processes the photo you send for identification.
            </Text>
          </View>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  countBadge: {
    minWidth: 58,
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1,
    borderColor: colors.border,
  },
  countNumber: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 21,
  },
  countLabel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  summaryCard: {
    ...layout.card,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
    backgroundColor: colors.surface,
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  helper: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
    paddingHorizontal: 8,
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
