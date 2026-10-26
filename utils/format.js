import { LOW_CONFIDENCE_THRESHOLD } from "../constants/config";

export function formatPercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  return `${(number * 100).toFixed(1)}%`;
}

export function confidenceDescriptor(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "Unknown";
  if (number >= 0.85) return "Strong match";
  if (number >= LOW_CONFIDENCE_THRESHOLD) return "Possible match";
  return "Uncertain match";
}

export function formatDate(iso) {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return "Unknown date";
  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(iso) {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return "Unknown date";
  return date.toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
