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

export function DrillRoomPanel({ room, isActive, onActivate, onOpen, accent }: DrillRoomPanelProps) {
  const C = useC();
  const [hovered, setHovered] = useState(false);

  const hasBlocks = room.blocks.length > 0;
  const plainText = room.blocks
    .filter((b) => b.blockType === "text" && b.content)
    .map((b) => b.content?.replace(/<[^>]+>/g, "") || "")
    .join(" ")
    .trim();
  const isEmpty = !plainText;

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
          <Dot status={hasBlocks ? "in_progress" : "empty"} hideLabel size={5} />
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
            style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", gap: 10 }}
          >
            {isEmpty ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                {room.prompt && (
                  <p style={{ fontSize: 12, color: C.t4, lineHeight: 1.6, margin: 0, fontStyle: "italic" }}>
                    {room.prompt}
                  </p>
                )}
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  style={{ marginTop: 12 }}
                >
                  <Btn onClick={onOpen} style={{ fontSize: 10 }}>
                    {"\u229E"} start writing
                  </Btn>
                </motion.div>
              </div>
            ) : (
              <div style={{
                flex: 1,
                fontSize: 13,
                color: C.t2,
                lineHeight: 1.7,
                overflow: "hidden",
              }}>
                {plainText.length > 180 ? plainText.slice(0, 180) + "..." : plainText}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ fontSize: 11, color: C.t4, lineHeight: 1.5 }}
          >
            {isEmpty
              ? (room.prompt ? room.prompt.slice(0, 30) + "..." : "empty")
              : plainText.slice(0, 40) + (plainText.length > 40 ? "..." : "")
            }
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
