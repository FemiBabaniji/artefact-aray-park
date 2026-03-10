"use client";

import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";
import { SPF } from "@/lib/motion";
import type { SectionRendererProps } from "../types";

export function ContentSection({ blocks, accent }: SectionRendererProps) {
  const C = useC();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={SPF}
      style={{
        display: "flex",
        flexDirection: "column",
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
        >
          {block.type === "embed" || block.id.includes("demo") || block.id.includes("product") ? (
            <div
              style={{
                aspectRatio: "16 / 9",
                borderRadius: 12,
                backgroundColor: C.sep,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: `1px solid ${C.edge}`,
              }}
            >
              {block.content?.includes("http") ? (
                <span style={{ fontSize: 13, color: C.t3 }}>Video embed</span>
              ) : (
                <span style={{ fontSize: 32, color: C.t4 }}>
                  {"\u25B6"}
                </span>
              )}
            </div>
          ) : (
            <p
              style={{
                fontSize: 15,
                color: C.t2,
                margin: 0,
                lineHeight: 1.7,
              }}
            >
              {block.content || (
                <span style={{ color: C.t3, fontStyle: "italic" }}>
                  {block.label || "Content goes here..."}
                </span>
              )}
            </p>
          )}
        </motion.div>
      ))}
    </motion.div>
  );
}
