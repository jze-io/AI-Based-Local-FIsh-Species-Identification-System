/**
 * Address of the local inference server on this PC.
 *
 * The phone cannot use "localhost" because that means the phone itself.
 * Use the PC's Wi-Fi IPv4 address, keep both devices on the same network,
 * and leave the backend running while testing.
 *
 * If the PC's IP changes, update this one line and reload Expo.
 */
export const API_BASE_URL = "http://192.168.254.109:8000";

/** How long to wait for the local server before showing a timeout message. */
export const REQUEST_TIMEOUT_MS = 30000;

/**
 * Below this score the UI describes the result as an uncertain match instead
 * of a confident identification. This is a presentation threshold, not a
 * guarantee that higher scores are correct.
 */
export const LOW_CONFIDENCE_THRESHOLD = 0.6;
