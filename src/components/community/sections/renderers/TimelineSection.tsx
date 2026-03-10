"use client";

import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";
import { SPF } from "@/lib/motion";
import type { SectionRendererProps } from "../types";

export function TimelineSection({ blocks, accent }: SectionRendererProps) {
  const C = useC();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={SPF}
      style={{
        position: "relative",
        padding: "16px 0 16px 32px",
      }}
    >
      {/* Vertical line */}
      <div
        style={{
          position: "absolute",
          left: 8,
          top: 24,
          bottom: 24,
          width: 2,
          backgroundColor: C.edge,
        }}
      />

      {blocks.map((block, i) => (
        <motion.div
          key={block.id}
          layoutId={block.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...SPF, delay: i * 0.1 }}
          style={{
            position: "relative",
            paddingBottom: i < blocks.length - 1 ? 32 : 0,
          }}
        >
          {/* Dot */}
          <div
            style={{
              position: "absolute",
              left: -28,
              top: 6,
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: accent || C.blue,
              border: `2px solid ${C.bg}`,
            }}
          />

          <div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: C.t3,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {block.label || `Milestone ${i + 1}`}
            </span>

            <h3
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: C.t1,
                margin: "4px 0 0 0",
              }}
            >
              {block.content || "Milestone"}
            </h3>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
