"use client";

import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";
import { FADE } from "@/lib/motion";
import { BlockComposer } from "@/components/room/BlockComposer";
import { Lbl } from "@/components/primitives/Lbl";
import { Btn } from "@/components/primitives/Btn";
import { Dot } from "@/components/primitives/Dot";
import type { Block } from "@/types/room";
import type { Room } from "../../types";

type RoomFullscreenProps = {
  room: Room;
  accent: string;
  onClose: () => void;
  onBlocksChange: (blocks: Block[]) => void;
};

export function RoomFullscreen({ room, accent, onClose, onBlocksChange }: RoomFullscreenProps) {
  const C = useC();
  const hasBlocks = room.blocks.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={FADE}
      style={{
        position: "fixed",
        inset: 0,
        background: C.void,
        zIndex: 300,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 24px",
          borderBottom: `1px solid ${C.sep}`,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Btn onClick={onClose}>{"\u2190"} back</Btn>
          <div style={{ width: 1, height: 16, background: C.sep }} />
          <motion.div
            animate={{ background: accent }}
            style={{ width: 6, height: 6, borderRadius: "50%" }}
          />
          <Lbl style={{ color: C.t2 }}>{room.label}</Lbl>
        </div>
        <Dot status={hasBlocks ? "in_progress" : "empty"} />
      </div>

      {/* Content area */}
      <div
        style={{
          flex: 1,
          overflow: "hidden",
          padding: 24,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {!hasBlocks && room.prompt && (
          <p
            style={{
              fontSize: 15,
              color: C.t3,
              lineHeight: 1.7,
              margin: "0 0 20px",
              fontStyle: "italic",
              flexShrink: 0,
            }}
          >
            {room.prompt}
          </p>
        )}

        <div style={{ flex: 1, minHeight: 0 }}>
          <BlockComposer
            blocks={room.blocks}
            purpose={room.prompt}
            onChange={onBlocksChange}
            readOnly={false}
            layout="masonry"
            columns={3}
          />
        </div>
      </div>
    </motion.div>
  );
}
