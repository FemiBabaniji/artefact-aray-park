"use client";

import Image from "next/image";
import { useMemo, useState, type ReactNode } from "react";
import {
  siClaude,
  siCline,
  siCursor,
  siDiscord,
  siGmail,
  siWindsurf,
  siZoom,
  type SimpleIcon,
} from "simple-icons";
import { EngagementComposer, type EngagementComposerArtefact } from "@/components/create/EngagementComposer";
import { useConnectorStatus } from "@/components/create/connectors/hooks/useConnectorStatus";
import { useIngestionQueue } from "@/components/create/connectors/hooks/useIngestionQueue";
import { useOutputGeneration } from "@/components/create/connectors/hooks/useOutputGeneration";
import type {
  EngagementSnapshot,
  InputConnector,
  OutputConnector,
  QueuedItem,
} from "@/components/create/connectors/types";
import { useResponsive } from "@/components/mobile/ResponsiveLayout";
import { useC } from "@/hooks/useC";

type DashboardSection = "home" | "artefacts" | "integrations";

type ArtefactRecord = EngagementComposerArtefact & {
  id: string;
  updatedAt: string;
  summary: string;
  roomCount: number;
  featuredCount: number;
  clientViewedAt: string;
  nextAction: string;
  decisionHeadline: string;
  claudeAction: string;
};

const ARTEFACTS: ArtefactRecord[] = [
  {
    id: "northstar-growth-reset",
    name: "Northstar Growth Reset",
    clientName: "Northstar Health",
    consultantName: "Meridian Advisory",
    value: "$68,000",
    duration: "12 weeks",
    practiceLabel: "Strategy Sprint",
    phase: "active",
    updatedAt: "3d ago",
    summary: "Growth reset, operating cadence, and board-ready handover.",
    roomCount: 7,
    featuredCount: 4,
    clientViewedAt: "Jake viewed portal 3d ago",
    nextAction: "Approve 3 AI-captured items from this week's steering call.",
    decisionHeadline: "Weekly operating cadence approved and featured in Decisions.",
    claudeAction: "Claude logged 2 decision blocks from the latest Zoom transcript.",
  },
  {
    id: "harbor-retail-replatform",
    name: "Harbor Retail Replatform",
    clientName: "Harbor Retail",
    consultantName: "Meridian Advisory",
    value: "$92,000",
    duration: "16 weeks",
    practiceLabel: "Transformation",
    phase: "review",
    updatedAt: "1d ago",
    summary: "Migration decisions, delivery risks, and weekly executive recaps.",
    roomCount: 8,
    featuredCount: 3,
    clientViewedAt: "Alicia viewed handover render yesterday",
    nextAction: "Resolve analytics migration risk before review closes.",
    decisionHeadline: "Budget ownership moved into the steering cadence.",
    claudeAction: "Claude generated a board-summary draft from featured outcomes.",
  },
  {
    id: "solstice-ops-reset",
    name: "Solstice Ops Reset",
    clientName: "Solstice Energy",
    consultantName: "Meridian Advisory",
    value: "$54,000",
    duration: "10 weeks",
    practiceLabel: "Operating Model",
    phase: "scoping",
    updatedAt: "6h ago",
    summary: "Scope design, success criteria, and cross-functional intake.",
    roomCount: 6,
    featuredCount: 2,
    clientViewedAt: "No client views yet",
    nextAction: "Finalize scope room and send portal preview.",
    decisionHeadline: "North-star objective drafted and ready for client sign-off.",
    claudeAction: "Claude summarized intake notes into a scoping draft.",
  },
];

const INPUT_BRAND: Record<string, { label: string; tone: string; icon?: SimpleIcon; image?: string }> = {
  gmail: { label: "Gmail", tone: "#EA4335", icon: siGmail },
  outlook: { label: "Outlook", tone: "#0078D4", image: "/integration-logos/outlook.ico" },
  slack: { label: "Slack", tone: "#611f69", image: "/integration-logos/slack.ico" },
  discord: { label: "Discord", tone: "#5865F2", icon: siDiscord },
  zoom: { label: "Zoom", tone: "#0B5CFF", icon: siZoom },
  manual: { label: "Paste / Drop", tone: "#6b7280" },
};

