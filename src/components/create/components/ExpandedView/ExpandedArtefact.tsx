"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useC } from "@/hooks/useC";
import { useIsMobile } from "@/hooks/useBreakpoint";
import { FADE } from "@/lib/motion";
import { useGuestArtefactContext } from "@/context/GuestArtefactContext";
import { Lbl } from "@/components/primitives/Lbl";
import { Btn } from "@/components/primitives/Btn";
import { Dot } from "@/components/primitives/Dot";
import { DrillTile, DrillOverlay, RoomFullscreen } from "../DrillView";
import { IdentityEditor } from "./IdentityEditor";
import { RoomView } from "./RoomView";
import { IngestContent } from "@/components/ingest/IngestContent";
import { PageComposer } from "@/components/community/sections/PageComposer";
import type { Block } from "@/types/room";
import type { CardTheme } from "../../types";
import type { DocumentBlock } from "@/types/document";

type ExpandedArtefactProps = {
  accent: string;
  cardBg: string;
  colorId: string;
  onColorChange: (id: string) => void;
  onCollapse: () => void;
  theme: CardTheme;
  dark: boolean;
  onToggleTheme: () => void;
  ingestBlocks?: DocumentBlock[];
  onIngestBlocksChange?: (blocks: DocumentBlock[]) => void;
  onIngestPull?: (content: string) => void;
  /** Force view to "room" when activeRoomId is set externally */
  autoShowRoom?: boolean;
  /** Fill parent container instead of using fixed sizing */
  fillContainer?: boolean;
  /** Hide all editing controls (color picker, theme toggle, add room, identity edit) */
  readOnly?: boolean;
};

