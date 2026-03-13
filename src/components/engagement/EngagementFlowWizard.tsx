"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useC, useTheme } from "@/hooks/useC";
import {
  WizardLayout,
  StepAccordion,
  ArtefactPreviewPanel,
  useGhostTyping,
  type WizardStep,
} from "@/components/wizard";
import { ViewToggle, PageComposer } from "@/components/community/sections";
import type { PreviewViewMode } from "@/components/community/sections";
import type { StandaloneRoom, Identity } from "@/types/artefact";

// ── Types ─────────────────────────────────────────────────────────────────────

type EngagementFlowWizardProps = {
  onComplete?: () => void;
};

// ── Wizard Steps ──────────────────────────────────────────────────────────────

const WIZARD_STEPS: WizardStep[] = [
  { id: "insight", num: 1, label: "The Core Insight" },
  { id: "events", num: 2, label: "Event Log" },
  { id: "blocks", num: 3, label: "Compressed Blocks" },
  { id: "trust", num: 4, label: "Trust Gradient" },
  { id: "featured", num: 5, label: "Featured Blocks" },
  { id: "portal", num: 6, label: "Client Portal" },
  { id: "pitch", num: 7, label: "Pitch Deck" },
  { id: "demo", num: 8, label: "Demo Render" },
  { id: "asset", num: 9, label: "Practice Asset" },
];

// ── Sample Content for Preview ────────────────────────────────────────────────

const SAMPLE_CONTENT: Record<string, string> = {
  scope: "Ops Transformation engagement for Apex Logistics. 14-week engagement focused on warehouse routing optimization.",
  research: "Discovery phase complete. Identified 2.3-day cycle time improvement opportunity in warehouse routing.",
  deliverables: "Phase 1: Routing module replacement. Phase 2: Process automation. Phase 3: Training rollout.",
  meetings: "3-phase implementation approach approved by client stakeholders on March 10, 2026.",
  outcomes: "Target: 2+ day reduction in cycle time. Current progress: Analysis complete, recommendations drafted.",
  documents: "Statement of work, routing analysis report, implementation roadmap.",
};

// ── Mock Rooms for Preview ────────────────────────────────────────────────────

const MOCK_ROOMS: StandaloneRoom[] = [
  { id: "scope", key: "scope", label: "Scope", prompt: "", visibility: "public", orderIndex: 0, blocks: [{ id: "scope_1", blockType: "text", content: "", orderIndex: 0 }] },
  { id: "research", key: "research", label: "Discovery", prompt: "", visibility: "public", orderIndex: 1, blocks: [{ id: "research_1", blockType: "text", content: "", orderIndex: 0 }] },
  { id: "deliverables", key: "deliverables", label: "Recommendations", prompt: "", visibility: "public", orderIndex: 2, blocks: [{ id: "deliverables_1", blockType: "text", content: "", orderIndex: 0 }] },
  { id: "meetings", key: "meetings", label: "Checkpoints", prompt: "", visibility: "public", orderIndex: 3, blocks: [{ id: "meetings_1", blockType: "text", content: "", orderIndex: 0 }] },
  { id: "outcomes", key: "outcomes", label: "Outcomes", prompt: "", visibility: "public", orderIndex: 4, blocks: [{ id: "outcomes_1", blockType: "text", content: "", orderIndex: 0 }] },
];

const MOCK_IDENTITY: Identity = {
  name: "Apex Logistics",
  title: "Ops Transformation",
  bio: "14-week engagement · $68,000 · Sarah Chen, Meridian Advisory",
  location: "",
  skills: [],
  links: [],
};

// ── Step Content Components ───────────────────────────────────────────────────

function InsightContent({ C }: { C: ReturnType<typeof useC> }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 11, color: C.t3, lineHeight: 1.6 }}>
        A consulting engagement isn't a folder of files — it's a <span style={{ color: C.t1, fontWeight: 500 }}>state machine</span> that transitions throughout a lifecycle.
      </div>
      <div style={{ background: C.edge, borderRadius: 8, padding: 12, border: `1px solid ${C.sep}` }}>
        <div style={{ fontSize: 10, color: C.t4, marginBottom: 8, fontFamily: "'DM Mono', monospace", letterSpacing: ".04em" }}>SAME STATE, DIFFERENT RENDERS</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            ["Client Portal", "Live trust layer during delivery"],
            ["Pitch Deck", "New business conversations"],
            ["Board Summary", "Stakeholder updates"],
            ["Handover Doc", "Engagement close"],
            ["Demo Render", "Sales tool (masked)"],
          ].map(([name, purpose]) => (
            <div key={name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 4, height: 4, borderRadius: 2, background: C.blue }} />
              <span style={{ fontSize: 11, color: C.t1 }}>{name}</span>
              <span style={{ fontSize: 10, color: C.t4 }}>— {purpose}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ fontSize: 10, color: C.t4, fontStyle: "italic" }}>
        Not exports. Live, configured views of current state.
      </div>
    </div>
  );
}

