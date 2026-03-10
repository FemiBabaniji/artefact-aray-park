"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useC, useTheme } from "@/hooks/useC";
import { FADE, SP } from "@/lib/motion";
import { useGuestArtefactContext } from "@/context/GuestArtefactContext";
import { BlockComposer } from "@/components/room/BlockComposer";
import { Lbl } from "@/components/primitives/Lbl";
import { Btn } from "@/components/primitives/Btn";
import type { Block } from "@/types/room";

// ── Color Palettes (matches preview.jsx) ──────────────────────────────────────

function useCardColors(C: ReturnType<typeof useC>) {
  const isDark = C.void === "#0b0b0f";

  // From preview.jsx Artefact component
  const colors = isDark
    ? [
        { id: "indigo", accent: C.blue, card: C.sep },
        { id: "emerald", accent: "#4ade80", card: C.sep },
        { id: "amber", accent: "#fbbf24", card: C.sep },
        { id: "rose", accent: "#fb7185", card: C.sep },
        { id: "sky", accent: "#38bdf8", card: C.sep },
        { id: "violet", accent: "#a78bfa", card: C.sep },
      ]
    : [
        { id: "magenta", accent: "#e040fb", card: "#2d1a38" },
        { id: "cobalt", accent: "#4f8ef7", card: "#111e3a" },
        { id: "emerald", accent: "#34d399", card: "#0d2620" },
        { id: "amber", accent: "#fbbf24", card: "#221a08" },
        { id: "rose", accent: "#fb7185", card: "#2a1020" },
        { id: "slate", accent: "#94a3b8", card: "#18202e" },
      ];

  return {
    isDark,
    colors,
    defaultColorId: isDark ? "indigo" : "magenta",
    // Outer accent bg always has dark text
    outerText: "rgba(0,0,0,0.50)",
    // Inner card always has white text (dark bg in both modes)
    innerTextPrimary: "#ffffff",
    innerTextSecondary: isDark ? C.t3 : "rgba(255,255,255,0.45)",
    cardShadow: (accent: string) =>
      isDark ? `0 8px 48px ${accent}33` : `0 8px 40px ${accent}44`,
  };
}

// ── Main Portal Component ─────────────────────────────────────────────────────