const OUTPUT_BRAND: Record<string, { label: string; tone: string; icon?: SimpleIcon; image?: string }> = {
  claude: { label: "Claude", tone: "#d97706", icon: siClaude },
  chatgpt: { label: "ChatGPT", tone: "#10a37f", image: "/integration-logos/chatgpt.ico" },
  cursor: { label: "Cursor", tone: "#111111", icon: siCursor },
  windsurf: { label: "Windsurf", tone: "#0f766e", icon: siWindsurf },
  cline: { label: "Cline", tone: "#4f46e5", icon: siCline },
  mcp: { label: "MCP", tone: "#2563eb" },
  resume: { label: "Resume", tone: "#7c3aed" },
  portal: { label: "Portal", tone: "#15803d" },
};

function phaseColor(phase: string, blue: string, amber: string, green: string, edge: string) {
  if (phase === "active") return blue;
  if (phase === "review") return amber;
  if (phase === "scoping") return edge;
  return green;
}

function LogoMark({
  children,
  tone,
}: {
  children: ReactNode;
  tone: string;
}) {
  const C = useC();
  return (
    <div
      style={{
        width: 34,
        height: 34,
        borderRadius: 10,
        border: `1px solid ${C.sep}`,
        background: `${tone}14`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {children}
    </div>
  );
}

function BrandIcon({
  icon,
  image,
  label,
  tone,
}: {
  icon?: SimpleIcon;
  image?: string;
  label: string;
  tone: string;
}) {
  if (image) {
    return (
      <LogoMark tone={tone}>
        <Image src={image} alt={label} width={18} height={18} style={{ width: 18, height: 18 }} />
      </LogoMark>
    );
  }

  if (icon) {
    return (
      <LogoMark tone={tone}>
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" style={{ display: "block", fill: tone }}>
          <path d={icon.path} />
        </svg>
      </LogoMark>
    );
  }

  return (
    <LogoMark tone={tone}>
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: tone }}>{label.slice(0, 2).toUpperCase()}</span>
    </LogoMark>
  );
}

function SurfaceCard({
  children,
  style,
}: {
  children: ReactNode;
  style?: React.CSSProperties;
}) {
  const C = useC();
  return (
    <div
      style={{
        border: `1px solid ${C.sep}`,
        borderRadius: 18,
        background: C.bg,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SectionHeader({
  title,
  detail,
  action,
}: {
  title: string;
  detail?: string;
  action?: ReactNode;
}) {
  const C = useC();
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 18 }}>
      <div>
        <div style={{ fontSize: 24, lineHeight: 1.05, letterSpacing: "-.04em", fontWeight: 500, color: C.t1, marginBottom: 6 }}>
          {title}
        </div>
        {detail ? <div style={{ fontSize: 14, color: C.t3 }}>{detail}</div> : null}
      </div>
      {action}
    </div>
  );
}

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail: string;
}) {
  const C = useC();
  return (
    <SurfaceCard style={{ padding: 18 }}>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: ".08em", textTransform: "uppercase", color: C.t4, marginBottom: 10 }}>
        {label}
      </div>
      <div style={{ fontSize: 30, lineHeight: 1, letterSpacing: "-.05em", fontWeight: 500, color: C.t1, marginBottom: 8 }}>{value}</div>
      <div style={{ fontSize: 13, color: C.t3 }}>{detail}</div>
    </SurfaceCard>
  );
}

