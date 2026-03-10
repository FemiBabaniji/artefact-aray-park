"use client";

import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";
import { SPF } from "@/lib/motion";
import type { SectionRendererProps } from "../types";

export function DocumentsSection({ blocks, accent }: SectionRendererProps) {
  const C = useC();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={SPF}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
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
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: 16,
            borderRadius: 10,
            border: `1px solid ${C.edge}`,
            backgroundColor: C.bg,
          }}
        >
          {/* Document icon */}
          <div
            style={{
              width: 44,
              height: 52,
              borderRadius: 6,
              backgroundColor: accent ? `${accent}20` : C.sep,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 18, color: accent || C.t3 }}>
              {block.id.includes("deck") ? "D" : block.id.includes("pager") ? "1" : "F"}
            </span>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h3
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: C.t1,
                margin: 0,
              }}
            >
              {block.label || block.content || "Document"}
            </h3>
            <p
              style={{
                fontSize: 12,
                color: C.t3,
                margin: "4px 0 0 0",
              }}
            >
              {block.content?.includes(".pdf") ? "PDF Document" : "Document"}
            </p>
          </div>

          <div
            style={{
              fontSize: 12,
              color: C.t3,
              padding: "4px 8px",
              borderRadius: 4,
              backgroundColor: C.sep,
            }}
          >
            View
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
