"use client";

import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";
import { SPF } from "@/lib/motion";
import type { SectionRendererProps } from "../types";

export function MetricsSection({ blocks, accent }: SectionRendererProps) {
  const C = useC();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={SPF}
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: 16,
        padding: "16px 0",
      }}
    >
      {blocks.map((block, i) => (
        <motion.div
          key={block.id}
          layoutId={block.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPF, delay: i * 0.05 }}
          style={{
            padding: 20,
            borderRadius: 12,
            backgroundColor: C.sep,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <span
            style={{
              fontSize: 28,
              fontWeight: 600,
              color: accent || C.t1,
              letterSpacing: "-0.02em",
            }}
          >
            {block.content || "—"}
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: C.t3,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {block.label || block.id}
          </span>
        </motion.div>
      ))}
    </motion.div>
  );
}