function EventsContent({ C }: { C: ReturnType<typeof useC> }) {
  const events = [
    { time: "10:32", type: "decision", text: "Client approved 3-phase approach" },
    { time: "10:28", type: "finding", text: "2.3-day cycle time improvement identified" },
    { time: "10:15", type: "context", text: "Kickoff call with stakeholders" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 11, color: C.t3, lineHeight: 1.5 }}>
        Append-only event log as source of truth. Time travel, auditability, and "what was decided and when."
      </div>
      <div style={{ background: C.void, borderRadius: 8, border: `1px solid ${C.sep}`, overflow: "hidden" }}>
        {events.map((e, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 10px", borderBottom: i < events.length - 1 ? `1px solid ${C.sep}` : "none" }}>
            <span style={{ fontSize: 9, color: C.t4, fontFamily: "'DM Mono', monospace", marginTop: 2 }}>{e.time}</span>
            <div>
              <div style={{ fontSize: 9, color: e.type === "decision" ? C.green : e.type === "finding" ? C.blue : C.t4, fontFamily: "'DM Mono', monospace", letterSpacing: ".04em", marginBottom: 2 }}>{e.type.toUpperCase()}</div>
              <div style={{ fontSize: 11, color: C.t2 }}>{e.text}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 10, color: C.t4, background: `${C.blue}10`, padding: "6px 10px", borderRadius: 5 }}>
        Blocks are materialized projections of the event log
      </div>
    </div>
  );
}

function BlocksContent({ C }: { C: ReturnType<typeof useC> }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 11, color: C.t3, lineHeight: 1.5 }}>
        Raw inputs get projected into structured semantic blocks. Signal separated from noise at the boundary.
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ flex: 1, background: C.edge, borderRadius: 6, padding: 8, fontSize: 10, color: C.t4, border: `1px solid ${C.sep}` }}>
          45min Zoom call<br/>Slack thread<br/>Email chain
        </div>
        <div style={{ fontSize: 16, color: C.t4 }}>→</div>
        <div style={{ flex: 1, padding: "8px 10px", borderRadius: 6, background: `${C.green}08`, border: `1px solid ${C.green}20` }}>
          <div style={{ fontSize: 9, color: C.green, fontFamily: "'DM Mono', monospace", marginBottom: 2 }}>DECISION</div>
          <div style={{ fontSize: 10, color: C.t2 }}>3-phase implementation approved</div>
        </div>
      </div>
      <div style={{ padding: "8px 10px", borderRadius: 6, background: `${C.blue}08`, border: `1px solid ${C.blue}20` }}>
        <div style={{ fontSize: 9, color: C.blue, fontFamily: "'DM Mono', monospace", marginBottom: 2 }}>MCP</div>
        <div style={{ fontSize: 10, color: C.t3 }}>Zoom call ends → AI writes decision block → portal re-renders with "NEW" badge</div>
      </div>
    </div>
  );
}

function TrustContent({ C }: { C: ReturnType<typeof useC> }) {
  const rooms = [
    { name: "Scope", visibility: "client_view", color: C.green },
    { name: "Discovery", visibility: "client_view", color: C.green },
    { name: "Working Notes", visibility: "consultant_only", color: C.amber },
    { name: "Pricing", visibility: "consultant_only", color: C.amber },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 11, color: C.t3, lineHeight: 1.5 }}>
        Rooms have visibility levels. The client sees a curated view; the consultant controls what surfaces.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {rooms.map((r) => (
          <div key={r.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 10px", borderRadius: 6, background: C.edge, border: `1px solid ${C.sep}` }}>
            <span style={{ fontSize: 11, color: C.t2 }}>{r.name}</span>
            <span style={{ fontSize: 9, color: r.color, fontFamily: "'DM Mono', monospace" }}>{r.visibility}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, fontSize: 9, color: C.t4 }}>
        <span><span style={{ color: C.green }}>●</span> Client visible</span>
        <span><span style={{ color: C.amber }}>●</span> Consultant only</span>
      </div>
    </div>
  );
}

