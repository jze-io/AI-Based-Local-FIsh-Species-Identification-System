import React from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

/**
 * Decorative school of fish used as a faint background motif on dark cards.
 * Purely visual: it is hidden from screen readers and never intercepts touches.
 */
const FISH = [
  { top: "6%", left: "78%", size: 46, rotate: "-12deg", flip: false, fade: 1 },
  { top: "19%", left: "62%", size: 25, rotate: "-6deg", flip: true, fade: 0.7 },
  { top: "9%", left: "91%", size: 17, rotate: "-22deg", flip: false, fade: 0.55 },
  { top: "68%", left: "4%", size: 32, rotate: "9deg", flip: true, fade: 0.5 },
  { top: "81%", left: "19%", size: 17, rotate: "15deg", flip: false, fade: 0.4 },
];

export default function FishPattern({
  color = "#FFFFFF",
  strength = 0.1,
  style,
}) {
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, style]}
    >
      {FISH.map((fish) => (
        <Ionicons
          key={`${fish.top}-${fish.left}`}
          color={color}
          name="fish"
          size={fish.size}
          style={{
            position: "absolute",
            top: fish.top,
            left: fish.left,
            opacity: strength * fish.fade,
            transform: [
              { scaleX: fish.flip ? -1 : 1 },
              { rotate: fish.rotate },
            ],
          }}
        />
      ))}
    </View>
  );
}