function InputConnectorCard({
  connector,
  active,
  onSelect,
  onConnect,
  onSync,
}: {
  connector: InputConnector;
  active: boolean;
  onSelect: () => void;
  onConnect: () => void;
  onSync: () => void;
}) {
  const C = useC();
  const brand = INPUT_BRAND[connector.provider];
  const actionLabel = connector.status === "disconnected" ? "Connect" : "Sync now";
  const action = connector.status === "disconnected" ? onConnect : onSync;

  return (
    <button
      onClick={onSelect}
      style={{
        width: "100%",
        textAlign: "left",
        padding: 14,
        borderRadius: 16,
        border: `1px solid ${active ? brand.tone : C.sep}`,
        background: active ? `${brand.tone}0E` : C.bg,
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        cursor: "pointer",
      }}
    >
      <BrandIcon icon={brand.icon} image={brand.image} label={brand.label} tone={brand.tone} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 4 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: C.t1 }}>{brand.label}</div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: connector.itemsQueued > 0 ? brand.tone : C.t4 }}>
            {connector.itemsQueued} queued
          </div>
        </div>
        <div style={{ fontSize: 12, color: C.t3, marginBottom: 10 }}>
          {connector.accountLabel ?? "Not connected"} · {connector.status}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ fontSize: 12, color: C.t4 }}>
            {connector.lastSync ? `Last sync ${connector.lastSync}` : `Routes to ${connector.targetRoom}`}
          </div>
          <button
            onClick={(event) => {
              event.stopPropagation();
              action();
            }}
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              color: brand.tone,
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
            }}
          >
            {actionLabel} →
          </button>
        </div>
      </div>
    </button>
  );
}

function OutputConnectorCard({
  connector,
  active,
  done,
  running,
  onSelect,
  onRun,
}: {
  connector: OutputConnector;
  active: boolean;
  done: boolean;
  running: boolean;
  onSelect: () => void;
  onRun: () => void;
}) {
  const C = useC();
  const brand = OUTPUT_BRAND[connector.target];
  const actionLabel = connector.action === "copy"
    ? "Copy"
    : connector.action === "download"
      ? "Download"
      : connector.action === "serve"
        ? "Serve"
        : "Open";

  return (
    <button
      onClick={onSelect}
      style={{
        width: "100%",
        textAlign: "left",
        padding: 14,
        borderRadius: 16,
        border: `1px solid ${active ? brand.tone : C.sep}`,
        background: active ? `${brand.tone}0E` : C.bg,
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        cursor: "pointer",
      }}
    >
      <BrandIcon icon={brand.icon} image={brand.image} label={brand.label} tone={brand.tone} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 4 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: C.t1 }}>{brand.label}</div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: done ? brand.tone : C.t4 }}>
            {connector.format}
          </div>
        </div>
        <div style={{ fontSize: 12, color: C.t3, marginBottom: 10 }}>
          {connector.includeRooms.length} rooms · {connector.maskClient ? "masked" : "real client"}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ fontSize: 12, color: done ? brand.tone : C.t4 }}>
            {running ? "Generating…" : done ? "Ready" : "One-click export"}
          </div>
          <button
            onClick={(event) => {
              event.stopPropagation();
              onRun();
            }}
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              color: brand.tone,
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
            }}
          >
            {actionLabel} →
          </button>
        </div>
      </div>
    </button>
  );
}