function FeaturedContent({ C }: { C: ReturnType<typeof useC> }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 11, color: C.t3, lineHeight: 1.5 }}>
        One featured block per room. Forces one curatorial decision — "what's the headline here?" — rather than endless assembling.
      </div>
      {[
        { room: "Discovery", starred: true, title: "2.3-day cycle time improvement identified" },
        { room: "Scope", starred: true, title: "14-week ops transformation engagement" },
        { room: "Notes", starred: false, title: "Internal pricing discussion" },
      ].map((b) => (
        <div key={b.title} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 6, background: b.starred ? `${C.amber}10` : C.edge, border: `1px solid ${b.starred ? `${C.amber}30` : C.sep}` }}>
          <span style={{ color: b.starred ? C.amber : C.t4, fontSize: 12 }}>{b.starred ? "★" : "☆"}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, color: C.t4, marginBottom: 2 }}>{b.room}</div>
            <span style={{ fontSize: 11, color: b.starred ? C.t1 : C.t3 }}>{b.title}</span>
          </div>
        </div>
      ))}
      <div style={{ fontSize: 10, color: C.t4 }}>
        Pitch deck pulls featured blocks from selected rooms
      </div>
    </div>
  );
}

function PortalContent({ C }: { C: ReturnType<typeof useC> }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 20, height: 20, borderRadius: 4, background: C.blue, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff" }}>M</div>
        <div style={{ fontSize: 11, color: C.t1 }}>Meridian Advisory</div>
        <div style={{ fontSize: 9, color: C.green, background: `${C.green}15`, padding: "2px 8px", borderRadius: 10 }}>Live</div>
      </div>
      <div style={{ fontSize: 11, color: C.t3, lineHeight: 1.5 }}>
        Real-time visibility during delivery. When a decision gets logged, the portal updates automatically.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
        {[["Phase", "Analysis"], ["Progress", "Week 3"], ["Next", "Mar 24"]].map(([l, v]) => (
          <div key={l} style={{ background: C.edge, borderRadius: 5, padding: "6px 8px", border: `1px solid ${C.sep}` }}>
            <div style={{ fontSize: 9, color: C.t4 }}>{l}</div>
            <div style={{ fontSize: 12, color: C.t1 }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 10, color: C.t4, fontStyle: "italic" }}>
        Intent: client_portal — all client_view rooms
      </div>
    </div>
  );
}

function PitchContent({ C }: { C: ReturnType<typeof useC> }) {
  const purple = "#a78bfa";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 11, color: C.t3, lineHeight: 1.5 }}>
        Same engagement data, different render. Featured blocks only — one headline per room.
      </div>
      <div style={{ background: `${purple}10`, borderRadius: 8, padding: 12, border: `1px solid ${purple}30` }}>
        <div style={{ fontSize: 10, color: purple, fontFamily: "'DM Mono', monospace", marginBottom: 8 }}>PITCH DECK</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 11, color: C.t2 }}>★ Ops Transformation — 14 weeks</div>
          <div style={{ fontSize: 11, color: C.t2 }}>★ 2.3-day cycle time improvement</div>
          <div style={{ fontSize: 11, color: C.t2 }}>★ 3-phase implementation approved</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, fontSize: 10, color: C.t4 }}>
        <span>Scope ✓</span>
        <span>Outcomes ✓</span>
        <span>Meetings ✓</span>
      </div>
    </div>
  );
}

function DemoContent({ C }: { C: ReturnType<typeof useC> }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 11, color: C.t3, lineHeight: 1.5 }}>
        Every completed engagement becomes evidence for the next sale. Render-time masking — not stored state.
      </div>
      <div style={{ background: C.edge, borderRadius: 8, padding: 10, border: `1px solid ${C.sep}` }}>
        {[
          ["clientName", "[Client Name]"],
          ["participantNames", "[CMO], [Brand Lead]"],
          ["figures", "XX% / $XX,XXX"],
        ].map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: k !== "figures" ? `1px solid ${C.sep}` : "none" }}>
            <span style={{ fontSize: 10, color: C.t4, fontFamily: "'DM Mono', monospace" }}>{k}</span>
            <span style={{ fontSize: 11, color: C.amber }}>{v}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1, padding: "6px 8px", borderRadius: 5, background: `${C.amber}10`, fontSize: 10, color: C.amber, textAlign: "center" }}>Demo link (masked)</div>
        <div style={{ flex: 1, padding: "6px 8px", borderRadius: 5, background: `${C.green}10`, fontSize: 10, color: C.green, textAlign: "center" }}>Portal link (real)</div>
      </div>
    </div>
  );
}

