"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";
import { FADE } from "@/lib/motion";
import { useGuestArtefactContext } from "@/context/GuestArtefactContext";
import { BlockComposer } from "@/components/room/BlockComposer";
import { Lbl } from "@/components/primitives/Lbl";
import { Btn } from "@/components/primitives/Btn";
import type { StandaloneRoom } from "@/types/artefact";
import type { Block } from "@/types/room";

type RoomEditorProps = {
  room: StandaloneRoom;
};

export function RoomEditor({ room }: RoomEditorProps) {
  const C = useC();
  const { updateRoom, updateBlocks, removeRoom, state } = useGuestArtefactContext();
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [labelValue, setLabelValue] = useState(room.label);
  const [showMenu, setShowMenu] = useState(false);

  const handleBlocksChange = useCallback(
    (blocks: Block[]) => {
      updateBlocks(room.id, blocks);
    },
    [room.id, updateBlocks]
  );

  const handleLabelSave = () => {
    if (labelValue.trim() && labelValue !== room.label) {
      updateRoom(room.id, { label: labelValue.trim() });
    }
    setIsEditingLabel(false);
  };

  const handleLabelKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLabelSave();
    } else if (e.key === "Escape") {
      setLabelValue(room.label);
      setIsEditingLabel(false);
    }
  };

  const handleDeleteRoom = () => {
    if (state.rooms.length > 1) {
      removeRoom(room.id);
    }
    setShowMenu(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={FADE}
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 24px",
          borderBottom: `1px solid ${C.sep}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ flex: 1 }}>
          {isEditingLabel ? (
            <input
              type="text"
              value={labelValue}
              onChange={(e) => setLabelValue(e.target.value)}
              onBlur={handleLabelSave}
              onKeyDown={handleLabelKeyDown}
              autoFocus
              style={{
                background: "transparent",
                border: "none",
                fontSize: 18,
                fontWeight: 500,
                color: C.t1,
                outline: "none",
                width: "100%",
              }}
            />
          ) : (
            <div
              onClick={() => setIsEditingLabel(true)}
              style={{
                fontSize: 18,
                fontWeight: 500,
                color: C.t1,
                cursor: "text",
              }}
            >
              {room.label}
            </div>
          )}
          {room.prompt && (
            <div style={{ fontSize: 12, color: C.t3, marginTop: 4 }}>
              {room.prompt}
            </div>
          )}
        </div>

        {/* Room menu */}
        <div style={{ position: "relative" }}>
          <Btn
            onClick={() => setShowMenu(!showMenu)}
            style={{ color: C.t3, fontSize: 14 }}
          >
            ...
          </Btn>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: 4,
                background: C.bg,
                border: `1px solid ${C.edge}`,
                borderRadius: 6,
                padding: "4px 0",
                minWidth: 120,
                zIndex: 10,
              }}
            >
              <div
                onClick={() => {
                  setIsEditingLabel(true);
                  setShowMenu(false);
                }}
                style={{
                  padding: "8px 12px",
                  fontSize: 12,
                  color: C.t2,
                  cursor: "pointer",
                }}
              >
                Rename
              </div>
              {state.rooms.length > 1 && (
                <div
                  onClick={handleDeleteRoom}
                  style={{
                    padding: "8px 12px",
                    fontSize: 12,
                    color: "#ef4444",
                    cursor: "pointer",
                  }}
                >
                  Delete room
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Content: BlockComposer */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: 24,
        }}
      >
        <BlockComposer
          blocks={room.blocks}
          purpose={room.prompt}
          onChange={handleBlocksChange}
          readOnly={false}
          layout="vertical"
        />
      </div>
    </motion.div>
  );
}
