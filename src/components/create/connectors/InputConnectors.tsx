"use client";

import { useMemo } from "react";
import { useIsMobile } from "@/hooks/useBreakpoint";
import { useC } from "@/hooks/useC";
import { ConnectorBranch } from "./ConnectorBranch";
import { InputConnectorNode } from "./ConnectorNode";
import type { InputConnector } from "./types";

const INPUT_META: Record<InputConnector["provider"], { icon: string; label: string; color: string }> = {
  gmail: { icon: "@", label: "Gmail", color: "#1d4ed8" },
  outlook: { icon: "@", label: "Outlook", color: "#2563eb" },
  slack: { icon: "#", label: "Slack", color: "#7c3aed" },
  discord: { icon: "#", label: "Discord", color: "#6366f1" },
  zoom: { icon: "▶", label: "Zoom", color: "#0ea5e9" },
  manual: { icon: "+", label: "Paste / Drop", color: "#16a34a" },
};

type InputConnectorsProps = {
  connectors: InputConnector[];
  activeId: string;
  onSelect: (id: string) => void;
  onConnect: (id: string) => void;
  onSync: (id: string) => void;
  onToggleAuto: (id: string) => void;
};

export function InputConnectors({
  connectors,
  activeId,
  onSelect,
  onConnect,
  onSync,
  onToggleAuto,
}: InputConnectorsProps) {
  const C = useC();
  const isMobile = useIsMobile();
  const activeIndex = useMemo(() => Math.max(0, connectors.findIndex((item) => item.id === activeId)), [connectors, activeId]);
  const activeConnector = connectors[activeIndex] ?? connectors[0];
  const activeColor = activeConnector ? INPUT_META[activeConnector.provider].color : C.blue;

  return (
    <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: "center", gap: isMobile ? 12 : 0 }}>
      <div style={{ display: "grid", gap: 10, width: isMobile ? "100%" : 232 }}>
        {connectors.map((connector) => {
          const meta = INPUT_META[connector.provider];
          return (
            <InputConnectorNode
              key={connector.id}
              connector={connector}
              active={connector.id === activeId}
              compact
              icon={meta.icon}
              label={meta.label}
              color={meta.color}
              onSelect={() => onSelect(connector.id)}
              onPrimary={() => (connector.status === "disconnected" ? onConnect(connector.id) : onSync(connector.id))}
            />
          );
        })}
      </div>

      <div style={{ padding: isMobile ? "0 12px" : "0 4px" }}>
        <ConnectorBranch
          direction="input"
          count={connectors.length}
          activeIndex={activeIndex}
          activeColor={activeColor}
          syncing={activeConnector?.status === "syncing"}
          compact={isMobile}
        />
      </div>

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
                {INPUT_META[activeConnector.provider].icon}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: C.t1 }}>{INPUT_META[activeConnector.provider].label}</div>
                <div style={{ fontSize: 11, color: C.t3 }}>{activeConnector.accountLabel ?? "Not connected"}</div>
              </div>
            </div>

            <div style={{ display: "grid", gap: 6, paddingTop: 10, borderTop: `1px solid ${C.sep}` }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.t4 }}>
                Last sync: {activeConnector.lastSync ?? "never"}
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.t4 }}>
                Queued: {activeConnector.itemsQueued} items
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.t4 }}>
                Auto-ingest: {activeConnector.autoIngest ? "on" : "off"}
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, paddingTop: 12 }}>
              <button
                onClick={() => (activeConnector.status === "disconnected" ? onConnect(activeConnector.id) : onSync(activeConnector.id))}
                style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: activeColor, background: "none", border: "none", padding: 0 }}
              >
                {activeConnector.status === "disconnected" ? "Connect" : "Sync now"}
              </button>
              <button
                onClick={() => onToggleAuto(activeConnector.id)}
                style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.t4, background: "none", border: "none", padding: 0 }}
              >
                Toggle auto
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
