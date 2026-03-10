"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useC } from "@/hooks/useC";
import { FADE, SP } from "@/lib/motion";
import { useGuestArtefactContext } from "@/context/GuestArtefactContext";
import { BlockComposer } from "@/components/room/BlockComposer";
import { Lbl } from "@/components/primitives/Lbl";
import { Btn } from "@/components/primitives/Btn";
import { Region } from "@/components/artefact/Region";
import type { Block } from "@/types/room";

type DrillKey = "identity" | "rooms" | null;

export function ArtefactCard() {
  const C = useC();
  const {
    state,
    activeRoomId,
    setActiveRoomId,
    updateIdentity,
    updateRoom,
    updateBlocks,
    addRoom,
  } = useGuestArtefactContext();

  const [drilled, setDrilled] = useState<DrillKey>(null);
  const [activeRoomInDrill, setActiveRoomInDrill] = useState<string | null>(null);

  const SZ = "min(70vw, 70vh)";

  // When drilling into rooms, show the active room
  const drilledRoom = activeRoomInDrill
    ? state.rooms.find((r) => r.id === activeRoomInDrill)
    : null;

  const handleBlocksChange = useCallback(
    (blocks: Block[]) => {
      if (activeRoomInDrill) {
        updateBlocks(activeRoomInDrill, blocks);
      }
    },
    [activeRoomInDrill, updateBlocks]
  );

  return (
    <div style={{ position: "relative", width: SZ, height: SZ, flexShrink: 0 }}>
      {/* Floating label */}
      <div
        style={{
          position: "absolute",
          top: -18,
          left: 0,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Lbl style={{ fontSize: 8 }}>artefact</Lbl>
        <span style={{ fontSize: 10, color: C.t4 }}>
          {state.identity.name || "Untitled"}{" "}
          {state.identity.title && `— ${state.identity.title}`}
        </span>
      </div>

      <motion.div
        animate={{ borderColor: C.edge, background: C.void }}
        style={{
          width: "100%",
          height: "100%",
          border: `1px solid ${C.edge}`,
          borderRadius: 14,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* ── Drill Overlay ── */}
        <AnimatePresence>
          {drilled && (
            <DrillOverlay
              drilled={drilled}
              onBack={() => {
                setDrilled(null);
                setActiveRoomInDrill(null);
              }}
              state={state}
              activeRoomInDrill={activeRoomInDrill}
              setActiveRoomInDrill={setActiveRoomInDrill}
              drilledRoom={drilledRoom}
              onBlocksChange={handleBlocksChange}
              updateIdentity={updateIdentity}
            />
          )}
        </AnimatePresence>

        {/* ── LEFT column ── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "22px 24px",
            height: "100%",
            overflow: "hidden",
            borderRight: `1px solid ${C.sep}`,
          }}
        >
          {/* Identity region */}
          <Region tag="identity" flex="none">
            <div
              onClick={() => setDrilled("identity")}
              style={{ cursor: "pointer" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  marginBottom: 14,
                }}
              >
                {/* Avatar placeholder */}
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: C.blue,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>
                    {state.identity.name
                      ? state.identity.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()
                      : "?"}
                  </span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 17,
                      fontWeight: 600,
                      color: C.t1,
                      letterSpacing: "-.025em",
                      marginBottom: 3,
                      lineHeight: 1.2,
                    }}
                  >
                    {state.identity.name || "Your name"}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: C.t3,
                      lineHeight: 1.4,
                    }}
                  >
                    {state.identity.title || "Your title"}
                  </div>
                </div>
              </div>
              {state.identity.bio && (
                <div
                  style={{
                    fontSize: 12,
                    color: C.t2,
                    lineHeight: 1.5,
                    marginBottom: 8,
                  }}
                >
                  {state.identity.bio.slice(0, 100)}
                  {state.identity.bio.length > 100 && "..."}
                </div>
              )}
            </div>
          </Region>

          {/* Rooms region */}
          <Region tag="rooms" flex="1">
            <div
              onClick={() => setDrilled("rooms")}
              style={{ cursor: "pointer", height: "100%" }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {state.rooms.slice(0, 4).map((room) => (
                  <div
                    key={room.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 0",
                      borderBottom: `1px solid ${C.sep}`,
                    }}
                  >
                    <span style={{ fontSize: 12, color: C.t2 }}>
                      {room.label}
                    </span>
                    <span
                      style={{
                        fontSize: 9,
                        color: room.blocks.length > 0 ? C.green : C.t4,
                      }}
                    >
                      {room.blocks.length > 0
                        ? `${room.blocks.length} blocks`
                        : "empty"}
                    </span>
                  </div>
                ))}
                {state.rooms.length > 4 && (
                  <div style={{ fontSize: 10, color: C.t4, marginTop: 4 }}>
                    +{state.rooms.length - 4} more
                  </div>
                )}
              </div>
            </div>
          </Region>
        </div>

        {/* ── RIGHT column ── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "22px 24px",
            height: "100%",
            overflow: "hidden",
          }}
        >
          <Region tag="preview" flex="1">
            <div
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: C.t4,
                fontSize: 12,
                textAlign: "center",
                gap: 12,
              }}
            >
              <div>Click identity or rooms to edit</div>
              <div style={{ fontSize: 10 }}>
                Your artefact will compile into
                <br />
                portfolio, resume, and more
              </div>
            </div>
          </Region>
        </div>
      </motion.div>
    </div>
  );
}

// ── Drill Overlay ────────────────────────────────────────────────────────────

function DrillOverlay({
  drilled,
  onBack,
  state,
  activeRoomInDrill,
  setActiveRoomInDrill,
  drilledRoom,
  onBlocksChange,
  updateIdentity,
}: {
  drilled: DrillKey;
  onBack: () => void;
  state: ReturnType<typeof useGuestArtefactContext>["state"];
  activeRoomInDrill: string | null;
  setActiveRoomInDrill: (id: string | null) => void;
  drilledRoom: ReturnType<typeof useGuestArtefactContext>["state"]["rooms"][0] | null | undefined;
  onBlocksChange: (blocks: Block[]) => void;
  updateIdentity: ReturnType<typeof useGuestArtefactContext>["updateIdentity"];
}) {
  const C = useC();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={FADE}
      style={{
        position: "absolute",
        inset: 0,
        background: C.void,
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        borderRadius: 14,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: `1px solid ${C.sep}`,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Btn onClick={onBack} style={{ color: C.t3 }}>
          ← back
        </Btn>
        <Lbl>{drilled === "identity" ? "identity" : "rooms"}</Lbl>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {drilled === "identity" ? (
          <IdentityEditor identity={state.identity} updateIdentity={updateIdentity} />
        ) : (
          <RoomsEditor
            rooms={state.rooms}
            activeRoomId={activeRoomInDrill}
            setActiveRoomId={setActiveRoomInDrill}
            drilledRoom={drilledRoom}
            onBlocksChange={onBlocksChange}
          />
        )}
      </div>
    </motion.div>
  );
}

// ── Identity Editor ──────────────────────────────────────────────────────────

function IdentityEditor({
  identity,
  updateIdentity,
}: {
  identity: ReturnType<typeof useGuestArtefactContext>["state"]["identity"];
  updateIdentity: ReturnType<typeof useGuestArtefactContext>["updateIdentity"];
}) {
  const C = useC();

  const fields: { key: "name" | "title" | "location" | "bio"; label: string; placeholder: string; multiline?: boolean }[] = [
    { key: "name", label: "Name", placeholder: "Your name" },
    { key: "title", label: "Title", placeholder: "What you do" },
    { key: "location", label: "Location", placeholder: "Where you're based" },
    { key: "bio", label: "Bio", placeholder: "Brief bio...", multiline: true },
  ];

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      {fields.map((f) => (
        <div key={f.key}>
          <Lbl style={{ marginBottom: 6, display: "block" }}>{f.label}</Lbl>
          {f.multiline ? (
            <textarea
              value={identity[f.key] || ""}
              onChange={(e) => updateIdentity({ [f.key]: e.target.value })}
              placeholder={f.placeholder}
              rows={3}
              style={{
                width: "100%",
                background: "transparent",
                border: `1px solid ${C.sep}`,
                borderRadius: 6,
                padding: "10px 12px",
                fontSize: 13,
                color: C.t1,
                outline: "none",
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />
          ) : (
            <input
              type="text"
              value={identity[f.key] || ""}
              onChange={(e) => updateIdentity({ [f.key]: e.target.value })}
              placeholder={f.placeholder}
              style={{
                width: "100%",
                background: "transparent",
                border: `1px solid ${C.sep}`,
                borderRadius: 6,
                padding: "10px 12px",
                fontSize: 13,
                color: C.t1,
                outline: "none",
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Rooms Editor ─────────────────────────────────────────────────────────────

function RoomsEditor({
  rooms,
  activeRoomId,
  setActiveRoomId,
  drilledRoom,
  onBlocksChange,
}: {
  rooms: ReturnType<typeof useGuestArtefactContext>["state"]["rooms"];
  activeRoomId: string | null;
  setActiveRoomId: (id: string | null) => void;
  drilledRoom: ReturnType<typeof useGuestArtefactContext>["state"]["rooms"][0] | null | undefined;
  onBlocksChange: (blocks: Block[]) => void;
}) {
  const C = useC();

  if (drilledRoom) {
    // Show room editor
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <div
          style={{
            padding: "12px 16px",
            borderBottom: `1px solid ${C.sep}`,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Btn onClick={() => setActiveRoomId(null)} style={{ color: C.t3 }}>
            ← rooms
          </Btn>
          <span style={{ fontSize: 14, fontWeight: 500, color: C.t1 }}>
            {drilledRoom.label}
          </span>
        </div>
        {drilledRoom.prompt && (
          <div
            style={{
              padding: "12px 16px",
              fontSize: 12,
              color: C.t3,
              borderBottom: `1px solid ${C.sep}`,
            }}
          >
            {drilledRoom.prompt}
          </div>
        )}
        <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
          <BlockComposer
            blocks={drilledRoom.blocks}
            purpose={drilledRoom.prompt}
            onChange={onBlocksChange}
            readOnly={false}
            layout="vertical"
          />
        </div>
      </div>
    );
  }

  // Show room list
  return (
    <div style={{ padding: 16 }}>
      {rooms.map((room) => (
        <motion.div
          key={room.id}
          onClick={() => setActiveRoomId(room.id)}
          whileHover={{ background: C.bg }}
          style={{
            padding: "14px 16px",
            borderRadius: 8,
            cursor: "pointer",
            marginBottom: 4,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: C.t1 }}>
                {room.label}
              </div>
              {room.prompt && (
                <div style={{ fontSize: 11, color: C.t4, marginTop: 2 }}>
                  {room.prompt}
                </div>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {room.blocks.length > 0 && (
                <span
                  style={{
                    fontSize: 10,
                    color: C.green,
                    background: C.green + "22",
                    padding: "2px 8px",
                    borderRadius: 4,
                  }}
                >
                  {room.blocks.length}
                </span>
              )}
              <span style={{ fontSize: 12, color: C.t4 }}>→</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
