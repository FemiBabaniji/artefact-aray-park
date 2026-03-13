"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { useC } from "@/hooks/useC";
import { ConnectorPanel } from "@/components/create/connectors/ConnectorPanel";
import type { EngagementSnapshot, QueuedItem } from "@/components/create/connectors/types";

type Visibility = "consultant_only" | "client_view" | "client_edit";
type BlockType =
  | "decision"
  | "outcome"
  | "deliverable"
  | "status"
  | "milestone"
  | "note"
  | "metric"
  | "risk";
type RenderIntent = "portal" | "pitch" | "board" | "handover" | "demo";

type Block = {
  id: string;
  title: string;
  content: string;
  type: BlockType;
  vis: Visibility;
  featured: boolean;
  pinned: boolean;
  source: "manual" | "mcp" | "integration" | "imported";
  createdAt: string;
};

type Room = {
  id: string;
  name: string;
  vis: Visibility;
  desc: string;
  participate: RenderIntent[];
  blocks: Block[];
};

type RenderConfig = {
  label: string;
  rooms: string[];
  ft: boolean;
  masked: boolean;
  hint: string;
};

export type EngagementComposerArtefact = {
  name: string;
  clientName: string;
  consultantName: string;
  value: string;
  duration: string;
  practiceLabel: string;
  phase: string;
};

const ROOM_DATA: Room[] = [
  {
    id: "scope",
    name: "Scope",
    vis: "client_view",
    desc: "Objectives, timeline, and success criteria.",
    participate: ["portal", "pitch", "board", "handover", "demo"],
    blocks: [
      {
        id: "b1",
        title: "North-star objective",
        content: "Stabilize the growth system in 12 weeks and produce a board-ready operating model.",
        type: "status",
        vis: "client_view",
        featured: true,
        pinned: true,
        source: "manual",
        createdAt: "Mar 3",
      },
      {
        id: "b2",
        title: "Success criteria",
        content: "Target: reduce planning latency from 12 days to 4 days across growth and operations.",
        type: "metric",
        vis: "client_view",
        featured: false,
        pinned: false,
        source: "manual",
        createdAt: "Mar 3",
      },
    ],
  },
  {
    id: "discovery",
    name: "Discovery",
    vis: "consultant_only",
    desc: "Internal synthesis, interviews, and working notes.",
    participate: ["handover"],
    blocks: [
      {
        id: "b3",
        title: "Operating friction",
        content: "Leadership team is making channel decisions from four disconnected reporting sources.",
        type: "note",
        vis: "consultant_only",
        featured: false,
        pinned: false,
        source: "manual",
        createdAt: "Mar 4",
      },
    ],
  },
  {
    id: "decisions",
    name: "Decisions",
    vis: "client_view",
    desc: "Approved decisions, rationale, and ownership.",
    participate: ["portal", "pitch", "handover", "demo"],
    blocks: [
      {
        id: "b4",
        title: "Weekly operating cadence approved",
        content: "CEO and CMO approved a single weekly cadence with shared KPI review and one owner per dependency.",
        type: "decision",
        vis: "client_view",
        featured: true,
        pinned: false,
        source: "mcp",
        createdAt: "Mar 7",
      },
    ],
  },
  {
    id: "deliverables",
    name: "Deliverables",
    vis: "client_view",
    desc: "Structured outputs, documents, and implementation assets.",
    participate: ["portal", "handover", "demo"],
    blocks: [
      {
        id: "b5",
        title: "Growth operating model",
        content: "Draft operating model with role clarity, review cadence, and escalation rules.",
        type: "deliverable",
        vis: "client_view",
        featured: false,
        pinned: false,
        source: "manual",
        createdAt: "Mar 9",
      },
    ],
  },
  {
    id: "outcomes",
    name: "Outcomes",
    vis: "client_view",
    desc: "Impact, evidence, and measurable movement.",
    participate: ["portal", "pitch", "board", "handover", "demo"],
    blocks: [
      {
        id: "b6",
        title: "Planning cycle compressed",
        content: "The team compressed planning from 12 days to 5 days by consolidating approvals into one decision forum.",
        type: "outcome",
        vis: "client_view",
        featured: true,
        pinned: false,
        source: "mcp",
        createdAt: "Mar 11",
      },
    ],
  },
  {
    id: "meetings",
    name: "Meetings",
    vis: "client_edit",
    desc: "Meeting recaps, action items, and call-level state changes.",
    participate: ["portal", "pitch", "handover", "demo"],
    blocks: [
      {
        id: "b7",
        title: "Steering committee recap",
        content: "Client agreed to move regional budget ownership into the weekly steering committee.",
        type: "note",
        vis: "client_edit",
        featured: true,
        pinned: false,
        source: "mcp",
        createdAt: "Mar 12",
      },
    ],
  },
  {
    id: "risks",
    name: "Risks",
    vis: "consultant_only",
    desc: "Issues that need mitigation, escalation, or tighter ownership.",
    participate: ["board", "handover"],
    blocks: [
      {
        id: "b8",
        title: "Analytics migration dependency",
        content: "The analytics team may lag the warehouse migration by two weeks.",
        type: "risk",
        vis: "consultant_only",
        featured: false,
        pinned: false,
        source: "manual",
        createdAt: "Mar 10",
      },
    ],
  },
];

