"use client";

import { useState, useRef, useMemo, useEffect, useCallback, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useC, useTheme } from "@/hooks/useC";
import { FADE } from "@/lib/motion";
import { Lbl } from "@/components/primitives/Lbl";
import { CompactCard, ExpandedArtefact } from "@/components/create/components";
import { useCardColors } from "@/components/create/hooks";
import { GuestArtefactCtx, type GuestArtefactContextValue } from "@/context/GuestArtefactContext";
import type { GuestArtefactState, StandaloneRoom, Identity } from "@/types/artefact";
import type { ArtefactState, LifecycleState } from "@/types/events";

// ── Types ─────────────────────────────────────────────────────────────────────

type WizardStep = {
  id: string;
  num: number;
  label: string;
};

type BlockLayout = "headline" | "body" | "metric" | "media" | "two-column" | "bullet";

type BlockTemplate = {
  id: string;
  type: string;
  label: string;
  prompt: string;
  required: boolean;
  layout: BlockLayout;
  slideOrder: number;
};

type RoomSemantic = "about" | "projects" | "metrics" | "timeline" | "custom";

type RoomTemplate = {
  id: string;
  label: string;
  type: RoomSemantic;
  shared: boolean;
  visibility: "public" | "community" | "private";
  blocks: BlockTemplate[];
};

type DirectoryConfig = {
  visibility: "public" | "community";
  cardFields: string[];
  sortFields: string[];
  searchFields: string[];
  filters: { industry: boolean; skills: boolean; stage: boolean };
};

