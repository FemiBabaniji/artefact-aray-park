"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useC } from "@/hooks/useC";
import { SPF } from "@/lib/motion";
import { Lbl } from "@/components/primitives/Lbl";
import { Btn } from "@/components/primitives/Btn";
import { Dot } from "@/components/primitives/Dot";
import type { Room } from "../../types";

type DrillRoomPanelProps = {
  room: Room;
  isActive: boolean;
  onActivate: () => void;
  onOpen: () => void;
  accent: string;
};

// ── Block Preview Renderer ─────────────────────────────────────────────────

function BlockPreview({ block, accent }: { block: Room["blocks"][0]; accent: string }) {
  const C = useC();

  // Extract plain text for display
  const plainText = block.content?.replace(/<[^>]+>/g, "") || "";

  if (block.blockType === "metric") {
    // Parse metric content (format: "value|label" or just "value")
    const [value, label] = (block.content || "—").split("|");
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        padding: "8px 12px",
        background: accent + "11",
        borderRadius: 8,
        borderLeft: `2px solid ${accent}`,
      }}>
        <span style={{ fontSize: 18, fontWeight: 600, color: C.t1, fontFamily: "'DM Mono', monospace" }}>
          {value || "—"}
        </span>
        {label && (
          <span style={{ fontSize: 9, color: C.t3, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {label}
          </span>
        )}
      </div>
    );
  }

  if (block.blockType === "image") {
    return (
      <div style={{
        height: 48,
        background: C.edge,
        borderRadius: 6,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <span style={{ fontSize: 9, color: C.t4 }}>Image</span>
      </div>
    );
  }

  if (block.blockType === "link") {
    return (
      <div style={{
        padding: "6px 10px",
        background: C.edge,
        borderRadius: 6,
        fontSize: 11,
        color: accent,
        textDecoration: "underline",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}>
        {plainText || "Link"}
      </div>
    );
  }

  // Default text block
  if (!plainText) return null;

  return (
    <div style={{
      fontSize: 12,
      color: C.t2,
      lineHeight: 1.6,
      overflow: "hidden",
      display: "-webkit-box",
      WebkitLineClamp: 3,
      WebkitBoxOrient: "vertical",
    }}>
      {plainText}
    </div>
  );
}

// ── Room Content Preview ───────────────────────────────────────────────────

function RoomContentPreview({ room, accent }: { room: Room; accent: string }) {
  const C = useC();
  const blocks = room.blocks.filter(b => b.content);

  if (blocks.length === 0) {
    return (
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        color: C.t4,
      }}>
        {room.prompt && (
          <p style={{ fontSize: 11, lineHeight: 1.5, margin: 0, fontStyle: "italic", textAlign: "center", maxWidth: 200 }}>
            {room.prompt}
          </p>
        )}
        <span style={{ fontSize: 10 }}>No content yet</span>
      </div>
    );
  }

  // Group metrics together for compact display
  const metrics = blocks.filter(b => b.blockType === "metric");
  const otherBlocks = blocks.filter(b => b.blockType !== "metric");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Metrics row */}
      {metrics.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {metrics.slice(0, 3).map((block) => (
            <BlockPreview key={block.id} block={block} accent={accent} />
          ))}
          {metrics.length > 3 && (
            <span style={{ fontSize: 9, color: C.t4, alignSelf: "center" }}>
              +{metrics.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Other blocks */}
      {otherBlocks.slice(0, 2).map((block) => (
        <BlockPreview key={block.id} block={block} accent={accent} />
      ))}

      {otherBlocks.length > 2 && (
        <span style={{ fontSize: 9, color: C.t4 }}>
          +{otherBlocks.length - 2} more blocks
        </span>
      )}
    </div>
  );
}

// ── Drill Room Panel ───────────────────────────────────────────────────────

export function DrillRoomPanel({ room, isActive, onActivate, onOpen, accent }: DrillRoomPanelProps) {
  const C = useC();
  const [hovered, setHovered] = useState(false);

  const hasBlocks = room.blocks.length > 0;
  const hasContent = room.blocks.some(b => b.content);

  // Get preview text for collapsed state
  const previewText = room.blocks
    .filter((b) => b.blockType === "text" && b.content)
    .map((b) => b.content?.replace(/<[^>]+>/g, "") || "")
    .join(" ")
    .trim();

  return (
    <motion.div
      layout
      transition={SPF}
      onClick={!isActive ? onActivate : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: isActive ? 4 : 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        cursor: isActive ? "default" : "pointer",
        borderTop: `1px solid ${hovered && !isActive ? accent + "44" : C.sep}`,
        paddingTop: 10,
        overflow: "hidden",
        transition: "border-color 0.15s",
      }}
    >
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 6,
        flexShrink: 0,
      }}>
        <Lbl style={{ color: isActive ? C.t2 : C.t3 }}>{room.label}</Lbl>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {(isActive || hovered) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.1 }}
            >
              <Btn onClick={onOpen} style={{ fontSize: 8, padding: "2px 5px" }}>
                {"\u229E"} open
              </Btn>
            </motion.div>
          )}
          <Dot status={hasContent ? "in_progress" : hasBlocks ? "empty" : "empty"} hideLabel size={5} />
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {isActive ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}
          >
            <RoomContentPreview room={room} accent={accent} />
          </motion.div>
        ) : (
          <motion.div
            key="collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ fontSize: 11, color: C.t4, lineHeight: 1.5 }}
          >
            {!hasContent
              ? (room.prompt ? room.prompt.slice(0, 30) + "..." : "empty")
              : previewText.slice(0, 40) + (previewText.length > 40 ? "..." : "")
            }
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
