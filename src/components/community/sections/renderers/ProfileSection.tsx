"use client";

import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";
import { SPF } from "@/lib/motion";
import type { SectionRendererProps } from "../types";

export function ProfileSection({ blocks, accent }: SectionRendererProps) {
  const C = useC();

  const name = blocks.find((b) => b.id === "name" || b.id.includes("name"))?.content;
  const title = blocks.find((b) => b.id === "title" || b.id.includes("title"))?.content;
  const bio = blocks.find((b) => b.id === "bio" || b.id.includes("bio"))?.content;
  const photo = blocks.find((b) => b.id === "photo" || b.type === "image")?.content;
  const location = blocks.find((b) => b.id === "location")?.content;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={SPF}
      style={{
        display: "grid",
        gridTemplateColumns: photo ? "100px 1fr" : "1fr",
        gap: 24,
        alignItems: "start",
        padding: "24px 0",
      }}
    >
      {photo && (
        <motion.div
          layoutId="photo"
          style={{
            width: 100,
            height: 100,
            borderRadius: "50%",
            backgroundColor: accent || C.t4,
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {photo.startsWith("http") && (
            <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          )}
        </motion.div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {name && (
          <motion.h2
            layoutId="name"
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: C.t1,
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            {name}
          </motion.h2>
        )}

        {title && (
          <motion.p
            layoutId="title"
            style={{
              fontSize: 14,
              color: accent || C.t2,
              margin: 0,
              fontWeight: 500,
            }}
          >
            {title}
            {location && <span style={{ color: C.t3 }}> / {location}</span>}
          </motion.p>
        )}

        {bio && (
          <motion.p
            layoutId="bio"
            style={{
              fontSize: 14,
              color: C.t2,
              margin: "8px 0 0 0",
              lineHeight: 1.6,
            }}
          >
            {bio}
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}
