"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
    tag: "The problem",
    title: "When a stakeholder questions the work, the dispute is usually about memory.",
    body: "The artefact keeps a visible record of what changed, who agreed, and where the proof came from.",
  },
  {
    tag: "Five renders",
    title: "Portal, pitch deck, board summary, handover, demo render.",
    body: "One state object. Multiple surfaces. Update the engagement once and every render moves with it.",
  },
  {
    tag: "AI ingestion",
    title: "Calls and threads do not write directly into the engagement.",
    body: "They compress into reviewable blocks first, so the system stays useful instead of becoming another noisy transcript archive.",
  },
];

const RENDERS = [
  [
    "Client Portal",
    "Live context during delivery. Decisions, outcomes, and visible progress without status emails.",
  ],
  [
    "Pitch Deck",
    "Featured blocks become slides so new business pulls from real work instead of reconstructed memory.",
  ],
  [
    "Board Summary",
    "Stakeholder-ready proof of what changed, what matters now, and what needs a decision next.",
  ],
  [
    "Handover Doc",
    "Chronological closeout that gives the incoming stakeholder full context without re-briefing calls.",
  ],
  [
    "Demo Render",
    "Masked content with real structure, so every finished engagement becomes a sales asset.",
  ],
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
        className="mono"
        style={{
          fontSize: 10,
          letterSpacing: ".14em",
          textTransform: "uppercase",
          color: "rgba(15,23,42,.44)",
        }}
      >
        {eyebrow}
      </div>
      <h2
        style={{
          fontSize: "clamp(32px, 4vw, 54px)",
          lineHeight: 0.98,
          letterSpacing: "-.06em",
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
        <div style={{ fontSize: 15, lineHeight: 1.2, letterSpacing: "-.03em", color: C.t1 }}>
          {round.source}
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
          raw capture
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
          <div style={{ fontSize: compact ? 11 : 12, lineHeight: compact ? 1.45 : 1.6, color: "rgba(15,23,42,.74)" }}>
            {round.snippet}
          </div>
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
              Northstar Growth Reset
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
              meetings & decisions → featured for sales room
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
            {round.blockTitle}
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
            {round.blockMeta}
          </div>
        </motion.div>
        <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
          {[
            "Proof room updated",
            "Board summary ready to refresh",
            "Sales room render eligible",
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
          prospect-facing proof
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
          <div style={{ fontSize: compact ? 12 : 13, lineHeight: compact ? 1.4 : 1.5, color: C.t1 }}>
            {round.salesTitle}
          </div>
          <div style={{ fontSize: compact ? 10 : 11, lineHeight: compact ? 1.45 : 1.6, color: "rgba(15,23,42,.68)", marginTop: 8 }}>
            {round.salesProof}
          </div>
        </motion.div>
        <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
          {["Masked company details", "Featured room proof", "Ready for live demo"].map(
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
        padding: isMobile ? 16 : 22,
        background: "linear-gradient(180deg, rgba(207,223,231,.94), rgba(199,218,227,.96))",
        borderRadius: 26,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) 88px minmax(0, 1fr) 88px minmax(0, 1fr)",
          gap: isMobile ? 18 : 18,
          alignItems: "center",
          minHeight: isMobile ? undefined : 420,
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
              Board summary
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

export default function LandingPage() {
  const C = useC();
  const breakpoint = useBreakpoint();
  const router = useRouter();

  const isMobile = breakpoint === "xs" || breakpoint === "sm";
  const isDesktop = breakpoint === "lg" || breakpoint === "xl";
  const heroColumns = isDesktop ? "minmax(0, 0.78fr) minmax(0, 1.22fr)" : "1fr";
  const renderColumns =
    breakpoint === "lg" || breakpoint === "xl"
      ? "repeat(5, minmax(0, 1fr))"
      : breakpoint === "md"
        ? "repeat(2, minmax(0, 1fr))"
        : "1fr";
  const momentColumns =
    breakpoint === "lg" || breakpoint === "xl" ? "repeat(3, minmax(0, 1fr))" : "1fr";

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
          padding: isMobile ? "24px 16px 48px" : "34px 24px 72px",
        }}
      >
        <div
          style={{
            maxWidth: 1460,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: heroColumns,
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
                  lineHeight: 0.98,
                  letterSpacing: "-.065em",
                  fontWeight: 500,
                  color: C.t1,
                  maxWidth: "8ch",
                  textWrap: "balance",
                }}
              >
                Approve a block. Every render updates.
              </h1>
              <p
                style={{
                  fontSize: 15,
                  lineHeight: 1.7,
                  color: "rgba(15,23,42,.7)",
                  maxWidth: 420,
                  marginTop: 16,
                }}
              >
                Client portal. Pitch deck. Board summary. Handover doc. All live from the same source. Log it once and it&apos;s everywhere.
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

      <section id="problem" style={{ padding: isMobile ? "56px 16px" : "84px 24px", borderTop: `1px solid ${C.sep}`, borderBottom: `1px solid ${C.sep}` }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <SectionIntro
            eyebrow="The problem"
            title="When the engagement ends, most firms cannot point to a durable record of what happened."
            body="Decisions scatter across calls, Slack, email, and decks. The client remembers fragments. The next proposal gets rebuilt from memory. The practice does not compound."
          />

          <div style={{ display: "grid", gridTemplateColumns: momentColumns, gap: 16, marginTop: 30 }}>
            {MOMENTS.map((item) => (
              <Frame key={item.title} style={{ padding: 20 }}>
                <div className="mono" style={{ fontSize: 9, letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(29,78,216,.9)", marginBottom: 10 }}>
                  {item.tag}
                </div>
                <div style={{ fontSize: 22, lineHeight: 1.08, letterSpacing: "-.05em", color: C.t1 }}>{item.title}</div>
                <div style={{ marginTop: 12, fontSize: 14, lineHeight: 1.75, color: "rgba(15,23,42,.68)" }}>{item.body}</div>
              </Frame>
            ))}
          </div>
        </div>
      </section>

      <section id="renders" style={{ padding: isMobile ? "56px 16px" : "84px 24px", borderBottom: `1px solid ${C.sep}` }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <SectionIntro
            eyebrow="Five renders"
            title="Same data. Different surface."
            body="The point is not generating more documents. The point is configuring how one engagement state renders for a client, a board, a handover, or the next sale."
          />

          <div style={{ display: "grid", gridTemplateColumns: renderColumns, gap: 12, marginTop: 30 }}>
            {RENDERS.map(([title, body], index) => (
              <Frame key={title} style={{ padding: 18, minHeight: 210, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: index === 0 ? C.blue : "rgba(15,23,42,.16)" }} />
                <div className="mono" style={{ fontSize: 9, letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(15,23,42,.4)", marginBottom: 12 }}>
                  {index === 0 ? "During delivery" : index === 1 ? "New business" : index === 2 ? "Stakeholders" : index === 3 ? "At close" : "Sales asset"}
                </div>
                <div style={{ fontSize: 18, lineHeight: 1.08, letterSpacing: "-.04em", color: C.t1 }}>{title}</div>
                <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.7, color: "rgba(15,23,42,.68)" }}>{body}</div>
              </Frame>
            ))}
          </div>
        </div>
      </section>

      <section id="how" style={{ padding: isMobile ? "56px 16px" : "84px 24px", borderBottom: `1px solid ${C.sep}` }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: heroColumns, gap: 18, alignItems: "start" }}>
          <div style={{ minWidth: 0 }}>
            <SectionIntro
              eyebrow="AI ingestion"
              title="A 45-minute call becomes a few typed blocks, not a wall of transcript."
              body="Claude reads the engagement context first, extracts what changed, routes it to review, and only then lets approved blocks land in the right room. The client sees progress without waiting for another update email."
            />
          </div>

          <Frame style={{ padding: 20, minWidth: 0 }}>
            <div className="mono" style={{ fontSize: 9, letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(15,23,42,.42)", marginBottom: 14 }}>
              Compression
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              {[
                ["Zoom call · 45 min", "2-5 blocks"],
                ["Slack thread · 30 messages", "1-2 blocks"],
                ["Email chain · 8 messages", "1-3 blocks"],
                ["Voice memo · 3 min", "1 block"],
              ].map(([input, output]) => (
                <div key={input} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 10, alignItems: "center", paddingBottom: 12, borderBottom: `1px solid ${C.sep}` }}>
                  <div style={{ fontSize: 13, color: "rgba(15,23,42,.66)" }}>{input}</div>
                  <div className="mono" style={{ fontSize: 10, color: "rgba(15,23,42,.34)" }}>→</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.blue }}>{output}</div>
                </div>
              ))}
            </div>

            <Frame style={{ marginTop: 16, padding: 16, borderRadius: 18, boxShadow: "none", background: "rgba(248,250,252,.9)" }}>
              <div className="mono" style={{ fontSize: 9, letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(15,23,42,.42)", marginBottom: 12 }}>
                Pending review · 3 items
              </div>
              <div style={{ display: "grid", gap: 12 }}>
                {[
                  ["High confidence", "Decision: premium tier selected for launch"],
                  ["Medium confidence", "Note: CEO may resist clinical positioning"],
                  ["Medium confidence", "Scope flag: social media templates request"],
                ].map(([state, copy], index) => (
                  <div key={copy} style={{ display: "grid", gap: 6, padding: 12, borderRadius: 14, border: `1px solid ${index === 0 ? "rgba(29,78,216,.14)" : C.sep}`, background: index === 0 ? "rgba(29,78,216,.06)" : "rgba(255,255,255,.88)" }}>
                    <div className="mono" style={{ fontSize: 9, letterSpacing: ".08em", textTransform: "uppercase", color: index === 0 ? C.blue : "rgba(15,23,42,.42)" }}>
                      {state}
                    </div>
                    <div style={{ fontSize: 13, lineHeight: 1.6, color: "rgba(15,23,42,.76)" }}>{copy}</div>
                  </div>
                ))}
              </div>
            </Frame>
          </Frame>
        </div>
      </section>

      <section id="pricing" style={{ padding: isMobile ? "56px 16px 80px" : "84px 24px 96px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <SectionIntro
            eyebrow="Pricing"
            title="No per-engagement tax."
            body="You are not buying a nicer project tracker. You are buying a system that turns every engagement into a reusable practice asset."
          />

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, maxWidth: 760, marginTop: 30 }}>
            <Frame style={{ padding: 24 }}>
              <div className="mono" style={{ fontSize: 9, letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(15,23,42,.42)", marginBottom: 12 }}>
                Solo
              </div>
              <div style={{ fontSize: 62, lineHeight: 1, letterSpacing: "-.09em", color: C.t1 }}>£99</div>
              <div className="mono" style={{ fontSize: 10, color: "rgba(15,23,42,.42)", marginTop: 8 }}>
                per month · 1 active engagement
              </div>
              <div style={{ marginTop: 18, fontSize: 14, lineHeight: 1.75, color: "rgba(15,23,42,.68)" }}>
                For consultants running sequential engagements and wanting the full artefact system without seat overhead.
              </div>
            </Frame>

            <Frame style={{ padding: 24, background: "#111214", border: "1px solid rgba(255,255,255,.08)" }}>
              <div className="mono" style={{ fontSize: 9, letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(255,255,255,.34)", marginBottom: 12 }}>
                Boutique · most popular
              </div>
              <div style={{ fontSize: 62, lineHeight: 1, letterSpacing: "-.09em", color: "#fff" }}>£399</div>
              <div className="mono" style={{ fontSize: 10, color: "rgba(255,255,255,.34)", marginTop: 8 }}>
                per month · up to 5 seats
              </div>
              <div style={{ marginTop: 18, fontSize: 14, lineHeight: 1.75, color: "rgba(255,255,255,.62)" }}>
                For firms running multiple engagements simultaneously and building practice-level intelligence across work.
              </div>
            </Frame>
          </div>

          <Frame style={{ marginTop: 18, padding: isMobile ? 20 : "26px 24px", background: "linear-gradient(180deg, rgba(255,255,255,.96), rgba(247,248,251,.94))" }}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr auto", gap: 18, alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "clamp(28px, 4vw, 58px)", lineHeight: 0.96, letterSpacing: "-.07em", color: C.t1, maxWidth: 760 }}>
                  They are not buying a tool. They are buying confidence that the engagement will not turn into a memory contest.
                </div>
                <div style={{ marginTop: 14, fontSize: 15, lineHeight: 1.8, color: "rgba(15,23,42,.68)", maxWidth: 660 }}>
                  Use the same system for delivery, handover, stakeholder proof, and the next sale.
                </div>
              </div>

              <button
                onClick={() => router.push("/create")}
                style={{ border: "none", borderRadius: 999, background: C.t1, color: "#f6f6f3", padding: "14px 20px", fontSize: 12, letterSpacing: ".1em", textTransform: "uppercase", whiteSpace: "nowrap" }}
              >
                Open the preview
              </button>
            </div>
          </Frame>
        </div>
      </section>
    </div>
  );
}
