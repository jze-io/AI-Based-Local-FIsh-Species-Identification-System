import { File, UploadType } from "expo-file-system";
import {
  API_BASE_URL,
  LOW_CONFIDENCE_THRESHOLD,
  REQUEST_TIMEOUT_MS,
} from "../constants/config";
import { isKnownLabel } from "../constants/labels";

export class FishClassifierError extends Error {
  constructor(message, code = "CLASSIFIER_ERROR") {
    super(message);
    this.name = "FishClassifierError";
    this.code = code;
  }
}

const ACCEPTED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

function normaliseMimeType(mimeType, uri) {
  const candidate = (mimeType || "").toLowerCase().split(";")[0].trim();
  if (candidate && candidate !== "application/octet-stream") {
    return candidate === "image/jpg" ? "image/jpeg" : candidate;
  }
  const extension = (uri.split("?")[0].match(/\.([a-z0-9]+)$/i)?.[1] || "")
    .toLowerCase();
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  return "image/jpeg";
}

function parseJsonBody(body, status) {
  if (!body) {
    throw new FishClassifierError(
      `The server returned an empty response (HTTP ${status}).`,
      "EMPTY_RESPONSE",
    );
  }
  try {
    return JSON.parse(body);
  } catch {
    throw new FishClassifierError(
      `The server returned an unreadable response (HTTP ${status}). Check that API_BASE_URL points to the OFishx backend.`,
      "INVALID_RESPONSE",
    );
  }
}

function serverMessage(payload, status) {
  if (payload && typeof payload.error === "string" && payload.error.trim()) {
    return payload.error.trim();
  }
  if (status === 413) {
    return "The photo is too large for the server. Choose a smaller image.";
  }
  if (status === 415) {
    return "That image format is not supported. Use a JPEG, PNG, or WebP photo.";
  }
  return `The server could not identify this image (HTTP ${status}).`;
}

function validatePredictions(payload) {
  if (!payload || payload.success !== true) {
    throw new FishClassifierError(
      "The server did not return a successful identification.",
      "INVALID_RESPONSE",
    );
  }
  if (!Array.isArray(payload.predictions) || payload.predictions.length === 0) {
    throw new FishClassifierError(
      "The server returned no predictions for this image.",
      "NO_PREDICTIONS",
    );
  }

  const predictions = payload.predictions
    .map((item) => ({
      label: typeof item?.label === "string" ? item.label.trim() : "",
      confidence: Number(item?.confidence),
    }))
    .filter(
      (item) =>
        item.label &&
        isKnownLabel(item.label) &&
        Number.isFinite(item.confidence) &&
        item.confidence >= 0 &&
        item.confidence <= 1,
    )
    .sort((a, b) => b.confidence - a.confidence);

  if (predictions.length !== payload.predictions.length) {
    throw new FishClassifierError(
      "The backend returned a label or score that does not match the trained model. Check labels.txt on the server.",
      "MODEL_LABEL_MISMATCH",
    );
  }
  if (!predictions.length) {
    throw new FishClassifierError(
      "The server returned no usable predictions.",
      "NO_PREDICTIONS",
    );
  }

  const top = predictions[0];
  return {
    topPrediction: top,
    predictions,
    lowConfidence: top.confidence < LOW_CONFIDENCE_THRESHOLD,
    inferenceMs: Number.isFinite(Number(payload.inferenceMs))
      ? Number(payload.inferenceMs)
      : null,
    model: payload.model || null,
    receivedFormat: payload.receivedFormat || null,
  };
}

/**
 * Upload one image to the local Flask server and return the model's real
 * scores. There is deliberately no fallback prediction: failures throw.
 */
export async function classifyFish(imageUri, options = {}) {
  if (!imageUri || typeof imageUri !== "string") {
    throw new FishClassifierError(
      "Choose or capture a fish photo first.",
      "INVALID_IMAGE",
    );
  }

  const file = new File(imageUri);
  if (!file.exists) {
    throw new FishClassifierError(
      "The selected photo is no longer available. Choose it again.",
      "INVALID_IMAGE",
    );
  }
  if (file.size <= 0) {
    throw new FishClassifierError(
      "The selected photo is empty or could not be read.",
      "INVALID_IMAGE",
    );
  }
  if (file.size > 12 * 1024 * 1024) {
    throw new FishClassifierError(
      "The photo is larger than 12 MB. Choose a smaller image.",
      "IMAGE_TOO_LARGE",
    );
  }

  const mimeType = normaliseMimeType(
    options.mimeType || file.type || "",
    imageUri,
  );
  if (!ACCEPTED_MIME_TYPES.has(mimeType)) {
    throw new FishClassifierError(
      "That image type is not supported. Use a JPEG, PNG, or WebP photo.",
      "UNSUPPORTED_IMAGE",
    );
  }

  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  let task = null;
  try {
    task = file.createUploadTask(`${API_BASE_URL}/predict`, {
      uploadType: UploadType.MULTIPART,
      fieldName: "image",
      mimeType,
      parameters: { source: "ofishx-mobile" },
      signal: controller.signal,
    });
    const response = await task.uploadAsync();
    const payload = parseJsonBody(response.body, response.status);

    if (response.status < 200 || response.status >= 300) {
      throw new FishClassifierError(
        serverMessage(payload, response.status),
        `HTTP_${response.status}`,
      );
    }

    return validatePredictions(payload);
  } catch (error) {
    if (error instanceof FishClassifierError) throw error;
    if (timedOut) {
      throw new FishClassifierError(
        "The server took too long to answer. Make sure this PC is awake and the OFishx backend is running.",
        "TIMEOUT",
      );
    }
    throw new FishClassifierError(
      "Could not reach the OFishx server. Check that the PC server is running, the phone is on the same Wi-Fi, and API_BASE_URL in constants/config.js is the PC's current IP address.",
      "NETWORK_ERROR",
    );
  } finally {
    clearTimeout(timeout);
    try {
      task?.release();
    } catch {
      // Native task cleanup is best effort.
    }
  }
}

/**
 * Check the local server and model without running a prediction.
 */
export async function checkBackend() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    const body = await response.text();
    const payload = parseJsonBody(body, response.status);
    if (!response.ok || payload.success !== true) {
      throw new FishClassifierError(
        serverMessage(payload, response.status),
        `HTTP_${response.status}`,
      );
    }
    return {
      ok: true,
      classes: Array.isArray(payload.classes) ? payload.classes : [],
      model: payload.model || "OFishx classifier",
    };
  } catch (error) {
    if (error instanceof FishClassifierError) throw error;
    if (error?.name === "AbortError") {
      throw new FishClassifierError(
        "The server did not answer within 8 seconds.",
        "TIMEOUT",
      );
    }
    throw new FishClassifierError(
      "Could not reach the server. Start the backend and check the Wi-Fi address.",
      "NETWORK_ERROR",
    );
  } finally {
    clearTimeout(timeout);
  }
}

export { API_BASE_URL };
