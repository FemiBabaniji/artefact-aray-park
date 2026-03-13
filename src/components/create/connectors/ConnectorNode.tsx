"use client";

import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";
import type { ConnectorStatus, InputConnector, OutputConnector } from "./types";

const STATUS_LABELS: Record<ConnectorStatus, string> = {
  disconnected: "disconnected",
  connecting: "connecting",
  connected: "connected",
  syncing: "syncing",
  error: "error",
};

type InputNodeProps = {
  connector: InputConnector;
  active: boolean;
  compact?: boolean;
  icon: string;
  label: string;
  color: string;
  onSelect: () => void;
  onPrimary: () => void;
  onToggleAuto?: () => void;
};

export function InputConnectorNode({
  connector,
  active,
  compact = false,
  icon,
  label,
  color,
  onSelect,
  onPrimary,
  onToggleAuto,
}: InputNodeProps) {
  const C = useC();

  return (
    <motion.div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      style={{
        width: "100%",
        textAlign: "left",
        background: active ? `${color}12` : C.bg,
        border: `1px solid ${active ? `${color}44` : C.sep}`,
        borderRadius: 12,
        padding: compact ? "10px 12px" : "12px 14px",
        display: "flex",
        flexDirection: "column",
        gap: compact ? 5 : 8,
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: active ? color : C.sep,
            color: active ? C.bg : C.t3,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'DM Mono', monospace",
            fontSize: 11,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: C.t1 }}>{label}</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: connector.itemsQueued ? color : C.t4 }}>
              {connector.itemsQueued > 0 ? `● ${connector.itemsQueued}` : "● 0"}
            </span>
          </div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.t4, marginTop: 2 }}>
            {STATUS_LABELS[connector.status]}{connector.lastSync ? ` · ${connector.lastSync}` : ""}
          </div>
        </div>
      </div>

      {compact && active && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 2 }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.t4 }}>
            {connector.targetRoom}
          </span>
          <button
            onClick={(event) => {
              event.stopPropagation();
              onPrimary();
            }}
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              color,
              background: "none",
              border: "none",
              padding: 0,
              whiteSpace: "nowrap",
            }}
          >
            {connector.status === "disconnected" ? "Connect →" : "Sync now →"}
          </button>
        </div>
      )}

      {!compact && (
        <>
          <div style={{ fontSize: 11, color: C.t3 }}>{connector.accountLabel ?? "Not connected"}</div>
          <div style={{ borderTop: `1px solid ${C.sep}`, paddingTop: 8, display: "grid", gap: 4 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.t4 }}>
              Target room: {connector.targetRoom}
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.t4 }}>
              Auto-ingest: {connector.autoIngest ? "on" : "off"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, paddingTop: 2 }}>
            <button
              onClick={(event) => {
                event.stopPropagation();
                onPrimary();
              }}
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 10,
                color: active ? color : C.t3,
                background: "none",
                border: "none",
                padding: 0,
              }}
            >
              {connector.status === "disconnected" ? "Connect" : "Sync now"}
            </button>
            {onToggleAuto && (
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleAuto();
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
                Toggle auto
              </button>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
}

type OutputNodeProps = {
  connector: OutputConnector;
  active: boolean;
  compact?: boolean;
  icon: string;
  label: string;
  color: string;
  generating: boolean;
  completed: boolean;
  onSelect: () => void;
  onRun: () => void;
};

export function OutputConnectorNode({
  connector,
  active,
  compact = false,
  icon,
  label,
  color,
  generating,
  completed,
  onSelect,
  onRun,
}: OutputNodeProps) {
  const C = useC();

  return (
    <motion.div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      style={{
        cursor: "pointer",
        padding: compact ? "10px 12px" : "12px 14px",
        borderRadius: 12,
        background: active ? `${color}12` : "transparent",
        border: `1px solid ${active ? `${color}44` : "transparent"}`,
        display: "flex",
        alignItems: "center",
        gap: 12,
        opacity: active ? 1 : 0.55,
      }}
    >
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          background: active ? color : C.sep,
          color: active ? C.bg : C.t3,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'DM Mono', monospace",
          fontSize: 11,
          flexShrink: 0,
        }}
      >
        {completed ? "✓" : icon}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: active ? C.t1 : C.t3 }}>{label}</div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: active ? color : C.t4, marginTop: 2 }}>
          {connector.format}
        </div>
      </div>
      {compact && active && (
        <button
          onClick={(event) => {
            event.stopPropagation();
            onRun();
          }}
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 10,
            color: generating ? C.t3 : color,
            background: "none",
            border: "none",
            padding: 0,
            whiteSpace: "nowrap",
          }}
        >
          {generating ? "Running…" : completed ? "Done" : connector.action === "copy" ? "Copy →" : connector.action === "download" ? "Save →" : connector.action === "serve" ? "URI →" : "Open →"}
        </button>
      )}
      {!compact && active && (
        <button
          onClick={(event) => {
            event.stopPropagation();
            onRun();
          }}
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 10,
            color: generating ? C.t3 : color,
            background: "none",
            border: "none",
            padding: 0,
            whiteSpace: "nowrap",
          }}
        >
          {generating ? "Running…" : completed ? "Done" : connector.action === "copy" ? "Copy →" : connector.action === "download" ? "Download →" : connector.action === "serve" ? "Copy URI →" : "Open →"}
        </button>
      )}
    </motion.div>
  );
}