export function ExpandedArtefact({
  accent,
  colorId,
  onColorChange,
  onCollapse,
  theme,
  dark,
  onToggleTheme,
  ingestBlocks = [],
  onIngestBlocksChange,
  onIngestPull,
  autoShowRoom = false,
  fillContainer = false,
  readOnly = false,
}: ExpandedArtefactProps) {
  const C = useC();
  const isMobile = useIsMobile();
  const {
    state,
    activeRoomId,
    setActiveRoomId,
    updateIdentity,
    updateRoom,
    updateBlocks,
    addRoom,
    removeRoom,
  } = useGuestArtefactContext();

  const [view, setView] = useState<"overview" | "identity" | "room" | "ingest">("overview");
  const [layout, setLayout] = useState<"list" | "drill">("list");
  const [mode, setMode] = useState<"workspace" | "page">("workspace");
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [newRoomLabel, setNewRoomLabel] = useState("");
  const [drillActiveL, setDrillActiveL] = useState(0);
  const [drillActiveR, setDrillActiveR] = useState(0);
  const [drillTarget, setDrillTarget] = useState<"identity" | "rooms" | "connect" | null>(null);
  const [fsRoomId, setFsRoomId] = useState<string | null>(null);

  const fsRoom = fsRoomId ? state.rooms.find(r => r.id === fsRoomId) : null;
  const activeRoom = state.rooms.find((r) => r.id === activeRoomId);

  // Auto-switch to room view when activeRoomId changes externally
  useEffect(() => {
    if (autoShowRoom && activeRoomId) {
      setView("room");
    } else if (autoShowRoom && !activeRoomId) {
      setView("overview");
    }
  }, [autoShowRoom, activeRoomId]);

  const handleBlocksChange = useCallback(
    (blocks: Block[]) => {
      if (activeRoomId) {
        updateBlocks(activeRoomId, blocks);
      }
    },
    [activeRoomId, updateBlocks]
  );

  const handleAddRoom = () => {
    if (newRoomLabel.trim()) {
      const newId = addRoom(newRoomLabel.trim());
      setNewRoomLabel("");
      setIsAddingRoom(false);
      setActiveRoomId(newId);
      setView("room");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAddRoom();
    if (e.key === "Escape") {
      setIsAddingRoom(false);
      setNewRoomLabel("");
    }
  };

  const handleRoomSelect = (roomId: string) => {
    setActiveRoomId(roomId);
    setView("room");
  };

  // Responsive sizing
  const SZ = fillContainer ? "100%" : (isMobile ? "min(92vw, 85vh)" : "min(70vw, 70vh)");
  const sidebarWidth = isMobile ? 140 : 200;
  const fontSize = {
    label: isMobile ? 7 : 8,
    small: isMobile ? 9 : 10,
    body: isMobile ? 11 : 12,
    name: isMobile ? 10 : 12,
  };

  return (
    <div style={{ position: "relative", width: SZ, height: SZ, flexShrink: fillContainer ? 1 : 0, flex: fillContainer ? 1 : "none" }}>
      {/* Floating label */}
      <div
        style={{
          position: "absolute",
          top: -20,
          left: 0,
          display: "flex",
          alignItems: "center",
          gap: isMobile ? 6 : 8,
          flexWrap: "wrap",
        }}
      >
        <motion.div
          animate={{ background: accent }}
          transition={{ duration: 0.28 }}
          style={{ width: 6, height: 6, borderRadius: "50%" }}
        />
        <Lbl style={{ fontSize: fontSize.label }}>artefact</Lbl>
        <span style={{ fontSize: fontSize.small, color: C.t4 }}>
          {state.identity.name || "Untitled"}
        </span>

        {/* Mode toggle: Workspace | Page */}
        {!isMobile && (
          <div style={{
            display: "flex",
            marginLeft: 12,
            border: `1px solid ${C.sep}`,
            borderRadius: 6,
            overflow: "hidden"
          }}>
            {[
              { key: "workspace" as const, label: "Workspace" },
              { key: "page" as const, label: "Page" },
            ].map(({ key, label }) => (
              <motion.button
                key={key}
                onClick={() => setMode(key)}
                whileTap={{ scale: 0.95 }}
                style={{
                  padding: "4px 10px",
                  background: mode === key ? C.edge : "transparent",
                  color: mode === key ? C.t1 : C.t4,
                  fontSize: 9,
                  fontWeight: 500,
                  border: "none",
                  cursor: "pointer",
                  transition: "background 0.15s, color 0.15s",
                }}
              >
                {label}
              </motion.button>
            ))}
          </div>
        )}

        {/* Layout toggle (only in workspace mode) */}
        {!isMobile && mode === "workspace" && (
          <div style={{
            display: "flex",
            border: `1px solid ${C.sep}`,
            borderRadius: 6,
            overflow: "hidden"
          }}>
            {[
              { key: "list" as const, icon: "\u2630" },
              { key: "drill" as const, icon: "\u229E" },
            ].map(({ key, icon }) => (
              <motion.button
                key={key}
                onClick={() => setLayout(key)}
                whileTap={{ scale: 0.95 }}
                style={{
                  padding: "4px 8px",
                  background: layout === key ? C.edge : "transparent",
                  color: layout === key ? C.t1 : C.t4,
                  fontSize: 10,
                  border: "none",
                  cursor: "pointer",
                  transition: "background 0.15s, color 0.15s",
                }}
              >
                {icon}
              </motion.button>
            ))}
          </div>
        )}

        <Btn onClick={onCollapse} style={{ marginLeft: isMobile ? "auto" : 8, fontSize: isMobile ? 8 : 9 }}>
          &larr; {isMobile ? "back" : "collapse"}
        </Btn>
      </div>

      {/* Main card */}
      <motion.div
        animate={{
          borderColor: accent + "22",
          background: C.sep,
        }}
        transition={{ duration: 0.28 }}
        style={{
          width: "100%",
          height: "100%",
          border: `1px solid ${theme.isDark ? accent + "22" : C.edge}`,
          borderRadius: isMobile ? 14 : 18,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          position: "relative",
          boxShadow: theme.isDark
            ? `0 0 0 1px ${accent}11, 0 8px 40px rgba(0,0,0,0.5)`
            : `0 4px 24px rgba(0,0,0,0.08)`,
        }}
      >
        {/* Accent top bar */}
        <motion.div
          animate={{ background: accent }}
          transition={{ duration: 0.28 }}
          style={{ height: isMobile ? 2 : 3, flexShrink: 0, width: "100%" }}
        />

        {/* Content area */}
        <AnimatePresence mode="wait">
        {mode === "page" ? (
        /* ══════════════════════════════════════════════════════════════════════════════
           PAGE MODE - Full page preview
           ══════════════════════════════════════════════════════════════════════════════ */
        <motion.div
          key="page-mode"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={FADE}
          style={{
            flex: 1,
            overflow: "auto",
            background: C.void,
          }}
        >
          <PageComposer
            rooms={state.rooms.map((room) => ({
              id: room.id,
              label: room.label,
              type: room.key || "custom",
              blocks: room.blocks.map((block) => ({
                id: block.id,
                type: block.blockType,
                label: block.caption || block.blockType,
              })),
            }))}
            getBlockContent={(blockId: string) => {
              for (const room of state.rooms) {
                const block = room.blocks.find((b) => b.id === blockId);
                if (block) {
                  return block.content || "";
                }
              }
              return "";
            }}
            accent={accent}
            activeRoomId={activeRoomId || state.rooms[0]?.id}
          />
        </motion.div>
        ) : layout === "list" ? (
        <motion.div
          key="list-layout"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={FADE}
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: `${sidebarWidth}px 1fr`,
            overflow: "hidden",
            minHeight: 0,
          }}
        >
          {/* Sidebar */}
          <div
            style={{
              borderRight: `1px solid ${C.void}66`,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              background: C.void,
            }}
          >
            {/* Identity section */}
            <motion.div
              onClick={readOnly ? undefined : () => setView("identity")}
              whileHover={readOnly ? undefined : { opacity: 0.85 }}
              style={{
                padding: isMobile ? "12px" : "16px",
                borderBottom: `1px solid ${C.sep}`,
                cursor: readOnly ? "default" : "pointer",
                background: view === "identity" ? C.sep : "transparent",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: isMobile ? 8 : 10,
                  marginBottom: isMobile ? 6 : 8,
                }}
              >
                <motion.div
                  animate={{ background: accent }}
                  transition={{ duration: 0.28 }}
                  style={{
                    width: isMobile ? 28 : 32,
                    height: isMobile ? 28 : 32,
                    borderRadius: isMobile ? 6 : 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: isMobile ? 9 : 10,
                      fontWeight: 700,
                      color: "rgba(0,0,0,0.5)",
                    }}
                  >
                    {state.identity.name
                      ? state.identity.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()
                      : "?"}
                  </span>
                </motion.div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: fontSize.name,
                      fontWeight: 600,
                      color: C.t1,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {state.identity.name || "Your name"}
                  </div>
                  <div
                    style={{
                      fontSize: fontSize.small,
                      color: C.t3,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {state.identity.title || "Your title"}
                  </div>
                </div>
              </div>
              <Lbl style={{ fontSize: fontSize.label, color: C.t4 }}>identity</Lbl>
            </motion.div>

            {/* Rooms list */}
            <div
              style={{
                flex: 1,
                overflow: "auto",
                padding: isMobile ? "8px 0" : "12px 0",
              }}
            >
              <div
                style={{
                  padding: isMobile ? "0 12px 6px" : "0 16px 8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Lbl style={{ fontSize: fontSize.label }}>rooms</Lbl>
                <span
                  style={{
                    fontSize: fontSize.small - 1,
                    color: C.t4,
                    fontFamily: "'DM Mono', monospace",
                  }}
                >
                  {state.rooms.length}
                </span>
              </div>

              {state.rooms.map((room) => {
                const isActive = room.id === activeRoomId && view === "room";
                const hasBlocks = room.blocks.length > 0;

                return (
                  <motion.div
                    key={room.id}
                    onClick={() => handleRoomSelect(room.id)}
                    whileHover={{ background: C.bg }}
                    animate={{
                      background: isActive ? C.bg : "transparent",
                    }}
                    style={{
                      padding: isMobile ? "6px 12px" : "8px 16px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 6,
                      borderLeft: isActive
                        ? `2px solid ${accent}`
                        : "2px solid transparent",
                    }}
                  >
                    <span
                      style={{
                        fontSize: fontSize.body,
                        fontWeight: isActive ? 500 : 400,
                        color: isActive ? C.t1 : C.t2,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {room.label}
                    </span>
                    {hasBlocks && (
                      <span
                        style={{
                          fontSize: isMobile ? 8 : 9,
                          color: C.green,
                          background: C.green + "22",
                          padding: isMobile ? "1px 4px" : "2px 6px",
                          borderRadius: 4,
                        }}
                      >
                        {room.blocks.length}
                      </span>
                    )}
                  </motion.div>
                );
              })}

              {/* Add room - only when editable */}
              {!readOnly && (
                <div style={{ padding: isMobile ? "6px 12px" : "8px 16px" }}>
                  {isAddingRoom ? (
                    <div style={{ display: "flex", gap: 4 }}>
                      <input
                        type="text"
                        value={newRoomLabel}
                        onChange={(e) => setNewRoomLabel(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Room name"
                        autoFocus
                        style={{
                          flex: 1,
                          background: "transparent",
                          border: `1px solid ${C.sep}`,
                          borderRadius: 4,
                          padding: isMobile ? "4px 8px" : "6px 10px",
                          fontSize: fontSize.body,
                          color: C.t1,
                          outline: "none",
                          minWidth: 0,
                        }}
                      />
                      <Btn onClick={handleAddRoom} style={{ color: C.green, fontSize: fontSize.body }}>
                        +
                      </Btn>
                    </div>
                  ) : (
                    <Btn
                      onClick={() => setIsAddingRoom(true)}
                      style={{ color: C.t3, fontSize: fontSize.small }}
                    >
                      + add
                    </Btn>
                  )}
                </div>
              )}

              {/* Ingest section - mobile only, hide when readOnly */}
              {!readOnly && isMobile && onIngestPull && (
                <motion.div
                  onClick={() => setView("ingest")}
                  whileHover={{ background: C.bg }}
                  animate={{ background: view === "ingest" ? C.bg : "transparent" }}
                  style={{
                    margin: "8px 12px",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: `1px dashed ${view === "ingest" ? accent : C.sep}`,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <Lbl style={{ fontSize: fontSize.label, marginBottom: 2, display: "block" }}>ingest</Lbl>
                    <span style={{ fontSize: fontSize.small, color: C.t4 }}>
                      {ingestBlocks.length > 0 ? `${ingestBlocks.length} sources` : "Import content"}
                    </span>
                  </div>
                  <span style={{ fontSize: 12, color: view === "ingest" ? accent : C.t4 }}>+</span>
                </motion.div>
              )}
            </div>

            {/* Color swatches + theme toggle - only when editable */}
            {!readOnly && (
              <div
                style={{
                  padding: isMobile ? "10px 12px" : "12px 16px",
                  borderTop: `1px solid ${C.sep}`,
                  display: "flex",
                  alignItems: "center",
                  gap: isMobile ? 4 : 6,
                }}
              >
                {theme.colors.map((col) => (
                  <motion.button
                    key={col.id}
                    onClick={() => onColorChange(col.id)}
                    animate={{
                      background: col.accent,
                      width: colorId === col.id ? (isMobile ? 14 : 16) : (isMobile ? 8 : 10),
                      height: colorId === col.id ? (isMobile ? 14 : 16) : (isMobile ? 8 : 10),
                      boxShadow:
                        colorId === col.id
                          ? `0 0 0 1.5px ${C.void}, 0 0 0 2.5px ${col.accent}`
                          : "none",
                    }}
                    transition={{ duration: 0.15 }}
                    style={{
                      borderRadius: "50%",
                      border: "none",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  />
                ))}

                {/* Theme toggle */}
                <motion.button
                  onClick={onToggleTheme}
                  whileHover={{ opacity: 0.7 }}
                  whileTap={{ scale: 0.9 }}
                  style={{
                    marginLeft: "auto",
                    width: isMobile ? 20 : 24,
                    height: isMobile ? 12 : 14,
                    borderRadius: 7,
                    background: C.sep,
                    border: `1px solid ${C.edge}`,
                    cursor: "pointer",
                    position: "relative",
                    flexShrink: 0,
                  }}
                >
                  <motion.div
                    animate={{ x: dark ? 2 : (isMobile ? 8 : 10) }}
                    transition={{ duration: 0.15 }}
                    style={{
                      position: "absolute",
                      top: isMobile ? 1.5 : 2,
                      width: isMobile ? 7 : 8,
                      height: isMobile ? 7 : 8,
                      borderRadius: "50%",
                      background: dark ? C.t3 : "#fbbf24",
                    }}
                  />
                </motion.button>
              </div>
            )}
          </div>

          {/* Main content area */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              background: C.void,
            }}
          >
            <AnimatePresence mode="wait">
              {view === "overview" && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={FADE}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: isMobile ? 12 : 16,
                    color: C.t3,
                    padding: isMobile ? 16 : 32,
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: isMobile ? 14 : 18, color: C.t1, fontWeight: 500 }}>
                    Welcome to your artefact
                  </div>
                  <div style={{ fontSize: fontSize.body, lineHeight: 1.6, maxWidth: 300 }}>
                    Click <strong>identity</strong> to add your details, or
                    select a <strong>room</strong> to start adding content.
                  </div>
                  <div
                    style={{
                      marginTop: isMobile ? 12 : 16,
                      display: "flex",
                      gap: 6,
                      flexWrap: "wrap",
                      justifyContent: "center",
                    }}
                  >
                    {state.rooms.slice(0, isMobile ? 3 : 4).map((room) => (
                      <motion.button
                        key={room.id}
                        onClick={() => handleRoomSelect(room.id)}
                        whileHover={{ opacity: 0.8 }}
                        whileTap={{ scale: 0.97 }}
                        style={{
                          padding: isMobile ? "6px 12px" : "8px 16px",
                          border: `1px solid ${C.sep}`,
                          borderRadius: 8,
                          background: "transparent",
                          color: C.t2,
                          fontSize: fontSize.body - 1,
                          cursor: "pointer",
                        }}
                      >
                        {room.label}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {view === "identity" && (
                <motion.div
                  key="identity"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={FADE}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                  }}
                >
                  <IdentityEditor
                    identity={state.identity}
                    updateIdentity={updateIdentity}
                    onBack={() => setView("overview")}
                    compact={isMobile}
                  />
                </motion.div>
              )}

              {view === "room" && activeRoom && (
                <motion.div
                  key={`room-${activeRoom.id}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={FADE}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                  }}
                >
                  <RoomView
                    room={activeRoom}
                    onBlocksChange={handleBlocksChange}
                    updateRoom={updateRoom}
                    removeRoom={removeRoom}
                    canDelete={state.rooms.length > 1}
                    onBack={() => setView("overview")}
                    compact={isMobile}
                    readOnly={readOnly}
                  />
                </motion.div>
              )}

              {view === "ingest" && onIngestBlocksChange && onIngestPull && (
                <motion.div
                  key="ingest"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={FADE}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                  }}
                >
                  <IngestContent
                    blocks={ingestBlocks}
                    onBlocksChange={onIngestBlocksChange}
                    onPull={onIngestPull}
                    compact={isMobile}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
        ) : (
        /* ══════════════════════════════════════════════════════════════════════════════
           DRILL LAYOUT
           ══════════════════════════════════════════════════════════════════════════════ */
        <motion.div
          key="drill-layout"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={FADE}
          style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: 0 }}
        >
          {/* Left column */}
          <div style={{ display: "flex", flexDirection: "column", borderRight: `1px solid ${C.void}66` }}>
            <DrillTile
              tag="identity"
              onClick={() => setDrillTarget("identity")}
              accent={accent}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <motion.div
                  animate={{ background: accent }}
                  style={{ width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(0,0,0,0.5)" }}>
                    {state.identity.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
                  </span>
                </motion.div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.t1 }}>{state.identity.name || "Your name"}</div>
                  <div style={{ fontSize: 11, color: C.t3 }}>{state.identity.title || "Your title"}</div>
                </div>
              </div>
            </DrillTile>

            <DrillTile
              tag="rooms"
              onClick={() => setDrillTarget("rooms")}
              accent={accent}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {state.rooms.slice(0, 3).map(room => (
                  <div key={room.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Dot status={room.blocks.length > 0 ? "in_progress" : "empty"} hideLabel />
                    <span style={{ fontSize: 12, color: C.t2 }}>{room.label}</span>
                  </div>
                ))}
                {state.rooms.length > 3 && (
                  <span style={{ fontSize: 10, color: C.t4 }}>+{state.rooms.length - 3} more</span>
                )}
              </div>
            </DrillTile>
          </div>

          {/* Right column */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <DrillTile
              tag="connect"
              onClick={() => setDrillTarget("connect")}
              accent={accent}
            >
              <div style={{ fontSize: 12, color: C.t3, lineHeight: 1.5 }}>
                Links and social profiles
              </div>
            </DrillTile>

            <DrillTile
              tag="preview"
              onClick={() => {}}
              accent={accent}
            >
              <div style={{ fontSize: 12, color: C.t3, lineHeight: 1.5 }}>
                See how your artefact looks
              </div>
            </DrillTile>
          </div>

          {/* Drill Overlay */}
          <AnimatePresence>
            {drillTarget && (
              <DrillOverlay
                drillKey={drillTarget}
                onBack={() => setDrillTarget(null)}
                accent={accent}
                identity={state.identity}
                rooms={state.rooms}
                onOpenRoom={(roomId: string) => {
                  setFsRoomId(roomId);
                  setDrillTarget(null);
                }}
                drillActiveL={drillActiveL}
                drillActiveR={drillActiveR}
                setDrillActiveL={setDrillActiveL}
                setDrillActiveR={setDrillActiveR}
              />
            )}
          </AnimatePresence>
        </motion.div>
        )}
        </AnimatePresence>
      </motion.div>

      {/* Fullscreen room editor */}
      <AnimatePresence>
        {fsRoom && (
          <RoomFullscreen
            room={fsRoom}
            accent={accent}
            onClose={() => setFsRoomId(null)}
            onBlocksChange={(blocks) => updateBlocks(fsRoom.id, blocks)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
