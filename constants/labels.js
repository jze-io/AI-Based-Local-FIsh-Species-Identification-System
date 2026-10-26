/**
 * Authoritative class order from the trained model's labels.txt.
 *
 * Keep this list in sync with:
 *   C:\xampp\htdocs\ofishx-backend\model\labels.txt
 *
 * The app receives labels from the backend and validates them against this
 * list. It never invents a label or reorders predictions.
 */
export const MODEL_LABELS = [
  "Bangus",
  "Dalagang bukid",
  "Budboron",
  "Pakol",
  "Tulay",
  "Bilong-bilong",
  "Barilis",
  "Tulingan",
  "Hiwas",
  "Tilapia",
];

export function isKnownLabel(label) {
  return MODEL_LABELS.includes(label);
}
