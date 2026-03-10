"use client";

import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";
import { SPF } from "@/lib/motion";
import type { SectionRendererProps } from "../types";

export function GallerySection({ blocks, accent }: SectionRendererProps) {
  const C = useC();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={SPF}
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: 16,
        padding: "16px 0",
      }}
    >
      {blocks.map((block, i) => (
        <motion.div
          key={block.id}
          layoutId={block.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...SPF, delay: i * 0.05 }}
          style={{
            borderRadius: 12,
            border: `1px solid ${C.edge}`,
            overflow: "hidden",
            backgroundColor: C.bg,
          }}
        >
          <div
            style={{
              height: 120,
              backgroundColor: accent ? `${accent}20` : C.sep,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {block.type === "image" && block.content?.startsWith("http") ? (
              <img
                src={block.content}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <span style={{ fontSize: 24, color: C.t4 }}>
                {block.label?.[0] || block.id[0]?.toUpperCase()}
              </span>
            )}
          </div>

          <div style={{ padding: 16 }}>
            <h3
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: C.t1,
                margin: 0,
              }}
            >
              {block.label || block.id}
            </h3>
            {block.content && block.type !== "image" && (
              <p
                style={{
                  fontSize: 13,
                  color: C.t2,
                  margin: "8px 0 0 0",
                  lineHeight: 1.4,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {block.content}
              </p>
            )}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
