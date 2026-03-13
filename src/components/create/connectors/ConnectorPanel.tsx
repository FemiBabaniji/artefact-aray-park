"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo } from "react";
import { useIsMobile } from "@/hooks/useBreakpoint";
import { ConnectorBranch } from "./ConnectorBranch";
import { InputConnectorNode, OutputConnectorNode } from "./ConnectorNode";
import { IngestionQueue } from "./IngestionQueue";
import { useConnectorStatus } from "./hooks/useConnectorStatus";
import { useIngestionQueue } from "./hooks/useIngestionQueue";
import { useOutputGeneration } from "./hooks/useOutputGeneration";
import type { EngagementSnapshot, InputConnector, OutputConnector, QueuedItem } from "./types";

type ConnectorPanelProps = {
  snapshot: EngagementSnapshot;
  onApproveQueueItem: (item: QueuedItem) => void;
};

const INPUT_META: Record<InputConnector["provider"], { icon: string; label: string; color: string }> = {
  gmail: { icon: "@", label: "Gmail", color: "#1d4ed8" },
  outlook: { icon: "@", label: "Outlook", color: "#2563eb" },
  slack: { icon: "#", label: "Slack", color: "#7c3aed" },
  discord: { icon: "#", label: "Discord", color: "#6366f1" },
  zoom: { icon: "▶", label: "Zoom", color: "#0ea5e9" },
  manual: { icon: "+", label: "Paste / Drop", color: "#16a34a" },
};

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

export function ConnectorPanel({ snapshot, onApproveQueueItem }: ConnectorPanelProps) {
  const isMobile = useIsMobile();
  const {
    inputs,
    outputs,
    activeInput,
    activeOutput,
    setActiveInput,
    setActiveOutput,
    connectInput,
    syncInput,
  } = useConnectorStatus();
  const { queue, pendingCount, approve, reject, retarget } = useIngestionQueue();
  const { generating, completed, runOutput } = useOutputGeneration(snapshot);

  const queueRooms = useMemo(
    () => snapshot.rooms.map((room) => ({ id: room.id, name: room.name })),
    [snapshot.rooms],
  );

  const activeInputIndex = Math.max(0, inputs.findIndex((item) => item.id === activeInput));
  const activeOutputIndex = Math.max(0, outputs.findIndex((item) => item.id === activeOutput));
  const activeInputColor = INPUT_META[inputs[activeInputIndex]?.provider ?? "gmail"].color;
  const activeOutputColor = OUTPUT_META[outputs[activeOutputIndex]?.target ?? "claude"].color;

  const handleApprove = (id: string) => {
    const item = approve(id);
    if (item) onApproveQueueItem(item);
  };

  if (isMobile) {
    return (
      <div style={{ display: "grid", gap: 16, marginTop: 16 }}>
        <div style={{ display: "grid", gap: 10 }}>
          {inputs.map((connector) => {
            const meta = INPUT_META[connector.provider];
            return (
              <InputConnectorNode
                key={connector.id}
                connector={connector}
                active={connector.id === activeInput}
                compact
                icon={meta.icon}
                label={meta.label}
                color={meta.color}
                onSelect={() => setActiveInput(connector.id)}
                onPrimary={() => (connector.status === "disconnected" ? connectInput(connector.id) : syncInput(connector.id))}
              />
            );
          })}
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          {outputs.map((connector) => {
            const meta = OUTPUT_META[connector.target];
            return (
              <OutputConnectorNode
                key={connector.id}
                connector={connector}
                active={connector.id === activeOutput}
                compact
                icon={meta.icon}
                label={meta.label}
                color={meta.color}
                generating={generating === connector.id}
                completed={completed === connector.id}
                onSelect={() => setActiveOutput(connector.id)}
                onRun={() => void runOutput(connector)}
              />
            );
          })}
        </div>

        <IngestionQueue
          queue={queue}
          rooms={queueRooms}
          onApprove={handleApprove}
          onReject={reject}
          onRetarget={retarget}
        />
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "visible",
          pointerEvents: "none",
        }}
      >
        <motion.div
          initial={{ opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.32, ease: [0.19, 1, 0.22, 1] }}
          style={{
            position: "absolute",
            top: "50%",
            right: "100%",
            marginRight: 20,
            width: 208,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            pointerEvents: "auto",
            transform: "translateY(-50%)",
          }}
        >
          {inputs.map((connector) => {
            const meta = INPUT_META[connector.provider];
            return (
              <InputConnectorNode
                key={connector.id}
                connector={connector}
                active={connector.id === activeInput}
                compact
                icon={meta.icon}
                label={meta.label}
                color={meta.color}
                onSelect={() => setActiveInput(connector.id)}
                onPrimary={() => (connector.status === "disconnected" ? connectInput(connector.id) : syncInput(connector.id))}
              />
            );
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scaleX: 0.7 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.34, delay: 0.04, ease: [0.19, 1, 0.22, 1] }}
          style={{
            position: "absolute",
            top: "50%",
            right: "100%",
            marginRight: -76,
            transformOrigin: "right center",
            transform: "translateY(-50%)",
          }}
        >
          <ConnectorBranch
            direction="input"
            count={inputs.length}
            activeIndex={activeInputIndex}
            activeColor={activeInputColor}
            syncing={inputs[activeInputIndex]?.status === "syncing"}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scaleX: 0.7 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.34, delay: 0.04, ease: [0.19, 1, 0.22, 1] }}
          style={{
            position: "absolute",
            top: "50%",
            left: "100%",
            marginLeft: -76,
            transformOrigin: "left center",
            transform: "translateY(-50%)",
          }}
        >
          <ConnectorBranch
            direction="output"
            count={outputs.length}
            activeIndex={activeOutputIndex}
            activeColor={activeOutputColor}
            syncing={Boolean(generating)}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.32, ease: [0.19, 1, 0.22, 1] }}
          style={{
            position: "absolute",
            top: "50%",
            left: "100%",
            marginLeft: 20,
            width: 208,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            pointerEvents: "auto",
            transform: "translateY(-50%)",
          }}
        >
          {outputs.map((connector) => {
            const meta = OUTPUT_META[connector.target];
            return (
              <OutputConnectorNode
                key={connector.id}
                connector={connector}
                active={connector.id === activeOutput}
                compact
                icon={meta.icon}
                label={meta.label}
                color={meta.color}
                generating={generating === connector.id}
                completed={completed === connector.id}
                onSelect={() => setActiveOutput(connector.id)}
                onRun={() => void runOutput(connector)}
              />
            );
          })}
        </motion.div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={pendingCount > 0 ? "queue-open" : "queue-empty"}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.26, delay: 0.12, ease: [0.19, 1, 0.22, 1] }}
          style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: 20 }}
        >
          <IngestionQueue
            queue={queue}
            rooms={queueRooms}
            onApprove={handleApprove}
            onReject={reject}
            onRetarget={retarget}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
