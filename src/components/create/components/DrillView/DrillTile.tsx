"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";
import { Lbl } from "@/components/primitives/Lbl";

type DrillTileProps = {
  tag: string;
  onClick: () => void;
  accent: string;
  flex?: number | string | "none";
  style?: React.CSSProperties;
  children: React.ReactNode;
};

export function DrillTile({ tag, onClick, accent, flex = 1, style, children }: DrillTileProps) {
  const C = useC();
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={{ opacity: 0.9 }}
      animate={{ borderColor: hovered ? accent + "44" : C.sep }}
      style={{
        flex,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        border: `1px solid ${C.sep}`,
        borderRadius: 12,
        padding: "12px 14px",
        background: C.void,
        overflow: "hidden",
        transition: "border-color 0.15s",
        ...style,
      }}
    >
      <Lbl style={{ fontSize: 8, marginBottom: 10, display: "block", flexShrink: 0 }}>{tag}</Lbl>
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {children}
      </div>
    </motion.div>
  );
}
