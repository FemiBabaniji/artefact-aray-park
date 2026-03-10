"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";
import { BlockComposer } from "@/components/room/BlockComposer";
import { Lbl } from "@/components/primitives/Lbl";
import { Btn } from "@/components/primitives/Btn";
import type { Block } from "@/types/room";

type RoomViewProps = {
  room: {
    id: string;
    label: string;
    prompt?: string;
    blocks: Block[];
  };
  onBlocksChange: (blocks: Block[]) => void;
  updateRoom: (roomId: string, updates: { label?: string }) => void;
  removeRoom: (roomId: string) => void;
  canDelete: boolean;
  onBack: () => void;
  compact?: boolean;
};

export function RoomView({
  room,
  onBlocksChange,
  updateRoom,
  removeRoom,
  canDelete,
  onBack,
  compact,
}: RoomViewProps) {
  const C = useC();
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [labelValue, setLabelValue] = useState(room.label);
  const [showMenu, setShowMenu] = useState(false);

  const handleLabelSave = () => {
    if (labelValue.trim() && labelValue !== room.label) {
      updateRoom(room.id, { label: labelValue.trim() });
    }
    setIsEditingLabel(false);
  };

  const handleLabelKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLabelSave();
    if (e.key === "Escape") {
      setLabelValue(room.label);
      setIsEditingLabel(false);
    }
  };

  const headerPadding = compact ? "10px 12px" : "14px 20px";
  const contentPadding = compact ? 12 : 20;
  const fontSize = compact ? 12 : 14;

  return (
    <>
      <div
        style={{
          padding: headerPadding,
          borderBottom: `1px solid ${C.sep}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: compact ? 8 : 12 }}>
          <Btn onClick={onBack} style={{ color: C.t3, fontSize: compact ? 10 : 12 }}>
            &larr;
          </Btn>
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
                fontSize,
                fontWeight: 500,
                color: C.t1,
                outline: "none",
                minWidth: 0,
              }}
            />
          ) : (
            <span
              onClick={() => setIsEditingLabel(true)}
              style={{
                fontSize,
                fontWeight: 500,
                color: C.t1,
                cursor: "text",
              }}
            >
              {room.label}
            </span>
          )}
        </div>

        {/* Room menu */}
        <div style={{ position: "relative" }}>
          <Btn
            onClick={() => setShowMenu(!showMenu)}
            style={{ color: C.t3, fontSize }}
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
                minWidth: compact ? 100 : 120,
                zIndex: 10,
              }}
            >
              <div
                onClick={() => {
                  setIsEditingLabel(true);
                  setShowMenu(false);
                }}
                style={{
                  padding: compact ? "6px 10px" : "8px 12px",
                  fontSize: compact ? 11 : 12,
                  color: C.t2,
                  cursor: "pointer",
                }}
              >
                Rename
              </div>
              {canDelete && (
                <div
                  onClick={() => {
                    removeRoom(room.id);
                    onBack();
                  }}
                  style={{
                    padding: compact ? "6px 10px" : "8px 12px",
                    fontSize: compact ? 11 : 12,
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

      {room.prompt && (
        <div
          style={{
            padding: compact ? "8px 12px" : "10px 20px",
            fontSize: compact ? 10 : 11,
            color: C.t4,
            borderBottom: `1px solid ${C.sep}`,
          }}
        >
          {room.prompt}
        </div>
      )}

      <div style={{ flex: 1, overflow: "auto", padding: contentPadding }}>
        <BlockComposer
          blocks={room.blocks}
          purpose={room.prompt}
          onChange={onBlocksChange}
          readOnly={false}
          layout="vertical"
        />
      </div>
    </>
  );
}
