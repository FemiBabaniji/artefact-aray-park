import { useC } from "@/hooks/useC";
import type { CardTheme } from "../views/types";

export function useCardColors(C: ReturnType<typeof useC>): CardTheme {
  const isDark = C.void === "#0b0b0f";

  const colors = isDark
    ? [
        { id: "indigo", accent: C.blue, card: C.sep },
        { id: "emerald", accent: "#4ade80", card: C.sep },
        { id: "amber", accent: "#fbbf24", card: C.sep },
        { id: "rose", accent: "#fb7185", card: C.sep },
        { id: "sky", accent: "#38bdf8", card: C.sep },
        { id: "violet", accent: "#a78bfa", card: C.sep },
      ]
    : [
        { id: "magenta", accent: "#e040fb", card: "#2d1a38" },
        { id: "cobalt", accent: "#4f8ef7", card: "#111e3a" },
        { id: "emerald", accent: "#34d399", card: "#0d2620" },
        { id: "amber", accent: "#fbbf24", card: "#221a08" },
        { id: "rose", accent: "#fb7185", card: "#2a1020" },
        { id: "slate", accent: "#94a3b8", card: "#18202e" },
      ];

  return {
    isDark,
    colors,
    outerText: "rgba(0,0,0,0.50)",
    innerTextPrimary: "#ffffff",
    innerTextSecondary: isDark ? C.t3 : "rgba(255,255,255,0.45)",
    cardShadow: (accent: string) =>
      isDark ? `0 8px 48px ${accent}33` : `0 8px 40px ${accent}44`,
  };
}