function AssetContent({ C }: { C: ReturnType<typeof useC> }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 11, color: C.t3, lineHeight: 1.5 }}>
        The consultant isn't paying for project management — they're paying for a system that turns every engagement into a <span style={{ color: C.t1, fontWeight: 500 }}>reusable practice asset</span>.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {[
          ["During delivery", "Client portal, trust layer, decision log"],
          ["At close", "Handover doc, outcomes record"],
          ["Post-engagement", "Case study source, demo render"],
          ["Across engagements", "Pattern intelligence"],
        ].map(([stage, value]) => (
          <div key={stage} style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: 8, padding: "6px 10px", background: C.edge, borderRadius: 5, border: `1px solid ${C.sep}` }}>
            <span style={{ fontSize: 10, color: C.t4 }}>{stage}</span>
            <span style={{ fontSize: 10, color: C.t2 }}>{value}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: "8px 12px", borderRadius: 6, background: `${C.green}08`, border: `1px solid ${C.green}20`, fontSize: 10, color: C.green, textAlign: "center" }}>
        What gets featured = what clients care about
      </div>
    </div>
  );
}

// ── Preview Panel with View Toggle ────────────────────────────────────────────

function EngagementPreviewPanel({
  rooms,
  identity,
  showExpanded,
  focusedRoomId,
  C,
}: {
  rooms: StandaloneRoom[];
  identity: Identity;
  showExpanded: boolean;
  focusedRoomId: string | null;
  C: ReturnType<typeof useC>;
}) {
  const [viewMode, setViewMode] = useState<PreviewViewMode>("workspace");

  // Convert rooms to PageComposer format
  const pageRooms = useMemo(() => {
    return rooms.map((room) => ({
      id: room.id,
      label: room.label,
      type: room.key || "custom",
      blocks: room.blocks.map((block) => ({
        id: block.id,
        type: block.blockType,
        label: block.blockType,
      })),
    }));
  }, [rooms]);

  const getBlockContent = (blockId: string) => {
    for (const room of rooms) {
      const block = room.blocks.find((b) => b.id === blockId);
      if (block) return block.content || "";
    }
    return "";
  };

  if (showExpanded) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, padding: 24 }}>
        {/* View Toggle */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <ViewToggle mode={viewMode} onChange={setViewMode} />
        </div>

        <AnimatePresence mode="wait">
          {viewMode === "page" ? (
            <motion.div
              key="page-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.28, ease: [0.22, 0.1, 0.36, 1] }}
              style={{ flex: 1, overflow: "auto", borderRadius: 12, border: `1px solid ${C.sep}` }}
            >
              <PageComposer
                rooms={pageRooms}
                getBlockContent={getBlockContent}
                accent={C.blue}
                activeRoomId={focusedRoomId || rooms[0]?.id}
              />
            </motion.div>
          ) : (
            <motion.div
              key="workspace-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.28, ease: [0.22, 0.1, 0.36, 1] }}
              style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}
            >
              <ArtefactPreviewPanel
                rooms={rooms}
                identity={identity}
                showExpanded={true}
                focusedRoomId={focusedRoomId}
                fullscreen={true}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Compact preview
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, position: "relative", zIndex: 1 }}>
      <motion.span
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.2 }}
        className="mono"
        style={{ fontSize: 8, color: C.t4, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 4 }}
      >
        engagement artefact preview
      </motion.span>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.22, 0.1, 0.36, 1] }}
      >
        <ArtefactPreviewPanel
          rooms={rooms}
          identity={identity}
          showExpanded={false}
          focusedRoomId={null}
        />
      </motion.div>

      <motion.span
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.2 }}
        style={{ fontSize: 11, color: C.t4, lineHeight: 1.6 }}
      >
        Updates live as you progress through steps.
      </motion.span>
    </div>
  );
}

// ── Main Wizard Component ─────────────────────────────────────────────────────

