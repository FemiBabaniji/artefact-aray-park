"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useC } from "@/hooks/useC";
import { SP, SPF } from "@/lib/motion";
import { Lbl } from "@/components/primitives/Lbl";
import { Btn } from "@/components/primitives/Btn";
import type { Identity, StandaloneRoom } from "@/types/artefact";

// ── Output Types ─────────────────────────────────────────────────────────────

type OutputType = "resume" | "portfolio" | "identity";

type OutputConfig = {
  id: OutputType;
  label: string;
  description: string;
  format: string;
  color: string;
  icon: string;
};

const OUTPUTS: OutputConfig[] = [
  {
    id: "resume",
    label: "Resume",
    description: "Professional CV",
    format: "PDF",
    color: "#22c55e",
    icon: "R",
  },
  {
    id: "portfolio",
    label: "Portfolio",
    description: "Public page",
    format: "HTML",
    color: "#60a5fa",
    icon: "P",
  },
  {
    id: "identity",
    label: "AI Context",
    description: "Copy for MCP",
    format: "COPY",
    color: "#a855f7",
    icon: "{}",
  },
];

// ── Compact Output Visualization ─────────────────────────────────────────────

type CompactOutputViewProps = {
  identity: Identity;
  rooms: StandaloneRoom[];
  accent: string;
  cardBg: string;
  theme: {
    outerText: string;
    innerTextPrimary: string;
    innerTextSecondary: string;
    cardShadow: (accent: string) => string;
  };
  onBack: () => void;
};

