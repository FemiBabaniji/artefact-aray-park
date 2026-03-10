"use client";

import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";
import { SPF } from "@/lib/motion";
import type { SectionRendererProps } from "../types";

type HeroBandProps = SectionRendererProps & {
  communityName?: string;
};

export function HeroBand({ blocks, accent, communityName }: HeroBandProps) {
  const C = useC();

  // Extract content from blocks
  const name = blocks.find((b) => b.id.includes("name") || b.type === "name")?.content;
  const title = blocks.find((b) => b.id.includes("title") || b.type === "title")?.content;
  const bio = blocks.find((b) => b.id.includes("bio") || b.type === "bio")?.content;
  const photo = blocks.find((b) => b.type === "image" || b.id.includes("photo") || b.id.includes("avatar"))?.content;
  const links = blocks.filter((b) => b.id.includes("link") || b.type === "link" || b.id.includes("website") || b.id.includes("linkedin") || b.id.includes("twitter") || b.id.includes("email"));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={SPF}
      style={{
        // Full-width band - breaks out of container
        width: "100vw",
        marginLeft: "calc(-50vw + 50%)",
        padding: "120px 24px",
        textAlign: "center",
        borderBottom: `1px solid ${C.sep}`,
        background: C.void,
      }}
    >
      {/* Content container */}
      <div
        style={{
          maxWidth: 800,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        {/* Community badge */}
        {communityName && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPF, delay: 0.05 }}
            style={{
              fontSize: 10,
              fontWeight: 500,
              color: C.t4,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: 8,
            }}
          >
            {communityName} Artefact
          </motion.div>
        )}

        {/* Avatar/Photo */}
        {photo && (
          <motion.div
            layoutId="hero-photo"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...SPF, delay: 0.1 }}
            style={{
              width: 96,
              height: 96,
              borderRadius: 20,
              backgroundColor: accent || C.edge,
              overflow: "hidden",
              marginBottom: 8,
            }}
          >
            {photo.startsWith("http") && (
              <img
                src={photo}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            )}
          </motion.div>
        )}

        {/* Name */}
        {name && (
          <motion.h1
            layoutId="hero-name"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPF, delay: 0.15 }}
            style={{
              fontSize: 40,
              fontWeight: 600,
              color: C.t1,
              margin: 0,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
            }}
          >
            {name}
          </motion.h1>
        )}

        {/* Title/Role */}
        {title && (
          <motion.p
            layoutId="hero-title"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPF, delay: 0.2 }}
            style={{
              fontSize: 16,
              color: C.t2,
              margin: 0,
            }}
          >
            {title}
          </motion.p>
        )}

        {/* Bio/Headline */}
        {bio && (
          <motion.p
            layoutId="hero-bio"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPF, delay: 0.25 }}
            style={{
              fontSize: 18,
              color: C.t2,
              margin: "8px 0 0 0",
              maxWidth: 600,
              lineHeight: 1.6,
            }}
          >
            {bio}
          </motion.p>
        )}

        {/* Social links */}
        {links.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPF, delay: 0.3 }}
            style={{
              display: "flex",
              gap: 12,
              marginTop: 24,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {links.map((link) => (
              <a
                key={link.id}
                href={link.content}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: "8px 16px",
                  fontSize: 12,
                  fontWeight: 500,
                  color: C.t2,
                  background: C.edge,
                  borderRadius: 20,
                  textDecoration: "none",
                  transition: "background 0.15s, color 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = accent || C.t4;
                  e.currentTarget.style.color = C.void;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = C.edge;
                  e.currentTarget.style.color = C.t2;
                }}
              >
                {link.label || getLinkLabel(link.content)}
              </a>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// Helper to extract readable label from URL
function getLinkLabel(url: string): string {
  if (!url) return "Link";
  try {
    const hostname = new URL(url).hostname.replace("www.", "");
    if (hostname.includes("linkedin")) return "LinkedIn";
    if (hostname.includes("twitter") || hostname.includes("x.com")) return "Twitter";
    if (hostname.includes("github")) return "GitHub";
    if (hostname.includes("instagram")) return "Instagram";
    if (hostname.includes("mailto:")) return "Email";
    return hostname.split(".")[0].charAt(0).toUpperCase() + hostname.split(".")[0].slice(1);
  } catch {
    if (url.startsWith("mailto:")) return "Email";
    return "Link";
  }
}