export function EngagementFlowWizard({ onComplete }: EngagementFlowWizardProps) {
  const C = useC();
  const { dark } = useTheme();

  const [wizStep, setWizStep] = useState(1);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [started, setStarted] = useState(false);
  const [focusedRoomId, setFocusedRoomId] = useState<string | null>(null);

  const { getDisplayedContent } = useGhostTyping(SAMPLE_CONTENT);

  // Build rooms with animated content
  const mockRooms: StandaloneRoom[] = useMemo(() => {
    return MOCK_ROOMS.map((room) => ({
      ...room,
      blocks: [{
        ...room.blocks[0],
        content: getDisplayedContent(room.key, SAMPLE_CONTENT[room.key] || ""),
      }],
    }));
  }, [getDisplayedContent]);

  const advance = () => {
    if (!started) {
      setStarted(true);
      return;
    }
    setDone((d) => new Set([...d, WIZARD_STEPS[wizStep - 1].id]));
    if (wizStep < WIZARD_STEPS.length) {
      setWizStep((w) => w + 1);
      // Focus different rooms as we progress
      const roomFocus = ["scope", "research", "deliverables", "meetings", "outcomes"];
      setFocusedRoomId(roomFocus[wizStep % roomFocus.length] || null);
    } else {
      onComplete?.();
    }
  };

  const renderStepContent = (step: WizardStep) => {
    const contentMap: Record<string, React.ReactNode> = {
      insight: <InsightContent C={C} />,
      events: <EventsContent C={C} />,
      blocks: <BlocksContent C={C} />,
      trust: <TrustContent C={C} />,
      featured: <FeaturedContent C={C} />,
      portal: <PortalContent C={C} />,
      pitch: <PitchContent C={C} />,
      demo: <DemoContent C={C} />,
      asset: <AssetContent C={C} />,
    };
    return contentMap[step.id] || null;
  };

  const renderStepAction = (step: WizardStep) => (
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
      {step.id === "asset" ? "Complete →" : "Continue →"}
    </motion.button>
  );

  // Show expanded preview for certain steps
  const showExpanded = wizStep >= 3;

  return (
    <WizardLayout
      started={started}
      dark={dark}
      accentColor={C.blue}
      welcomeContent={
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px 80px" }}>
          <div style={{ width: "100%", maxWidth: 440 }}>
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div style={{ fontSize: 10, letterSpacing: ".14em", color: C.t4, marginBottom: 12, fontFamily: "'DM Mono', monospace", textTransform: "uppercase" }}>
                Engagement Artefact
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: C.t1, letterSpacing: "-.025em", marginBottom: 12, lineHeight: 1.3 }}>
                Not a folder of files.<br/>A state machine.
              </div>
              <div style={{ fontSize: 13, color: C.t3, lineHeight: 1.7 }}>
                The same engagement renders as a client portal,<br/>a pitch deck, or a demo — live, not exported.
              </div>
            </div>

            <div style={{ background: C.edge, borderRadius: 12, padding: "16px 18px", marginBottom: 28, border: `1px solid ${C.sep}` }}>
              <div style={{ fontSize: 9, color: C.t4, fontFamily: "'DM Mono', monospace", letterSpacing: ".06em", marginBottom: 10 }}>THE PRODUCT WALKTHROUGH</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {WIZARD_STEPS.map((s, idx) => (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11, color: C.t2 }}>{s.label}</span>
                    {idx < WIZARD_STEPS.length - 1 && <span style={{ color: C.t4 }}>→</span>}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ textAlign: "center" }}>
              <motion.button
                onClick={advance}
                whileHover={{ opacity: 0.9, y: -1 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  padding: "12px 32px",
                  background: `linear-gradient(135deg, ${C.t1} 0%, ${dark ? "#555" : "#333"} 100%)`,
                  border: "none",
                  borderRadius: 10,
                  color: C.bg,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  boxShadow: dark ? "0 4px 20px rgba(0,0,0,0.4)" : "0 4px 20px rgba(0,0,0,0.12)",
                }}
              >
                Start the tour →
              </motion.button>
              <div style={{ fontSize: 10, color: C.t4, marginTop: 12, fontFamily: "'DM Mono', monospace" }}>
                9 steps · About 2 minutes
              </div>
            </div>
          </div>
        </div>
      }
      leftPanelHeader={
        <>
          <div style={{ width: 20, height: 20, borderRadius: 5, background: C.blue, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 10, color: "#fff" }}>A</span>
          </div>
          <span style={{ fontSize: 12, color: C.t1, fontWeight: 500 }}>Artefact Architecture</span>
        </>
      }
      leftPanelContent={
        <div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: C.t4, marginBottom: 4, fontFamily: "'DM Mono', monospace", letterSpacing: ".04em", textTransform: "uppercase" }}>
              How It Works
            </div>
            <div style={{ fontSize: 13, color: C.t2, lineHeight: 1.6 }}>
              Event-sourced foundation, live renders, practice assets.
            </div>
          </div>
          <StepAccordion
            steps={WIZARD_STEPS}
            currentStep={wizStep}
            doneSteps={done}
            onStepClick={setWizStep}
            renderStepContent={renderStepContent}
            renderStepAction={renderStepAction}
          />
        </div>
      }
      rightPanelContent={
        <EngagementPreviewPanel
          rooms={mockRooms}
          identity={MOCK_IDENTITY}
          showExpanded={showExpanded}
          focusedRoomId={focusedRoomId}
          C={C}
        />
      }
      rightPanelFullscreen={showExpanded}
    />
  );
}
