"use client";

import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";
import { Lbl } from "@/components/primitives/Lbl";
import type { CardTheme } from "../../types";

type CompactCardProps = {
  identity: { name: string; title: string };
  rooms: Array<{ id: string; blocks: unknown[] }>;
  accent: string;
  cardBg: string;
  onExpand: () => void;
  onShowOutputs: () => void;
  colorId: string;
  onColorChange: (id: string) => void;
  theme: CardTheme;
  dark: boolean;
  onToggleTheme: () => void;
};

export function CompactCard({
  identity,
  rooms,
  accent,
  cardBg,
  onExpand,
  onShowOutputs,
  colorId,
  onColorChange,
  theme,
  dark,
  onToggleTheme,
}: CompactCardProps) {
  const C = useC();
  const outerTextColor = theme.outerText;
  const innerTextPrimary = theme.innerTextPrimary;
  const innerTextSecondary = theme.innerTextSecondary;

  const roomsWithContent = rooms.filter((r) => r.blocks.length > 0).length;
  const initials = identity.name
    ? identity.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 14,
        flexShrink: 0,
      }}
    >
      {/* Card */}
      <motion.div
        animate={{ background: accent }}
        transition={{ duration: 0.28, ease: [0.22, 0.1, 0.36, 1] }}
        style={{
          width: 260,
          borderRadius: 22,
          overflow: "hidden",
          position: "relative",
          flexShrink: 0,
          boxShadow: theme.cardShadow(accent),
        }}
      >
        {/* Header strip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "13px 16px 10px",
          }}
        >
          <Lbl style={{ fontSize: 8, color: outerTextColor }}>artefact</Lbl>
          <motion.button
            onClick={onExpand}
            whileHover={{ opacity: 0.7 }}
            style={{
              fontSize: 9,
              fontFamily: "'DM Mono', monospace",
              color: outerTextColor,
              letterSpacing: ".04em",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            expand &rarr;
          </motion.button>
        </div>

        {/* Inner card */}
        <motion.div
          animate={{ background: cardBg }}
          transition={{ duration: 0.28 }}
          style={{
            margin: "0 12px 14px",
            borderRadius: 14,
            padding: "14px 16px 18px",
            position: "relative",
            minHeight: 160,
          }}
        >
          {/* Avatar square */}
          <motion.div
            animate={{ background: accent }}
            transition={{ duration: 0.28 }}
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "rgba(0,0,0,0.5)",
                fontFamily: "'DM Mono', monospace",
              }}
            >
              {initials}
            </span>
          </motion.div>

          {/* Name + title */}
          <div style={{ position: "absolute", bottom: 18, left: 16, right: 16 }}>
            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: innerTextPrimary,
                letterSpacing: "-.025em",
                lineHeight: 1.15,
                marginBottom: 4,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {identity.name || "Your name"}
            </div>
            <div
              style={{
                fontSize: 11,
                color: innerTextSecondary,
                fontWeight: 400,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {identity.title || "Your title"}
            </div>
          </div>
        </motion.div>

        {/* Bottom strip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 16px 14px",
          }}
        >
          <span
            style={{
              fontSize: 10,
              color: outerTextColor,
              fontFamily: "'DM Mono', monospace",
            }}
          >
            {roomsWithContent} of {rooms.length} rooms
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            <motion.button
              onClick={onShowOutputs}
              whileHover={{ opacity: 0.8, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "4px 8px",
                borderRadius: 6,
                background: "rgba(0,0,0,0.15)",
                border: "none",
                cursor: "pointer",
                fontSize: 9,
                color: outerTextColor,
                fontFamily: "'DM Mono', monospace",
              }}
            >
              <span>outputs</span>
              <span style={{ opacity: 0.6 }}>&rarr;</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Color swatches + theme toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        {theme.colors.map((col) => (
          <motion.button
            key={col.id}
            onClick={() => onColorChange(col.id)}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            animate={{
              background: col.accent,
              width: colorId === col.id ? 22 : 14,
              height: colorId === col.id ? 22 : 14,
              boxShadow:
                colorId === col.id
                  ? `0 0 0 2px ${C.void}, 0 0 0 3.5px ${col.accent}`
                  : "none",
            }}
            transition={{ duration: 0.18 }}
            style={{
              borderRadius: "50%",
              border: "none",
              cursor: "pointer",
              flexShrink: 0,
            }}
          />
        ))}

        {/* Theme toggle */}
        <motion.button
          onClick={onToggleTheme}
          whileHover={{ opacity: 0.7 }}
          whileTap={{ scale: 0.9 }}
          style={{
            marginLeft: 8,
            width: 28,
            height: 16,
            borderRadius: 8,
            background: C.sep,
            border: `1px solid ${C.edge}`,
            cursor: "pointer",
            position: "relative",
            flexShrink: 0,
          }}
        >
          <motion.div
            animate={{ x: dark ? 2 : 12 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "absolute",
              top: 2,
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: dark ? C.t3 : "#fbbf24",
            }}
          />
        </motion.button>
      </div>
    </div>
  );
}