const INTENTS: Record<RenderIntent, RenderConfig> = {
  portal: {
    label: "Client Portal",
    rooms: ["scope", "decisions", "deliverables", "outcomes", "meetings"],
    ft: false,
    masked: false,
    hint: "Live trust layer during delivery.",
  },
  pitch: {
    label: "Pitch Deck",
    rooms: ["scope", "decisions", "outcomes", "meetings"],
    ft: true,
    masked: false,
    hint: "Featured proof for new business.",
  },
  board: {
    label: "Board Summary",
    rooms: ["scope", "outcomes", "risks"],
    ft: true,
    masked: false,
    hint: "Executive signal only.",
  },
  handover: {
    label: "Handover",
    rooms: ["scope", "discovery", "decisions", "deliverables", "outcomes", "meetings", "risks"],
    ft: false,
    masked: false,
    hint: "Chronological closeout view.",
  },
  demo: {
    label: "Demo",
    rooms: ["scope", "decisions", "outcomes", "meetings"],
    ft: true,
    masked: true,
    hint: "Masked sales render. Real structure, safe content.",
  },
};

function visLabel(vis: Visibility) {
  if (vis === "consultant_only") return "internal";
  if (vis === "client_edit") return "client edit";
  return "client view";
}

function maskText(text: string, clientName: string) {
  return text
    .replaceAll(clientName, "[Client Name]")
    .replace(/CEO|CMO/g, "[Executive]")
    .replace(/12 days|5 days|4 days/g, "[N] days");
}

function dotColor(C: ReturnType<typeof useC>, vis: Visibility) {
  if (vis === "client_edit") return C.green;
  if (vis === "client_view") return C.blue;
  return C.edge;
}

function RowButton({
  children,
  onClick,
  style,
}: {
  children: ReactNode;
  onClick?: () => void;
  style?: CSSProperties;
}) {
  const C = useC();

  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: "100%",
        textAlign: "left",
        padding: "12px 20px",
        borderTop: "none",
        borderLeft: "none",
        borderRight: "none",
        borderBottom: `1px solid ${C.sep}`,
        background: "transparent",
        color: "inherit",
        cursor: onClick ? "pointer" : "default",
        transition: "background 120ms ease",
        ...style,
      }}
      onMouseEnter={(event) => {
        if (!onClick) return;
        event.currentTarget.style.background = C.bg === C.void ? "rgba(0,0,0,0.025)" : "rgba(255,255,255,0.03)";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.background = "transparent";
      }}
    >
      {children}
    </button>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  const C = useC();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <div style={{ fontSize: 18, fontWeight: 500, letterSpacing: "-.02em", color: C.t1 }}>{value}</div>
      <div
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 9,
          letterSpacing: ".07em",
          textTransform: "uppercase",
          color: C.t4,
        }}
      >
        {label}
      </div>
    </div>
  );
}

function VisibilityDot({ vis }: { vis: Visibility }) {
  const C = useC();

  return (
    <span
      style={{
        width: 5,
        height: 5,
        borderRadius: "50%",
        flexShrink: 0,
        background: dotColor(C, vis),
      }}
    />
  );
}

