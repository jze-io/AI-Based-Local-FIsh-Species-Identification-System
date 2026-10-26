import { MODEL_LABELS } from "../constants/labels";

/**
 * Fish backgrounds for the ten labels the model was trained on.
 *
 * These are deliberately cautious. Local Philippine fish names frequently
 * cover several species, and an image classifier can only return the class it
 * was trained on. Where a scientific identification is not certain we say so
 * instead of inventing one. This file is the single place to edit fish facts.
 */
export const FISH_INFO_DISCLAIMER =
  "Local fish names vary by region and can cover more than one species. Scientific names marked probable or unconfirmed are context, not a positive identification from the app.";

export const FISH_INFORMATION = {
  Bangus: {
    label: "Bangus",
    englishName: "Milkfish",
    aliases: ["Bangrus"],
    scientificName: "Chanos chanos",
    scientificStatus: "confirmed",
    description:
      "Milkfish is a silvery, streamlined fish with a deeply forked tail and a small mouth. It is one of the most familiar food fish in the Philippines and is widely grown in ponds and pens.",
    habitat:
      "Coastal marine waters, estuaries, and brackish ponds. It is also extensively farmed.",
    distinctive:
      "Look for a smooth silver body, a deeply forked tail, and the absence of obvious large teeth.",
    note:
      "Bangus is the common Philippine name for milkfish. The class is well defined, although farmed milkfish can look plump or stubby.",
  },
  "Dalagang bukid": {
    label: "Dalagang bukid",
    englishName: "Yellowtail fusilier",
    aliases: ["Dalagang-bukid"],
    scientificName: "Caesio cuning",
    scientificStatus: "probable",
    description:
      "Dalagang bukid is a small, schooling reef fish with a slender body, a reddish or pinkish underside, and a yellow tail. It is common in Philippine markets and on reef-associated fishing grounds.",
    habitat:
      "Coral reefs, reef slopes, and nearby coastal waters, usually in schools.",
    distinctive:
      "Look for a fusilier body shape and a yellow tail; the exact colour pattern changes with the species and the light.",
    note:
      "More than one fusilier is sold under similar local names. The scientific name here is the common association, not a guarantee for every fish labelled dalagang bukid.",
  },
  Budboron: {
    label: "Budboron",
    englishName: "Scad (family Carangidae)",
    aliases: ["Galunggong group"],
    scientificName: "Not confirmed",
    scientificStatus: "unresolved",
    description:
      "Budboron is a local name for a small scad, the slender silver fish often grouped with galunggong. Scads have a streamlined body, a forked tail, and a row of small finlets near the tail.",
    habitat:
      "Coastal and offshore waters; scads typically travel in schools and are caught by small-scale and commercial fisheries.",
    distinctive:
      "Look for a slender silver body, forked tail, and finlets between the dorsal fin and tail.",
    note:
      "Philippine references associate Budboron with more than one Decapterus scad, so this app does not claim a single scientific species.",
  },
  Pakol: {
    label: "Pakol",
    englishName: "Triggerfish (family Balistidae)",
    aliases: ["Triggerfish"],
    scientificName: "Not confirmed",
    scientificStatus: "unresolved",
    description:
      "Pakol refers to triggerfish, reef fish with tough skin, a small mouth, and a locking dorsal spine. They are often recognised by their unusual body shape and strong jaws.",
    habitat:
      "Coral reefs, lagoons, rocky bottoms, and reef edges.",
    distinctive:
      "Look for a laterally compressed body, a small mouth, and the heavy first dorsal spine that can lock upright.",
    note:
      "Several triggerfish species occur in the Philippines and can be called pakol. Handle live triggerfish with care because of their spines.",
  },
  Tulay: {
    label: "Tulay",
    englishName: "Scad (Selar group)",
    aliases: ["Matang baka in some areas"],
    scientificName: "Not confirmed (Selar sp.)",
    scientificStatus: "unresolved",
    description:
      "Tulay is a local name for a small schooling scad with large eyes, a blue-green back, a silver belly, and a deeply forked tail.",
    habitat:
      "Coastal waters, lagoons, and bays; often found in schools.",
    distinctive:
      "Look for a large eye relative to the head, a streamlined silver body, and a forked tail.",
    note:
      "Philippine references apply tulay to more than one small scad, including oxeye scad and bigeye scad. The app therefore does not claim one confirmed species.",
  },
  "Bilong-bilong": {
    label: "Bilong-bilong",
    englishName: "Moonfish",
    aliases: ["Moonfish", "Hiwas in some areas"],
    scientificName: "Mene maculata",
    scientificStatus: "probable",
    description:
      "Bilong-bilong is a moonfish with a very deep, flattened, disc-like silver body and a small mouth. It often has small dark spots or markings along the upper part of its body.",
    habitat:
      "Inshore coastal waters, shallow bays, and sandy or muddy bottoms.",
    distinctive:
      "Look for the almost round, razor-thin profile and the dark spots along the back.",
    note:
      "The model has separate Hiwas and Bilong-bilong classes, but local usage can treat these moonfish names as overlapping. The distinction here follows the model labels.",
  },
  Barilis: {
    label: "Barilis",
    englishName: "Tuna, likely yellowfin group",
    aliases: ["Yellowfin tuna", "Tuna"],
    scientificName: "Not confirmed (Thunnus sp.)",
    scientificStatus: "unresolved",
    description:
      "Barilis is a general Philippine market name for tunas, especially yellowfin-type tunas. These are large, fast pelagic fish with a streamlined body, finlets, and a crescent-shaped tail.",
    habitat:
      "Open ocean and deep offshore waters; tunas are strong swimmers that may travel long distances.",
    distinctive:
      "Look for a torpedo-shaped body and finlets between the dorsal fin and tail. Yellowfin tuna also have bright yellow finlets and a yellow stripe along the side.",
    note:
      "Barilis can refer to more than one tuna species. An image alone cannot establish the exact species, so the app does not present a confirmed scientific name.",
  },
  Tulingan: {
    label: "Tulingan",
    englishName: "Frigate or bullet tuna",
    aliases: ["Frigate tuna", "Bullet tuna"],
    scientificName: "Auxis sp.",
    scientificStatus: "probable",
    description:
      "Tulingan is a small tuna with a torpedo-shaped body, a dark blue or mottled back, and a silver belly. It is a common market fish and is often cooked in coconut milk or made into dried fish.",
    habitat:
      "Pelagic coastal and offshore waters, usually in schools.",
    distinctive:
      "Look for a small tuna body with a pointed head, finlets, and a dark patterned back.",
    note:
      "Frigate tuna (Auxis thazard) and bullet tuna (Auxis rochei) are both called tulingan in various places. This app therefore uses the genus name only.",
  },
  Hiwas: {
    label: "Hiwas",
    englishName: "Moonfish",
    aliases: ["Moonfish", "Bilong-bilong in some areas"],
    scientificName: "Mene maculata (provisional)",
    scientificStatus: "unresolved",
    description:
      "Hiwas is another local moonfish name for a deep-bodied, silver, razor-bellied fish. It looks very similar to bilong-bilong and is easy to confuse with it in a photo.",
    habitat:
      "Coastal marine waters, shallow bays, and estuaries.",
    distinctive:
      "Look for a thin, disc-like body with a sharp belly ridge and a small mouth.",
    note:
      "The project's local database maps Hiwas and Bilong-bilong to the same moonfish species. Their separate output labels should not be read as proof of two different species.",
  },
  Tilapia: {
    label: "Tilapia",
    englishName: "Nile tilapia",
    aliases: ["Nile tilapia"],
    scientificName: "Oreochromis niloticus",
    scientificStatus: "probable",
    description:
      "Tilapia is a freshwater cichlid with a deep body and, often, dark vertical stripes. Nile tilapia is widely farmed in the Philippines and is a common everyday food fish.",
    habitat:
      "Ponds, lakes, rivers, and reservoirs. Tilapia tolerates a wide range of freshwater conditions.",
    distinctive:
      "Look for a deep body, a spiny dorsal fin, and dark vertical bars along the side.",
    note:
      "Farmed tilapia can include hybrids and related cichlids. The scientific name is the usual identity for this class, not a guarantee for every hybrid.",
  },
};

export const FISH_INFORMATION_LIST = MODEL_LABELS.map(
  (label) => FISH_INFORMATION[label],
).filter(Boolean);

export function getFishInformation(label) {
  return (
    FISH_INFORMATION[label] || {
      label: label || "Unknown",
      englishName: "No local information available",
      aliases: [],
      scientificName: "Not confirmed",
      scientificStatus: "unresolved",
      description:
        "This result is not one of the classes the app has information for. Check the backend labels before relying on it.",
      habitat: "Not available",
      distinctive: "Not available",
      note:
        "The app will never fill a missing species with invented facts. Re-run the scan or check the model label order.",
    }
  );
}

export function statusLabel(status) {
  if (status === "confirmed") return "Scientific name confirmed";
  if (status === "probable") return "Common association";
  if (status === "unresolved") return "Scientific name unconfirmed";
  return "Unverified";
}
