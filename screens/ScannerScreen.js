import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Screen, {
  ErrorState,
  InlineNotice,
  LoadingState,
  PageHeader,
} from "../components/Screen";
import AppButton from "../components/AppButton";
import { classifyFish } from "../services/fishClassifier";
import { colors, layout, radius, typography } from "../constants/theme";

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const ACCEPTED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

function validateAsset(asset) {
  if (!asset?.uri) {
    throw new Error("The selected file has no readable image data.");
  }
  if (asset.type && asset.type !== "image") {
    throw new Error("Choose an image, not a video or document.");
  }
  if (asset.fileSize && asset.fileSize > MAX_IMAGE_BYTES) {
    throw new Error("That photo is larger than 12 MB. Choose a smaller image.");
  }
  const mime = (asset.mimeType || "").toLowerCase();
  if (mime && !ACCEPTED_MIME.has(mime)) {
    throw new Error(
      "That image format is not supported. Choose a JPEG, PNG, or WebP photo.",
    );
  }
}

export default function ScannerScreen({ navigation, route }) {
  const [permission, requestPermission, getPermission] = useCameraPermissions();
  const focused = useIsFocused();
  const cameraRef = useRef(null);
  const captureLock = useRef(false);
  const classifyLock = useRef(false);
  const handledReset = useRef(null);

  const [appActive, setAppActive] = useState(AppState.currentState === "active");
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [flash, setFlash] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [picking, setPicking] = useState(false);
  const [classifying, setClassifying] = useState(false);
  const [selected, setSelected] = useState(null);
  const [classifyError, setClassifyError] = useState(null);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      setAppActive(state === "active");
      if (state !== "active") setCameraReady(false);
      if (state === "active") getPermission().catch(() => {});
    });
    return () => subscription.remove();
  }, [getPermission]);

  useFocusEffect(
    useCallback(() => {
      getPermission().catch(() => {});
      return () => setCameraReady(false);
    }, [getPermission]),
  );

  useEffect(() => {
    if (!focused) {
      setCameraReady(false);
      return;
    }
    getPermission().catch(() => {});
  }, [focused, getPermission]);

  useEffect(() => {
    const resetAt = route.params?.resetAt;
    if (resetAt && resetAt !== handledReset.current) {
      handledReset.current = resetAt;
      setSelected(null);
      setClassifyError(null);
      setCameraReady(false);
    }
  }, [route.params?.resetAt]);

  async function chooseFromGallery() {
    if (picking || classifying) return;
    setPicking(true);
    setClassifyError(null);
    try {
      const response = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.9,
        selectionLimit: 1,
        exif: false,
      });
      if (response.canceled) return;
      const asset = response.assets?.[0];
      validateAsset(asset);
      setSelected({
        uri: asset.uri,
        mimeType: asset.mimeType || "image/jpeg",
        width: asset.width,
        height: asset.height,
        fileName: asset.fileName || null,
      });
      setCameraReady(false);
    } catch (error) {
      Alert.alert(
        "Could not use that photo",
        error.message || "Choose a different image and try again.",
      );
    } finally {
      setPicking(false);
    }
  }

  async function capturePhoto() {
    if (
      !cameraReady ||
      captureLock.current ||
      capturing ||
      picking ||
      !cameraRef.current
    ) {
      return;
    }
    captureLock.current = true;
    setCapturing(true);
    try {
      const picture = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        exif: false,
      });
      if (!picture?.uri) {
        throw new Error("The camera did not return a photo.");
      }
      setSelected({
        uri: picture.uri,
        mimeType: "image/jpeg",
        width: picture.width,
        height: picture.height,
        fileName: null,
      });
      setCameraReady(false);
    } catch {
      Alert.alert(
        "Could not capture the photo",
        "Keep the camera open and try again. You can also choose an image from the gallery.",
      );
    } finally {
      captureLock.current = false;
      setCapturing(false);
    }
  }

  async function identify() {
    if (classifyLock.current || classifying || !selected?.uri) return;
    classifyLock.current = true;
    setClassifying(true);
    setClassifyError(null);
    try {
      const result = await classifyFish(selected.uri, {
        mimeType: selected.mimeType,
      });
      navigation.navigate("Results", {
        imageUri: selected.uri,
        mimeType: selected.mimeType,
        result,
      });
    } catch (error) {
      setClassifyError(error);
    } finally {
      classifyLock.current = false;
      setClassifying(false);
    }
  }

  async function askForCamera() {
    try {
      const response = await requestPermission();
      if (!response.granted && !response.canAskAgain) {
        Alert.alert(
          "Camera access is blocked",
          "Open Android Settings, choose Apps, Expo Go, Permissions, then allow Camera.",
        );
      }
    } catch {
      Alert.alert(
        "Could not request camera access",
        "Open your phone settings and allow camera access for Expo Go.",
      );
    }
  }

  if (!permission) {
    return (
      <Screen edges={["top", "bottom", "left", "right"]}>
        <LoadingState label="Checking camera permission…" />
      </Screen>
    );
  }

  if (selected) {
    return (
      <Screen edges={["top", "bottom", "left", "right"]}>
        <View style={styles.previewTop}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retake photo"
            onPress={() => {
              setSelected(null);
              setClassifyError(null);
            }}
            hitSlop={8}
            style={({ pressed }) => [
              styles.backButton,
              { opacity: pressed ? 0.65 : 1 },
            ]}
          >
            <Ionicons name="arrow-back" size={20} color={colors.primary} />
            <Text style={styles.backText}>Retake</Text>
          </Pressable>
          <Text style={styles.previewTitle}>Photo preview</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Choose a different photo"
            onPress={chooseFromGallery}
            disabled={classifying || picking}
            hitSlop={8}
            style={({ pressed }) => [
              styles.backButton,
              { opacity: classifying || picking ? 0.4 : pressed ? 0.65 : 1 },
            ]}
          >
            <Ionicons name="images-outline" size={20} color={colors.primary} />
          </Pressable>
        </View>

        <View style={styles.previewFrame}>
          <Image
            source={{ uri: selected.uri }}
            accessibilityLabel="Selected fish photo"
            resizeMode="contain"
            style={styles.previewImage}
          />
        </View>

        <View style={styles.previewInfo}>
          <View style={styles.previewInfoIcon}>
            <Ionicons name="scan-outline" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={typography.bodyStrong}>Is the fish clear?</Text>
            <Text style={typography.caption}>
              One fish, good lighting, and as little background clutter as
              possible gives the model the best chance.
            </Text>
          </View>
        </View>

        {classifyError ? (
          <ErrorState
            title="Identification failed"
            message={classifyError.message}
            onRetry={identify}
          />
        ) : null}

        <AppButton
          title={classifying ? "Identifying…" : "Identify fish"}
          icon="search"
          onPress={identify}
          loading={classifying}
          disabled={picking}
        />
        <View style={styles.previewActions}>
          <AppButton
            title="Choose another"
            icon="images-outline"
            variant="secondary"
            onPress={chooseFromGallery}
            loading={picking}
            disabled={classifying}
            style={{ flex: 1 }}
          />
          <AppButton
            title="Retake"
            icon="camera-outline"
            variant="secondary"
            onPress={() => {
              setSelected(null);
              setClassifyError(null);
            }}
            disabled={classifying || picking}
            style={{ flex: 1 }}
          />
        </View>

        <InlineNotice icon="wifi-outline">
          The photo is sent over your local Wi-Fi to the model running on the
          OFishx PC server. The server does not save it. Your result can be
          saved on this phone after identification.
        </InlineNotice>
      </Screen>
    );
  }

  if (!permission.granted || cameraError) {
    return (
      <Screen edges={["top", "bottom", "left", "right"]}>
        <PageHeader
          eyebrow="FISH SCANNER"
          title={cameraError ? "Camera unavailable" : "Camera access"}
          subtitle={
            cameraError
              ? "The camera could not start. Another app may be using it, or the device camera is unavailable."
              : "OFishx needs camera access to photograph a fish. You can still choose a photo from your gallery."
          }
        />
        <View style={layout.card}>
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons
                name={cameraError ? "warning-outline" : "camera-outline"}
                size={21}
                color={colors.primary}
              />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={typography.bodyStrong}>
                {cameraError
                  ? "Try the camera again"
                  : permission.canAskAgain
                    ? "Permission is needed once"
                    : "Permission is blocked in Android"}
              </Text>
              <Text style={typography.caption}>
                {cameraError
                  ? "If the camera still fails, use a gallery photo. The rest of the app works normally."
                  : "Camera access is used only while this screen is open. Photos are taken by you, never automatically."}
              </Text>
            </View>
          </View>
        </View>

        {cameraError ? (
          <AppButton
            title="Try camera again"
            icon="refresh-outline"
            onPress={() => {
              setCameraError(null);
              setCameraReady(false);
            }}
          />
        ) : permission.canAskAgain ? (
          <AppButton
            title="Allow camera access"
            icon="camera-outline"
            onPress={askForCamera}
          />
        ) : (
          <AppButton
            title="Open phone settings"
            icon="settings-outline"
            onPress={() =>
              Linking.openSettings().catch(() =>
                Alert.alert(
                  "Open settings manually",
                  "Open Android Settings, Apps, Expo Go, Permissions, Camera.",
                ),
              )
            }
          />
        )}
        <AppButton
          title="Choose from gallery"
          icon="images-outline"
          variant="secondary"
          onPress={chooseFromGallery}
          loading={picking}
        />
        <AppButton
          title="Back to home"
          variant="ghost"
          onPress={() => navigation.navigate("Home")}
        />
        <InlineNotice>
          No prediction is ever shown without the trained model. If the local
          server is offline, the app tells you instead of guessing.
        </InlineNotice>
      </Screen>
    );
  }

  return (
    <View style={styles.cameraScreen}>
      {focused ? <StatusBar style="light" /> : null}
      {focused && appActive ? (
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="back"
          mode="picture"
          flash={flash ? "on" : "off"}
          onCameraReady={() => setCameraReady(true)}
          onMountError={(event) => {
            setCameraReady(false);
            setCameraError(
              event?.message || "The camera could not be started.",
            );
          }}
        />
      ) : null}

      <View style={styles.cameraShade} pointerEvents="none" />

      <SafeAreaView edges={["top", "bottom"]} style={styles.cameraOverlay}>
        <View style={styles.cameraHeader}>
          <View style={styles.cameraBrand}>
            <Ionicons name="scan" size={17} color={colors.white} />
            <Text style={styles.cameraTitle}>Fish scanner</Text>
          </View>
          <View style={styles.cameraHeaderActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={flash ? "Turn flash off" : "Turn flash on"}
              accessibilityState={{ selected: flash }}
              onPress={() => setFlash((value) => !value)}
              style={styles.cameraIconButton}
              hitSlop={8}
            >
              <Ionicons
                name={flash ? "flash" : "flash-off-outline"}
                size={21}
                color={colors.white}
              />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close scanner"
              onPress={() => navigation.navigate("Home")}
              style={styles.cameraIconButton}
              hitSlop={8}
            >
              <Ionicons name="close" size={22} color={colors.white} />
            </Pressable>
          </View>
        </View>

        <View style={styles.frameArea} pointerEvents="none">
          <View style={styles.fishFrame}>
            <View style={[styles.corner, styles.cornerTopLeft]} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />
          </View>
          <Text style={styles.frameHint}>
            Place one fish inside the frame
          </Text>
        </View>

        <View style={styles.cameraBottom}>
          <Text style={styles.cameraHelp}>
            Good light helps. Avoid glare, nets, and busy backgrounds.
          </Text>
          <View style={styles.controls}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Choose a photo from the gallery"
              onPress={chooseFromGallery}
              disabled={picking || capturing}
              style={({ pressed }) => [
                styles.sideControl,
                { opacity: picking || capturing ? 0.4 : pressed ? 0.65 : 1 },
              ]}
            >
              {picking ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Ionicons name="images-outline" size={24} color={colors.white} />
              )}
              <Text style={styles.sideControlLabel}>Gallery</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Capture fish photo"
              accessibilityState={{
                disabled: !cameraReady || capturing,
                busy: capturing,
              }}
              disabled={!cameraReady || capturing}
              onPress={capturePhoto}
              style={({ pressed }) => [
                styles.shutterOuter,
                {
                  opacity: !cameraReady ? 0.45 : pressed ? 0.8 : 1,
                },
              ]}
            >
              <View style={styles.shutterInner}>
                {capturing ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <Ionicons name="camera" size={25} color={colors.primary} />
                )}
              </View>
            </Pressable>

            <View style={styles.sideControl}>
              <Ionicons
                name="shield-checkmark-outline"
                size={23}
                color={colors.white}
              />
              <Text style={styles.sideControlLabel}>
                {cameraReady ? "Ready" : "Starting"}
              </Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  previewTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 2,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minWidth: 66,
    minHeight: 38,
  },
  backText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  previewTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800",
  },
  previewFrame: {
    width: "100%",
    aspectRatio: 1.05,
    borderRadius: radius.xl,
    overflow: "hidden",
    backgroundColor: colors.primaryDark,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  previewInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 14,
  },
  previewInfoIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewActions: {
    flexDirection: "row",
    gap: 10,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  infoIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceStrong,
  },
  cameraScreen: {
    flex: 1,
    backgroundColor: colors.primaryDark,
  },
  cameraShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(4, 24, 29, 0.18)",
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: "space-between",
  },
  cameraHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  cameraBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(6,40,47,0.64)",
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cameraTitle: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
  },
  cameraHeaderActions: {
    flexDirection: "row",
    gap: 8,
  },
  cameraIconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(6,40,47,0.64)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  frameArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 16,
  },
  fishFrame: {
    width: "100%",
    maxWidth: 390,
    aspectRatio: 1.18,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  corner: {
    position: "absolute",
    width: 28,
    height: 28,
    borderColor: colors.turquoise,
  },
  cornerTopLeft: {
    top: -1,
    left: -1,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 12,
  },
  cornerTopRight: {
    top: -1,
    right: -1,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 12,
  },
  cornerBottomLeft: {
    bottom: -1,
    left: -1,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 12,
  },
  cornerBottomRight: {
    bottom: -1,
    right: -1,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 12,
  },
  frameHint: {
    color: colors.white,
    backgroundColor: "rgba(6,40,47,0.64)",
    borderRadius: radius.pill,
    overflow: "hidden",
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 12,
    fontWeight: "600",
  },
  cameraBottom: {
    backgroundColor: "rgba(5,31,37,0.82)",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 14,
  },
  cameraHelp: {
    color: "#C6DEDE",
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  sideControl: {
    width: 68,
    alignItems: "center",
    gap: 5,
    paddingVertical: 8,
  },
  sideControlLabel: {
    color: "#D7ECEC",
    fontSize: 10,
    fontWeight: "600",
  },
  shutterOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
    borderColor: colors.white,
    padding: 5,
  },
  shutterInner: {
    flex: 1,
    borderRadius: 30,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
});
