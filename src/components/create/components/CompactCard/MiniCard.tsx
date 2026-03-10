"use client";

import { motion } from "framer-motion";
import type { CardTheme } from "../../types";

type MiniCardProps = {
  identity: { name: string; title: string };
  accent: string;
  cardBg: string;
  onClick: () => void;
  theme: CardTheme;
};

export function MiniCard({ identity, accent, cardBg, onClick, theme }: MiniCardProps) {
  const initials = identity.name
    ? identity.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      animate={{ background: accent }}
      transition={{ duration: 0.28, ease: [0.22, 0.1, 0.36, 1] }}
      style={{
        width: 80,
        height: 100,
        borderRadius: 14,
        overflow: "hidden",
        cursor: "pointer",
        position: "relative",
        flexShrink: 0,
        boxShadow: theme.cardShadow(accent),
      }}
    >
      {/* Inner mini card */}
      <motion.div
        animate={{ background: cardBg }}
        transition={{ duration: 0.28 }}
        style={{
          position: "absolute",
          inset: 6,
          borderRadius: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 8,
        }}
      >
        {/* Avatar */}
        <motion.div
          animate={{ background: accent }}
          transition={{ duration: 0.28 }}
          style={{
            width: 28,
            height: 28,
            borderRadius: 7,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 6,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "rgba(0,0,0,0.5)",
              fontFamily: "'DM Mono', monospace",
            }}
          >
            {initials}
          </span>
        </motion.div>
        {/* Name truncated */}
        <div
          style={{
            fontSize: 9,
            fontWeight: 600,
            color: theme.innerTextPrimary,
            textAlign: "center",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            width: "100%",
          }}
        >
          {identity.name?.split(" ")[0] || "Name"}
        </div>
      </motion.div>
    </motion.div>
  );
}
