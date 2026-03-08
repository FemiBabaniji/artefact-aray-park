"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useC } from "@/hooks/useC";
import { useDemoConfig, type RoomConfig } from "@/context/DemoConfigContext";
import { Lbl } from "@/components/primitives/Lbl";
import { BlockComposer } from "@/components/room/BlockComposer";
import type { Pace, Block } from "@/types/room";

const SP = { type: "spring", stiffness: 300, damping: 30 } as const;

export { RoomsStep as SectionsStep };

export function RoomsStep() {
  const C = useC();
  const { config, updateRooms } = useDemoConfig();

  // Track which room is active in each column (2x2 accordion)
  const [activeL, setActiveL] = useState(0);
  const [activeR, setActiveR] = useState(0);

  // Split rooms into left/right columns
  const leftRooms = config.rooms.filter((_, i) => i % 2 === 0);
  const rightRooms = config.rooms.filter((_, i) => i % 2 === 1);

  const handleUpdateRoom = useCallback(
    (id: string, updates: Partial<RoomConfig>) => {
      const newRooms = config.rooms.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      );
      updateRooms(newRooms);
    },
    [config.rooms, updateRooms]
  );

  const handleAddRoom = useCallback(() => {
    const newId = `room_${Date.now()}`;
    const newRooms: RoomConfig[] = [
      ...config.rooms,
      {
        id: newId,
        label: "New room",
        purpose: "",
        pace: "development",
        isPublic: true,
        isStructured: false,
        order: config.rooms.length,
      },
    ];
    updateRooms(newRooms);
  }, [config.rooms, updateRooms]);

  const handleDeleteRoom = useCallback(
    (id: string) => {
      if (config.rooms.length <= 2) return;
      const newRooms = config.rooms
        .filter((r) => r.id !== id)
        .map((r, i) => ({ ...r, order: i }));
      updateRooms(newRooms);
    },
    [config.rooms, updateRooms]
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Intro text */}
      <p style={{ fontSize: 12, color: C.t3, lineHeight: 1.5, margin: "0 0 14px" }}>
        Click a room to expand. Members will add blocks directly inside.
      </p>

      {/* 2x2 Accordion Grid */}
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 1,
          background: C.sep,
          border: `1px solid ${C.edge}`,
          borderRadius: 10,
          overflow: "hidden",
          minHeight: 0,
        }}
      >
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", background: C.void }}>
          {leftRooms.map((room, i) => (
            <RoomQuad
              key={room.id}
              room={room}
              isActive={activeL === i}
              onActivate={() => setActiveL(i)}
              onUpdate={(updates) => handleUpdateRoom(room.id, updates)}
              onDelete={() => handleDeleteRoom(room.id)}
              canDelete={config.rooms.length > 2}
            />
          ))}
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", background: C.void }}>
          {rightRooms.map((room, i) => (
            <RoomQuad
              key={room.id}
              room={room}
              isActive={activeR === i}
              onActivate={() => setActiveR(i)}
              onUpdate={(updates) => handleUpdateRoom(room.id, updates)}
              onDelete={() => handleDeleteRoom(room.id)}
              canDelete={config.rooms.length > 2}
            />
          ))}
        </div>
      </div>

      {/* Add room */}
      <button
        onClick={handleAddRoom}
        style={{
          marginTop: 12,
          padding: "8px 0",
          fontSize: 11,
          color: C.t3,
          background: "none",
          border: `1px dashed ${C.edge}`,
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        + Add room
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Room Quad - the accordion card that IS the editing surface
// ─────────────────────────────────────────────────────────────────────────────

type RoomQuadProps = {
  room: RoomConfig;
  isActive: boolean;
  onActivate: () => void;
  onUpdate: (updates: Partial<RoomConfig>) => void;
  onDelete: () => void;
  canDelete: boolean;
};

function RoomQuad({
  room,
  isActive,
  onActivate,
  onUpdate,
  onDelete,
  canDelete,
}: RoomQuadProps) {
  const C = useC();
  const [editingLabel, setEditingLabel] = useState(false);
  const [editingPurpose, setEditingPurpose] = useState(false);
  const [labelValue, setLabelValue] = useState(room.label);
  const [purposeValue, setPurposeValue] = useState(room.purpose || "");

  // Demo blocks state (not persisted, just for preview)
  const [demoBlocks, setDemoBlocks] = useState<Block[]>([]);

  const paceColors: Record<Pace, string> = {
    foundation: C.green,
    development: C.blue,
    ongoing: C.t3,
  };

  const handleLabelSubmit = () => {
    if (labelValue.trim() && labelValue !== room.label) {
      onUpdate({ label: labelValue.trim() });
    } else {
      setLabelValue(room.label);
    }
    setEditingLabel(false);
  };

  const handlePurposeSubmit = () => {
    if (purposeValue !== room.purpose) {
      onUpdate({ purpose: purposeValue || undefined });
    }
    setEditingPurpose(false);
  };

  return (
    <motion.div
      layout
      transition={SP}
      onClick={onActivate}
      style={{
        flex: isActive ? 3 : 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        borderBottom: `1px solid ${C.sep}`,
        cursor: "pointer",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          flexShrink: 0,
        }}
      >
        {/* Label */}
        {editingLabel ? (
          <input
            type="text"
            value={labelValue}
            onChange={(e) => setLabelValue(e.target.value)}
            onBlur={handleLabelSubmit}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleLabelSubmit();
              if (e.key === "Escape") {
                setLabelValue(room.label);
                setEditingLabel(false);
              }
            }}
            onClick={(e) => e.stopPropagation()}
            autoFocus
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: C.t1,
              background: "transparent",
              border: "none",
              outline: "none",
              padding: 0,
              width: 120,
            }}
          />
        ) : (
          <Lbl
            style={{ fontSize: 10, cursor: "text" }}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              setEditingLabel(true);
            }}
          >
            {room.label}
          </Lbl>
        )}

        {/* Pace badge */}
        <select
          value={room.pace}
          onChange={(e) => {
            e.stopPropagation();
            onUpdate({ pace: e.target.value as Pace });
          }}
          onClick={(e) => e.stopPropagation()}
          style={{
            fontSize: 8,
            padding: "2px 6px",
            borderRadius: 3,
            background: paceColors[room.pace] + "20",
            color: paceColors[room.pace],
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-mono)",
            textTransform: "uppercase",
          }}
        >
          <option value="foundation">Foundation</option>
          <option value="development">Development</option>
          <option value="ongoing">Ongoing</option>
        </select>
      </div>

      {/* Expanded content */}
      <AnimatePresence mode="wait">
        {isActive ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              flex: 1,
              overflow: "auto",
              padding: "0 14px 14px",
              minHeight: 0,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Purpose (editable) */}
            <div style={{ marginBottom: 12 }}>
              {editingPurpose ? (
                <textarea
                  value={purposeValue}
                  onChange={(e) => setPurposeValue(e.target.value)}
                  onBlur={handlePurposeSubmit}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setPurposeValue(room.purpose || "");
                      setEditingPurpose(false);
                    }
                  }}
                  autoFocus
                  placeholder="What is this room for?"
                  style={{
                    width: "100%",
                    fontSize: 12,
                    color: C.t2,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    padding: 0,
                    resize: "none",
                    lineHeight: 1.5,
                    minHeight: 36,
                  }}
                />
              ) : (
                <p
                  onClick={() => setEditingPurpose(true)}
                  style={{
                    fontSize: 12,
                    color: room.purpose ? C.t2 : C.t4,
                    lineHeight: 1.5,
                    margin: 0,
                    cursor: "text",
                  }}
                >
                  {room.purpose || "Click to add purpose..."}
                </p>
              )}
            </div>

            {/* BlockComposer preview */}
            <div
              style={{
                padding: 10,
                background: C.edge + "20",
                borderRadius: 6,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  color: C.t4,
                  marginBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: ".05em",
                }}
              >
                Member view preview
              </div>
              <BlockComposer
                blocks={demoBlocks}
                onChange={setDemoBlocks}
              />
            </div>

            {/* Delete */}
            {canDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                style={{
                  padding: "4px 0",
                  fontSize: 10,
                  color: C.t4,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                Remove room
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            style={{
              padding: "0 14px 10px",
              fontSize: 11,
              color: C.t4,
              lineHeight: 1.4,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {room.purpose?.slice(0, 40) || "..."}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