type CommunityConfig = {
  theme: "auto" | "light" | "warm" | "dark";
  textSize: "S" | "M" | "L";
  density: "list" | "compact";
  rooms: RoomTemplate[];
  directory: DirectoryConfig;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const WIZARD_STEPS: WizardStep[] = [
  { id: "welcome", num: 1, label: "Welcome" },
  { id: "appearance", num: 2, label: "Appearance" },
  { id: "rooms", num: 3, label: "Rooms" },
  { id: "directory", num: 4, label: "Directory" },
  { id: "launch", num: 5, label: "Launch" },
];

const ROOM_TYPES: { id: RoomSemantic; label: string }[] = [
  { id: "about", label: "Profile" },
  { id: "projects", label: "Project" },
  { id: "metrics", label: "Metrics" },
  { id: "timeline", label: "Timeline" },
  { id: "custom", label: "Custom" },
];

const BLOCK_TYPES = [
  { id: "text", label: "Text" },
  { id: "metric", label: "Metric" },
  { id: "image", label: "Image" },
  { id: "embed", label: "Embed" },
  { id: "document", label: "Document" },
  { id: "link", label: "Link" },
];

const DEFAULT_COMMUNITY_ROOMS: RoomTemplate[] = [
  {
    id: "identity", label: "Identity", type: "about",
    shared: false, visibility: "public",
    blocks: [
      { id: "name", type: "text", label: "Name", prompt: "Your full name", required: true, layout: "headline", slideOrder: 0 },
      { id: "bio", type: "text", label: "Bio", prompt: "Short bio", required: true, layout: "body", slideOrder: 1 },
      { id: "photo", type: "image", label: "Photo", prompt: "Profile photo", required: false, layout: "media", slideOrder: 2 },
    ]
  },
  {
    id: "startup", label: "Startup", type: "projects",
    shared: true, visibility: "community",
    blocks: [
      { id: "startup_name", type: "text", label: "Startup Name", prompt: "Company name", required: true, layout: "headline", slideOrder: 0 },
      { id: "one_liner", type: "text", label: "One-liner", prompt: "What you do in one sentence", required: true, layout: "body", slideOrder: 1 },
      { id: "stage", type: "text", label: "Stage", prompt: "Idea, MVP, Growth, etc.", required: true, layout: "metric", slideOrder: 2 },
    ]
  },
  {
    id: "pitch", label: "Pitch", type: "custom",
    shared: true, visibility: "public",
    blocks: [
      { id: "problem", type: "text", label: "Problem", prompt: "The problem you solve", required: true, layout: "headline", slideOrder: 1 },
      { id: "solution", type: "text", label: "Solution", prompt: "Your solution", required: true, layout: "body", slideOrder: 2 },
      { id: "market", type: "text", label: "Market", prompt: "Market size and opportunity", required: true, layout: "body", slideOrder: 3 },
      { id: "product", type: "embed", label: "Product Demo", prompt: "Loom or video demo", required: false, layout: "media", slideOrder: 4 },
      { id: "traction", type: "metric", label: "Traction", prompt: "Key metrics", required: true, layout: "metric", slideOrder: 5 },
      { id: "ask", type: "text", label: "Ask", prompt: "What you're raising", required: false, layout: "headline", slideOrder: 6 },
    ]
  },
  {
    id: "traction", label: "Traction", type: "metrics",
    shared: true, visibility: "private",
    blocks: [
      { id: "mrr", type: "metric", label: "MRR", prompt: "Monthly recurring revenue", required: false, layout: "metric", slideOrder: 1 },
      { id: "users", type: "metric", label: "Users", prompt: "Active users", required: false, layout: "metric", slideOrder: 2 },
      { id: "growth", type: "metric", label: "Growth Rate", prompt: "Month-over-month %", required: false, layout: "metric", slideOrder: 3 },
    ]
  },
  {
    id: "documents", label: "Documents", type: "custom",
    shared: true, visibility: "community",
    blocks: [
      { id: "deck", type: "document", label: "Pitch Deck", prompt: "Upload your deck", required: false, layout: "media", slideOrder: 0 },
      { id: "one_pager", type: "document", label: "One Pager", prompt: "Company one-pager", required: false, layout: "media", slideOrder: 1 },
    ]
  }
];

const MAX_ROOMS = 8;
const MAX_BLOCKS_PER_ROOM = 12;

const DEFAULT_CONFIG: CommunityConfig = {
  theme: "light",
  textSize: "M",
  density: "list",
  rooms: DEFAULT_COMMUNITY_ROOMS,
  directory: {
    visibility: "community",
    cardFields: ["name", "startup_name", "stage"],
    sortFields: ["name", "stage"],
    searchFields: ["name", "startup_name"],
    filters: { industry: true, skills: true, stage: true },
  },
};

// ── Sample Member Data (for preview) ──────────────────────────────────────────

const SAMPLE_MEMBER = {
  // Identity
  name: "Kwame Mensah",
  bio: "Founder building AI infrastructure for communities.",
  title: "Founder & CEO",
  location: "San Francisco",

  // Startup
  startup_name: "Artefact Labs",
  one_liner: "Infrastructure for founder communities.",
  stage: "Seed",

  // Pitch
  problem: "Accelerators track founders in spreadsheets.",
  solution: "Structured artefacts for portfolio management.",
  market: "$4B founder community tools market.",
  traction: "127 active communities",
  ask: "Raising $2M seed",

  // Metrics
  mrr: "$24K",
  users: "1,240",
  growth: "18%",

  // Documents
  deck: "pitch-deck.pdf",
  one_pager: "one-pager.pdf",
};

function getSampleContent(blockId: string, blockType: string): string {
  const idMap: Record<string, string> = {
    name: SAMPLE_MEMBER.name,
    bio: SAMPLE_MEMBER.bio,
    photo: "",
    startup_name: SAMPLE_MEMBER.startup_name,
    one_liner: SAMPLE_MEMBER.one_liner,
    stage: SAMPLE_MEMBER.stage,
    problem: SAMPLE_MEMBER.problem,
    solution: SAMPLE_MEMBER.solution,
    market: SAMPLE_MEMBER.market,
    traction: SAMPLE_MEMBER.traction,
    ask: SAMPLE_MEMBER.ask,
    mrr: SAMPLE_MEMBER.mrr,
    users: SAMPLE_MEMBER.users,
    growth: SAMPLE_MEMBER.growth,
    deck: SAMPLE_MEMBER.deck,
    one_pager: SAMPLE_MEMBER.one_pager,
    product: "",
  };

  if (idMap[blockId] !== undefined) return idMap[blockId];

  const typeMap: Record<string, string> = {
    text: "Sample content for this field.",
    metric: "$10K",
    image: "",
    document: "document.pdf",
    embed: "",
    link: "https://example.com",
  };

  return typeMap[blockType] || "Sample content";
}

// ── Ghost Typing Hook ─────────────────────────────────────────────────────────

type TypingState = {
  [blockId: string]: {
    target: string;
    displayed: string;
    isTyping: boolean;
  };
};

function useGhostTyping(rooms: RoomTemplate[]) {
  const [typingState, setTypingState] = useState<TypingState>({});
  const intervalsRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  // Build target content map from rooms
  const targetMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const room of rooms) {
      for (const block of room.blocks) {
        map[block.id] = getSampleContent(block.id, block.type);
      }
    }
    return map;
  }, [rooms]);

  // Detect changes and start typing animations
  useEffect(() => {
    const newState: TypingState = {};
    const blocksToAnimate: string[] = [];

    for (const [blockId, target] of Object.entries(targetMap)) {
      const existing = typingState[blockId];
      if (!existing) {
        // New block - start typing
        newState[blockId] = { target, displayed: "", isTyping: true };
        blocksToAnimate.push(blockId);
      } else if (existing.target !== target) {
        // Content changed - restart typing
        newState[blockId] = { target, displayed: "", isTyping: true };
        blocksToAnimate.push(blockId);
      } else {
        // Keep existing state
        newState[blockId] = existing;
      }
    }

    if (blocksToAnimate.length > 0) {
      setTypingState(newState);

      // Clear old intervals for these blocks
      for (const blockId of blocksToAnimate) {
        const existing = intervalsRef.current.get(blockId);
        if (existing) clearInterval(existing);
      }

      // Start staggered typing for new blocks
      blocksToAnimate.forEach((blockId, idx) => {
        const delay = idx * 150; // Stagger by 150ms
        setTimeout(() => {
          const target = targetMap[blockId];
          if (!target) return;

          let charIdx = 0;
          const interval = setInterval(() => {
            charIdx++;
            setTypingState((prev) => {
              const current = prev[blockId];
              if (!current) return prev;
              if (charIdx >= target.length) {
                clearInterval(interval);
                intervalsRef.current.delete(blockId);
                return {
                  ...prev,
                  [blockId]: { ...current, displayed: target, isTyping: false },
                };
              }
              return {
                ...prev,
                [blockId]: { ...current, displayed: target.slice(0, charIdx) },
              };
            });
          }, 25); // 25ms per character

          intervalsRef.current.set(blockId, interval);
        }, delay);
      });
    }

    // Cleanup intervals on unmount
    return () => {
      intervalsRef.current.forEach((interval) => clearInterval(interval));
    };
  }, [targetMap]); // eslint-disable-line react-hooks/exhaustive-deps

  // Get displayed content for a block
  const getDisplayedContent = useCallback(
    (blockId: string, fallback: string) => {
      const state = typingState[blockId];
      if (!state) return fallback;
      return state.displayed || (state.isTyping ? "" : fallback);
    },
    [typingState]
  );

  const isTyping = useCallback(
    (blockId: string) => typingState[blockId]?.isTyping ?? false,
    [typingState]
  );

  return { getDisplayedContent, isTyping };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  const C = useC();
  return (
    <motion.div
      onClick={() => onChange(!on)}
      animate={{ background: on ? "#4ade80" : C.edge }}
      transition={{ duration: 0.15 }}
      style={{
        width: 36,
        height: 20,
        borderRadius: 10,
        cursor: "pointer",
        position: "relative",
        flexShrink: 0,
      }}
    >
      <motion.div
        animate={{ x: on ? 18 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 40 }}
        style={{
          position: "absolute",
          top: 2,
          width: 16,
          height: 16,
          borderRadius: 8,
          background: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,.35)",
        }}
      />
    </motion.div>
  );
}

