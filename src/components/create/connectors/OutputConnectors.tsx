"use client";

import { useMemo } from "react";
import { useIsMobile } from "@/hooks/useBreakpoint";
import { useC } from "@/hooks/useC";
import { ConnectorBranch } from "./ConnectorBranch";
import { OutputConnectorNode } from "./ConnectorNode";
import type { OutputConnector } from "./types";

const OUTPUT_META: Record<OutputConnector["target"], { icon: string; label: string; color: string }> = {
  claude: { icon: "◐", label: "Claude", color: "#f97316" },
  chatgpt: { icon: "◑", label: "ChatGPT", color: "#10b981" },
  cursor: { icon: ">_", label: "Cursor", color: "#60a5fa" },
  windsurf: { icon: "~", label: "Windsurf", color: "#a855f7" },
  cline: { icon: "C", label: "Cline", color: "#ec4899" },
  mcp: { icon: "{}", label: "MCP", color: "#14b8a6" },
  resume: { icon: "R", label: "Resume", color: "#22c55e" },
  portal: { icon: "P", label: "Portal", color: "#eab308" },
};

type OutputConnectorsProps = {
  connectors: OutputConnector[];
  activeId: string;
  generatingId: string | null;
  completedId: string | null;
  onSelect: (id: string) => void;
  onRun: (id: string) => void;
};

export function OutputConnectors({
  connectors,
  activeId,
  generatingId,
  completedId,
  onSelect,
  onRun,
}: OutputConnectorsProps) {
  const C = useC();
  const isMobile = useIsMobile();
  const activeIndex = useMemo(() => Math.max(0, connectors.findIndex((item) => item.id === activeId)), [connectors, activeId]);
  const activeConnector = connectors[activeIndex] ?? connectors[0];
  const activeColor = activeConnector ? OUTPUT_META[activeConnector.target].color : C.blue;

  return (
    <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: "center", gap: isMobile ? 12 : 0 }}>
      <div
        style={{
          width: isMobile ? "100%" : 250,
          border: `1px solid ${C.sep}`,
          borderRadius: 16,
          padding: "14px 16px",
          background: C.bg,
        }}
      >
        {activeConnector && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: activeColor,
                  color: C.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 11,
                }}
              >
                {OUTPUT_META[activeConnector.target].icon}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: C.t1 }}>{OUTPUT_META[activeConnector.target].label}</div>
                <div style={{ fontSize: 11, color: C.t3 }}>
                  {activeConnector.action} · {activeConnector.format}
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gap: 6, paddingTop: 10, borderTop: `1px solid ${C.sep}` }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.t4 }}>
                Include rooms: {activeConnector.includeRooms.join(", ")}
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.t4 }}>
                Mask client: {activeConnector.maskClient ? "yes" : "no"}
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, paddingTop: 12 }}>
              <button
                onClick={() => onRun(activeConnector.id)}
                style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: activeColor, background: "none", border: "none", padding: 0 }}
              >
                {generatingId === activeConnector.id ? "Running…" : activeConnector.action === "copy" ? "Copy now" : activeConnector.action === "download" ? "Download now" : activeConnector.action === "serve" ? "Copy URI" : "Open link"}
              </button>
            </div>
          </>
        )}
      </div>

      <div style={{ padding: isMobile ? "0 12px" : "0 4px" }}>
        <ConnectorBranch direction="output" count={connectors.length} activeIndex={activeIndex} activeColor={activeColor} syncing={Boolean(generatingId)} compact={isMobile} />
      </div>

      <div style={{ display: "grid", gap: 10, width: isMobile ? "100%" : 232 }}>
        {connectors.map((connector) => {
          const meta = OUTPUT_META[connector.target];
          return (
            <OutputConnectorNode
              key={connector.id}
              connector={connector}
              active={connector.id === activeId}
              compact
              icon={meta.icon}
              label={meta.label}
              color={meta.color}
              generating={generatingId === connector.id}
              completed={completedId === connector.id}
              onSelect={() => onSelect(connector.id)}
              onRun={() => onRun(connector.id)}
            />
          );
        })}
      </div>
    </div>
  );
}