export function CompactOutputView({
  identity,
  rooms,
  accent,
  cardBg,
  theme,
  onBack,
}: CompactOutputViewProps) {
  const C = useC();
  const [activeOutput, setActiveOutput] = useState(1); // Start with portfolio
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<OutputType | null>(null);

  const initials = identity.name
    ? identity.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  const roomsWithContent = rooms.filter((r) => r.blocks.length > 0).length;

  // Auto-cycle outputs
  useEffect(() => {
    if (generating || generated) return;
    const id = setInterval(() => {
      setActiveOutput((p) => (p + 1) % 3);
    }, 3000);
    return () => clearInterval(id);
  }, [generating, generated]);

  const handleGenerate = useCallback(async () => {
    const output = OUTPUTS[activeOutput];
    setGenerating(true);

    await new Promise((r) => setTimeout(r, 1200));

    if (output.id === "identity") {
      // Generate MCP-friendly context string
      const context = generateMCPContext(identity, rooms);
      await navigator.clipboard.writeText(context);
    } else if (output.id === "portfolio") {
      window.open("/p/preview", "_blank");
    } else if (output.id === "resume") {
      const resumeText = generateResumeText(identity, rooms);
      const blob = new Blob([resumeText], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${identity.name?.toLowerCase().replace(/\s+/g, "-") || "artefact"}-resume.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }

    setGenerating(false);
    setGenerated(output.id);
    setTimeout(() => setGenerated(null), 2500);
  }, [activeOutput, identity, rooms]);

  const activeColor = OUTPUTS[activeOutput].color;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 0,
        position: "relative",
      }}
    >
      {/* Mini Artefact Card (Source) */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={SP}
        style={{
          width: 180,
          borderRadius: 18,
          overflow: "hidden",
          flexShrink: 0,
          background: accent,
          boxShadow: theme.cardShadow(accent),
          zIndex: 2,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 12px 8px",
          }}
        >
          <Lbl style={{ fontSize: 7, color: theme.outerText }}>artefact</Lbl>
          <motion.button
            onClick={onBack}
            whileHover={{ opacity: 0.7 }}
            style={{
              fontSize: 8,
              fontFamily: "'DM Mono', monospace",
              color: theme.outerText,
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            ← back
          </motion.button>
        </div>

        {/* Inner card */}
        <motion.div
          style={{
            margin: "0 10px 10px",
            borderRadius: 12,
            padding: "12px 14px 14px",
            background: cardBg,
            minHeight: 100,
            position: "relative",
          }}
        >
          {/* Avatar */}
          <motion.div
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "rgba(0,0,0,0.5)",
                fontFamily: "'DM Mono', monospace",
              }}
            >
              {initials}
            </span>
          </motion.div>

          {/* Name + title */}
          <div style={{ position: "absolute", bottom: 14, left: 14, right: 14 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: theme.innerTextPrimary,
                letterSpacing: "-.02em",
                lineHeight: 1.2,
                marginBottom: 2,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {identity.name || "Your name"}
            </div>
            <div
              style={{
                fontSize: 9,
                color: theme.innerTextSecondary,
              }}
            >
              {identity.title || "Your title"}
            </div>
          </div>
        </motion.div>

        {/* Bottom strip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "6px 12px 10px",
          }}
        >
          <span
            style={{
              fontSize: 8,
              color: theme.outerText,
              fontFamily: "'DM Mono', monospace",
            }}
          >
            {roomsWithContent}/{rooms.length} rooms
          </span>
          <div
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: roomsWithContent > 0 ? "#4ade80" : C.t4,
            }}
          />
        </div>
      </motion.div>

      {/* Animated Branches SVG */}
      <svg
        width="120"
        height="200"
        viewBox="0 0 120 200"
        style={{
          marginLeft: -8,
          marginRight: -8,
          zIndex: 1,
        }}
      >
        <defs>
          <filter id="branch-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Branch paths */}
        {[
          { y: 50, idx: 0, d: "M 0 100 H 40 Q 60 100 60 80 Q 60 50 80 50 H 120" },
          { y: 100, idx: 1, d: "M 0 100 H 120" },
          { y: 150, idx: 2, d: "M 0 100 H 40 Q 60 100 60 120 Q 60 150 80 150 H 120" },
        ].map(({ y, idx, d }) => {
          const isActive = activeOutput === idx;
          const color = isActive ? OUTPUTS[idx].color : C.sep;
          return (
            <motion.path
              key={idx}
              d={d}
              fill="none"
              strokeLinecap="round"
              strokeWidth={2}
              filter={isActive ? "url(#branch-glow)" : undefined}
              initial={{ pathLength: 0 }}
              animate={{
                pathLength: 1,
                stroke: color,
                opacity: isActive ? 1 : 0.25,
              }}
              transition={{
                pathLength: { duration: 0.8, delay: idx * 0.15 },
                stroke: { duration: 0.3 },
                opacity: { duration: 0.3 },
              }}
            />
          );
        })}

        {/* Animated dot traveling along active path */}
        <motion.circle
          r={3}
          fill={activeColor}
          filter="url(#branch-glow)"
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            cx: [0, 40, 80, 120],
            cy: activeOutput === 0 ? [100, 100, 65, 50] : activeOutput === 2 ? [100, 100, 135, 150] : [100, 100, 100, 100],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatDelay: 1.5,
            ease: "easeInOut",
          }}
        />
      </svg>

      {/* Output Nodes */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ ...SP, delay: 0.2 }}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          zIndex: 2,
        }}
      >
        {OUTPUTS.map((output, idx) => {
          const isActive = activeOutput === idx;
          const isGenerated = generated === output.id;

          return (
            <motion.div
              key={output.id}
              onClick={() => !generating && setActiveOutput(idx)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              animate={{
                opacity: isActive ? 1 : 0.5,
                x: isActive ? 0 : -4,
              }}
              transition={SPF}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                cursor: generating ? "wait" : "pointer",
                padding: "10px 14px",
                borderRadius: 12,
                background: isActive ? output.color + "15" : "transparent",
                border: `1px solid ${isActive ? output.color + "44" : "transparent"}`,
              }}
            >
              {/* Icon */}
              <motion.div
                animate={{
                  background: isActive ? output.color : C.sep,
                  scale: isActive ? 1 : 0.9,
                }}
                transition={{ duration: 0.25 }}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontSize: output.icon === "{}" ? 10 : 12,
                    fontWeight: 700,
                    color: isActive ? "rgba(0,0,0,0.6)" : C.t3,
                    fontFamily: "'DM Mono', monospace",
                  }}
                >
                  {isGenerated ? "✓" : output.icon}
                </span>
              </motion.div>

              {/* Label */}
              <div style={{ minWidth: 80 }}>
                <motion.div
                  animate={{ color: isActive ? C.t1 : C.t3 }}
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    lineHeight: 1.2,
                  }}
                >
                  {output.label}
                </motion.div>
                <motion.div
                  animate={{ color: isActive ? output.color : C.t4 }}
                  style={{
                    fontSize: 9,
                    fontFamily: "'DM Mono', monospace",
                    marginTop: 2,
                  }}
                >
                  {output.format}
                </motion.div>
              </div>

              {/* Generate button (only for active) */}
              <AnimatePresence>
                {isActive && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGenerate();
                    }}
                    disabled={generating}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      marginLeft: "auto",
                      padding: "6px 12px",
                      borderRadius: 6,
                      border: "none",
                      background: generating ? C.sep : output.color,
                      color: generating ? C.t3 : "rgba(0,0,0,0.7)",
                      fontSize: 10,
                      fontWeight: 600,
                      cursor: generating ? "wait" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    {generating ? (
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                      >
                        ◐
                      </motion.span>
                    ) : isGenerated ? (
                      output.id === "identity" ? "Copied!" : "Done!"
                    ) : output.id === "identity" ? (
                      "Copy →"
                    ) : (
                      "Generate →"
                    )}
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