// ── Room Accordion ────────────────────────────────────────────────────────────

function RoomAccordion({
  room,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onRemove,
  onAddBlock,
  onUpdateBlock,
  onRemoveBlock,
}: {
  room: RoomTemplate;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (updates: Partial<RoomTemplate>) => void;
  onRemove: () => void;
  onAddBlock: () => void;
  onUpdateBlock: (blockId: string, updates: Partial<BlockTemplate>) => void;
  onRemoveBlock: (blockId: string) => void;
}) {
  const C = useC();
  const VIS_COLORS: Record<string, string> = { public: C.green, community: C.blue, private: C.amber };

  return (
    <div style={{ marginBottom: 4 }}>
      {/* Room Header */}
      <motion.div
        onClick={onToggleExpand}
        whileHover={{ background: C.edge }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 12px",
          border: `1px solid ${isExpanded ? C.t3 : C.sep}`,
          borderRadius: isExpanded ? "8px 8px 0 0" : 8,
          cursor: "pointer",
          background: isExpanded ? C.edge : "transparent",
          transition: "border-color 0.15s",
        }}
      >
        <span style={{ flex: 1, fontSize: 13, color: C.t1, fontWeight: 500 }}>{room.label}</span>
        {room.shared && (
          <span style={{ fontSize: 9, color: C.t4, fontFamily: "'DM Mono', monospace" }}>shared</span>
        )}
        <span
          style={{
            fontSize: 8,
            color: VIS_COLORS[room.visibility],
            fontFamily: "'DM Mono', monospace",
            textTransform: "uppercase",
          }}
        >
          {room.visibility}
        </span>
        <motion.span
          animate={{ rotate: isExpanded ? 180 : 0 }}
          style={{ fontSize: 10, color: C.t4 }}
        >
          ▼
        </motion.span>
      </motion.div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              overflow: "hidden",
              border: `1px solid ${C.sep}`,
              borderTop: "none",
              borderRadius: "0 0 8px 8px",
              background: C.bg,
            }}
          >
            <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Room Name */}
              <div>
                <Lbl style={{ display: "block", marginBottom: 6 }}>Room name</Lbl>
                <input
                  type="text"
                  value={room.label}
                  onChange={(e) => onUpdate({ label: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    border: `1px solid ${C.sep}`,
                    borderRadius: 6,
                    background: "transparent",
                    color: C.t1,
                    fontSize: 12,
                    fontFamily: "'DM Sans', sans-serif",
                    outline: "none",
                  }}
                />
              </div>

              {/* Room Type */}
              <div>
                <Lbl style={{ display: "block", marginBottom: 6 }}>Room type</Lbl>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {ROOM_TYPES.map((t) => (
                    <motion.button
                      key={t.id}
                      onClick={() => onUpdate({ type: t.id })}
                      animate={{
                        background: room.type === t.id ? C.edge : "transparent",
                        borderColor: room.type === t.id ? C.t3 : C.sep,
                      }}
                      style={{
                        padding: "5px 10px",
                        border: "1px solid",
                        borderRadius: 6,
                        fontSize: 11,
                        color: room.type === t.id ? C.t1 : C.t3,
                        cursor: "pointer",
                      }}
                    >
                      {t.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Shared + Visibility Row */}
              <div style={{ display: "flex", gap: 20 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Lbl>Shared room</Lbl>
                    <Toggle on={room.shared} onChange={(v) => onUpdate({ shared: v })} />
                  </div>
                  <div style={{ fontSize: 10, color: C.t4, marginTop: 4 }}>
                    Co-founders can edit
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <Lbl style={{ display: "block", marginBottom: 6 }}>Visibility</Lbl>
                  <div style={{ display: "flex", border: `1px solid ${C.sep}`, borderRadius: 6, overflow: "hidden" }}>
                    {(["public", "community", "private"] as const).map((v) => (
                      <motion.button
                        key={v}
                        onClick={() => onUpdate({ visibility: v })}
                        animate={{
                          background: room.visibility === v ? C.edge : "transparent",
                          color: room.visibility === v ? C.t1 : C.t4,
                        }}
                        style={{
                          flex: 1,
                          padding: "5px 8px",
                          fontSize: 9,
                          border: "none",
                          fontFamily: "'DM Mono', monospace",
                          cursor: "pointer",
                          textTransform: "uppercase",
                        }}
                      >
                        {v}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Blocks */}
              <div>
                <Lbl style={{ display: "block", marginBottom: 8 }}>
                  Blocks ({room.blocks.length}/{MAX_BLOCKS_PER_ROOM})
                </Lbl>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {room.blocks.map((block) => (
                    <div
                      key={block.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 10px",
                        border: `1px solid ${C.sep}`,
                        borderRadius: 6,
                        background: C.edge,
                      }}
                    >
                      <span style={{ flex: 1, fontSize: 11, color: C.t2 }}>{block.label}</span>
                      <span
                        className="mono"
                        style={{ fontSize: 8, color: C.t4, textTransform: "uppercase" }}
                      >
                        {block.type}
                      </span>
                      {block.required && (
                        <span style={{ fontSize: 8, color: C.amber, fontFamily: "'DM Mono', monospace" }}>
                          req
                        </span>
                      )}
                      <motion.button
                        onClick={() => onRemoveBlock(block.id)}
                        whileHover={{ opacity: 0.7 }}
                        style={{ fontSize: 12, color: C.t4, cursor: "pointer" }}
                      >
                        ×
                      </motion.button>
                    </div>
                  ))}
                  {room.blocks.length < MAX_BLOCKS_PER_ROOM && (
                    <motion.button
                      onClick={onAddBlock}
                      whileHover={{ borderColor: C.t3 }}
                      style={{
                        padding: "8px 12px",
                        border: `1px dashed ${C.sep}`,
                        borderRadius: 6,
                        fontSize: 11,
                        color: C.t3,
                        cursor: "pointer",
                        background: "transparent",
                        textAlign: "center",
                      }}
                    >
                      + Add block
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Remove Room */}
              <motion.button
                onClick={onRemove}
                whileHover={{ opacity: 0.7 }}
                style={{
                  alignSelf: "flex-start",
                  padding: "6px 12px",
                  border: `1px solid ${C.sep}`,
                  borderRadius: 6,
                  fontSize: 10,
                  color: C.t4,
                  cursor: "pointer",
                  background: "transparent",
                }}
              >
                Remove room
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Mock Context Provider for Preview ─────────────────────────────────────────

function MockGuestArtefactProvider({
  children,
  rooms,
  identity,
  focusedRoomId,
}: {
  children: ReactNode;
  rooms: StandaloneRoom[];
  identity: Identity;
  focusedRoomId?: string | null;
}) {
  const [activeRoomId, setActiveRoomId] = useState<string | null>(rooms[0]?.id || null);

  // Sync with focused room from parent
  useEffect(() => {
    if (focusedRoomId !== undefined) {
      setActiveRoomId(focusedRoomId || rooms[0]?.id || null);
    }
  }, [focusedRoomId, rooms]);

  const state: GuestArtefactState = useMemo(
    () => ({
      sessionId: "preview",
      createdAt: "2024-01-01T00:00:00.000Z",
      identity,
      rooms,
    }),
    [identity, rooms]
  );

  const artefactState: ArtefactState = useMemo(
    () => ({
      id: "preview",
      sessionId: "preview",
      ownerId: null,
      slug: null,
      lifecycleState: "draft" as const,
      identity,
      rooms,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
      version: 0,
    }),
    [identity, rooms]
  );

  const value: GuestArtefactContextValue = useMemo(
    () => ({
      state,
      isLoaded: true,
      activeRoomId,
      setActiveRoomId,
      artefactState,
      events: [],
      version: 0,
      lifecycleState: "draft" as const,
      updateIdentity: () => {},
      updateRoom: () => {},
      addRoom: () => "",
      removeRoom: () => {},
      reorderRooms: () => {},
      updateBlocks: () => {},
      addBlock: () => {},
      removeBlock: () => {},
      claim: () => {},
      publish: () => {},
      archive: () => {},
      getActiveRoom: () => rooms.find((r) => r.id === activeRoomId),
      getRoomBlockCount: () => rooms.reduce((acc, r) => acc + r.blocks.length, 0),
      clearState: () => {},
    }),
    [state, activeRoomId, artefactState, rooms]
  );

  return <GuestArtefactCtx.Provider value={value}>{children}</GuestArtefactCtx.Provider>;
}

// ── Artefact Preview using ExpandedArtefact ───────────────────────────────────

function ArtefactPreviewInner({
  accent,
  cardBg,
  colorId,
  onColorChange,
  theme,
  dark,
  onToggleTheme,
  autoShowRoom,
  fullscreen,
}: {
  accent: string;
  cardBg: string;
  colorId: string;
  onColorChange: (id: string) => void;
  theme: ReturnType<typeof useCardColors>;
  dark: boolean;
  onToggleTheme: () => void;
  autoShowRoom?: boolean;
  fullscreen?: boolean;
}) {
  return (
    <div style={fullscreen ? { width: "100%", height: "100%", display: "flex", flexDirection: "column" } : { transform: "scale(0.65)", transformOrigin: "center center" }}>
      <ExpandedArtefact
        accent={accent}
        cardBg={cardBg}
        colorId={colorId}
        onColorChange={onColorChange}
        onCollapse={() => {}}
        theme={theme}
        dark={dark}
        onToggleTheme={onToggleTheme}
        autoShowRoom={autoShowRoom}
        fillContainer={fullscreen}
      />
    </div>
  );
}

function ArtefactPreview({
  config,
  showExpanded = false,
  focusedRoomId,
  fullscreen = false,
}: {
  config: CommunityConfig;
  showExpanded?: boolean;
  focusedRoomId?: string | null;
  fullscreen?: boolean;
}) {
  const C = useC();
  const { dark, toggle: toggleTheme } = useTheme();
  const theme = useCardColors(C);
  const [colorId, setColorId] = useState(theme.isDark ? "indigo" : "magenta");

  const colorExists = theme.colors.some((c) => c.id === colorId);
  const effectiveColorId = colorExists ? colorId : theme.isDark ? "indigo" : "magenta";
  const cc = theme.colors.find((c) => c.id === effectiveColorId) || theme.colors[0];

  // Ghost typing effect
  const { getDisplayedContent } = useGhostTyping(config.rooms);

  // Convert RoomTemplate[] to StandaloneRoom[] for preview with sample content
  const mockRooms: StandaloneRoom[] = useMemo(() => {
    return config.rooms.map((room, idx) => ({
      id: room.id,
      key: room.id,
      label: room.label,
      prompt: "",
      visibility: room.visibility === "public" ? ("public" as const) : ("private" as const),
      orderIndex: idx,
      blocks: room.blocks.map((block, bIdx) => {
        const sampleContent = getSampleContent(block.id, block.type);
        const displayedContent = getDisplayedContent(block.id, sampleContent);
        return {
          id: block.id,
          blockType: (block.type === "text" || block.type === "image" || block.type === "link" ||
                     block.type === "embed" || block.type === "document" || block.type === "metric"
                     ? block.type : "text") as "text" | "image" | "link" | "embed" | "document" | "metric",
          content: displayedContent,
          orderIndex: bIdx,
        };
      }),
    }));
  }, [config.rooms, getDisplayedContent]);

  // Sample member identity
  const mockIdentity: Identity = useMemo(
    () => ({
      name: SAMPLE_MEMBER.name,
      title: SAMPLE_MEMBER.title,
      bio: SAMPLE_MEMBER.bio,
      location: SAMPLE_MEMBER.location,
      skills: ["Product", "Engineering"],
      links: [],
    }),
    []
  );

  if (showExpanded) {
    return (
      <MockGuestArtefactProvider rooms={mockRooms} identity={mockIdentity} focusedRoomId={focusedRoomId}>
        <ArtefactPreviewInner
          accent={cc.accent}
          cardBg={cc.card}
          colorId={colorId}
          onColorChange={setColorId}
          theme={theme}
          dark={dark}
          onToggleTheme={toggleTheme}
          autoShowRoom={!!focusedRoomId}
          fullscreen={fullscreen}
        />
      </MockGuestArtefactProvider>
    );
  }

  return (
    <CompactCard
      identity={mockIdentity}
      rooms={mockRooms}
      accent={cc.accent}
      cardBg={cc.card}
      onExpand={() => {}}
      onShowOutputs={() => {}}
      colorId={colorId}
      onColorChange={setColorId}
      theme={theme}
      dark={dark}
      onToggleTheme={toggleTheme}
    />
  );
}

// ── Main Wizard Component ─────────────────────────────────────────────────────

export function CommunityCreateWizard() {
  const C = useC();
  const { dark, toggle: toggleTheme } = useTheme();

  const [wizStep, setWizStep] = useState(0);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [launched, setLaunched] = useState(false);
  const [started, setStarted] = useState(false);
  const [logo, setLogo] = useState<string | null>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const [config, setConfig] = useState<CommunityConfig>(DEFAULT_CONFIG);
  const [expandedRoomId, setExpandedRoomId] = useState<string | null>(null);

  const upd = (path: string, val: unknown) => {
    setConfig((prev) => {
      const next = JSON.parse(JSON.stringify(prev)) as CommunityConfig;
      const parts = path.split(".");
      let obj: Record<string, unknown> = next;
      for (let i = 0; i < parts.length - 1; i++) {
        obj = obj[parts[i]] as Record<string, unknown>;
      }
      obj[parts[parts.length - 1]] = val;
      return next;
    });
  };

  // ── Room Management ──────────────────────────────────────────────────────────

  const updateRoom = (roomId: string, updates: Partial<RoomTemplate>) => {
    setConfig((prev) => ({
      ...prev,
      rooms: prev.rooms.map((r) => (r.id === roomId ? { ...r, ...updates } : r)),
    }));
  };

  const addRoom = () => {
    if (config.rooms.length >= MAX_ROOMS) return;
    const newRoom: RoomTemplate = {
      id: `room_${Date.now()}`,
      label: "New Room",
      type: "custom",
      shared: false,
      visibility: "community",
      blocks: [],
    };
    setConfig((prev) => ({ ...prev, rooms: [...prev.rooms, newRoom] }));
    setExpandedRoomId(newRoom.id);
  };

  const removeRoom = (roomId: string) => {
    setConfig((prev) => ({
      ...prev,
      rooms: prev.rooms.filter((r) => r.id !== roomId),
    }));
    if (expandedRoomId === roomId) setExpandedRoomId(null);
  };

  const addBlock = (roomId: string) => {
    const room = config.rooms.find((r) => r.id === roomId);
    if (!room || room.blocks.length >= MAX_BLOCKS_PER_ROOM) return;
    const newBlock: BlockTemplate = {
      id: `block_${Date.now()}`,
      type: "text",
      label: "New Block",
      prompt: "Enter content",
      required: false,
      layout: "body",
      slideOrder: room.blocks.length,
    };
    updateRoom(roomId, { blocks: [...room.blocks, newBlock] });
  };

  const updateBlock = (roomId: string, blockId: string, updates: Partial<BlockTemplate>) => {
    const room = config.rooms.find((r) => r.id === roomId);
    if (!room) return;
    updateRoom(roomId, {
      blocks: room.blocks.map((b) => (b.id === blockId ? { ...b, ...updates } : b)),
    });
  };

  const removeBlock = (roomId: string, blockId: string) => {
    const room = config.rooms.find((r) => r.id === roomId);
    if (!room) return;
    updateRoom(roomId, { blocks: room.blocks.filter((b) => b.id !== blockId) });
  };

  // ── Navigation ───────────────────────────────────────────────────────────────

  const advance = () => {
    if (wizStep === 0 && !started) {
      setDone((d) => new Set([...d, WIZARD_STEPS[0].id]));
      setStarted(true);
      setWizStep(1);
      return;
    }
    setDone((d) => new Set([...d, WIZARD_STEPS[wizStep].id]));
    if (wizStep < WIZARD_STEPS.length - 1) {
      setWizStep((w) => w + 1);
    } else {
      setLaunched(true);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setLogo(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // ── Launched State ──────────────────────────────────────────────────────────

  if (launched) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={FADE}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          gap: 20,
          textAlign: "center",
          padding: 40,
        }}
      >
        <div style={{ fontSize: 36, color: C.green }}>✓</div>
        <div style={{ fontSize: 20, fontWeight: 600, color: C.t1, letterSpacing: "-.025em" }}>
          Community workspace ready.
        </div>
        <div style={{ fontSize: 13, color: C.t3, maxWidth: 360, lineHeight: 1.7 }}>
          Members will receive artefacts structured exactly as you configured. Start inviting
          founders to join your community.
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <motion.button
            whileHover={{ opacity: 0.8 }}
            whileTap={{ scale: 0.97 }}
            style={{
              padding: "9px 20px",
              border: `1px solid ${C.t2}`,
              borderRadius: 8,
              background: "transparent",
              color: C.t1,
              fontSize: 11,
              fontFamily: "'DM Mono', monospace",
              letterSpacing: ".04em",
              cursor: "pointer",
            }}
          >
            Invite members
          </motion.button>
          <motion.button
            whileHover={{ opacity: 0.8 }}
            whileTap={{ scale: 0.97 }}
            style={{
              padding: "9px 20px",
              border: `1px solid ${C.sep}`,
              borderRadius: 8,
              background: "transparent",
              color: C.t3,
              fontSize: 11,
              fontFamily: "'DM Mono', monospace",
              letterSpacing: ".04em",
              cursor: "pointer",
            }}
          >
            Open dashboard
          </motion.button>
        </div>
      </motion.div>
    );
  }

  // ── Main Render ─────────────────────────────────────────────────────────────

  return (
    <div style={{ flex: 1, overflow: "hidden", position: "relative", minHeight: 0 }}>
      {/* PHASE 1: Fullscreen welcome */}
      <motion.div
        key="welcome-phase"
        animate={{
          opacity: started ? 0 : 1,
          x: started ? -60 : 0,
          pointerEvents: started ? "none" : "auto",
        }}
        transition={{ duration: 0.38, ease: [0.4, 0, 0.2, 1] }}
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          overflow: "auto",
          padding: "80px 24px 120px",
          willChange: "transform, opacity",
        }}
      >
        <div style={{ width: "100%", maxWidth: 480 }}>
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 22, fontWeight: 600, color: C.t1, letterSpacing: "-.025em" }}>
              Create your community
            </div>
          </div>

          {WIZARD_STEPS.map((s, idx) => {
            const isCurrent = idx === 0;
            return (
              <div key={s.id}>
                <div style={{ height: 1, background: C.sep }} />
                <div
                  style={{
                    display: "flex",
                    gap: 16,
                    padding: "18px 0",
                    opacity: isCurrent ? 1 : 0.32,
                  }}
                >
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 13,
                      flexShrink: 0,
                      marginTop: 1,
                      background: isCurrent ? C.t1 : "transparent",
                      border: isCurrent ? "none" : `1px solid ${C.sep}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: isCurrent ? C.bg : C.t4,
                        fontFamily: "'DM Mono', monospace",
                      }}
                    >
                      {s.num}
                    </span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: isCurrent ? 600 : 400,
                        color: isCurrent ? C.t1 : C.t3,
                        marginBottom: isCurrent ? 12 : 0,
                      }}
                    >
                      {s.label}
                    </div>
                    {isCurrent && (
                      <div>
                        <div
                          style={{ fontSize: 12, color: C.t3, marginBottom: 14, lineHeight: 1.7 }}
                        >
                          Configure your community workspace - artefact structure, rooms, sharing
                          rules, and directory.
                        </div>
                        <input
                          ref={logoRef}
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={handleLogoUpload}
                        />
                        <motion.div
                          onClick={() => (logo ? setLogo(null) : logoRef.current?.click())}
                          whileHover={{ opacity: 0.8 }}
                          whileTap={{ scale: 0.97 }}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "8px 12px",
                            border: `1px solid ${logo ? C.t3 : C.sep}`,
                            borderRadius: 8,
                            cursor: "pointer",
                            marginBottom: 16,
                            transition: "border-color .2s",
                          }}
                        >
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 6,
                              background: logo ? "transparent" : C.edge,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                              overflow: "hidden",
                              border: `1px solid ${C.sep}`,
                            }}
                          >
                            {logo ? (
                              <img
                                src={logo}
                                alt="logo"
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                            ) : (
                              <span style={{ fontSize: 13, color: C.t4 }}>+</span>
                            )}
                          </div>
                          <div>
                            <div
                              style={{
                                fontSize: 12,
                                color: logo ? C.t1 : C.t3,
                                fontFamily: "'DM Sans', sans-serif",
                              }}
                            >
                              {logo ? "Logo uploaded" : "Upload community logo"}
                            </div>
                            <div
                              style={{
                                fontSize: 9,
                                color: C.t4,
                                marginTop: 1,
                                fontFamily: "'DM Mono', monospace",
                                letterSpacing: ".03em",
                              }}
                            >
                              {logo ? "click to remove" : "png, jpg, svg · optional"}
                            </div>
                          </div>
                          {logo && (
                            <span style={{ fontSize: 11, color: C.t4, marginLeft: 4 }}>×</span>
                          )}
                        </motion.div>
                        <div>
                          <motion.button
                            onClick={advance}
                            whileHover={{ opacity: 0.85 }}
                            whileTap={{ scale: 0.97 }}
                            style={{
                              padding: "10px 24px",
                              background: C.t1,
                              border: "none",
                              borderRadius: 9,
                              color: C.bg,
                              fontSize: 13,
                              fontFamily: "'DM Sans', sans-serif",
                              fontWeight: 500,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            Start setup <span style={{ fontSize: 14 }}>→</span>
                          </motion.button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div style={{ height: 1, background: C.sep }} />
        </div>
      </motion.div>

      {/* PHASE 2: Split layout */}
      <motion.div
        key="split-phase"
        animate={{
          opacity: started ? 1 : 0,
          x: started ? 0 : 60,
          pointerEvents: started ? "auto" : "none",
        }}
        transition={{ duration: 0.42, ease: [0.22, 0.1, 0.36, 1], delay: started ? 0.12 : 0 }}
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          overflow: "hidden",
          willChange: "transform, opacity",
        }}
      >
        {/* LEFT panel */}
        <motion.div
          animate={{ x: started ? 0 : -40, opacity: started ? 1 : 0 }}
          transition={{ duration: 0.44, ease: [0.22, 0.1, 0.36, 1], delay: started ? 0.18 : 0 }}
          style={{
            width: 440,
            flexShrink: 0,
            borderRight: `1px solid ${C.sep}`,
            overflow: "auto",
            padding: "36px 40px 80px",
          }}
        >
          <div style={{ marginBottom: 28 }}>
            <div
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: C.t1,
                letterSpacing: "-.025em",
                lineHeight: 1.2,
              }}
            >
              Create your community
            </div>
            <div style={{ fontSize: 12, color: C.t3, marginTop: 5, lineHeight: 1.6 }}>
              Configure your workspace.
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {WIZARD_STEPS.map((s, idx) => {
              const isDone = done.has(s.id);
              const isCurrent = wizStep === idx;
              const isPast = idx < wizStep;

              return (
                <div key={s.id}>
                  <motion.div
                    onClick={() => {
                      if (isPast || isDone) setWizStep(idx);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 0",
                      cursor: isPast || isDone ? "pointer" : "default",
                    }}
                  >
                    <motion.div
                      animate={{
                        background:
                          isDone || isPast ? C.t1 : isCurrent ? C.t1 : "transparent",
                        borderColor:
                          isDone || isPast ? C.t1 : isCurrent ? C.t1 : C.sep,
                      }}
                      transition={{ duration: 0.18 }}
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        border: "1.5px solid",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {isDone || isPast ? (
                        <span style={{ fontSize: 11, color: C.bg, fontWeight: 700, lineHeight: 1 }}>
                          ✓
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: 9,
                            color: isCurrent ? C.bg : C.t4,
                            fontFamily: "'DM Mono', monospace",
                            fontWeight: 600,
                          }}
                        >
                          {s.num}
                        </span>
                      )}
                    </motion.div>

                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: isCurrent ? 500 : 400,
                        color: isCurrent ? C.t1 : isDone || isPast ? C.t2 : C.t3,
                        transition: "color .15s",
                      }}
                    >
                      {s.label}
                    </span>
                  </motion.div>

                  <AnimatePresence>
                    {isCurrent && (
                      <motion.div
                        key="content"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.22, ease: [0.22, 0.1, 0.36, 1] }}
                        style={{ overflow: "hidden" }}
                      >
                        <div style={{ paddingLeft: 34, paddingBottom: 16 }}>
                          {/* Step content */}
                          {s.id === "welcome" && (
                            <div style={{ fontSize: 12, color: C.t3, lineHeight: 1.7 }}>
                              Setup complete - you can revisit any step above.
                            </div>
                          )}

                          {s.id === "appearance" && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div>
                                  <Lbl style={{ display: "block" }}>Dark mode</Lbl>
                                  <div style={{ fontSize: 10, color: C.t4, marginTop: 2 }}>
                                    {dark ? "Dark theme" : "Light theme"}
                                  </div>
                                </div>
                                <Toggle
                                  on={dark}
                                  onChange={() => toggleTheme()}
                                />
                              </div>
                              <div>
                                <Lbl style={{ display: "block", marginBottom: 8 }}>Text size</Lbl>
                                <div
                                  style={{
                                    display: "flex",
                                    border: `1px solid ${C.sep}`,
                                    borderRadius: 7,
                                    overflow: "hidden",
                                    width: "fit-content",
                                  }}
                                >
                                  {(["S", "M", "L"] as const).map((sz) => (
                                    <motion.button
                                      key={sz}
                                      onClick={() => upd("textSize", sz)}
                                      animate={{
                                        background: config.textSize === sz ? C.edge : "transparent",
                                        color: config.textSize === sz ? C.t1 : C.t3,
                                      }}
                                      style={{
                                        padding: "6px 16px",
                                        fontSize: 11,
                                        border: "none",
                                        fontFamily: "'DM Sans', sans-serif",
                                        cursor: "pointer",
                                      }}
                                    >
                                      {sz}
                                    </motion.button>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <Lbl style={{ display: "block", marginBottom: 8 }}>
                                  Layout density
                                </Lbl>
                                <div
                                  style={{
                                    display: "flex",
                                    border: `1px solid ${C.sep}`,
                                    borderRadius: 7,
                                    overflow: "hidden",
                                    width: "fit-content",
                                  }}
                                >
                                  {(["List", "Compact"] as const).map((d) => (
                                    <motion.button
                                      key={d}
                                      onClick={() => upd("density", d.toLowerCase())}
                                      animate={{
                                        background:
                                          config.density === d.toLowerCase()
                                            ? C.edge
                                            : "transparent",
                                        color:
                                          config.density === d.toLowerCase() ? C.t1 : C.t3,
                                      }}
                                      style={{
                                        padding: "6px 16px",
                                        fontSize: 11,
                                        border: "none",
                                        fontFamily: "'DM Sans', sans-serif",
                                        cursor: "pointer",
                                      }}
                                    >
                                      {d}
                                    </motion.button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {s.id === "rooms" && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                              <div style={{ fontSize: 11, color: C.t3, marginBottom: 12, lineHeight: 1.6 }}>
                                Define the structure of member artefacts. Click a room to configure.
                              </div>
                              {config.rooms.map((room) => (
                                <RoomAccordion
                                  key={room.id}
                                  room={room}
                                  isExpanded={expandedRoomId === room.id}
                                  onToggleExpand={() =>
                                    setExpandedRoomId(expandedRoomId === room.id ? null : room.id)
                                  }
                                  onUpdate={(updates) => updateRoom(room.id, updates)}
                                  onRemove={() => removeRoom(room.id)}
                                  onAddBlock={() => addBlock(room.id)}
                                  onUpdateBlock={(blockId, updates) =>
                                    updateBlock(room.id, blockId, updates)
                                  }
                                  onRemoveBlock={(blockId) => removeBlock(room.id, blockId)}
                                />
                              ))}
                              {config.rooms.length < MAX_ROOMS && (
                                <motion.button
                                  onClick={addRoom}
                                  whileHover={{ borderColor: C.t3 }}
                                  style={{
                                    marginTop: 8,
                                    padding: "10px 14px",
                                    border: `1px dashed ${C.sep}`,
                                    borderRadius: 8,
                                    fontSize: 12,
                                    color: C.t3,
                                    cursor: "pointer",
                                    background: "transparent",
                                    textAlign: "center",
                                  }}
                                >
                                  + Add room ({config.rooms.length}/{MAX_ROOMS})
                                </motion.button>
                              )}
                            </div>
                          )}

                          {s.id === "directory" && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                              <div>
                                <Lbl style={{ display: "block", marginBottom: 8 }}>
                                  Directory visibility
                                </Lbl>
                                <div
                                  style={{
                                    display: "flex",
                                    border: `1px solid ${C.sep}`,
                                    borderRadius: 7,
                                    overflow: "hidden",
                                    width: "fit-content",
                                  }}
                                >
                                  {(["public", "community"] as const).map((v) => (
                                    <motion.button
                                      key={v}
                                      onClick={() => upd("directory.visibility", v)}
                                      animate={{
                                        background:
                                          config.directory.visibility === v ? C.edge : "transparent",
                                        color: config.directory.visibility === v ? C.t1 : C.t3,
                                      }}
                                      style={{
                                        padding: "6px 14px",
                                        fontSize: 11,
                                        border: "none",
                                        fontFamily: "'DM Sans', sans-serif",
                                        cursor: "pointer",
                                        textTransform: "capitalize",
                                      }}
                                    >
                                      {v === "community" ? "Community only" : "Public"}
                                    </motion.button>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <Lbl style={{ display: "block", marginBottom: 8 }}>
                                  Filter options
                                </Lbl>
                                {(
                                  [
                                    ["industry", "Industry"],
                                    ["skills", "Skills"],
                                    ["stage", "Stage"],
                                  ] as const
                                ).map(([k, lbl]) => (
                                  <div
                                    key={k}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      padding: "7px 0",
                                      borderBottom: `1px solid ${C.sep}`,
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: 12,
                                        color: C.t2,
                                        fontFamily: "'DM Sans', sans-serif",
                                      }}
                                    >
                                      {lbl}
                                    </span>
                                    <Toggle
                                      on={config.directory.filters[k]}
                                      onChange={(v) => upd(`directory.filters.${k}`, v)}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {s.id === "launch" && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                              {[...done].map((id) => {
                                const st = WIZARD_STEPS.find((s) => s.id === id);
                                return st ? (
                                  <div
                                    key={id}
                                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                                  >
                                    <span style={{ color: C.t1, fontSize: 10 }}>✓</span>
                                    <span
                                      style={{
                                        fontSize: 11,
                                        color: C.t3,
                                        fontFamily: "'DM Sans', sans-serif",
                                      }}
                                    >
                                      {st.label}
                                    </span>
                                  </div>
                                ) : null;
                              })}
                              <div
                                style={{
                                  marginTop: 8,
                                  fontSize: 12,
                                  color: C.t2,
                                  lineHeight: 1.65,
                                }}
                              >
                                Your community workspace is ready. Members will receive artefacts
                                based on this structure.
                              </div>
                            </div>
                          )}

                          <motion.button
                            onClick={advance}
                            whileHover={{ opacity: 0.8 }}
                            whileTap={{ scale: 0.97 }}
                            style={{
                              marginTop: 16,
                              padding: "9px 22px",
                              border: `1px solid ${C.t2}`,
                              borderRadius: 8,
                              background: "transparent",
                              color: C.t1,
                              fontSize: 11,
                              fontFamily: "'DM Mono', monospace",
                              letterSpacing: ".04em",
                              cursor: "pointer",
                            }}
                          >
                            {s.id === "launch" ? "Launch community →" : "Continue →"}
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {idx < WIZARD_STEPS.length - 1 && (
                    <div
                      style={{
                        marginLeft: 10,
                        width: 1,
                        height: isCurrent ? 0 : 12,
                        background: C.sep,
                        transition: "height .2s",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* RIGHT panel - Artefact Preview using existing CompactCard */}
        <motion.div
          animate={{
            x: started ? 0 : 50,
            opacity: started ? 1 : 0,
          }}
          transition={{ duration: 0.44, ease: [0.22, 0.1, 0.36, 1], delay: started ? 0.22 : 0 }}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: wizStep === 2 && expandedRoomId ? "stretch" : "center",
            justifyContent: wizStep === 2 && expandedRoomId ? "stretch" : "center",
            background: C.bg,
            overflow: "hidden",
            position: "relative",
            transition: "align-items 0.28s ease, justify-content 0.28s ease",
          }}
        >
          <AnimatePresence>
            {!(wizStep === 2 && expandedRoomId) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.2 }}
                transition={{ duration: 0.3 }}
                style={{
                  position: "absolute",
                  width: 300,
                  height: 300,
                  borderRadius: "50%",
                  background: `radial-gradient(circle, ${C.blue}08 0%, transparent 70%)`,
                  pointerEvents: "none",
                }}
              />
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {wizStep === 2 && expandedRoomId ? (
              <motion.div
                key="fullscreen-preview"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.28, ease: [0.22, 0.1, 0.36, 1] }}
                style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, padding: 24 }}
              >
                <ArtefactPreview
                  config={config}
                  showExpanded={true}
                  focusedRoomId={expandedRoomId}
                  fullscreen={true}
                />
              </motion.div>
            ) : (
              <motion.div
                key="compact-preview"
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.28, ease: [0.22, 0.1, 0.36, 1] }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 16,
                  position: "relative",
                  zIndex: 1,
                }}
              >
                <motion.span
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.2 }}
                  className="mono"
                  style={{
                    fontSize: 8,
                    color: C.t4,
                    letterSpacing: ".08em",
                    textTransform: "uppercase",
                    marginBottom: 4,
                  }}
                >
                  member artefact preview
                </motion.span>

                <motion.div
                  key={JSON.stringify(config.rooms) + wizStep}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: [0.22, 0.1, 0.36, 1] }}
                >
                  <ArtefactPreview
                    config={config}
                    showExpanded={wizStep === 2}
                    focusedRoomId={null}
                  />
                </motion.div>

                <motion.span
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.2 }}
                  style={{ fontSize: 11, color: C.t4, lineHeight: 1.6 }}
                >
                  Updates live as you configure each step.
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
}