function HomeView({
  artefacts,
  pendingCount,
  queue,
  onOpenArtefact,
}: {
  artefacts: ArtefactRecord[];
  pendingCount: number;
  queue: QueuedItem[];
  onOpenArtefact: (artefact: ArtefactRecord) => void;
}) {
  const C = useC();
  const activeCount = artefacts.filter((artefact) => artefact.phase === "active" || artefact.phase === "review").length;
  const latestViews = artefacts.filter((artefact) => !artefact.clientViewedAt.toLowerCase().includes("no client")).length;
  const decisions = artefacts.slice(0, 3);
  const recentQueue = queue.filter((item) => item.status === "pending").slice(0, 3);

  return (
    <div>
      <SectionHeader title="Home" detail="What needs you now across the practice." />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 18 }}>
        <StatCard label="Active engagements" value={activeCount} detail="Live delivery and review work." />
        <StatCard label="Pending review" value={pendingCount} detail="AI-captured items waiting for approval." />
        <StatCard label="Recent client views" value={latestViews} detail="Engagements with recent portal activity." />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.3fr) minmax(320px, .9fr)", gap: 14 }}>
        <SurfaceCard style={{ padding: 18 }}>
          <SectionHeader title="Active artefacts" detail="Jump straight back into the work." />
          <div style={{ display: "grid", gap: 12 }}>
            {artefacts.map((artefact) => (
              <button
                key={artefact.id}
                onClick={() => onOpenArtefact(artefact)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: 16,
                  borderRadius: 16,
                  border: `1px solid ${C.sep}`,
                  background: C.bg,
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
                  <div style={{ fontSize: 16, fontWeight: 500, color: C.t1 }}>{artefact.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.t4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: phaseColor(artefact.phase, C.blue, C.amber, C.green, C.edge) }} />
                    {artefact.phase}
                  </div>
                </div>
                <div style={{ fontSize: 13, color: C.t3, marginBottom: 10 }}>{artefact.summary}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12, fontSize: 12, color: C.t4 }}>
                  <span>{artefact.clientName}</span>
                  <span>{artefact.value}</span>
                  <span>{artefact.updatedAt}</span>
                </div>
              </button>
            ))}
          </div>
        </SurfaceCard>

        <div style={{ display: "grid", gap: 14 }}>
          <SurfaceCard style={{ padding: 18 }}>
            <SectionHeader title="Pending review" detail="Latest queue items from integrations." />
            <div style={{ display: "grid", gap: 12 }}>
              {recentQueue.length === 0 ? (
                <div style={{ fontSize: 13, color: C.t4 }}>No pending items.</div>
              ) : recentQueue.map((item) => (
                <div key={item.id} style={{ paddingBottom: 12, borderBottom: `1px solid ${C.sep}` }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: C.t1, marginBottom: 4 }}>{item.preview}</div>
                  <div style={{ fontSize: 12, color: C.t3 }}>{item.sourceType} → {item.suggestedRoom} · {item.createdAt}</div>
                </div>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard style={{ padding: 18 }}>
            <SectionHeader title="Recent decisions" detail="What changed across artefacts." />
            <div style={{ display: "grid", gap: 12 }}>
              {decisions.map((artefact) => (
                <div key={artefact.id} style={{ paddingBottom: 12, borderBottom: `1px solid ${C.sep}` }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: C.t1, marginBottom: 4 }}>{artefact.decisionHeadline}</div>
                  <div style={{ fontSize: 12, color: C.t3 }}>{artefact.name} · {artefact.updatedAt}</div>
                </div>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard style={{ padding: 18 }}>
            <SectionHeader title="Claude activity" detail="Recent AI contributions." />
            <div style={{ display: "grid", gap: 12 }}>
              {artefacts.slice(0, 2).map((artefact) => (
                <div key={artefact.id} style={{ paddingBottom: 12, borderBottom: `1px solid ${C.sep}` }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: C.t1, marginBottom: 4 }}>{artefact.claudeAction}</div>
                  <div style={{ fontSize: 12, color: C.t3 }}>{artefact.name}</div>
                </div>
              ))}
            </div>
          </SurfaceCard>
        </div>
      </div>
    </div>
  );
}

function ArtefactsView({
  artefacts,
  onOpenArtefact,
}: {
  artefacts: ArtefactRecord[];
  onOpenArtefact: (artefact: ArtefactRecord) => void;
}) {
  const C = useC();

  return (
    <div>
      <SectionHeader title="Artefacts" detail="Select an engagement artefact to open the full drill surface." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
        {artefacts.map((artefact) => (
          <button
            key={artefact.id}
            onClick={() => onOpenArtefact(artefact)}
            style={{
              width: "100%",
              textAlign: "left",
              padding: 18,
              borderRadius: 18,
              border: `1px solid ${C.sep}`,
              background: C.bg,
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 20, lineHeight: 1.05, letterSpacing: "-.03em", fontWeight: 500, color: C.t1 }}>{artefact.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.t4 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: phaseColor(artefact.phase, C.blue, C.amber, C.green, C.edge) }} />
                {artefact.phase}
              </div>
            </div>
            <div style={{ fontSize: 13, color: C.t3, marginBottom: 14 }}>{artefact.summary}</div>
            <div style={{ display: "grid", gap: 8, fontSize: 12, color: C.t4 }}>
              <div>{artefact.clientName} · {artefact.practiceLabel}</div>
              <div>{artefact.roomCount} rooms · {artefact.featuredCount} featured</div>
              <div>{artefact.clientViewedAt}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function IntegrationsView({
  snapshot,
  inputs,
  outputs,
  activeInput,
  activeOutput,
  setActiveInput,
  setActiveOutput,
  connectInput,
  syncInput,
  queue,
  pendingCount,
  approve,
  reject,
}: {
  snapshot: EngagementSnapshot;
  inputs: InputConnector[];
  outputs: OutputConnector[];
  activeInput: string;
  activeOutput: string;
  setActiveInput: (id: string) => void;
  setActiveOutput: (id: string) => void;
  connectInput: (id: string) => void;
  syncInput: (id: string) => void;
  queue: QueuedItem[];
  pendingCount: number;
  approve: (id: string) => QueuedItem | null;
  reject: (id: string) => void;
}) {
  const C = useC();
  const { generating, completed, runOutput } = useOutputGeneration(snapshot);
  const pendingQueue = queue.filter((item) => item.status === "pending");

  return (
    <div>
      <SectionHeader title="Integrations" detail="Bring context in, review it, and push the artefact out to tools." />

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 14, marginBottom: 14 }}>
        <SurfaceCard style={{ padding: 18 }}>
          <SectionHeader title="Inputs" detail="External services flowing into the artefact." />
          <div style={{ display: "grid", gap: 12 }}>
            {inputs.map((connector) => (
              <InputConnectorCard
                key={connector.id}
                connector={connector}
                active={activeInput === connector.id}
                onSelect={() => setActiveInput(connector.id)}
                onConnect={() => connectInput(connector.id)}
                onSync={() => syncInput(connector.id)}
              />
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard style={{ padding: 18 }}>
          <SectionHeader title="Outputs" detail="One-click exports from the current artefact state." />
          <div style={{ display: "grid", gap: 12 }}>
            {outputs.map((connector) => (
              <OutputConnectorCard
                key={connector.id}
                connector={connector}
                active={activeOutput === connector.id}
                done={completed === connector.id}
                running={generating === connector.id}
                onSelect={() => setActiveOutput(connector.id)}
                onRun={() => void runOutput(connector)}
              />
            ))}
          </div>
        </SurfaceCard>
      </div>

      <SurfaceCard style={{ padding: 18 }}>
        <SectionHeader title="Review queue" detail={`${pendingCount} pending items awaiting approval.`} />
        <div style={{ display: "grid", gap: 12 }}>
          {pendingQueue.length === 0 ? (
            <div style={{ fontSize: 13, color: C.t4 }}>Queue is clear.</div>
          ) : pendingQueue.map((item) => (
            <div key={item.id} style={{ paddingBottom: 12, borderBottom: `1px solid ${C.sep}` }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: C.t1, marginBottom: 4 }}>{item.preview}</div>
              <div style={{ fontSize: 12, color: C.t4, marginBottom: 6 }}>
                {item.sourceType} → {item.suggestedRoom} · {item.suggestedType} · {item.createdAt}
              </div>
              <div style={{ fontSize: 13, color: C.t2, marginBottom: 10 }}>{item.meta}</div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button
                  onClick={() => approve(item.id)}
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 10,
                    color: C.blue,
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                  }}
                >
                  Accept →
                </button>
                <button
                  onClick={() => reject(item.id)}
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 10,
                    color: C.t4,
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                  }}
                >
                  Reject →
                </button>
              </div>
            </div>
          ))}
        </div>
      </SurfaceCard>
    </div>
  );
}

export function ArtefactDashboard() {
  const C = useC();
  const { isMobile } = useResponsive();
  const [section, setSection] = useState<DashboardSection>("home");
  const [selectedArtefact, setSelectedArtefact] = useState<ArtefactRecord | null>(null);
  const connectorState = useConnectorStatus();
  const queueState = useIngestionQueue();

  const currentArtefact = selectedArtefact ?? ARTEFACTS[0];
  const snapshot = useMemo<EngagementSnapshot>(
    () => ({
      name: currentArtefact.name,
      clientName: currentArtefact.clientName,
      consultantName: currentArtefact.consultantName,
      phase: currentArtefact.phase,
      value: currentArtefact.value,
      duration: currentArtefact.duration,
      rooms: [
        {
          id: "scope",
          name: "Scope",
          blocks: [{ id: "b1", title: "North-star objective", content: currentArtefact.summary, type: "status", featured: true, createdAt: "Mar 3" }],
        },
        {
          id: "decisions",
          name: "Decisions",
          blocks: [{ id: "b2", title: currentArtefact.decisionHeadline, content: currentArtefact.nextAction, type: "decision", featured: true, createdAt: "Mar 7" }],
        },
        {
          id: "outcomes",
          name: "Outcomes",
          blocks: [{ id: "b3", title: "Latest consultant context", content: currentArtefact.claudeAction, type: "outcome", featured: false, createdAt: "Mar 11" }],
        },
      ],
    }),
    [currentArtefact],
  );

  const navItems: Array<{ id: DashboardSection; label: string }> = [
    { id: "home", label: "Home" },
    { id: "artefacts", label: "Artefacts" },
    { id: "integrations", label: "Integrations" },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.void,
        padding: isMobile ? "20px 16px 88px" : "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 1440,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "92px minmax(0, 1fr)",
          gap: 18,
          alignItems: "stretch",
        }}
      >
        {!isMobile && (
          <SurfaceCard style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ padding: "10px 8px 16px", fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.t4 }}>create</div>
            {navItems.map((item) => {
              const active = section === item.id && !selectedArtefact;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedArtefact(null);
                    setSection(item.id);
                  }}
                  style={{
                    width: "100%",
                    minHeight: 58,
                    borderRadius: 16,
                    border: `1px solid ${active ? C.sep : "transparent"}`,
                    background: active ? C.bg : "transparent",
                    color: active ? C.t1 : C.t3,
                    cursor: "pointer",
                    fontSize: 12,
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </SurfaceCard>
        )}

        <SurfaceCard
          style={{
            minHeight: isMobile ? "calc(100vh - 108px)" : "calc(100vh - 48px)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: isMobile ? "18px 16px" : "22px 24px", borderBottom: `1px solid ${C.sep}` }}>
            {selectedArtefact ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <button
                  onClick={() => setSelectedArtefact(null)}
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 10,
                    color: C.t4,
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                  }}
                >
                  ← all artefacts
                </button>
                <div style={{ fontSize: 18, letterSpacing: "-.03em", fontWeight: 500, color: C.t1 }}>{selectedArtefact.name}</div>
              </div>
            ) : (
              <div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: ".08em", textTransform: "uppercase", color: C.t4, marginBottom: 8 }}>
                  consultant workspace
                </div>
                <div style={{ fontSize: 28, lineHeight: 1.05, letterSpacing: "-.05em", fontWeight: 500, color: C.t1 }}>
                  Practice dashboard
                </div>
              </div>
            )}
          </div>

          <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: selectedArtefact ? 0 : isMobile ? 16 : 24 }}>
            {selectedArtefact ? (
              <EngagementComposer artefact={selectedArtefact} />
            ) : section === "home" ? (
              <HomeView
                artefacts={ARTEFACTS}
                pendingCount={queueState.pendingCount}
                queue={queueState.queue}
                onOpenArtefact={setSelectedArtefact}
              />
            ) : section === "artefacts" ? (
              <ArtefactsView artefacts={ARTEFACTS} onOpenArtefact={setSelectedArtefact} />
            ) : (
              <IntegrationsView
                snapshot={snapshot}
                inputs={connectorState.inputs}
                outputs={connectorState.outputs}
                activeInput={connectorState.activeInput}
                activeOutput={connectorState.activeOutput}
                setActiveInput={connectorState.setActiveInput}
                setActiveOutput={connectorState.setActiveOutput}
                connectInput={connectorState.connectInput}
                syncInput={connectorState.syncInput}
                queue={queueState.queue}
                pendingCount={queueState.pendingCount}
                approve={queueState.approve}
                reject={queueState.reject}
              />
            )}
          </div>
        </SurfaceCard>
      </div>

      {isMobile && !selectedArtefact && (
        <SurfaceCard
          style={{
            position: "fixed",
            left: 16,
            right: 16,
            bottom: 16,
            padding: 8,
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 8,
            boxShadow: "0 12px 36px rgba(0,0,0,.10)",
          }}
        >
          {navItems.map((item) => {
            const active = section === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                style={{
                  minHeight: 44,
                  borderRadius: 14,
                  border: `1px solid ${active ? C.sep : "transparent"}`,
                  background: active ? C.bg : "transparent",
                  color: active ? C.t1 : C.t3,
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                {item.label}
              </button>
            );
          })}
        </SurfaceCard>
      )}
    </div>
  );
}
