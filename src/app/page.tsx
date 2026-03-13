"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { siZoom, type SimpleIcon } from "simple-icons";
import { ThemeToggle } from "@/components/primitives/ThemeToggle";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { useC } from "@/hooks/useC";
import type { CSSProperties, ReactNode } from "react";

type HeroRound = {
  source: string;
  sourceType: string;
  snippet: string;
  blockTitle: string;
  blockMeta: string;
  salesTitle: string;
  salesProof: string;
  logTime: string;
  logText: string;
};

const HERO_ROUNDS: HeroRound[] = [
  {
    source: "Zoom call · 14:32 · steering review",
    sourceType: "Call transcript",
    snippet:
      "Maria confirms premium tier for launch after the ingredient-transparency debate closes.",
    blockTitle: "Decision block: premium tier selected for launch",
    blockMeta: "Meetings & Decisions · client visible · approved",
    salesTitle: "Sales room proof: decision quality under pressure",
    salesProof:
      "Shows how Meridian turns live stakeholder tension into a timestamped decision trail a prospect can inspect.",
    logTime: "14:32",
    logText:
      "Pulled a Zoom transcript into the artefact, approved a decision block, then rendered it into the sales room.",
  },
  {
    source: "Slack sync · #acme-brand · scope question",
    sourceType: "Slack thread",
    snippet:
      "Client requests social templates; Claude flags likely scope drift and routes it into review.",
    blockTitle: "Guardrail block: social templates may exceed agreed scope",
    blockMeta: "Risks & Decisions · consultant only · needs response",
    salesTitle: "Sales room proof: scope control without friction",
    salesProof:
      "Turns internal guardrail behavior into a visible case-study asset for the next proposal.",
    logTime: "15:04",
    logText:
      "Pulled a Slack thread into the artefact, opened a guardrail block, then rendered the handling pattern into the sales room.",
  },
];

const MOMENTS = [
  {
    tag: "01",
    title: "Update one thing, update everything",
    body: "A decision gets made. You update the doc. Then the deck. Then the client email. Then remember the board summary is out of date. Fragmented systems are a manual sync tax.",
  },
  {
    tag: "02",
    title: "The engagement state lives nowhere",
    body: "Where are you in scope? What's been decided? What's outstanding? No single place holds the answer at any given moment.",
  },
  {
    tag: "03",
    title: "Handover is a reconstruction project",
    body: "At close, you spend a week assembling what happened from scattered sources. It's archaeology, not delivery.",
  },
  {
    tag: "04",
    title: "Nothing carries forward",
    body: "Every engagement should make the next one sharper. Without a live record, the pattern intelligence dies with the project.",
  },
];

type RenderKey = "portal" | "pitch" | "board" | "handover" | "demo";

const RENDER_SHOWCASE: Array<{
  key: RenderKey;
  nav: string;
  icon: string;
  title: string;
  body: string;
}> = [
  {
    key: "portal",
    nav: "Client Portal",
    icon: "Portal",
    title: "Live client portal - updated every time you approve a block.",
    body: "A URL your client visits throughout the engagement. Decisions, outcomes, milestones - in real time. Replaces the status email forever.",
  },
  {
    key: "pitch",
    nav: "Pitch Deck",
    icon: "Pitch",
    title: "Pitch deck built from real work - not reconstructed from memory.",
    body: "Star one block per room. A deck assembles from featured blocks. Prospects see what you did - dates, decisions, outcomes. Not what you claim.",
  },
  {
    key: "board",
    nav: "Board Summary",
    icon: "Board",
    title: "Board summary that writes itself. Print in 60 seconds.",
    body: "One page. KPI grid, featured outcomes, open risks. Formatted for the room - not assembled the night before.",
  },
  {
    key: "handover",
    nav: "Handover Doc",
    icon: "Handover",
    title: "Handover doc that accretes throughout. Not assembled at the end.",
    body: "Every room. Every block. Chronological. The complete engagement record. Handover stops being a reconstruction project and becomes a print.",
  },
  {
    key: "demo",
    nav: "Demo Render",
    icon: "Demo",
    title: "Every past engagement becomes a sales tool. Zero extra work.",
    body: "Real structure. Safe content. Client names, figures, and identifiers masked at render time. Switch any archived engagement to demo mode instantly.",
  },
];

type IngestionScene = {
  sourceLabel: string;
  sourceKind: string;
  sourceLines: string[];
  artefactTitle: string;
  artefactMeta: string;
  renderLabel: string;
  renderBody: string;
};

const INGESTION_SCENES: IngestionScene[] = [
  {
    sourceLabel: "Email thread",
    sourceKind: "client@acme.com",
    sourceLines: [
      "Premium tier makes more sense for launch.",
      "Keep the board rationale tight and commercial.",
    ],
    artefactTitle: "Decision block: premium tier selected for launch",
    artefactMeta: "Commercial strategy room · approved",
    renderLabel: "Board summary",
    renderBody: "Premium launch direction approved. Board rationale synced from the same block.",
  },
  {
    sourceLabel: "Google Doc",
    sourceKind: "Positioning notes",
    sourceLines: [
      "Clinical proof should anchor the narrative.",
      "Remove broad category language from the opening.",
    ],
    artefactTitle: "Narrative block: clinical proof leads the opening",
    artefactMeta: "Messaging room · ready to render",
    renderLabel: "Board summary",
    renderBody: "Opening narrative updated to lead with clinical proof and margin logic.",
  },
];

function LogoMark({
  size = 20,
  accent,
  background,
  border,
}: {
  size?: number;
  accent: string;
  background: string;
  border: string;
}) {
  const cell = Math.round(size * 0.28);
  const gap = Math.round(size * 0.11);
  const start = Math.round(size * 0.18);

  const squareStyle = (x: number, y: number, muted?: boolean): CSSProperties => ({
    position: "absolute",
    left: x,
    top: y,
    width: cell,
    height: cell,
    borderRadius: Math.max(2, Math.round(size * 0.08)),
    background: muted ? "transparent" : accent,
    border: muted ? `1px solid ${accent}` : "none",
    opacity: muted ? 0.38 : 1,
  });

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: Math.max(4, Math.round(size * 0.2)),
        border: `1px solid ${border}`,
        background,
        position: "relative",
        flexShrink: 0,
      }}
    >
      <div style={squareStyle(start, start)} />
      <div style={squareStyle(start + cell + gap, start)} />
      <div style={squareStyle(start, start + cell + gap)} />
      <div style={squareStyle(start + cell + gap, start + cell + gap, true)} />
    </div>
  );
}

function Frame({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  const C = useC();

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.92)",
        border: `1px solid ${C.sep}`,
        borderRadius: 22,
        boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SectionIntro({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  const C = useC();

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div
        style={{
          fontSize: 11,
          letterSpacing: ".04em",
          textTransform: "uppercase",
          color: "rgba(15,23,42,.44)",
        }}
      >
        {eyebrow}
      </div>
      <h2
        style={{
          fontSize: "clamp(32px, 4vw, 54px)",
          lineHeight: 1,
          letterSpacing: "-.03em",
          fontWeight: 500,
          color: C.t1,
          maxWidth: 700,
        }}
      >
        {title}
      </h2>
      <p
        style={{
          maxWidth: 620,
          fontSize: 15,
          lineHeight: 1.8,
          color: "rgba(15,23,42,.66)",
        }}
      >
        {body}
      </p>
    </div>
  );
}

function BrandIcon({ icon }: { icon: SimpleIcon }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <path d={icon.path} fill={`#${icon.hex}`} />
    </svg>
  );
}

function SourceGlyph({ round }: { round: HeroRound }) {
  const isSlack = round.sourceType.toLowerCase().includes("slack");

  if (isSlack) {
    return (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          background: "#fff",
          border: "1px solid rgba(15,23,42,.08)",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
          overflow: "hidden",
        }}
      >
        <Image
          src="/integration-logos/slack.ico"
          alt="Slack"
          width={18}
          height={18}
          style={{ display: "block" }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: 10,
        background: "#fff",
        border: "1px solid rgba(15,23,42,.08)",
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
      }}
    >
      <BrandIcon icon={siZoom} />
    </div>
  );
}

