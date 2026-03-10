"use client";

import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";
import { SPF } from "@/lib/motion";
import type { SectionRendererProps } from "../types";

export function HeroSection({ blocks, accent }: SectionRendererProps) {
  const C = useC();

  const title = blocks.find((b) => b.id.includes("name") || b.id.includes("startup"))?.content;
  const subtitle = blocks.find((b) => b.id.includes("liner") || b.id.includes("tagline") || b.id.includes("title"))?.content;
  const image = blocks.find((b) => b.type === "image" || b.id.includes("photo") || b.id.includes("logo"))?.content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPF}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: 16,
        padding: "48px 0",
      }}
    >
      {image && (
        <motion.div
          layoutId={blocks.find((b) => b.type === "image")?.id}
          style={{
            width: 80,
            height: 80,
            borderRadius: 16,
            backgroundColor: accent || C.t4,
            overflow: "hidden",
            marginBottom: 8,
          }}
        >
          {image.startsWith("http") && (
            <img src={image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          )}
        </motion.div>
      )}

      {title && (
        <motion.h1
          layoutId={blocks.find((b) => b.id.includes("name"))?.id}
          style={{
            fontSize: 32,
            fontWeight: 600,
            color: C.t1,
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </motion.h1>
      )}

      {subtitle && (
        <motion.p
          layoutId={blocks.find((b) => b.id.includes("liner"))?.id}
          style={{
            fontSize: 16,
            color: C.t2,
            margin: 0,
            maxWidth: 500,
            lineHeight: 1.5,
          }}
        >
          {subtitle}
        </motion.p>
      )}
    </motion.div>
  );
}