export function CreatePortal() {
  const C = useC();
  const { toggle: toggleTheme, dark } = useTheme();
  const { state, isLoaded } = useGuestArtefactContext();
  const [compact, setCompact] = useState(true);

  const theme = useCardColors(C);
  const [colorId, setColorId] = useState(theme.defaultColorId);

  // Reset color when theme changes (like preview.jsx)
  const prevIsDark = useRef(theme.isDark);
  useEffect(() => {
    if (prevIsDark.current !== theme.isDark) {
      setColorId(theme.isDark ? "indigo" : "magenta");
      prevIsDark.current = theme.isDark;
    }
  }, [theme.isDark]);

  const cc = theme.colors.find((c) => c.id === colorId) || theme.colors[0];

  if (!isLoaded) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: C.t3,
        }}
      >
        <motion.div
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Loading...
        </motion.div>
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        position: "relative",
        background: C.void,
      }}
    >
      {/* Welcome message when compact */}
      <AnimatePresence>
        {compact && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={FADE}
            style={{
              position: "absolute",
              top: 0,
              bottom: "50%",
              left: 0,
              right: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
              paddingBottom: 20,
            }}
          >
            <div
              style={{
                fontSize: 28,
                fontWeight: 600,
                color: C.t1,
                letterSpacing: "-.03em",
                lineHeight: 1.25,
                marginBottom: 8,
              }}
            >
              This is your artefact.
            </div>
            <div style={{ fontSize: 14, color: C.t3, lineHeight: 1.6 }}>
              Expand it to start building your profile.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
        <AnimatePresence mode="wait">
          {compact ? (
            <motion.div
              key="compact"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={SP}
            >
              <CompactCard
                identity={state.identity}
                rooms={state.rooms}
                accent={cc.accent}
                cardBg={cc.card}
                onExpand={() => setCompact(false)}
                colorId={colorId}
                onColorChange={setColorId}
                theme={theme}
                dark={dark}
                onToggleTheme={toggleTheme}
              />
            </motion.div>
          ) : (
            <motion.div
              key="expanded"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={SP}
            >
              <ExpandedArtefact
                accent={cc.accent}
                cardBg={cc.card}
                colorId={colorId}
                onColorChange={setColorId}
                onCollapse={() => setCompact(true)}
                theme={theme}
                dark={dark}
                onToggleTheme={toggleTheme}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Compact Card (Portal Entry) ───────────────────────────────────────────────

type CardTheme = {
  isDark: boolean;
  colors: Array<{ id: string; accent: string; card: string }>;
  outerText: string;
  innerTextPrimary: string;
  innerTextSecondary: string;
  cardShadow: (accent: string) => string;
};

type CompactCardProps = {
  identity: { name: string; title: string };
  rooms: Array<{ id: string; blocks: unknown[] }>;
  accent: string;
  cardBg: string;
  onExpand: () => void;
  colorId: string;
  onColorChange: (id: string) => void;
  theme: CardTheme;
  dark: boolean;
  onToggleTheme: () => void;
};

function CompactCard({
  identity,
  rooms,
  accent,
  cardBg,
  onExpand,
  colorId,
  onColorChange,
  theme,
  dark,
  onToggleTheme,
}: CompactCardProps) {
  const C = useC();
  const outerTextColor = theme.outerText;
  const innerTextPrimary = theme.innerTextPrimary;
  const innerTextSecondary = theme.innerTextSecondary;

  const roomsWithContent = rooms.filter((r) => r.blocks.length > 0).length;
  const initials = identity.name
    ? identity.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 14,
        flexShrink: 0,
      }}
    >
      {/* Card */}
      <motion.div
        animate={{ background: accent }}
        transition={{ duration: 0.28, ease: [0.22, 0.1, 0.36, 1] }}
        style={{
          width: 260,
          borderRadius: 22,
          overflow: "hidden",
          position: "relative",
          flexShrink: 0,
          boxShadow: theme.cardShadow(accent),
        }}
      >
        {/* Header strip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "13px 16px 10px",
          }}
        >
          <Lbl style={{ fontSize: 8, color: outerTextColor }}>artefact</Lbl>
          <motion.button
            onClick={onExpand}
            whileHover={{ opacity: 0.7 }}
            style={{
              fontSize: 9,
              fontFamily: "'DM Mono', monospace",
              color: outerTextColor,
              letterSpacing: ".04em",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            expand &rarr;
          </motion.button>
        </div>

        {/* Inner card */}
        <motion.div
          animate={{ background: cardBg }}
          transition={{ duration: 0.28 }}
          style={{
            margin: "0 12px 14px",
            borderRadius: 14,
            padding: "14px 16px 18px",
            position: "relative",
            minHeight: 160,
          }}
        >
          {/* Avatar square */}
          <motion.div
            animate={{ background: accent }}
            transition={{ duration: 0.28 }}
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "rgba(0,0,0,0.5)",
                fontFamily: "'DM Mono', monospace",
              }}
            >
              {initials}
            </span>
          </motion.div>

          {/* Name + title */}
          <div style={{ position: "absolute", bottom: 18, left: 16, right: 16 }}>
            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: innerTextPrimary,
                letterSpacing: "-.025em",
                lineHeight: 1.15,
                marginBottom: 4,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {identity.name || "Your name"}
            </div>
            <div
              style={{
                fontSize: 11,
                color: innerTextSecondary,
                fontWeight: 400,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
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
            padding: "8px 16px 14px",
          }}
        >
          <span
            style={{
              fontSize: 10,
              color: outerTextColor,
              fontFamily: "'DM Mono', monospace",
            }}
          >
            {roomsWithContent} of {rooms.length} rooms
          </span>
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: roomsWithContent > 0 ? "#4ade80" : C.t4,
            }}
          />
        </div>
      </motion.div>

      {/* Color swatches + theme toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        {theme.colors.map((col) => (
          <motion.button
            key={col.id}
            onClick={() => onColorChange(col.id)}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            animate={{
              background: col.accent,
              width: colorId === col.id ? 22 : 14,
              height: colorId === col.id ? 22 : 14,
              boxShadow:
                colorId === col.id
                  ? `0 0 0 2px ${C.void}, 0 0 0 3.5px ${col.accent}`
                  : "none",
            }}
            transition={{ duration: 0.18 }}
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
            marginLeft: 8,
            width: 28,
            height: 16,
            borderRadius: 8,
            background: C.sep,
            border: `1px solid ${C.edge}`,
            cursor: "pointer",
            position: "relative",
            flexShrink: 0,
          }}
        >
          <motion.div
            animate={{ x: dark ? 2 : 12 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "absolute",
              top: 2,
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: dark ? C.t3 : "#fbbf24",
            }}
          />
        </motion.button>
      </div>
    </div>
  );
}

// ── Expanded Artefact View ────────────────────────────────────────────────────

type ExpandedArtefactProps = {
  accent: string;
  cardBg: string;
  colorId: string;
  onColorChange: (id: string) => void;
  onCollapse: () => void;
  theme: CardTheme;
  dark: boolean;
  onToggleTheme: () => void;
};

function ExpandedArtefact({
  accent,
  cardBg,
  colorId,
  onColorChange,
  onCollapse,
  theme,
  dark,
  onToggleTheme,
}: ExpandedArtefactProps) {
  const C = useC();
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

  const [view, setView] = useState<"overview" | "identity" | "room">("overview");
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [newRoomLabel, setNewRoomLabel] = useState("");

  const activeRoom = state.rooms.find((r) => r.id === activeRoomId);

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

  const SZ = "min(70vw, 70vh)";

  return (
    <div style={{ position: "relative", width: SZ, height: SZ, flexShrink: 0 }}>
      {/* Floating label */}
      <div
        style={{
          position: "absolute",
          top: -20,
          left: 0,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <motion.div
          animate={{ background: accent }}
          transition={{ duration: 0.28 }}
          style={{ width: 6, height: 6, borderRadius: "50%" }}
        />
        <Lbl style={{ fontSize: 8 }}>artefact</Lbl>
        <span style={{ fontSize: 10, color: C.t4 }}>
          {state.identity.name || "Untitled"}
        </span>
        <Btn onClick={onCollapse} style={{ marginLeft: 8, fontSize: 9 }}>
          &larr; collapse
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
          borderRadius: 18,
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
          style={{ height: 3, flexShrink: 0, width: "100%" }}
        />

        {/* Content area */}
        <div
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: "200px 1fr",
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
              onClick={() => setView("identity")}
              whileHover={{ opacity: 0.85 }}
              style={{
                padding: "16px",
                borderBottom: `1px solid ${C.sep}`,
                cursor: "pointer",
                background: view === "identity" ? C.sep : "transparent",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 8,
                }}
              >
                <motion.div
                  animate={{ background: accent }}
                  transition={{ duration: 0.28 }}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
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
                      fontSize: 12,
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
                      fontSize: 10,
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
              <Lbl style={{ fontSize: 8, color: C.t4 }}>identity</Lbl>
            </motion.div>

            {/* Rooms list */}
            <div
              style={{
                flex: 1,
                overflow: "auto",
                padding: "12px 0",
              }}
            >
              <div
                style={{
                  padding: "0 16px 8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Lbl style={{ fontSize: 8 }}>rooms</Lbl>
                <span
                  style={{
                    fontSize: 9,
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
                    onClick={() => {
                      setActiveRoomId(room.id);
                      setView("room");
                    }}
                    whileHover={{ background: C.bg }}
                    animate={{
                      background: isActive ? C.bg : "transparent",
                    }}
                    style={{
                      padding: "8px 16px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                      borderLeft: isActive
                        ? `2px solid ${accent}`
                        : "2px solid transparent",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
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
                          fontSize: 9,
                          color: C.green,
                          background: C.green + "22",
                          padding: "2px 6px",
                          borderRadius: 4,
                        }}
                      >
                        {room.blocks.length}
                      </span>
                    )}
                  </motion.div>
                );
              })}

              {/* Add room */}
              <div style={{ padding: "8px 16px" }}>
                {isAddingRoom ? (
                  <div style={{ display: "flex", gap: 6 }}>
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
                        padding: "6px 10px",
                        fontSize: 12,
                        color: C.t1,
                        outline: "none",
                      }}
                    />
                    <Btn onClick={handleAddRoom} style={{ color: C.green }}>
                      +
                    </Btn>
                  </div>
                ) : (
                  <Btn
                    onClick={() => setIsAddingRoom(true)}
                    style={{ color: C.t3, fontSize: 10 }}
                  >
                    + add room
                  </Btn>
                )}
              </div>
            </div>

            {/* Color swatches + theme toggle */}
            <div
              style={{
                padding: "12px 16px",
                borderTop: `1px solid ${C.sep}`,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {theme.colors.map((col) => (
                <motion.button
                  key={col.id}
                  onClick={() => onColorChange(col.id)}
                  animate={{
                    background: col.accent,
                    width: colorId === col.id ? 16 : 10,
                    height: colorId === col.id ? 16 : 10,
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
                  width: 24,
                  height: 14,
                  borderRadius: 7,
                  background: C.sep,
                  border: `1px solid ${C.edge}`,
                  cursor: "pointer",
                  position: "relative",
                  flexShrink: 0,
                }}
              >
                <motion.div
                  animate={{ x: dark ? 2 : 10 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: "absolute",
                    top: 2,
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: dark ? C.t3 : "#fbbf24",
                  }}
                />
              </motion.button>
            </div>
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
                    gap: 16,
                    color: C.t3,
                    padding: 32,
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 18, color: C.t1, fontWeight: 500 }}>
                    Welcome to your artefact
                  </div>
                  <div style={{ fontSize: 12, lineHeight: 1.6, maxWidth: 300 }}>
                    Click <strong>identity</strong> to add your details, or
                    select a <strong>room</strong> to start adding content.
                  </div>
                  <div
                    style={{
                      marginTop: 16,
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                      justifyContent: "center",
                    }}
                  >
                    {state.rooms.slice(0, 4).map((room) => (
                      <motion.button
                        key={room.id}
                        onClick={() => {
                          setActiveRoomId(room.id);
                          setView("room");
                        }}
                        whileHover={{ opacity: 0.8 }}
                        whileTap={{ scale: 0.97 }}
                        style={{
                          padding: "8px 16px",
                          border: `1px solid ${C.sep}`,
                          borderRadius: 8,
                          background: "transparent",
                          color: C.t2,
                          fontSize: 11,
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
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── Identity Editor ───────────────────────────────────────────────────────────

type IdentityEditorProps = {
  identity: {
    name: string;
    title: string;
    bio: string;
    location: string;
  };
  updateIdentity: (updates: Partial<{ name: string; title: string; bio: string; location: string }>) => void;
  onBack: () => void;
};

function IdentityEditor({ identity, updateIdentity, onBack }: IdentityEditorProps) {
  const C = useC();

  const fields: {
    key: "name" | "title" | "location" | "bio";
    label: string;
    placeholder: string;
    multiline?: boolean;
  }[] = [
    { key: "name", label: "Name", placeholder: "Your name" },
    { key: "title", label: "Title", placeholder: "What you do" },
    { key: "location", label: "Location", placeholder: "Where you're based" },
    { key: "bio", label: "Bio", placeholder: "Brief bio...", multiline: true },
  ];

  return (
    <>
      <div
        style={{
          padding: "14px 20px",
          borderBottom: `1px solid ${C.sep}`,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Btn onClick={onBack} style={{ color: C.t3 }}>
          &larr;
        </Btn>
        <span style={{ fontSize: 14, fontWeight: 500, color: C.t1 }}>
          Identity
        </span>
      </div>
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
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
    </>
  );
}

// ── Room View ─────────────────────────────────────────────────────────────────

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
};

function RoomView({
  room,
  onBlocksChange,
  updateRoom,
  removeRoom,
  canDelete,
  onBack,
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

  return (
    <>
      <div
        style={{
          padding: "14px 20px",
          borderBottom: `1px solid ${C.sep}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Btn onClick={onBack} style={{ color: C.t3 }}>
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
                fontSize: 14,
                fontWeight: 500,
                color: C.t1,
                outline: "none",
              }}
            />
          ) : (
            <span
              onClick={() => setIsEditingLabel(true)}
              style={{
                fontSize: 14,
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
              {canDelete && (
                <div
                  onClick={() => {
                    removeRoom(room.id);
                    onBack();
                  }}
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

      {room.prompt && (
        <div
          style={{
            padding: "10px 20px",
            fontSize: 11,
            color: C.t4,
            borderBottom: `1px solid ${C.sep}`,
          }}
        >
          {room.prompt}
        </div>
      )}

      <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
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