// ── MCP Context Generator ────────────────────────────────────────────────────

function generateMCPContext(identity: Identity, rooms: StandaloneRoom[]): string {
  const lines: string[] = [];

  lines.push("<user_context>");
  lines.push("");

  // Identity section
  lines.push("<identity>");
  if (identity.name) lines.push(`name: ${identity.name}`);
  if (identity.title) lines.push(`title: ${identity.title}`);
  if (identity.location) lines.push(`location: ${identity.location}`);
  if (identity.bio) {
    lines.push(`bio: ${identity.bio}`);
  }
  if (identity.skills.length > 0) {
    lines.push(`skills: ${identity.skills.join(", ")}`);
  }
  if (identity.links.length > 0) {
    lines.push("links:");
    identity.links.forEach((link) => {
      lines.push(`  - ${link.label}: ${link.url}`);
    });
  }
  lines.push("</identity>");
  lines.push("");

  // Rooms with content
  const roomsWithContent = rooms.filter((r) => r.blocks.length > 0);

  if (roomsWithContent.length > 0) {
    lines.push("<context_rooms>");

    roomsWithContent.forEach((room) => {
      lines.push("");
      lines.push(`<room key="${room.key}" label="${room.label}">`);

      room.blocks.forEach((block) => {
        if (block.blockType === "text" && block.content) {
          const text = block.content.replace(/<[^>]+>/g, "").trim();
          if (text) {
            lines.push(text);
          }
        } else if (block.blockType === "link" && block.content) {
          const title = block.metadata?.ogTitle || block.caption || "Link";
          lines.push(`[${title}](${block.content})`);
        }
      });

      lines.push(`</room>`);
    });

    lines.push("");
    lines.push("</context_rooms>");
  }

  lines.push("");
  lines.push("</user_context>");

  return lines.join("\n");
}

// ── Resume Text Generator ────────────────────────────────────────────────────

function generateResumeText(identity: Identity, rooms: StandaloneRoom[]): string {
  const lines: string[] = [];

  lines.push("═".repeat(50));
  lines.push(identity.name || "Name");
  lines.push(identity.title || "Title");
  if (identity.location) lines.push(identity.location);
  if (identity.email) lines.push(identity.email);
  lines.push("═".repeat(50));
  lines.push("");

  if (identity.bio) {
    lines.push("ABOUT");
    lines.push("─".repeat(30));
    lines.push(identity.bio);
    lines.push("");
  }

  if (identity.skills.length > 0) {
    lines.push("SKILLS");
    lines.push("─".repeat(30));
    lines.push(identity.skills.join(" • "));
    lines.push("");
  }

  rooms
    .filter((r) => r.blocks.length > 0)
    .forEach((room) => {
      lines.push(room.label.toUpperCase());
      lines.push("─".repeat(30));
      room.blocks.forEach((block) => {
        if (block.blockType === "text" && block.content) {
          const text = block.content.replace(/<[^>]+>/g, "").trim();
          if (text) lines.push(text);
        }
      });
      lines.push("");
    });

  lines.push("─".repeat(50));
  lines.push(`Generated from Artefact on ${new Date().toLocaleDateString()}`);

  return lines.join("\n");
}
