"use client";

import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";
import { SPF } from "@/lib/motion";
import type { SectionRendererProps } from "../types";

export function AdditionalSection({ blocks, accent }: SectionRendererProps) {
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
            padding: 16,
            borderRadius: 8,
            backgroundColor: C.sep,
            opacity: 0.8,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: block.content ? 8 : 0,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: C.t3,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {block.label || block.id}
            </span>
            <span
              style={{
                fontSize: 10,
                color: C.t4,
                padding: "2px 6px",
                borderRadius: 4,
                backgroundColor: C.edge,
              }}
            >
              {block.type}
            </span>
          </div>

          {block.content && (
            <p
              style={{
                fontSize: 14,
                color: C.t2,
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              {block.content}
            </p>
          )}
        </motion.div>
      ))}
    </motion.div>
  );
}
