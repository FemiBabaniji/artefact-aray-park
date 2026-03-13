"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useC } from "@/hooks/useC";
import type { Checkpoint, CheckpointStatus, CheckpointType } from "@/types/checkpoint";
import { getCheckpointTypeLabel, getCheckpointStatusLabel } from "@/types/checkpoint";
import type { EngagementPhase } from "@/types/engagement";
import { getPhaseLabel } from "@/types/engagement";

type CheckpointsProps = {
  checkpoints: Checkpoint[];
  currentPhase: EngagementPhase;
  onStatusChange?: (checkpointId: string, status: CheckpointStatus, notes?: string) => void;
  onAdd?: (checkpoint: Omit<Checkpoint, "id" | "engagementId" | "createdAt" | "updatedAt" | "status" | "orderIndex">) => void;
  onDelete?: (checkpointId: string) => void;
  editable?: boolean;
};

export function Checkpoints({
  checkpoints,
  currentPhase,
  onStatusChange,
  onAdd,
  onDelete,
  editable = true,
}: CheckpointsProps) {
  const C = useC();
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedPhase, setExpandedPhase] = useState<EngagementPhase | null>(currentPhase);

  // Group checkpoints by phase
  const phases: EngagementPhase[] = [
    "intake", "qualification", "proposal", "negotiation",
    "signed", "delivery", "completed", "archived"
  ];

  const checkpointsByPhase = phases.reduce((acc, phase) => {
    acc[phase] = checkpoints.filter((c) => c.phase === phase);
    return acc;
  }, {} as Record<EngagementPhase, Checkpoint[]>);

  const getStatusColor = (status: CheckpointStatus): string => {
    switch (status) {
      case "completed": return C.green;
      case "in_progress": return C.blue;
      case "blocked": return C.amber;
      case "skipped": return C.t4;
      default: return C.t3;
    }
  };

  const getProgress = (phase: EngagementPhase): { completed: number; total: number } => {
    const phaseCheckpoints = checkpointsByPhase[phase];
    const completed = phaseCheckpoints.filter(
      (c) => c.status === "completed" || c.status === "skipped"
    ).length;
    return { completed, total: phaseCheckpoints.length };
  };

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 600, color: C.t1 }}>
          Checkpoints
        </div>
        {editable && onAdd && (
          <motion.button
            whileHover={{ opacity: 0.8 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              padding: "6px 12px",
              background: showAddForm ? C.sep : C.blue,
              border: "none",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 500,
              color: showAddForm ? C.t2 : "#fff",
              cursor: "pointer",
            }}
          >
            {showAddForm ? "Cancel" : "Add"}
          </motion.button>
        )}
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showAddForm && onAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{ marginBottom: 16, overflow: "hidden" }}
          >
            <AddCheckpointForm
              currentPhase={currentPhase}
              onAdd={(checkpoint) => {
                onAdd(checkpoint);
                setShowAddForm(false);
              }}
              onCancel={() => setShowAddForm(false)}
              C={C}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phase accordion */}
      <div style={{ display: "grid", gap: 8 }}>
        {phases.map((phase) => {
          const phaseCheckpoints = checkpointsByPhase[phase];
          if (phaseCheckpoints.length === 0) return null;

          const { completed, total } = getProgress(phase);
          const isExpanded = expandedPhase === phase;
          const isCurrent = phase === currentPhase;

          return (
            <div
              key={phase}
              style={{
                background: C.bg,
                border: `1px solid ${isCurrent ? C.blue : C.sep}`,
                borderRadius: 10,
                overflow: "hidden",
              }}
            >
              {/* Phase header */}
              <motion.button
                whileHover={{ background: C.void }}
                onClick={() => setExpandedPhase(isExpanded ? null : phase)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  textAlign: "left",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: C.t1 }}>
                    {getPhaseLabel(phase)}
                  </div>
                  <div style={{ fontSize: 11, color: C.t3 }}>
                    {completed}/{total} complete
                  </div>
                </div>

                {/* Progress bar */}
                <div
                  style={{
                    width: 60,
                    height: 4,
                    background: C.sep,
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${total > 0 ? (completed / total) * 100 : 0}%`,
                      height: "100%",
                      background: C.green,
                      transition: "width .3s",
                    }}
                  />
                </div>

                {/* Expand icon */}
                <motion.svg
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path d="M6 9L12 15L18 9" stroke={C.t3} strokeWidth="2" strokeLinecap="round" />
                </motion.svg>
              </motion.button>

              {/* Checkpoints list */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    style={{ overflow: "hidden" }}
                  >
                    <div style={{ padding: "0 16px 16px", display: "grid", gap: 8 }}>
                      {phaseCheckpoints.map((checkpoint) => (
                        <CheckpointItem
                          key={checkpoint.id}
                          checkpoint={checkpoint}
                          onStatusChange={onStatusChange}
                          onDelete={onDelete}
                          editable={editable}
                          getStatusColor={getStatusColor}
                          C={C}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Checkpoint Item ──────────────────────────────────────────────────────────

function CheckpointItem({
  checkpoint,
  onStatusChange,
  onDelete,
  editable,
  getStatusColor,
  C,
}: {
  checkpoint: Checkpoint;
  onStatusChange?: (id: string, status: CheckpointStatus, notes?: string) => void;
  onDelete?: (id: string) => void;
  editable: boolean;
  getStatusColor: (s: CheckpointStatus) => string;
  C: ReturnType<typeof useC>;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const isComplete = checkpoint.status === "completed" || checkpoint.status === "skipped";

  return (
    <div
      style={{
        padding: "10px 12px",
        background: C.void,
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      {/* Status indicator */}
      <motion.button
        whileHover={editable ? { scale: 1.1 } : undefined}
        onClick={() => {
          if (editable && onStatusChange) {
            const newStatus = isComplete ? "pending" : "completed";
            onStatusChange(checkpoint.id, newStatus);
          }
        }}
        disabled={!editable}
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          border: `2px solid ${getStatusColor(checkpoint.status)}`,
          background: isComplete ? getStatusColor(checkpoint.status) : "transparent",
          cursor: editable ? "pointer" : "default",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {isComplete && (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
            <path d="M20 6L9 17L4 12" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
          </svg>
        )}
      </motion.button>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: isComplete ? C.t3 : C.t1,
            textDecoration: isComplete ? "line-through" : "none",
          }}
        >
          {checkpoint.label}
        </div>
        {checkpoint.description && (
          <div style={{ fontSize: 11, color: C.t4, marginTop: 2 }}>
            {checkpoint.description}
          </div>
        )}
      </div>

      {/* Type badge */}
      <span
        style={{
          padding: "2px 8px",
          background: `${getStatusColor(checkpoint.status)}15`,
          borderRadius: 4,
          fontSize: 10,
          fontWeight: 500,
          color: getStatusColor(checkpoint.status),
        }}
      >
        {getCheckpointTypeLabel(checkpoint.checkpointType)}
      </span>

      {/* Required badge */}
      {checkpoint.required && (
        <span
          style={{
            padding: "2px 8px",
            background: `${C.amber}15`,
            borderRadius: 4,
            fontSize: 10,
            fontWeight: 500,
            color: C.amber,
          }}
        >
          Required
        </span>
      )}

      {/* Delete button */}
      {editable && onDelete && (
        <motion.button
          whileHover={{ opacity: 0.7 }}
          onClick={() => onDelete(checkpoint.id)}
          style={{
            padding: 4,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: C.t4,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </motion.button>
      )}
    </div>
  );
}

// ── Add Checkpoint Form ──────────────────────────────────────────────────────

function AddCheckpointForm({
  currentPhase,
  onAdd,
  onCancel,
  C,
}: {
  currentPhase: EngagementPhase;
  onAdd: (checkpoint: Omit<Checkpoint, "id" | "engagementId" | "createdAt" | "updatedAt" | "status" | "orderIndex">) => void;
  onCancel: () => void;
  C: ReturnType<typeof useC>;
}) {
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [phase, setPhase] = useState<EngagementPhase>(currentPhase);
  const [checkpointType, setCheckpointType] = useState<CheckpointType>("approval");
  const [required, setRequired] = useState(true);

  const handleSubmit = () => {
    if (!label.trim()) return;
    onAdd({
      label: label.trim(),
      description: description.trim() || undefined,
      phase,
      checkpointType,
      required,
    });
  };

  return (
    <div
      style={{
        padding: 16,
        background: C.bg,
        border: `1px solid ${C.sep}`,
        borderRadius: 10,
      }}
    >
      <input
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Checkpoint label"
        style={{
          width: "100%",
          padding: "10px 12px",
          background: C.void,
          border: `1px solid ${C.sep}`,
          borderRadius: 6,
          fontSize: 13,
          color: C.t1,
          marginBottom: 10,
          outline: "none",
        }}
      />

      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        style={{
          width: "100%",
          padding: "10px 12px",
          background: C.void,
          border: `1px solid ${C.sep}`,
          borderRadius: 6,
          fontSize: 13,
          color: C.t1,
          marginBottom: 10,
          outline: "none",
        }}
      />

      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <select
          value={phase}
          onChange={(e) => setPhase(e.target.value as EngagementPhase)}
          style={{
            flex: 1,
            padding: "10px 12px",
            background: C.void,
            border: `1px solid ${C.sep}`,
            borderRadius: 6,
            fontSize: 13,
            color: C.t1,
            outline: "none",
          }}
        >
          {["intake", "qualification", "proposal", "negotiation", "signed", "delivery", "completed"].map((p) => (
            <option key={p} value={p}>{getPhaseLabel(p as EngagementPhase)}</option>
          ))}
        </select>

        <select
          value={checkpointType}
          onChange={(e) => setCheckpointType(e.target.value as CheckpointType)}
          style={{
            flex: 1,
            padding: "10px 12px",
            background: C.void,
            border: `1px solid ${C.sep}`,
            borderRadius: 6,
            fontSize: 13,
            color: C.t1,
            outline: "none",
          }}
        >
          {(["approval", "delivery", "decision", "document", "review"] as CheckpointType[]).map((t) => (
            <option key={t} value={t}>{getCheckpointTypeLabel(t)}</option>
          ))}
        </select>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <input
          type="checkbox"
          checked={required}
          onChange={(e) => setRequired(e.target.checked)}
          style={{ width: 16, height: 16 }}
        />
        <label style={{ fontSize: 13, color: C.t2 }}>Required for phase transition</label>
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onCancel}
          style={{
            padding: "8px 16px",
            background: "transparent",
            border: `1px solid ${C.sep}`,
            borderRadius: 6,
            fontSize: 12,
            color: C.t2,
            cursor: "pointer",
          }}
        >
          Cancel
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={!label.trim()}
          style={{
            padding: "8px 16px",
            background: label.trim() ? C.blue : C.sep,
            border: "none",
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 500,
            color: label.trim() ? "#fff" : C.t4,
            cursor: label.trim() ? "pointer" : "not-allowed",
          }}
        >
          Add Checkpoint
        </motion.button>
      </div>
    </div>
  );
}