function SourcePanel({
  round,
  active,
  compact,
}: {
  round: HeroRound;
  active: boolean;
  compact?: boolean;
}) {
  const C = useC();

  return (
    <motion.div
      animate={{
        opacity: active ? 1 : 0.82,
      }}
      transition={{ duration: 0.25 }}
      style={{
        background: "rgba(255,255,255,.98)",
        border: active ? `1px solid rgba(29,78,216,.18)` : `1px solid ${C.sep}`,
        borderRadius: 16,
        overflow: "hidden",
        minWidth: 0,
        alignSelf: "start",
      }}
    >
      <div
        style={{
          padding: "10px 12px",
          borderBottom: `1px solid ${C.sep}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div
          className="mono"
          style={{
            fontSize: 8,
            letterSpacing: ".12em",
            textTransform: "uppercase",
            color: "rgba(15,23,42,.4)",
          }}
        >
          Source content
        </div>
        <div
          className="mono"
          style={{
            fontSize: 8,
            letterSpacing: ".08em",
            textTransform: "uppercase",
            color: active ? C.blue : "rgba(15,23,42,.34)",
          }}
        >
          {round.sourceType}
        </div>
      </div>
      <div style={{ padding: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <motion.div animate={{ scale: active ? 1 : 0.94, opacity: active ? 1 : 0.72 }} transition={{ duration: 0.25 }}>
            <SourceGlyph round={round} />
          </motion.div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, lineHeight: 1.2, letterSpacing: "-.03em", color: C.t1 }}>
              {active ? "Portal synced" : "Waiting for sync"}
            </div>
            <div style={{ fontSize: 11, lineHeight: 1.45, color: "rgba(15,23,42,.48)", marginTop: 4 }}>
              {active ? "Latest client-visible update is live" : "No approved update yet"}
            </div>
          </div>
        </div>
        <div
          className="mono"
          style={{
            fontSize: 8,
            letterSpacing: ".12em",
            textTransform: "uppercase",
            color: "rgba(15,23,42,.4)",
            marginTop: 10,
          }}
        >
          client portal
        </div>
        <div
          style={{
            marginTop: 12,
            padding: compact ? 10 : 12,
            borderRadius: 12,
            background: active ? "rgba(29,78,216,.06)" : "rgba(15,23,42,.03)",
            border: active ? "1px solid rgba(29,78,216,.12)" : "1px solid transparent",
          }}
        >
          <div style={{ fontSize: compact ? 12 : 13, lineHeight: compact ? 1.45 : 1.55, color: "rgba(15,23,42,.78)" }}>
            {active ? round.snippet : "Approved blocks appear here automatically once the artefact updates."}
          </div>
        </div>
        <div
          style={{
            marginTop: 10,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 10px",
            borderRadius: 999,
            background: active ? "rgba(34,197,94,.12)" : "rgba(15,23,42,.05)",
            color: active ? "#166534" : "rgba(15,23,42,.46)",
            fontSize: 11,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: active ? "#16a34a" : "rgba(15,23,42,.22)",
            }}
          />
          {active ? "Client portal updated" : "Awaiting source approval"}
        </div>
      </div>
    </motion.div>
  );
}

function ArtefactPanel({
  round,
  stage,
  compact,
}: {
  round: HeroRound;
  stage: number;
  compact?: boolean;
}) {
  const pulse = stage === 2;

  return (
    <motion.div
      animate={{
        opacity: stage >= 2 ? 1 : 0.84,
      }}
      transition={{ duration: 0.25 }}
      style={{
        background: "#111214",
        border: `1px solid ${
          pulse ? "rgba(96,165,250,.35)" : "rgba(255,255,255,.08)"
        }`,
        borderRadius: 16,
        overflow: "hidden",
        minWidth: 0,
        alignSelf: "stretch",
      }}
    >
      <div
        style={{
          padding: "10px 12px",
          borderBottom: "1px solid rgba(255,255,255,.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div
          className="mono"
          style={{
            fontSize: 8,
            letterSpacing: ".12em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,.34)",
          }}
        >
          Artefact core
        </div>
        <div
          className="mono"
          style={{
            fontSize: 8,
            letterSpacing: ".08em",
            textTransform: "uppercase",
            color: pulse ? "#93c5fd" : "rgba(255,255,255,.3)",
          }}
        >
          {stage < 2 ? "awaiting pull" : stage < 3 ? "compressing" : "approved"}
        </div>
      </div>
      <div style={{ padding: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <motion.div
            animate={{ scale: pulse ? 1.03 : 1 }}
            transition={{ duration: 0.25 }}
          >
            <LogoMark
              size={22}
              accent="#93c5fd"
              background="rgba(96,165,250,.12)"
              border="rgba(96,165,250,.26)"
            />
          </motion.div>
          <div>
            <div style={{ fontSize: 14, color: "#fff", letterSpacing: "-.03em" }}>
              Engagement artefact
            </div>
            <div
              className="mono"
              style={{
                fontSize: 8,
                letterSpacing: ".12em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,.34)",
                marginTop: 4,
              }}
            >
              canonical state for delivery and renders
            </div>
          </div>
        </div>
        <motion.div
          key={round.blockTitle}
          initial={{ opacity: 0.4, y: 8 }}
          animate={{ opacity: stage >= 2 ? 1 : 0.48, y: 0 }}
          transition={{ duration: 0.35 }}
          style={{
            padding: compact ? 10 : 12,
            borderRadius: 12,
            background: stage >= 2 ? "rgba(96,165,250,.12)" : "rgba(255,255,255,.04)",
            border: `1px solid ${
              stage >= 2 ? "rgba(96,165,250,.2)" : "rgba(255,255,255,.06)"
            }`,
          }}
        >
          <div style={{ fontSize: compact ? 12 : 13, lineHeight: compact ? 1.4 : 1.5, color: "#fff" }}>
            {stage >= 2 ? round.blockTitle : "Awaiting approved source material"}
          </div>
          <div
            className="mono"
            style={{
              fontSize: 8,
              letterSpacing: ".1em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,.34)",
              marginTop: 8,
            }}
          >
            {stage >= 2 ? round.blockMeta : "no artefact block yet"}
          </div>
        </motion.div>
        <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
          {[
            stage >= 2 ? "Block approved from live source" : "Source not yet approved",
            stage >= 2 ? "Artefact state updated" : "Waiting to update canonical state",
            stage >= 3 ? "Ready to drive all renders" : "Downstream renders locked",
          ].map((item, index) => (
            <div
              key={item}
              style={{
                display: "flex",
                gap: 8,
                padding: compact ? "7px 9px" : "8px 10px",
                borderRadius: 10,
                background:
                  index === 2 && stage >= 3
                    ? "rgba(96,165,250,.1)"
                    : "rgba(255,255,255,.04)",
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background:
                    index === 2 && stage >= 3 ? "#93c5fd" : "rgba(255,255,255,.18)",
                  marginTop: 5,
                  flexShrink: 0,
                }}
              />
              <div style={{ fontSize: compact ? 10 : 11, lineHeight: 1.4, color: "rgba(255,255,255,.78)" }}>
                {item}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function SalesRoomPanel({
  round,
  active,
  compact,
}: {
  round: HeroRound;
  active: boolean;
  compact?: boolean;
}) {
  const C = useC();

  return (
    <motion.div
      animate={{
        opacity: active ? 1 : 0.82,
      }}
      transition={{ duration: 0.25 }}
      style={{
        background: "rgba(255,255,255,.98)",
        border: active ? `1px solid rgba(29,78,216,.18)` : `1px solid ${C.sep}`,
        borderRadius: 16,
        overflow: "hidden",
        minWidth: 0,
        alignSelf: "start",
      }}
    >
      <div
        style={{
          padding: "10px 12px",
          borderBottom: `1px solid ${C.sep}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div
          className="mono"
          style={{
            fontSize: 8,
            letterSpacing: ".12em",
            textTransform: "uppercase",
            color: "rgba(15,23,42,.4)",
          }}
        >
          Sales room
        </div>
        <div
          className="mono"
          style={{
            fontSize: 8,
            letterSpacing: ".08em",
            textTransform: "uppercase",
            color: active ? C.blue : "rgba(15,23,42,.34)",
          }}
        >
          {active ? "new render" : "waiting"}
        </div>
      </div>
      <div style={{ padding: 12 }}>
        <div
          className="mono"
          style={{
            fontSize: 8,
            letterSpacing: ".12em",
            textTransform: "uppercase",
            color: "rgba(15,23,42,.4)",
          }}
        >
          pitch deck
        </div>
        <motion.div
          key={round.salesTitle}
          initial={{ opacity: 0.35, y: 8 }}
          animate={{ opacity: active ? 1 : 0.54, y: 0 }}
          transition={{ duration: 0.35 }}
          style={{
            marginTop: 10,
            padding: compact ? 10 : 12,
            borderRadius: 12,
            background: active ? "rgba(29,78,216,.07)" : "rgba(15,23,42,.03)",
            border: active ? "1px solid rgba(29,78,216,.12)" : "1px solid transparent",
          }}
        >
          <div style={{ fontSize: compact ? 10 : 11, lineHeight: 1.2, color: "rgba(15,23,42,.42)", textTransform: "uppercase", letterSpacing: ".08em" }}>
            Slide 12
          </div>
          <div style={{ marginTop: 8, fontSize: compact ? 18 : 20, lineHeight: 1.05, letterSpacing: "-.025em", color: C.t1 }}>
            {active ? round.salesTitle : "No approved pitch proof yet"}
          </div>
          <div style={{ fontSize: compact ? 10 : 11, lineHeight: compact ? 1.45 : 1.6, color: "rgba(15,23,42,.68)", marginTop: 8 }}>
            {active ? round.salesProof : "Approve a block in the artefact and a pitch-ready slide appears here."}
          </div>
        </motion.div>
        <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
          {[
            active ? "Deck slide refreshed" : "Waiting for artefact sync",
            active ? "Narrative updated" : "No narrative yet",
            active ? "Ready for live pitch" : "Pitch output locked",
          ].map(
            (item, index) => (
              <div
                key={item}
                style={{
                  display: "flex",
                  gap: 8,
                  padding: compact ? "7px 9px" : "8px 10px",
                  borderRadius: 10,
                  background:
                    index === 2 && active ? "rgba(29,78,216,.06)" : "rgba(15,23,42,.03)",
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: index === 2 && active ? C.blue : "rgba(15,23,42,.22)",
                    marginTop: 5,
                    flexShrink: 0,
                  }}
                />
                <div style={{ fontSize: compact ? 10 : 11, lineHeight: 1.4, color: "rgba(15,23,42,.78)" }}>
                  {item}
                </div>
              </div>
            ),
          )}
        </div>
      </div>
    </motion.div>
  );
}

function SyncConnector({
  progress,
}: {
  progress: number;
}) {
  const C = useC();

  return (
    <div
      style={{
        position: "relative",
        width: 72,
        height: 180,
        alignSelf: "center",
      }}
    >
      <svg
        viewBox="0 0 72 180"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        <path
          d="M6 90 C22 90, 24 52, 36 52 C48 52, 50 90, 66 90"
          fill="none"
          stroke="rgba(15,23,42,.16)"
          strokeDasharray="4 5"
          strokeLinecap="round"
        />
        <path
          d="M6 90 C22 90, 24 128, 36 128 C48 128, 50 90, 66 90"
          fill="none"
          stroke="rgba(15,23,42,.16)"
          strokeDasharray="4 5"
          strokeLinecap="round"
        />
        <motion.path
          d="M6 90 C22 90, 24 52, 36 52 C48 52, 50 90, 66 90"
          fill="none"
          stroke={C.blue}
          strokeLinecap="round"
          strokeWidth="1.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: progress }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        />
        <motion.path
          d="M6 90 C22 90, 24 128, 36 128 C48 128, 50 90, 66 90"
          fill="none"
          stroke={C.blue}
          strokeLinecap="round"
          strokeWidth="1.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: progress }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        />
      </svg>
      <motion.div
        animate={{
          left: `${8 + progress * 56}px`,
          opacity: progress > 0 ? 1 : 0,
          scale: progress > 0 ? 1 : 0.85,
        }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        style={{
          position: "absolute",
          top: 82,
          width: 16,
          height: 16,
          borderRadius: 999,
          background: "#fff",
          border: `2px solid ${C.blue}`,
          boxShadow: "0 0 0 4px rgba(29,78,216,.08)",
        }}
      />
    </div>
  );
}

function HeroSystemAnimation() {
  const breakpoint = useBreakpoint();
  const [roundIndex, setRoundIndex] = useState(0);
  const [stage, setStage] = useState(0);
  const isMobile = breakpoint === "xs" || breakpoint === "sm";
  const round = HERO_ROUNDS[roundIndex];

  useEffect(() => {
    const timers = [
      window.setTimeout(() => setStage(1), 700),
      window.setTimeout(() => setStage(2), 1800),
      window.setTimeout(() => setStage(3), 3000),
    ];

    return () => timers.forEach(window.clearTimeout);
  }, [roundIndex]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setStage(0);
      setRoundIndex((value) => (value + 1) % HERO_ROUNDS.length);
    }, 6200);

    return () => window.clearInterval(interval);
  }, []);

  const currentStep =
    stage < 1 ? 0 : stage < 2 ? 1 : stage < 3 ? 2 : 3;
  const connectorA = currentStep === 1 ? 0.55 : currentStep >= 2 ? 1 : 0;
  const connectorB = currentStep === 2 ? 0.55 : currentStep >= 3 ? 1 : 0;

  return (
    <Frame
      style={{
        padding: isMobile ? 16 : 24,
        background: "linear-gradient(180deg, rgba(207,223,231,.94), rgba(199,218,227,.96))",
        borderRadius: 26,
        height: isMobile ? undefined : "min(58vh, 620px)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) 60px minmax(0, 1fr) 60px minmax(0, 1fr)",
          gap: isMobile ? 18 : 18,
          alignItems: "center",
          height: "100%",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <SourcePanel round={round} active={currentStep >= 1} compact />
          {!isMobile ? (
            <div
              className="mono"
              style={{
                marginTop: 14,
                textAlign: "center",
                fontSize: 10,
                letterSpacing: ".08em",
                textTransform: "uppercase",
                color: "rgba(15,23,42,.72)",
              }}
            >
              Client portal
            </div>
          ) : null}
        </div>
        {!isMobile ? <SyncConnector progress={connectorA} /> : null}
        <div style={{ minWidth: 0 }}>
          <ArtefactPanel round={round} stage={currentStep >= 2 ? 3 : currentStep === 1 ? 2 : 1} compact />
          {!isMobile ? (
            <div
              className="mono"
              style={{
                marginTop: 14,
                textAlign: "center",
                fontSize: 10,
                letterSpacing: ".08em",
                textTransform: "uppercase",
                color: "rgba(15,23,42,.72)",
              }}
            >
              Artefact
            </div>
          ) : null}
        </div>
        {!isMobile ? <SyncConnector progress={connectorB} /> : null}
        <div style={{ minWidth: 0 }}>
          <SalesRoomPanel round={round} active={currentStep >= 3} compact />
          {!isMobile ? (
            <div
              className="mono"
              style={{
                marginTop: 14,
                textAlign: "center",
                fontSize: 10,
                letterSpacing: ".08em",
                textTransform: "uppercase",
                color: "rgba(15,23,42,.72)",
              }}
            >
              Pitch deck
            </div>
          ) : null}
        </div>
      </div>
    </Frame>
  );
}

function RenderShowcase() {
  const C = useC();
  const breakpoint = useBreakpoint();
  const [active, setActive] = useState<RenderKey>("portal");
  const isMobile = breakpoint === "xs" || breakpoint === "sm";
  const activePanel = RENDER_SHOWCASE.find((item) => item.key === active) ?? RENDER_SHOWCASE[0];
  const shellStyle = {
    borderRadius: 12,
    overflow: "hidden",
    width: "100%",
    maxWidth: 820,
    margin: "0 auto",
    aspectRatio: isMobile ? undefined : "16 / 10",
    minHeight: isMobile ? undefined : 440,
    boxShadow: "0 18px 46px rgba(15,23,42,.08), 0 3px 14px rgba(15,23,42,.05)",
  } as const;
  const chromeDotStyle = { width: 8, height: 8, borderRadius: "50%" } as const;
  const metaTextStyle = {
    fontSize: 11,
    letterSpacing: "-.01em",
    color: "rgba(15,23,42,.4)",
  } as const;
  const quietLabelStyle = {
    fontSize: 10,
    letterSpacing: ".02em",
    color: "rgba(15,23,42,.42)",
  } as const;
  const shellTitleStyle = {
    fontSize: isMobile ? 22 : 24,
    fontWeight: 500,
    letterSpacing: "-.02em",
    lineHeight: 1.08,
  } as const;
  const shellBodyStyle = {
    fontSize: 12,
    lineHeight: 1.58,
  } as const;
  const shellCardTitleStyle = {
    fontSize: 13,
    fontWeight: 500,
    letterSpacing: "-.01em",
  } as const;

  return (
    <Frame
      style={{
        overflow: "hidden",
        borderRadius: 20,
        background: "#eeeee9",
        maxWidth: 1180,
        margin: "0 auto",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "280px minmax(0, 1fr)",
          minHeight: isMobile ? undefined : 600,
          aspectRatio: isMobile ? undefined : "11 / 6",
        }}
      >
        <div
          style={{
            borderRight: isMobile ? "none" : `1px solid ${C.sep}`,
            borderBottom: isMobile ? `1px solid ${C.sep}` : "none",
            padding: isMobile ? "18px 0" : "28px 0",
            background: "#f3f3ef",
          }}
        >
          {RENDER_SHOWCASE.map((item) => {
            const selected = item.key === active;

            return (
              <button
                key={item.key}
                onClick={() => setActive(item.key)}
                style={{
                  width: "100%",
                  border: "none",
                  background: "transparent",
                  borderRight: "none",
                  padding: isMobile ? "12px 20px" : "12px 24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    color: selected ? C.t1 : "rgba(15,23,42,.42)",
                    fontSize: 15,
                    fontWeight: selected ? 500 : 400,
                    letterSpacing: "-.02em",
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      letterSpacing: "-.01em",
                      color: selected ? C.blue : "rgba(15,23,42,.28)",
                      minWidth: 62,
                      opacity: selected ? 1 : 0.6,
                    }}
                  >
                    {item.icon}
                  </span>
                  {item.nav}
                </div>
                <span
                  style={{
                    color: selected ? C.t1 : "rgba(15,23,42,.24)",
                    opacity: selected ? 1 : 0,
                    transform: selected ? "translateX(0)" : "translateX(-4px)",
                    transition: "opacity .15s ease, transform .15s ease",
                  }}
                >
                  →
                </span>
              </button>
            );
          })}

          <div
            style={{
              padding: isMobile ? "16px 20px 0" : "18px 24px 0",
              fontSize: 11,
              letterSpacing: "-.01em",
              color: "rgba(15,23,42,.38)",
            }}
          >
            + All from one source
          </div>
        </div>

        <div style={{ background: "#ecece8", position: "relative" }}>
          {!isMobile ? (
            <div
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: 36,
                height: 36,
                background: "#eeeee9",
                clipPath: "polygon(100% 0, 0 0, 100% 100%)",
                zIndex: 2,
              }}
            />
          ) : null}
          <div
            style={{
              background: "#ecece8",
              padding: isMobile ? "24px 20px 18px" : "26px 28px 18px",
            }}
          >
            <div
              style={{
                fontSize: "clamp(24px, 2.8vw, 34px)",
                fontWeight: 500,
                letterSpacing: "-.025em",
                lineHeight: 1.1,
                color: C.t1,
                maxWidth: 760,
              }}
            >
              {activePanel.title}
            </div>
            <div
              style={{
                marginTop: 14,
                fontSize: 14,
                lineHeight: 1.6,
                color: "rgba(15,23,42,.66)",
                maxWidth: 700,
              }}
            >
              {activePanel.body}
            </div>
            <a
              href="#pricing"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                marginTop: 18,
                border: "1px solid rgba(15,23,42,.22)",
                borderRadius: 999,
                background: "transparent",
                padding: "9px 14px",
                fontSize: 12,
                letterSpacing: "-.01em",
                color: C.t1,
              }}
            >
              <span>+</span>
              Explore
            </a>
          </div>

          <div style={{ padding: isMobile ? "18px 20px 20px" : "12px 28px 28px" }}>
            {active === "portal" ? (
              <Frame style={{ ...shellStyle, background: "#fff" }}>
                <div style={{ background: "#f0f0ee", borderBottom: `1px solid ${C.sep}`, padding: "8px 14px", display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ ...chromeDotStyle, background: "#ff5f56" }} />
                  <div style={{ ...chromeDotStyle, background: "#ffbd2e" }} />
                  <div style={{ ...chromeDotStyle, background: "#27c93f" }} />
                  <span style={{ marginLeft: 6, ...metaTextStyle }}>artefact.io/portal/acme-brand-strategy</span>
                </div>
                <div style={{ padding: isMobile ? 22 : 28, height: "100%", display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", paddingBottom: 18, borderBottom: `1px solid ${C.sep}` }}>
                    <div>
                      <div style={{ ...quietLabelStyle }}>Client portal</div>
                      <div style={{ ...shellTitleStyle, color: C.t1, marginTop: 6 }}>ACME Skincare</div>
                      <div style={{ marginTop: 8, ...metaTextStyle }}>Brand strategy engagement · Week 6 of 8</div>
                    </div>
                    <div style={{ fontSize: 10, color: "#285c40", background: "#eef6f0", border: "1px solid #d8e9dd", borderRadius: 999, padding: "5px 10px" }}>
                      Live with client
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.1fr .9fr", gap: 18, marginTop: 20 }}>
                    <div style={{ display: "grid", gap: 14 }}>
                      <div style={{ padding: "16px 18px", border: `1px solid ${C.sep}`, borderRadius: 10, background: "#fbfaf6" }}>
                        <div style={quietLabelStyle}>Current position</div>
                        <div style={{ ...shellBodyStyle, color: C.t1, marginTop: 8 }}>
                          Premium direction approved. Messaging revision aligned. Next milestone is board-ready narrative review on Friday.
                        </div>
                      </div>
                      <div style={{ padding: "16px 18px", border: `1px solid ${C.sep}`, borderRadius: 10 }}>
                        <div style={quietLabelStyle}>Latest decision</div>
                        <div style={{ ...shellCardTitleStyle, fontSize: 15, color: C.t1, marginTop: 8 }}>Option B selected for launch narrative</div>
                        <div style={{ ...shellBodyStyle, color: "rgba(15,23,42,.56)", marginTop: 6 }}>
                          Approved by Jake after pricing and clinical proof review. Downstream deck and summary are already current.
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "grid", gap: 14 }}>
                      <div style={{ padding: "16px 18px", border: `1px solid ${C.sep}`, borderRadius: 10 }}>
                        <div style={quietLabelStyle}>Engagement pulse</div>
                        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                          {[
                            ["Decision velocity", "On track"],
                            ["Scope drift", "Flagged early"],
                            ["Client visibility", "High"],
                          ].map(([k, v]) => (
                            <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12, ...shellBodyStyle, color: "rgba(15,23,42,.62)" }}>
                              <span>{k}</span>
                              <span style={{ color: C.t1 }}>{v}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div style={{ padding: "16px 18px", border: `1px solid ${C.sep}`, borderRadius: 10, background: "#f7f8fb" }}>
                        <div style={quietLabelStyle}>Recent update</div>
                        <div style={{ ...shellBodyStyle, color: "rgba(15,23,42,.62)", marginTop: 8 }}>
                          Claude logged a call decision at 14:32. Portal, board summary, and handover record refreshed from the same artefact state.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Frame>
            ) : null}

            {active === "pitch" ? (
              <Frame style={{ ...shellStyle, background: "#f6f2ea", border: "1px solid rgba(15,23,42,.12)" }}>
                <div style={{ background: "#ece7de", borderBottom: "1px solid rgba(15,23,42,.12)", padding: "8px 14px", display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ ...chromeDotStyle, background: "#ff5f56" }} />
                  <div style={{ ...chromeDotStyle, background: "#ffbd2e" }} />
                  <div style={{ ...chromeDotStyle, background: "#27c93f" }} />
                  <span style={{ marginLeft: 6, ...metaTextStyle }}>artefact.io/render/pitch/acme-brand-strategy</span>
                </div>
                <div style={{ padding: isMobile ? 22 : 30, background: "#f6f2ea", height: "100%", display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center" }}>
                    <div style={{ ...quietLabelStyle }}>Pitch deck</div>
                    <div style={{ fontSize: 10, color: "rgba(15,23,42,.44)" }}>Slide 12</div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.18fr .82fr", gap: 24, marginTop: 22, flex: 1, minHeight: 0 }}>
                    <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: isMobile ? 28 : 34,
                          lineHeight: 1.02,
                          letterSpacing: "-.03em",
                          color: C.t1,
                          maxWidth: 460,
                        }}
                      >
                        Premium tier selected for launch.
                      </div>
                      <div style={{ marginTop: 14, fontSize: 16, lineHeight: 1.55, color: "rgba(15,23,42,.64)", maxWidth: 500 }}>
                        The engagement record showed stronger willingness to pay and clearer differentiation in the premium tier before any broader architecture expansion.
                      </div>

                      <div style={{ marginTop: 26, paddingLeft: 18, borderLeft: "2px solid rgba(15,23,42,.18)", maxWidth: 460 }}>
                        <div style={{ ...quietLabelStyle }}>Proof from the work</div>
                        <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                          {[
                            "Client approved premium direction on 12 Mar 2026.",
                            "Commercial strategy room became the canonical decision source.",
                            "Board-ready rationale was generated from the same approval state.",
                          ].map((item) => (
                            <div key={item} style={{ ...shellBodyStyle, color: "rgba(15,23,42,.68)" }}>{item}</div>
                          ))}
                        </div>
                      </div>

                      <div style={{ marginTop: "auto", paddingTop: 18, display: "flex", justifyContent: "space-between", gap: 16, borderTop: "1px solid rgba(15,23,42,.12)" }}>
                        <div style={{ fontSize: 12, color: "rgba(15,23,42,.44)" }}>Meridian Advisory × ACME Skincare</div>
                        <div style={{ fontSize: 12, color: "rgba(15,23,42,.44)" }}>Case proof render</div>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateRows: "1.05fr .95fr", gap: 14, minWidth: 0 }}>
                      <div style={{ padding: "18px 18px", borderRadius: 14, background: "rgba(255,255,255,.62)", border: "1px solid rgba(15,23,42,.08)", display: "flex", flexDirection: "column" }}>
                        <div style={quietLabelStyle}>Decision signal</div>
                        <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
                          {[
                            ["Decision date", "12 Mar 2026"],
                            ["Decision owner", "Jake Mercer"],
                            ["Status", "Approved"],
                          ].map(([k, v]) => (
                            <div key={k} style={{ display: "grid", gap: 2 }}>
                              <div style={{ fontSize: 11, color: "rgba(15,23,42,.42)" }}>{k}</div>
                              <div style={{ fontSize: 15, lineHeight: 1.3, color: C.t1 }}>{v}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={{ padding: "18px 18px", borderRadius: 14, background: "#efe7d8", border: "1px solid rgba(15,23,42,.08)", display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12, alignContent: "start" }}>
                        {[
                          ["9", "Decisions logged"],
                          ["6", "Weeks active"],
                          ["3", "Outcomes landed"],
                          ["2", "Deliverables approved"],
                        ].map(([value, label]) => (
                          <div key={label} style={{ padding: "10px 8px 6px" }}>
                            <div style={{ fontSize: 24, lineHeight: 1, letterSpacing: "-.02em", color: C.t1 }}>{value}</div>
                            <div style={{ marginTop: 4, fontSize: 11, lineHeight: 1.35, color: "rgba(15,23,42,.52)" }}>{label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Frame>
            ) : null}

            {active === "board" ? (
              <Frame style={{ ...shellStyle, background: "#fffef9" }}>
                <div style={{ background: "#f5f5f0", borderBottom: `1px solid ${C.sep}`, padding: "8px 14px", display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ ...chromeDotStyle, background: "#ff5f56" }} />
                  <div style={{ ...chromeDotStyle, background: "#ffbd2e" }} />
                  <div style={{ ...chromeDotStyle, background: "#27c93f" }} />
                  <span style={{ marginLeft: 6, ...metaTextStyle }}>artefact.io/render/board/acme-brand-strategy</span>
                </div>
                <div style={{ padding: isMobile ? 22 : 28, height: "100%", display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", paddingBottom: 16, borderBottom: "1px solid rgba(15,23,42,.18)" }}>
                    <div>
                      <div style={{ ...quietLabelStyle }}>Board summary</div>
                      <div style={{ ...shellTitleStyle, fontSize: 20, color: C.t1, marginTop: 6 }}>ACME Skincare · Brand Strategy</div>
                      <div style={{ marginTop: 4, ...metaTextStyle }}>Week 6 of 8 · Meridian Advisory · March 2026</div>
                    </div>
                    <div style={{ fontSize: 10, letterSpacing: ".02em", color: "rgba(15,23,42,.46)", border: `1px solid ${C.sep}`, padding: "4px 8px", borderRadius: 4 }}>Confidential</div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))", gap: 10, marginTop: 18 }}>
                    {[
                      ["3wk", "Kickoff→dir"],
                      ["9", "Decisions"],
                      ["3", "Outcomes"],
                      ["6", "Weeks"],
                    ].map(([value, label]) => (
                      <div key={label} style={{ background: "#f2f0e8", borderRadius: 8, padding: "12px 12px" }}>
                        <div style={{ fontSize: 24, fontWeight: 500, letterSpacing: "-.02em", lineHeight: 1, color: C.t1 }}>{value}</div>
                        <div style={{ marginTop: 4, ...quietLabelStyle }}>{label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginTop: 18 }}>
                    <div style={{ padding: "16px 18px", border: `1px solid ${C.sep}`, borderRadius: 10 }}>
                      <div style={quietLabelStyle}>Executive summary</div>
                      <div style={{ marginTop: 10, ...shellBodyStyle, color: "rgba(15,23,42,.64)" }}>
                        Direction is stable. Premium positioning is locked. Remaining work is packaging the rationale cleanly for stakeholder circulation.
                      </div>
                    </div>
                    <div style={{ padding: "16px 18px", border: `1px solid ${C.sep}`, borderRadius: 10 }}>
                      <div style={quietLabelStyle}>Open risks</div>
                      <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                        {[
                          "Retail pricing narrative still needs finance sign-off",
                          "CMO onboarding note required if sponsor changes",
                        ].map((item) => (
                          <div key={item} style={{ ...shellBodyStyle, color: "rgba(15,23,42,.64)" }}>{item}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: 16, padding: "16px 18px", border: `1px solid ${C.sep}`, borderRadius: 10, background: "#fbfaf6" }}>
                    <div style={quietLabelStyle}>Featured outcomes</div>
                    <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                      {[
                        "Messaging framework approved two weeks ahead of schedule",
                        "Premium tier confirmed with board-ready rationale",
                        "Decision velocity moved from kickoff to direction in three weeks",
                      ].map((item) => (
                        <div key={item} style={{ ...shellBodyStyle, color: "rgba(15,23,42,.66)" }}>{item}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </Frame>
            ) : null}

            {active === "handover" ? (
              <Frame style={{ ...shellStyle, background: "#fff" }}>
                <div style={{ background: "#f0f0ee", borderBottom: `1px solid ${C.sep}`, padding: "8px 14px", display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ ...chromeDotStyle, background: "#ff5f56" }} />
                  <div style={{ ...chromeDotStyle, background: "#ffbd2e" }} />
                  <div style={{ ...chromeDotStyle, background: "#27c93f" }} />
                  <span style={{ marginLeft: 6, ...metaTextStyle }}>artefact.io/render/handover/acme-brand-strategy</span>
                </div>
                <div style={{ padding: isMobile ? 22 : 28, height: "100%", display: "flex", flexDirection: "column" }}>
                  <div style={{ ...quietLabelStyle }}>Handover document</div>
                  <div style={{ ...shellTitleStyle, fontSize: 20, color: C.t1, marginTop: 6 }}>ACME Skincare - Brand Strategy</div>
                  <div style={{ marginTop: 4, ...metaTextStyle, paddingBottom: 16, borderBottom: `1px solid ${C.sep}` }}>Engagement record · All rooms · Feb 15 - Mar 2026</div>
                  <div style={{ display: "grid", gap: 6, marginTop: 16 }}>
                    {[
                      { n: "01", room: "Scope & Objectives", complete: true, count: "3 blocks" },
                      { n: "02", room: "Research & Discovery", complete: false, count: "12 blocks" },
                      { n: "03", room: "Meetings & Decisions", complete: true, count: "9 blocks" },
                      { n: "04", room: "Outcomes & Impact", complete: true, count: "4 blocks" },
                      { n: "05", room: "Deliverables", complete: true, count: "4 blocks" },
                    ].map(({ n, room, complete, count }, index) => (
                      <div
                        key={room}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "11px 10px",
                          borderBottom: index === 4 ? "none" : "1px solid #f0f0ee",
                          background: room === "Meetings & Decisions" ? "#f7f9fc" : "transparent",
                          borderRadius: 8,
                        }}
                      >
                        <div style={{ width: 22, fontSize: 10, color: "rgba(15,23,42,.36)" }}>{n}</div>
                        <div style={{ ...shellCardTitleStyle, color: C.t1 }}>{room}</div>
                        <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: complete ? "#22c55e" : "rgba(15,23,42,.24)" }} />
                        <div style={{ marginLeft: 8, fontSize: 10, color: room === "Meetings & Decisions" ? C.blue : "rgba(15,23,42,.4)" }}>{count}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: "auto", paddingTop: 18, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
                    <div style={{ padding: "14px 16px", border: `1px solid ${C.sep}`, borderRadius: 10 }}>
                      <div style={quietLabelStyle}>Client handover note</div>
                      <div style={{ marginTop: 8, ...shellBodyStyle, color: "rgba(15,23,42,.62)" }}>
                        Final rationale, room history, and deliverables are already structured. No reconstruction week is required.
                      </div>
                    </div>
                    <div style={{ padding: "14px 16px", border: `1px solid ${C.sep}`, borderRadius: 10 }}>
                      <div style={quietLabelStyle}>Archive status</div>
                      <div style={{ marginTop: 8, ...shellBodyStyle, color: "rgba(15,23,42,.62)" }}>
                        Ready to transfer into client ownership or switch into masked demo mode for future pitches.
                      </div>
                    </div>
                  </div>
                </div>
              </Frame>
            ) : null}

            {active === "demo" ? (
              <Frame style={{ ...shellStyle, background: "#fffef9" }}>
                <div style={{ background: "#f5f5f0", borderBottom: `1px solid ${C.sep}`, padding: "8px 14px", display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ ...chromeDotStyle, background: "#ff5f56" }} />
                  <div style={{ ...chromeDotStyle, background: "#ffbd2e" }} />
                  <div style={{ ...chromeDotStyle, background: "#27c93f" }} />
                  <span style={{ marginLeft: 6, ...metaTextStyle }}>artefact.io/demo/acme-brand-strategy</span>
                </div>
                <div style={{ padding: isMobile ? 22 : 28, height: "100%", display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 10, letterSpacing: ".01em", color: "#92400e", background: "#fef9e7", border: "1px solid #fde68a", borderRadius: 999, padding: "6px 10px" }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#f59e0b" }} />
                    Demo render - names and figures masked at render time
                  </div>
                  <div style={{ ...quietLabelStyle, marginTop: 18 }}>Masked case study</div>
                  <div style={{ ...shellTitleStyle, marginTop: 6, color: "rgba(15,23,42,.76)" }}>[Client Name]</div>
                  <div style={{ marginTop: 6, ...metaTextStyle, paddingBottom: 14, borderBottom: `1px solid ${C.sep}` }}>[Project Name] · Week 6 · [masked]</div>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.05fr .95fr", gap: 18, marginTop: 18 }}>
                    <div style={{ padding: "16px 18px", border: `1px solid ${C.sep}`, borderRadius: 10, background: "#fbfaf6" }}>
                      <div style={quietLabelStyle}>What the prospect sees</div>
                      <div style={{ marginTop: 10, ...shellBodyStyle, color: "rgba(15,23,42,.62)" }}>
                        A clean engagement narrative with proof structure intact, but names, figures, and identifiers hidden at render time.
                      </div>
                      <div style={{ marginTop: 14, display: "grid", gap: 8 }}>
                        {[
                          "[Option] selected for launch narrative",
                          "Planning cycle compressed from XX days to XX days",
                          "[Market] positioning aligned around clinical proof",
                        ].map((item) => (
                          <div key={item} style={{ ...shellBodyStyle, color: "rgba(15,23,42,.66)" }}>{item}</div>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: "grid", gap: 14 }}>
                      <div style={{ padding: "16px 18px", border: `1px solid ${C.sep}`, borderRadius: 10 }}>
                        <div style={quietLabelStyle}>Render controls</div>
                        <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                          {[
                            ["Client name", "Masked"],
                            ["Commercial figures", "Masked"],
                            ["Decision structure", "Visible"],
                          ].map(([k, v]) => (
                            <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12, ...shellBodyStyle, color: "rgba(15,23,42,.62)" }}>
                              <span>{k}</span>
                              <span style={{ color: C.t1 }}>{v}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div style={{ padding: "16px 18px", border: `1px solid ${C.sep}`, borderRadius: 10 }}>
                        <div style={quietLabelStyle}>Safe to show</div>
                        <div style={{ marginTop: 8, ...shellBodyStyle, color: "rgba(15,23,42,.62)" }}>
                          The point is not anonymised decoration. It is credible proof from a real engagement without exposing the client.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Frame>
            ) : null}
          </div>
        </div>
      </div>
    </Frame>
  );
}

function AIIngestionMockup() {
  const C = useC();
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === "xs" || breakpoint === "sm";
  const [tick, setTick] = useState(0);
  const stepsPerScene = 46;

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTick((value) => value + 1);
    }, 70);

    return () => window.clearInterval(timer);
  }, []);

  const sceneIndex = Math.floor(tick / stepsPerScene) % INGESTION_SCENES.length;
  const scene = INGESTION_SCENES[sceneIndex];
  const sceneProgress = tick % stepsPerScene;
  const editorText = scene.sourceLines.join(" ");
  const typedEditorText = editorText.slice(0, Math.min(editorText.length, Math.max(1, sceneProgress * 2)));

  return (
    <Frame style={{ padding: isMobile ? 16 : 22, minWidth: 0, background: "linear-gradient(180deg, rgba(29,78,216,.08), rgba(248,250,252,.94))", overflow: "hidden" }}>
      <div style={{ fontSize: 11, letterSpacing: ".04em", textTransform: "uppercase", color: "rgba(15,23,42,.42)", marginBottom: 14 }}>
        Live ingestion
      </div>

      <div style={{ position: "relative", minHeight: isMobile ? 520 : 560 }}>
        <motion.div
          key={`render-surface-${sceneIndex}`}
          initial={{ opacity: 0.55, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          style={{
            position: "absolute",
            top: isMobile ? 8 : 10,
            left: isMobile ? 10 : 220,
            right: 10,
            bottom: isMobile ? 84 : 12,
            borderRadius: 24,
            background: "rgba(255,255,255,.94)",
            border: `1px solid ${C.sep}`,
            padding: isMobile ? "18px 16px" : "26px 30px",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) 240px", gap: 24, height: "100%" }}>
            <div style={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", paddingBottom: 14, borderBottom: `1px solid ${C.sep}` }}>
                <div>
                  <div style={{ fontSize: 11, color: "rgba(15,23,42,.42)" }}>{scene.renderLabel}</div>
                  <div style={{ marginTop: 6, fontSize: isMobile ? 24 : 30, lineHeight: 1.02, letterSpacing: "-.03em", color: C.t1 }}>
                    ACME board summary
                  </div>
                  <div style={{ marginTop: 8, fontSize: 12, lineHeight: 1.45, color: "rgba(15,23,42,.46)" }}>
                    Week 6 of 8 · Meridian Advisory · Generated from the current artefact
                  </div>
                </div>
                <div style={{ fontSize: 11, color: C.blue, whiteSpace: "nowrap" }}>Synced render</div>
              </div>

              <div style={{ marginTop: 18, display: "grid", gap: 14 }}>
                <div style={{ padding: "14px 14px", borderRadius: 14, background: "rgba(248,250,252,.82)", border: `1px solid ${C.sep}` }}>
                  <div style={{ fontSize: 11, color: "rgba(15,23,42,.42)" }}>Executive summary</div>
                  <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.6, color: C.t1 }}>{scene.renderBody}</div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
                  {[
                    ["Decision", "Premium launch direction approved"],
                    ["Narrative", "Clinical proof now leads the opening"],
                    ["Status", "Board ready"],
                    ["Carry-through", "Deck and handover inherit the same block"],
                  ].map(([label, body]) => (
                    <div key={label} style={{ padding: "12px 12px", borderRadius: 12, background: "#ffffff", border: `1px solid ${C.sep}` }}>
                      <div style={{ fontSize: 11, color: "rgba(15,23,42,.42)" }}>{label}</div>
                      <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.45, color: C.t1 }}>{body}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: "auto", paddingTop: 16, display: "grid", gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))", gap: 12 }}>
                {[
                  ["Client portal", "Current"],
                  ["Board summary", "Updated"],
                  ["Pitch deck", "Updated"],
                  ["Handover", "Ready"],
                ].map(([label, state], index) => (
                  <div key={label} style={{ padding: "12px 12px", borderRadius: 12, background: "rgba(248,250,252,.92)", border: `1px solid ${C.sep}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <motion.div
                        animate={{ scale: [1, 1.14, 1] }}
                        transition={{ duration: 1.4, repeat: Infinity, delay: index * 0.12 }}
                        style={{ width: 7, height: 7, borderRadius: "50%", background: C.blue }}
                      />
                      <div style={{ fontSize: 12, lineHeight: 1.35, color: C.t1 }}>{label}</div>
                    </div>
                    <div style={{ marginTop: 6, fontSize: 11, color: "rgba(15,23,42,.44)" }}>{state}</div>
                  </div>
                ))}
              </div>
            </div>

            {!isMobile ? (
              <div style={{ minWidth: 0, paddingLeft: 4 }}>
                <div style={{ padding: "14px 14px", borderRadius: 16, background: "#ffffff", border: `1px solid ${C.sep}` }}>
                  <div style={{ fontSize: 11, color: "rgba(15,23,42,.42)" }}>Added block</div>
                  <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                    {[
                      "Premium launch direction is approved.",
                      "Clinical proof now leads the opening rationale.",
                      "Deck and handover inherit the same block.",
                    ].map((line) => (
                      <div key={line} style={{ fontSize: 13, lineHeight: 1.5, color: "rgba(15,23,42,.58)" }}>
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </motion.div>

        <div
          style={{
            position: "absolute",
            top: isMobile ? 56 : 168,
            left: 0,
            width: isMobile ? "100%" : "38%",
            maxWidth: 360,
            borderRadius: 18,
            background: "rgba(255,255,255,.98)",
            border: `1px solid ${C.sep}`,
            boxShadow: "0 22px 48px rgba(15,23,42,.14)",
            padding: isMobile ? "18px 16px 20px" : "18px 18px 20px",
            zIndex: 4,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
            <div>
              <div style={{ fontSize: isMobile ? 24 : 28, lineHeight: 1.02, letterSpacing: "-.03em", color: C.t1 }}>New block</div>
              <div style={{ marginTop: 6, fontSize: 12, color: "rgba(15,23,42,.42)" }}>{scene.sourceLabel} · {scene.sourceKind}</div>
            </div>
            <motion.div
              animate={{ opacity: [0.45, 1, 0.45] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              style={{ fontSize: 11, color: C.blue }}
            >
              Claude listening
            </motion.div>
          </div>

          <motion.div
            animate={{ borderColor: ["rgba(29,78,216,.18)", "rgba(29,78,216,.65)", "rgba(29,78,216,.18)"], boxShadow: ["0 0 0 0 rgba(29,78,216,0)", "0 0 0 4px rgba(29,78,216,.10)", "0 0 0 0 rgba(29,78,216,0)"] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            style={{ marginTop: 18, borderRadius: 14, border: "1px solid rgba(29,78,216,.18)", background: "#fbfbf8", padding: "12px 12px", position: "relative", overflow: "hidden" }}
          >
            <div style={{ fontSize: 11, color: "rgba(15,23,42,.42)" }}>Input</div>
            <div style={{ marginTop: 10, minHeight: isMobile ? 104 : 122, fontSize: 13, lineHeight: 1.6, color: "rgba(15,23,42,.68)", whiteSpace: "pre-wrap" }}>
              {typedEditorText}
              <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 0.9, repeat: Infinity }} style={{ marginLeft: 1, color: C.blue }}>
                |
              </motion.span>
            </div>
          </motion.div>

          <div style={{ display: "flex", justifyContent: isMobile ? "stretch" : "flex-end", gap: 12, flexWrap: "wrap", marginTop: 18 }}>
            <div
              style={{
                borderRadius: 12,
                background: C.t1,
                color: "#f6f7f2",
                padding: "12px 18px",
                fontSize: isMobile ? 14 : 15,
                lineHeight: 1.2,
              }}
            >
              Approve Block
            </div>
          </div>

          {!isMobile ? (
            <motion.div
              aria-hidden="true"
              animate={{ x: [0, -10, 0], y: [0, 8, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              style={{
                position: "absolute",
                left: "58%",
                bottom: 34,
                zIndex: 3,
                filter: "drop-shadow(0 8px 16px rgba(15,23,42,.18))",
              }}
            >
              <svg width="22" height="26" viewBox="0 0 20 24" fill="none">
                <path d="M3 2L16 13H10.4L13.4 21L10.8 22L7.8 14H3V2Z" fill="#111827" stroke="#ffffff" />
              </svg>
            </motion.div>
          ) : null}
        </div>
      </div>
    </Frame>
  );
}

export default function LandingPage() {
  const C = useC();
  const breakpoint = useBreakpoint();
  const router = useRouter();

  const isMobile = breakpoint === "xs" || breakpoint === "sm";
  const isDesktop = breakpoint === "lg" || breakpoint === "xl";
  const pageMaxWidth =
    breakpoint === "xl"
      ? 1440
      : breakpoint === "lg"
        ? 1320
        : breakpoint === "md"
          ? 1160
          : undefined;
  const heroColumns = isDesktop ? "minmax(0, 0.78fr) minmax(0, 1.22fr)" : "1fr";
  const momentColumns =
    breakpoint === "lg" || breakpoint === "xl"
      ? "repeat(2, minmax(0, 1fr))"
      : breakpoint === "md"
        ? "repeat(2, minmax(0, 1fr))"
        : "1fr";

  const navItems = useMemo(
    () => [
      { href: "#problem", label: "The problem" },
      { href: "#renders", label: "Renders" },
      { href: "#how", label: "AI ingestion" },
      { href: "#pricing", label: "Pricing" },
    ],
    [],
  );

  return (
    <div
      style={{
        minHeight: "100%",
        overflowY: "auto",
        overflowX: "hidden",
        background:
          "radial-gradient(circle at top left, rgba(29,78,216,.07), transparent 28%), linear-gradient(180deg, #f2efe8 0%, #f6f4ef 28%, #fcfbf7 100%)",
        color: C.t1,
      }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          backdropFilter: "blur(18px)",
          background: "rgba(242,239,232,.76)",
          borderBottom: `1px solid ${C.sep}`,
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: isMobile ? "16px" : "16px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <LogoMark
              size={22}
              accent={C.t1}
              background="rgba(29,78,216,.08)"
              border="rgba(15,23,42,.12)"
            />
            <div style={{ fontSize: 15, letterSpacing: "-.03em", color: C.t1 }}>
              Engagement Artefact
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: isMobile ? 10 : 14,
              color: "rgba(15,23,42,.62)",
              fontSize: 12,
            }}
          >
            {!isMobile
              ? navItems.slice(0, 2).map((item) => (
                  <a key={item.href} href={item.href}>
                    {item.label}
                  </a>
                ))
              : null}
            <ThemeToggle />
            <button
              onClick={() => router.push("/create")}
              style={{
                border: "none",
                borderRadius: 999,
                background: C.t1,
                color: "#f6f6f3",
                padding: "10px 16px",
                fontSize: 11,
                letterSpacing: ".09em",
                textTransform: "uppercase",
              }}
            >
              Open create
            </button>
          </div>
        </div>
      </div>

      <section
        style={{
          padding: isMobile ? "24px 16px 48px" : "24px 24px 40px",
          minHeight: isMobile ? undefined : "calc(100svh - 73px)",
          display: "flex",
          alignItems: isMobile ? "stretch" : "center",
        }}
      >
        <div
          style={{
            maxWidth: pageMaxWidth,
            width: "100%",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: isDesktop ? "minmax(0, 0.7fr) minmax(0, 1.3fr)" : heroColumns,
            gap: isMobile ? 18 : 28,
            alignItems: "center",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <Frame
              style={{
                padding: isMobile ? 24 : "40px 38px",
                background: "linear-gradient(180deg, rgba(255,255,255,.97), rgba(249,248,245,.94))",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: "auto -10% -22% auto",
                  width: isMobile ? 220 : 320,
                  height: isMobile ? 220 : 320,
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(29,78,216,.12), transparent 68%)",
                  pointerEvents: "none",
                }}
              />
              <div
                className="mono"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 10,
                  letterSpacing: ".14em",
                  textTransform: "uppercase",
                  color: "rgba(15,23,42,.52)",
                  marginBottom: 24,
                  padding: "10px 12px",
                  borderRadius: 999,
                  border: `1px solid ${C.sep}`,
                  background: "rgba(255,255,255,.7)",
                }}
              >
                <span>For boutique consultancies</span>
              </div>
              <h1
                style={{
                  fontSize: "clamp(34px, 4.4vw, 56px)",
                  lineHeight: 1,
                  letterSpacing: "-.035em",
                  fontWeight: 500,
                  color: C.t1,
                  maxWidth: "10ch",
                  textWrap: "balance",
                }}
              >
                One source. Every deliverable. Always in sync.
              </h1>
              <p
                style={{
                  fontSize: 15,
                  lineHeight: 1.7,
                  color: "rgba(15,23,42,.7)",
                  maxWidth: 500,
                  marginTop: 16,
                }}
              >
                The engagement system that writes itself. For consultancies.
              </p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                  marginTop: 22,
                }}
              >
                <button
                  onClick={() => router.push("/create")}
                  style={{
                    border: "none",
                    borderRadius: 999,
                    background: C.t1,
                    color: "#f6f6f3",
                    padding: "14px 20px",
                    fontSize: 12,
                    letterSpacing: ".1em",
                    textTransform: "uppercase",
                  }}
                >
                  Preview the system
                </button>
                <a
                  href="#problem"
                  style={{
                    borderRadius: 999,
                    border: `1px solid ${C.sep}`,
                    background: "rgba(255,255,255,.88)",
                    color: C.t1,
                    padding: "14px 18px",
                    fontSize: 12,
                    letterSpacing: ".08em",
                    textTransform: "uppercase",
                  }}
                >
                  See how it works
                </a>
              </div>
              <div
                className="mono"
                style={{
                  marginTop: 14,
                  fontSize: 10,
                  letterSpacing: ".08em",
                  color: "rgba(15,23,42,.42)",
                }}
              >
                30-day free trial · no credit card required
              </div>
            </Frame>
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ display: "grid", gap: 12 }}>
              <HeroSystemAnimation />
            </div>
          </div>
        </div>
      </section>

      <section id="problem" style={{ padding: isMobile ? "56px 16px" : "104px 24px 112px", borderTop: `1px solid ${C.sep}`, borderBottom: `1px solid ${C.sep}` }}>
        <div style={{ maxWidth: pageMaxWidth, margin: "0 auto" }}>
          <SectionIntro
            eyebrow="The problem"
            title="You're running one engagement across five systems."
            body="CRM for the client. Notion for decisions. Slides for the board. Email for handover. A separate deck for the next pitch. Every update is a tax paid five times. Nothing stays current. Nothing compounds. And when the CEO joins week six and asks why - you're scrolling through Slack."
          />

          <div style={{ display: "grid", gridTemplateColumns: momentColumns, gap: 16, marginTop: isMobile ? 30 : 40 }}>
            {MOMENTS.map((item) => (
              <Frame key={item.title} style={{ padding: 20 }}>
                <div className="mono" style={{ fontSize: 9, letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(29,78,216,.9)", marginBottom: 10 }}>
                  {item.tag}
                </div>
                <div style={{ fontSize: 22, lineHeight: 1.12, letterSpacing: "-.025em", color: C.t1 }}>{item.title}</div>
                <div style={{ marginTop: 12, fontSize: 14, lineHeight: 1.75, color: "rgba(15,23,42,.68)" }}>{item.body}</div>
              </Frame>
            ))}
          </div>
        </div>
      </section>

      <section id="renders" style={{ padding: isMobile ? "56px 16px" : "104px 24px 112px", borderBottom: `1px solid ${C.sep}` }}>
        <div style={{ maxWidth: pageMaxWidth, margin: "0 auto" }}>
          <SectionIntro
            eyebrow="Five renders"
            title="Same data. Different surface."
            body="The point is not generating more documents. The point is configuring how one engagement state renders for a client, a board, a handover, or the next sale."
          />

          <div style={{ marginTop: isMobile ? 30 : 40 }}>
            <RenderShowcase />
          </div>
        </div>
      </section>

      <section id="how" style={{ padding: isMobile ? "56px 16px" : "104px 24px 112px", borderBottom: `1px solid ${C.sep}` }}>
        <div style={{ maxWidth: pageMaxWidth, margin: "0 auto", display: "grid", gridTemplateColumns: heroColumns, gap: isMobile ? 18 : 28, alignItems: "start" }}>
          <div style={{ minWidth: 0 }}>
            <SectionIntro
              eyebrow="AI ingestion"
              title="A 45-minute call becomes a few typed blocks, not a wall of transcript."
              body="Claude reads the engagement context first, extracts what changed, routes it to review, and only then lets approved blocks land in the right room. The client sees progress without waiting for another update email."
            />
          </div>

          <AIIngestionMockup />
        </div>
      </section>

      <section id="pricing" style={{ padding: isMobile ? "56px 16px 80px" : "104px 24px 120px" }}>
        <div style={{ maxWidth: pageMaxWidth, margin: "0 auto" }}>
          <SectionIntro
            eyebrow="Pricing"
            title="No per-engagement tax."
            body="You are not buying a nicer project tracker. You are buying a system that turns every engagement into a reusable practice asset."
          />

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, .92fr) minmax(0, 1.08fr)", gap: 16, marginTop: isMobile ? 30 : 40 }}>
            <Frame
              style={{
                padding: isMobile ? 22 : 28,
                background: "linear-gradient(180deg, rgba(255,255,255,.96), rgba(247,248,251,.92))",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div style={{ fontSize: 18, letterSpacing: "-.02em", color: C.t1 }}>Solo</div>
                <div
                  style={{
                    fontSize: 11,
                    color: "rgba(15,23,42,.56)",
                    padding: "6px 10px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,.8)",
                    border: `1px solid ${C.sep}`,
                  }}
                >
                  For one operator
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 22 }}>
                <div style={{ fontSize: 58, lineHeight: .95, letterSpacing: "-.04em", color: C.t1 }}>£99</div>
                <div style={{ fontSize: 14, color: "rgba(15,23,42,.58)" }}>/ month</div>
              </div>
              <div style={{ marginTop: 10, fontSize: 13, color: "rgba(15,23,42,.52)" }}>
                1 seat · 1 active engagement
              </div>
              <div style={{ marginTop: 18, fontSize: 15, lineHeight: 1.7, color: "rgba(15,23,42,.72)", maxWidth: 460 }}>
                For independent consultants who want the full engagement artefact system without team overhead.
              </div>

              <div style={{ display: "grid", gap: 12, marginTop: 24 }}>
                {[
                  "Client portal, board summary, handover doc, and pitch deck renders",
                  "AI-assisted block capture and approval flow",
                  "One live engagement system instead of scattered docs",
                  "Archive past work as reusable proof",
                ].map((item) => (
                  <div key={item} style={{ display: "grid", gridTemplateColumns: "14px minmax(0, 1fr)", gap: 10, alignItems: "start" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(29,78,216,.88)", marginTop: 8 }} />
                    <div style={{ fontSize: 14, lineHeight: 1.65, color: "rgba(15,23,42,.7)" }}>{item}</div>
                  </div>
                ))}
              </div>
            </Frame>

            <Frame
              style={{
                padding: isMobile ? 22 : 28,
                background: "linear-gradient(180deg, rgba(29,78,216,.08), rgba(255,255,255,.94))",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: "auto -8% -18% auto",
                  width: 240,
                  height: 240,
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(29,78,216,.12), transparent 70%)",
                  pointerEvents: "none",
                }}
              />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, position: "relative" }}>
                <div style={{ fontSize: 18, letterSpacing: "-.02em", color: C.t1 }}>Boutique</div>
                <div
                  style={{
                    fontSize: 11,
                    color: "rgba(29,78,216,.92)",
                    padding: "6px 10px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,.82)",
                    border: "1px solid rgba(29,78,216,.14)",
                  }}
                >
                  Most firms start here
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 22, position: "relative" }}>
                <div style={{ fontSize: 62, lineHeight: .95, letterSpacing: "-.045em", color: C.t1 }}>£399</div>
                <div style={{ fontSize: 14, color: "rgba(15,23,42,.58)" }}>/ month</div>
              </div>
              <div style={{ marginTop: 10, fontSize: 13, color: "rgba(15,23,42,.52)", position: "relative" }}>
                Up to 5 seats · multiple live engagements
              </div>
              <div style={{ marginTop: 18, fontSize: 15, lineHeight: 1.7, color: "rgba(15,23,42,.72)", maxWidth: 520, position: "relative" }}>
                For boutique consultancies that need one operating layer across delivery, handover, stakeholder reporting, and the next sale.
              </div>

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 12, marginTop: 24, position: "relative" }}>
                {[
                  ["Everything in Solo", "Plus practice-level visibility across engagements"],
                  ["Team seats", "Shared rooms, approvals, and review flow"],
                  ["Cross-engagement reuse", "Turn prior work into demo-ready proof"],
                  ["Faster handover", "The engagement record accumulates as you work"],
                ].map(([label, body]) => (
                  <div key={label} style={{ padding: "14px 14px 15px", borderRadius: 16, background: "rgba(255,255,255,.7)", border: "1px solid rgba(15,23,42,.08)" }}>
                    <div style={{ fontSize: 13, color: C.t1, letterSpacing: "-.01em" }}>{label}</div>
                    <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.6, color: "rgba(15,23,42,.62)" }}>{body}</div>
                  </div>
                ))}
              </div>
            </Frame>
          </div>

          <Frame style={{ marginTop: 18, padding: isMobile ? 20 : "26px 24px", background: "linear-gradient(180deg, rgba(255,255,255,.98), rgba(245,247,250,.94))" }}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) auto", gap: 18, alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "clamp(28px, 4vw, 54px)", lineHeight: 1.02, letterSpacing: "-.03em", color: C.t1, maxWidth: 760 }}>
                  Delivery system in the room. Proof system at handover. Commercial system for the next pitch.
                </div>
                <div style={{ marginTop: 14, fontSize: 15, lineHeight: 1.8, color: "rgba(15,23,42,.68)", maxWidth: 720 }}>
                  The point is not another workspace. The point is that one approved engagement state keeps rendering everywhere it needs to.
                </div>
              </div>

              <div style={{ display: "grid", gap: 10, justifyItems: isMobile ? "stretch" : "end" }}>
                <button
                  onClick={() => router.push("/create")}
                  style={{ border: "none", borderRadius: 999, background: C.t1, color: "#f6f6f3", padding: "14px 20px", fontSize: 12, letterSpacing: ".1em", textTransform: "uppercase", whiteSpace: "nowrap" }}
                >
                  Open the preview
                </button>
                <div style={{ fontSize: 12, color: "rgba(15,23,42,.5)" }}>
                  Need more than 5 seats or multi-practice rollout? Contact us.
                </div>
              </div>
            </div>
          </Frame>
        </div>
      </section>
    </div>
  );
}