export function EngagementComposer({
  artefact,
}: {
  artefact?: EngagementComposerArtefact;
}) {
  const C = useC();
  const currentArtefact: EngagementComposerArtefact = artefact ?? {
    name: "Northstar Growth Reset",
    clientName: "Northstar Health",
    consultantName: "Meridian Advisory",
    value: "$68,000",
    duration: "12 weeks",
    practiceLabel: "Strategy Sprint",
    phase: "active",
  };
  const [rooms, setRooms] = useState<Room[]>(ROOM_DATA);
  const [surface, setSurface] = useState<"artefact" | "render">("artefact");
  const [showConnectors, setShowConnectors] = useState(false);
  const [artefactView, setArtefactView] = useState<"artefact" | "room" | "block">("artefact");
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [renderTab, setRenderTab] = useState<RenderIntent>("portal");

  const visibleCount = useMemo(() => rooms.filter((room) => room.vis !== "consultant_only").length, [rooms]);
  const featuredCount = useMemo(
    () => rooms.reduce((count, room) => count + room.blocks.filter((block) => block.featured).length, 0),
    [rooms],
  );

  const toggleFeatured = (roomId: string, blockId: string) => {
    setRooms((current) =>
      current.map((room) => {
        if (room.id !== roomId) return room;
        const nextBlocks = room.blocks.map((block) => {
          if (block.id === blockId) return { ...block, featured: !block.featured };
          return { ...block, featured: false };
        });
        return { ...room, blocks: nextBlocks };
      }),
    );
  };

  const updateBlock = (roomId: string, blockId: string, updater: (block: Block) => Block) => {
    setRooms((current) =>
      current.map((room) =>
        room.id === roomId
          ? { ...room, blocks: room.blocks.map((block) => (block.id === blockId ? updater(block) : block)) }
          : room,
      ),
    );
  };

  const renderedSections = useMemo(() => {
    const intent = INTENTS[renderTab];

    return intent.rooms
      .map((roomId) => rooms.find((room) => room.id === roomId))
      .filter((room): room is Room => Boolean(room))
      .map((room) => {
        let blocks = intent.ft ? room.blocks.filter((block) => block.featured) : room.blocks;
        if (renderTab !== "handover") {
          blocks = blocks.filter((block) => block.vis !== "consultant_only");
        }
        return { room, blocks };
      })
      .filter((entry) => entry.blocks.length > 0);
  }, [renderTab, rooms]);

  const renderIntent = INTENTS[renderTab];
  const shellMaxWidth = surface === "render" ? "100%" : 760;
  const activeRoom = activeRoomId ? rooms.find((room) => room.id === activeRoomId) ?? null : null;
  const activeBlock = activeRoom && activeBlockId ? activeRoom.blocks.find((block) => block.id === activeBlockId) ?? null : null;
  const connectorsActive = surface === "artefact" && artefactView === "artefact" && showConnectors;
  const snapshot: EngagementSnapshot = useMemo(
    () => ({
      name: currentArtefact.name,
      clientName: currentArtefact.clientName,
      consultantName: currentArtefact.consultantName,
      phase: currentArtefact.phase,
      value: currentArtefact.value,
      duration: currentArtefact.duration,
      rooms,
    }),
    [currentArtefact.clientName, currentArtefact.consultantName, currentArtefact.duration, currentArtefact.name, currentArtefact.phase, currentArtefact.value, rooms],
  );

  const ingestQueueItem = (item: QueuedItem) => {
    const targetRoomId = rooms.some((room) => room.id === item.suggestedRoom) ? item.suggestedRoom : rooms[0]?.id;
    if (!targetRoomId) return;

    setRooms((current) =>
      current.map((room) =>
        room.id === targetRoomId
          ? {
              ...room,
              blocks: [
                {
                  id: `ingested_${item.id}`,
                  title: item.preview.replace(/^[^:]+:\s*/, "").replaceAll('"', ""),
                  content: `${item.preview} · ${item.meta}`,
                  type: item.suggestedType,
                  vis: room.vis === "consultant_only" ? "consultant_only" : "client_view",
                  featured: false,
                  pinned: false,
                  source: "integration",
                  createdAt: "just now",
                },
                ...room.blocks,
              ],
            }
          : room,
      ),
    );
  };

  return (
    <div
      style={{
        minHeight: "100%",
        height: "100%",
        background: surface === "render" ? C.bg : C.void,
        padding: surface === "render" ? 0 : "32px",
        display: "flex",
        alignItems: surface === "render" ? "stretch" : "center",
        justifyContent: "center",
        transition: "background .4s, padding .4s",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: shellMaxWidth,
          margin: surface === "render" ? "0 auto" : "0",
          border: surface === "render" ? "1px solid transparent" : `1px solid ${C.edge}`,
          borderRadius: surface === "render" ? 0 : 12,
          overflow: showConnectors && surface === "artefact" && artefactView === "artefact" ? "visible" : "hidden",
          background: C.bg,
          boxShadow: surface === "render" ? "none" : "0 2px 24px rgba(0,0,0,.06)",
          transition: "max-width .4s cubic-bezier(.22,.1,.36,1), border-radius .4s, box-shadow .4s, border-color .4s",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", height: surface === "render" ? "100vh" : 560, transition: "height .4s cubic-bezier(.22,.1,.36,1)" }}>
          <div
            style={{
              padding: surface === "render" ? "14px 32px" : "12px 20px",
              borderBottom: `1px solid ${C.sep}`,
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexShrink: 0,
              background: C.bg,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {surface === "artefact" && artefactView !== "artefact" && (
                <button
                  onClick={() => {
                    if (artefactView === "block") {
                      setArtefactView("room");
                      setActiveBlockId(null);
                    } else {
                      setArtefactView("artefact");
                      setActiveRoomId(null);
                      setActiveBlockId(null);
                    }
                  }}
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 10,
                    color: C.t4,
                    background: "none",
                    border: "none",
                    padding: 0,
                    marginRight: 8,
                  }}
                >
                  ← back
                </button>
              )}
              <button
                onClick={() => {
                  setSurface("artefact");
                  setRenderTab("portal");
                  setArtefactView("artefact");
                  setActiveRoomId(null);
                  setActiveBlockId(null);
                }}
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10,
                  color: surface === "artefact" ? C.t1 : C.t4,
                  background: "none",
                  border: "none",
                  padding: 0,
                }}
              >
                artefact
              </button>
              {surface === "artefact" && artefactView !== "artefact" && activeRoom && (
                <>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.t4 }}>›</span>
                  <button
                    onClick={() => {
                      setArtefactView("room");
                      setActiveBlockId(null);
                    }}
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 10,
                      color: artefactView === "room" ? C.t1 : C.t4,
                      background: "none",
                      border: "none",
                      padding: 0,
                    }}
                  >
                    {activeRoom.name}
                  </button>
                </>
              )}
              {surface === "artefact" && artefactView === "block" && activeBlock && (
                <>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.t4 }}>›</span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.t1 }}>{activeBlock.title}</span>
                </>
              )}
              {surface === "render" && (
                <>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.t4 }}>›</span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.t1 }}>renders</span>
                </>
              )}
            </div>

            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}>
              {surface === "render" ? (
                <button
                  onClick={() => {
                    setSurface("artefact");
                    setArtefactView("artefact");
                    setActiveRoomId(null);
                    setActiveBlockId(null);
                  }}
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 10,
                    color: C.t4,
                    background: "none",
                    border: "none",
                    padding: 0,
                  }}
                >
                  ← artefact
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setShowConnectors((current) => !current)}
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 10,
                      color: showConnectors ? C.t1 : C.t4,
                      background: "none",
                      border: "none",
                      padding: 0,
                    }}
                  >
                    connectors →
                  </button>
                  <button
                    onClick={() => setSurface("render")}
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 10,
                      color: C.blue,
                      background: "none",
                      border: "none",
                      padding: 0,
                    }}
                  >
                    renders →
                  </button>
                </>
              )}
            </div>
          </div>

          <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
            <AnimatePresence mode="wait" initial={false}>
              {surface === "artefact" ? (
                <motion.div
                  key="artefact"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {artefactView === "artefact" && (
                    <>
                      <div style={{ padding: connectorsActive ? "18px 20px 14px" : "20px 20px 12px" }}>
                        {!connectorsActive && (
                          <div
                            style={{
                              fontFamily: "'DM Mono', monospace",
                              fontSize: 9,
                              letterSpacing: ".1em",
                              textTransform: "uppercase",
                              color: C.t4,
                              marginBottom: 6,
                            }}
                          >
                            engagement · artefact · composer
                          </div>
                        )}
                        <div style={{ fontSize: 20, fontWeight: 500, letterSpacing: "-.02em", color: C.t1, lineHeight: 1.2, marginBottom: connectorsActive ? 6 : 8 }}>
                          {currentArtefact.name}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.t4 }}>
                            <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.green, display: "inline-block", marginRight: 4 }} />
                            {currentArtefact.phase}
                          </span>
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.t4 }}>{currentArtefact.clientName}</span>
                          {!connectorsActive && (
                            <>
                              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.t4 }}>{currentArtefact.value}</span>
                              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.t4 }}>{currentArtefact.duration}</span>
                              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.t4 }}>{currentArtefact.practiceLabel}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {!connectorsActive && (
                        <div style={{ display: "flex", gap: 24, padding: "12px 20px", borderBottom: `1px solid ${C.sep}` }}>
                          <Stat value={rooms.length} label="rooms" />
                          <Stat value={visibleCount} label="visible" />
                          <Stat value={featuredCount} label="featured" />
                        </div>
                      )}

                      {rooms.map((room) => (
                        <RowButton
                          key={room.id}
                          onClick={() => {
                            setArtefactView("room");
                            setActiveRoomId(room.id);
                            setActiveBlockId(null);
                          }}
                        >
                          <VisibilityDot vis={room.vis} />
                          <span style={{ fontSize: 13, fontWeight: 500, color: C.t1, flex: 1 }}>{room.name}</span>
                          <span
                            style={{
                              fontFamily: "'DM Mono', monospace",
                              fontSize: 10,
                              color: C.t4,
                              display: "flex",
                              gap: 12,
                              flexWrap: "wrap",
                            }}
                          >
                            <span>{room.blocks.length} block{room.blocks.length === 1 ? "" : "s"}</span>
                            {!connectorsActive && (
                              <span>{room.blocks.some((block) => block.featured) ? room.blocks.find((block) => block.featured)?.title : "no featured"}</span>
                            )}
                          </span>
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: C.t4 }}>›</span>
                        </RowButton>
                      ))}
                    </>
                  )}

                  {artefactView === "room" && activeRoom && (
                    <>
                      <div style={{ padding: "20px 20px 12px", borderBottom: `1px solid ${C.sep}` }}>
                        <div
                          style={{
                            fontFamily: "'DM Mono', monospace",
                            fontSize: 9,
                            letterSpacing: ".1em",
                            textTransform: "uppercase",
                            color: C.t4,
                            marginBottom: 6,
                          }}
                        >
                          {visLabel(activeRoom.vis)}
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 500, letterSpacing: "-.015em", color: C.t1, marginBottom: 4 }}>
                          {activeRoom.name}
                        </div>
                        <div style={{ fontSize: 12, color: C.t4, marginBottom: 12 }}>{activeRoom.desc}</div>
                        <button
                          onClick={() => {
                            const blockId = `b${Date.now()}`;
                            setRooms((current) =>
                              current.map((candidate) =>
                                candidate.id === activeRoom.id
                                  ? {
                                      ...candidate,
                                      blocks: [
                                        ...candidate.blocks,
                                        {
                                          id: blockId,
                                          title: "New block",
                                          content: "Capture a decision, update, metric, or deliverable here.",
                                          type: "note",
                                          vis: candidate.vis === "consultant_only" ? "consultant_only" : "client_view",
                                          featured: false,
                                          pinned: false,
                                          source: "manual",
                                          createdAt: "today",
                                        },
                                      ],
                                    }
                                  : candidate,
                              ),
                            );
                            setActiveBlockId(blockId);
                            setArtefactView("block");
                          }}
                          style={{
                            fontFamily: "'DM Mono', monospace",
                            fontSize: 11,
                            color: C.t4,
                            background: "none",
                            border: "none",
                            padding: 0,
                          }}
                        >
                          + add block
                        </button>
                      </div>

                      {activeRoom.blocks.map((block) => (
                        <div key={block.id} style={{ display: "flex", alignItems: "stretch", borderBottom: `1px solid ${C.sep}` }}>
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleFeatured(activeRoom.id, block.id);
                            }}
                            style={{
                              fontSize: 14,
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: "0 8px 0 18px",
                              lineHeight: 1,
                              color: block.featured ? "#f59e0b" : C.edge,
                            }}
                          >
                            {block.featured ? "★" : "☆"}
                          </button>
                          <RowButton
                            onClick={() => {
                              setActiveBlockId(block.id);
                              setArtefactView("block");
                            }}
                            style={{ borderBottom: "none", flex: 1, padding: "12px 16px" }}
                          >
                            <VisibilityDot vis={block.vis} />
                            <span style={{ fontSize: 13, fontWeight: 500, color: C.t1, flex: 1 }}>{block.title}</span>
                            <span
                              style={{
                                fontFamily: "'DM Mono', monospace",
                                fontSize: 10,
                                color: C.t4,
                                display: "flex",
                                gap: 12,
                              }}
                            >
                              <span>{block.type}</span>
                              <span>{block.source}</span>
                            </span>
                            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: C.t4 }}>›</span>
                          </RowButton>
                        </div>
                      ))}
                    </>
                  )}

                  {artefactView === "block" && activeRoom && activeBlock && (
                    <>
                      <div style={{ padding: "20px 20px 16px", borderBottom: `1px solid ${C.sep}` }}>
                        <div
                          style={{
                            fontFamily: "'DM Mono', monospace",
                            fontSize: 9,
                            letterSpacing: ".1em",
                            textTransform: "uppercase",
                            color: C.t4,
                            marginBottom: 6,
                          }}
                        >
                          {activeRoom.name} · {activeBlock.type}
                        </div>
                        <input
                          value={activeBlock.title}
                          onChange={(event) => {
                            updateBlock(activeRoom.id, activeBlock.id, (current) => ({ ...current, title: event.target.value }));
                          }}
                          style={{
                            width: "100%",
                            border: "none",
                            background: "transparent",
                            color: C.t1,
                            fontSize: 18,
                            fontWeight: 500,
                            letterSpacing: "-.015em",
                            outline: "none",
                            marginBottom: 12,
                          }}
                        />
                        <button
                          onClick={() => toggleFeatured(activeRoom.id, activeBlock.id)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            fontFamily: "'DM Mono', monospace",
                            fontSize: 10,
                            background: "none",
                            border: "none",
                            color: activeBlock.featured ? "#f59e0b" : C.t4,
                            padding: 0,
                          }}
                        >
                          <span style={{ fontSize: 16 }}>{activeBlock.featured ? "★" : "☆"}</span>
                          {activeBlock.featured ? "featured" : "feature this block"}
                        </button>
                      </div>

                      <div style={{ padding: "20px", borderBottom: `1px solid ${C.sep}` }}>
                        <textarea
                          value={activeBlock.content}
                          onChange={(event) => {
                            updateBlock(activeRoom.id, activeBlock.id, (current) => ({ ...current, content: event.target.value }));
                          }}
                          style={{
                            width: "100%",
                            minHeight: 180,
                            resize: "vertical",
                            border: "none",
                            outline: "none",
                            background: "transparent",
                            color: C.t2,
                            fontSize: 13,
                            lineHeight: 1.7,
                            fontFamily: "'DM Sans', sans-serif",
                          }}
                        />
                      </div>

                      <div style={{ padding: "0 20px 20px" }}>
                        {[
                          ["visibility", visLabel(activeBlock.vis)],
                          ["type", activeBlock.type],
                          ["source", activeBlock.source],
                          ["created", activeBlock.createdAt],
                          ...(activeBlock.pinned ? [["pinned", "yes"]] : []),
                        ].map(([label, value]) => (
                          <div
                            key={label}
                            style={{
                              display: "flex",
                              gap: 16,
                              alignItems: "flex-start",
                              padding: "12px 0",
                              borderBottom: `1px solid ${C.sep}`,
                            }}
                          >
                            <span
                              style={{
                                width: 80,
                                flexShrink: 0,
                                fontFamily: "'DM Mono', monospace",
                                fontSize: 9,
                                letterSpacing: ".07em",
                                textTransform: "uppercase",
                                color: C.t4,
                                paddingTop: 1,
                              }}
                            >
                              {label}
                            </span>
                            <span style={{ fontSize: 12, color: C.t2 }}>{value}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </motion.div>
              ) : surface === "render" ? (
                <motion.div
                  key="render"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}
                >
                  <div
                    style={{
                      display: "flex",
                      borderBottom: `1px solid ${C.sep}`,
                      padding: surface === "render" ? "0 32px" : "0 20px",
                      overflowX: "auto",
                      flexShrink: 0,
                    }}
                  >
                    {(Object.keys(INTENTS) as RenderIntent[]).map((intent) => (
                      <button
                        key={intent}
                        onClick={() => setRenderTab(intent)}
                        style={{
                          fontFamily: "'DM Mono', monospace",
                          fontSize: 10,
                          letterSpacing: ".04em",
                          color: renderTab === intent ? C.t1 : C.t4,
                          background: "none",
                          border: "none",
                          borderBottom: renderTab === intent ? `1px solid ${C.t1}` : "1px solid transparent",
                          padding: "12px 10px 11px",
                          marginBottom: -1,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {INTENTS[intent].label}
                      </button>
                    ))}
                  </div>

                  <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
                    <div
                      style={{
                        padding: surface === "render" ? "48px 32px" : "24px 20px",
                        maxWidth: 680,
                        margin: "0 auto",
                        transition: "padding .4s",
                      }}
                    >
                      <div style={{ fontSize: surface === "render" ? 32 : 26, fontWeight: 500, letterSpacing: "-.025em", color: C.t1, marginBottom: 5 }}>
                        {renderIntent.masked ? "[Client Name]" : currentArtefact.clientName}
                        {renderIntent.masked && (
                          <span
                            style={{
                              fontFamily: "'DM Mono', monospace",
                              fontSize: 9,
                              color: C.amber,
                              background: `${C.amber}14`,
                              padding: "1px 6px",
                              borderRadius: 3,
                              border: `1px solid ${C.amber}33`,
                              marginLeft: 8,
                              verticalAlign: "middle",
                            }}
                          >
                            masked
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontFamily: "'DM Mono', monospace",
                          fontSize: 10,
                          color: C.t4,
                          letterSpacing: ".06em",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 32,
                          paddingBottom: 24,
                          borderBottom: `1px solid ${C.sep}`,
                          flexWrap: "wrap",
                        }}
                      >
                        <span>{renderIntent.masked ? "[Engagement Name]" : currentArtefact.name}</span>
                        <span>·</span>
                        <span>{renderIntent.masked ? "[Consultant]" : currentArtefact.consultantName}</span>
                        <span>·</span>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 9,
                            color: C.green,
                            background: `${C.green}14`,
                            padding: "2px 8px",
                            borderRadius: 20,
                            border: `1px solid ${C.green}33`,
                          }}
                        >
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.green }} />
                          {currentArtefact.phase}
                        </span>
                      </div>

                      {renderedSections.map(({ room, blocks }) => (
                        <div key={room.id} style={{ marginBottom: 20 }}>
                          <div
                            style={{
                              fontFamily: "'DM Mono', monospace",
                              fontSize: 9,
                              letterSpacing: ".1em",
                              textTransform: "uppercase",
                              color: C.t4,
                              marginBottom: 8,
                            }}
                          >
                            {room.name}
                          </div>
                          {blocks.map((block) => (
                            <div
                              key={block.id}
                              style={{
                                padding: "10px 14px",
                                borderLeft: `2px solid ${block.featured ? C.blue : C.sep}`,
                                marginBottom: 6,
                              }}
                            >
                              <div style={{ fontSize: surface === "render" ? 14 : 13, fontWeight: 500, color: C.t1, marginBottom: 3 }}>
                                {renderIntent.masked ? maskText(block.title, currentArtefact.clientName) : block.title}
                              </div>
                              <div style={{ fontSize: surface === "render" ? 13 : 12, color: C.t2, lineHeight: 1.65 }}>
                                {renderIntent.masked ? maskText(block.content, currentArtefact.clientName) : block.content}
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}

                      <div
                        style={{
                          fontFamily: "'DM Mono', monospace",
                          fontSize: 9,
                          color: C.t4,
                          paddingTop: 16,
                          borderTop: `1px solid ${C.sep}`,
                          marginTop: 24,
                        }}
                      >
                        {renderIntent.hint}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>

        {surface === "artefact" && artefactView === "artefact" && showConnectors && (
          <div style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}>
            <div style={{ position: "absolute", inset: 0, pointerEvents: "auto" }}>
              <ConnectorPanel snapshot={snapshot} onApproveQueueItem={ingestQueueItem} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
