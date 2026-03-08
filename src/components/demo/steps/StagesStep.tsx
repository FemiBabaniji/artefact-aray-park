"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";
import { useDemoConfig, type StageConfig } from "@/context/DemoConfigContext";
import { Lbl } from "@/components/primitives/Lbl";

// Stage colors for visual indicators
const STAGE_COLORS: Record<string, string> = {
  pending: "#6b7280",
  entry: "#60a5fa",
  foundation: "#4ade80",
  development: "#fbbf24",
  showcase: "#f472b6",
  graduate: "#a78bfa",
};

export function StagesStep() {
  const C = useC();
  const { config, updateStages } = useDemoConfig();

  const handleLabelChange = useCallback(
    (id: string, label: string) => {
      const newStages = config.stages.map((s) =>
        s.id === id ? { ...s, label } : s
      );
      updateStages(newStages);
    },
    [config.stages, updateStages]
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 500,
            color: C.t1,
            marginBottom: 6,
          }}
        >
          Program Stages
        </h2>
        <p style={{ fontSize: 13, color: C.t3, lineHeight: 1.5 }}>
          Rename the stages members progress through. Click any label to edit.
          The order and number of stages is fixed.
        </p>
      </div>

      {/* Stage flow visualization */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "16px 0",
          overflowX: "auto",
        }}
      >
        {config.stages.map((stage, index) => (
          <div key={stage.id} style={{ display: "flex", alignItems: "center" }}>
            <StageChip
              stage={stage}
              onLabelChange={handleLabelChange}
              isFirst={index === 0}
            />
            {index < config.stages.length - 1 && (
              <div
                style={{
                  width: 20,
                  height: 1,
                  background: C.t4,
                  margin: "0 2px",
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Detailed list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <Lbl style={{ marginBottom: 4 }}>Stage labels</Lbl>
        {config.stages.map((stage, index) => (
          <StageRow
            key={stage.id}
            stage={stage}
            index={index}
            onLabelChange={handleLabelChange}
          />
        ))}
      </div>

      {/* Info note */}
      <div
        style={{
          padding: "14px 16px",
          background: C.edge + "30",
          borderRadius: 8,
        }}
      >
        <p
          className="mono"
          style={{ fontSize: 10, color: C.t3, lineHeight: 1.6 }}
        >
          Members progress through stages as they complete checkpoints. CP1
          sections must be accepted before advancing past Entry. CP2 sections
          must be accepted before advancing past Development.
        </p>
      </div>
    </div>
  );
}

// Stage chip for flow visualization
type StageChipProps = {
  stage: StageConfig;
  onLabelChange: (id: string, label: string) => void;
  isFirst: boolean;
};

function StageChip({ stage, isFirst }: StageChipProps) {
  const C = useC();
  const color = STAGE_COLORS[stage.id] || C.t3;

  return (
    <div
      style={{
        padding: "6px 12px",
        borderRadius: 12,
        background: color + "20",
        border: `1px solid ${color}40`,
      }}
    >
      <span
        className="mono"
        style={{
          fontSize: 9,
          color: color,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        {stage.label}
      </span>
    </div>
  );
}

// Editable stage row
type StageRowProps = {
  stage: StageConfig;
  index: number;
  onLabelChange: (id: string, label: string) => void;
};

function StageRow({ stage, index, onLabelChange }: StageRowProps) {
  const C = useC();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(stage.label);
  const color = STAGE_COLORS[stage.id] || C.t3;

  const handleStartEdit = () => {
    setEditValue(stage.label);
    setIsEditing(true);
  };

  const handleFinishEdit = () => {
    if (editValue.trim()) {
      onLabelChange(stage.id, editValue.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleFinishEdit();
    } else if (e.key === "Escape") {
      setEditValue(stage.label);
      setIsEditing(false);
    }
  };

  return (
    <motion.div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 14px",
        background: C.bg,
        border: `1px solid ${C.edge}`,
        borderRadius: 8,
      }}
      whileHover={{ borderColor: C.t4 }}
    >
      {/* Color indicator */}
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: color,
        }}
      />

      {/* Index */}
      <span
        className="mono"
        style={{ fontSize: 10, color: C.t4, width: 16, textAlign: "center" }}
      >
        {index + 1}
      </span>

      {/* Original ID */}
      <span
        className="mono"
        style={{
          fontSize: 10,
          color: C.t4,
          width: 80,
          textTransform: "uppercase",
        }}
      >
        {stage.id}
      </span>

      {/* Arrow */}
      <span style={{ color: C.t4 }}>&rarr;</span>

      {/* Editable label */}
      <div style={{ flex: 1 }}>
        {isEditing ? (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleFinishEdit}
            onKeyDown={handleKeyDown}
            autoFocus
            style={{
              width: "100%",
              fontSize: 13,
              fontWeight: 500,
              color: C.t1,
              background: "transparent",
              border: "none",
              outline: "none",
              padding: 0,
            }}
          />
        ) : (
          <button
            onClick={handleStartEdit}
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: C.t1,
              background: "none",
              border: "none",
              cursor: "text",
              textAlign: "left",
              padding: 0,
            }}
          >
            {stage.label}
          </button>
        )}
      </div>
    </motion.div>
  );
}
