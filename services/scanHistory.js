import AsyncStorage from "@react-native-async-storage/async-storage";
import { Directory, File, Paths } from "expo-file-system";

const HISTORY_KEY = "@ofishx/scans/v1";
const HISTORY_VERSION = 1;
const SCAN_FOLDER = "ofishx-scans";

function scanDirectory() {
  return new Directory(Paths.document, SCAN_FOLDER);
}

function isIsoDate(value) {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function isValidScan(item) {
  return (
    item &&
    typeof item === "object" &&
    typeof item.id === "string" &&
    item.id.length > 0 &&
    isIsoDate(item.createdAt) &&
    typeof item.imageUri === "string" &&
    item.imageUri.length > 0 &&
    item.topPrediction &&
    typeof item.topPrediction.label === "string" &&
    Number.isFinite(Number(item.topPrediction.confidence)) &&
    Array.isArray(item.predictions) &&
    item.predictions.length > 0 &&
    item.version === HISTORY_VERSION
  );
}

function extensionFor(source, mimeType) {
  const fromUri = (source.extension || "").toLowerCase();
  if ([".jpg", ".jpeg", ".png", ".webp"].includes(fromUri)) {
    return fromUri === ".jpeg" ? ".jpg" : fromUri;
  }
  const mime = (mimeType || source.type || "").toLowerCase();
  if (mime.includes("png")) return ".png";
  if (mime.includes("webp")) return ".webp";
  return ".jpg";
}

export async function loadScans() {
  const raw = await AsyncStorage.getItem(HISTORY_KEY);
  if (raw === null) return [];
  let rows;
  try {
    rows = JSON.parse(raw);
  } catch {
    throw new Error(
      "Saved scans could not be read. Clear the scan history and try again.",
    );
  }
  if (!Array.isArray(rows) || rows.some((item) => !isValidScan(item))) {
    throw new Error(
      "Saved scan history is in an older or damaged format. Delete it from the History screen to start fresh.",
    );
  }
  return [...rows].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
}

async function writeScans(rows) {
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(rows));
}

export async function saveScan({ imageUri, mimeType, result }) {
  if (!imageUri) {
    throw new Error("There is no photo to save.");
  }
  if (!result?.topPrediction || !Array.isArray(result.predictions)) {
    throw new Error("There is no completed identification to save.");
  }

  const source = new File(imageUri);
  if (!source.exists) {
    throw new Error(
      "The photo is no longer available. Scan or choose the image again.",
    );
  }

  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const directory = scanDirectory();
  const destination = new File(directory, `${id}${extensionFor(source, mimeType)}`);

  try {
    directory.create({ idempotent: true, intermediates: true });
    await source.copy(destination);
  } catch {
    throw new Error(
      "The photo could not be copied into app storage. Check the phone's free space and try again.",
    );
  }

  const scan = {
    version: HISTORY_VERSION,
    id,
    createdAt: new Date().toISOString(),
    imageUri: destination.uri,
    mimeType: mimeType || source.type || "image/jpeg",
    topPrediction: {
      label: result.topPrediction.label,
      confidence: Number(result.topPrediction.confidence),
    },
    predictions: result.predictions.map((item) => ({
      label: item.label,
      confidence: Number(item.confidence),
    })),
    lowConfidence: Boolean(result.lowConfidence),
    inferenceMs: Number.isFinite(Number(result.inferenceMs))
      ? Number(result.inferenceMs)
      : null,
    model: result.model || null,
  };

  try {
    const existing = await loadScans();
    await writeScans([scan, ...existing]);
  } catch (error) {
    try {
      destination.delete();
    } catch {
      // Orphan cleanup is best effort; the scan was not recorded.
    }
    throw error;
  }

  return scan;
}

export async function deleteScan(id) {
  const existing = await loadScans();
  const target = existing.find((item) => item.id === id);
  if (!target) return null;

  await writeScans(existing.filter((item) => item.id !== id));

  try {
    const photo = new File(target.imageUri);
    if (photo.exists) photo.delete();
  } catch {
    return "The scan was removed from history, but its photo file could not be deleted.";
  }
  return null;
}

export async function clearScans() {
  await AsyncStorage.removeItem(HISTORY_KEY);
  try {
    const directory = scanDirectory();
    if (directory.exists) directory.delete();
  } catch {
    return "History was cleared, but some photo files could not be removed. Try clearing it again.";
  }
  return null;
}
