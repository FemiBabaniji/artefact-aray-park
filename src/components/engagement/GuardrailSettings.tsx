"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";
import type { Guardrails } from "@/types/checkpoint";

type GuardrailSettingsProps = {
  guardrails: Guardrails;
  availableRooms: string[];
  onUpdate: (updates: Partial<Guardrails>) => void;
};

export function GuardrailSettings({
  guardrails,
  availableRooms,
  onUpdate,
}: GuardrailSettingsProps) {
  const C = useC();
  const [saving, setSaving] = useState(false);

  const handleToggle = async (key: keyof Guardrails, value: boolean) => {
    setSaving(true);
    await onUpdate({ [key]: value });
    setSaving(false);
  };

  const handleRoomsChange = async (rooms: string[]) => {
    setSaving(true);
    await onUpdate({ allowedUploadRooms: rooms });
    setSaving(false);
  };

  const toggleRoom = (roomKey: string) => {
    const current = guardrails.allowedUploadRooms;
    const newRooms = current.includes(roomKey)
      ? current.filter((r) => r !== roomKey)
      : [...current, roomKey];
    handleRoomsChange(newRooms);
  };

  return (
    <div style={{ display: "grid", gap: 24 }}>
      {/* Auto-Ingestion Section */}
      <Section title="Auto-Ingestion" C={C}>
        <ToggleRow
          label="Auto-ingest emails"
          description="Automatically process relevant client emails"
          checked={guardrails.autoIngestEmails}
          onChange={(v) => handleToggle("autoIngestEmails", v)}
          C={C}
        />
        <ToggleRow
          label="Auto-ingest meeting notes"
          description="Automatically process meeting transcripts"
          checked={guardrails.autoIngestMeetings}
          onChange={(v) => handleToggle("autoIngestMeetings", v)}
          C={C}
        />
        <ToggleRow
          label="Require approval"
          description="Review auto-ingested content before adding to rooms"
          checked={guardrails.requireApproval}
          onChange={(v) => handleToggle("requireApproval", v)}
          C={C}
        />
      </Section>

      {/* Client Portal Section */}
      <Section title="Client Portal" C={C}>
        <ToggleRow
          label="Allow client uploads"
          description="Let clients upload files through the portal"
          checked={guardrails.allowClientUploads}
          onChange={(v) => handleToggle("allowClientUploads", v)}
          C={C}
        />

        {guardrails.allowClientUploads && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, color: C.t3, marginBottom: 8 }}>
              Rooms that accept client uploads:
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {availableRooms.map((room) => {
                const isSelected = guardrails.allowedUploadRooms.includes(room);
                return (
                  <motion.button
                    key={room}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleRoom(room)}
                    style={{
                      padding: "6px 12px",
                      background: isSelected ? C.blue : C.void,
                      border: `1px solid ${isSelected ? C.blue : C.sep}`,
                      borderRadius: 6,
                      fontSize: 12,
                      color: isSelected ? "#fff" : C.t2,
                      cursor: "pointer",
                      textTransform: "capitalize",
                    }}
                  >
                    {room.replace(/_/g, " ")}
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}
      </Section>

      {/* Notifications Section */}
      <Section title="Notifications" C={C}>
        <ToggleRow
          label="Phase changes"
          description="Notify when engagement phase changes"
          checked={guardrails.notifyOnPhaseChange}
          onChange={(v) => handleToggle("notifyOnPhaseChange", v)}
          C={C}
        />
        <ToggleRow
          label="Client uploads"
          description="Notify when client uploads a file"
          checked={guardrails.notifyOnClientUpload}
          onChange={(v) => handleToggle("notifyOnClientUpload", v)}
          C={C}
        />
        <ToggleRow
          label="New blocks"
          description="Notify when any block is added"
          checked={guardrails.notifyOnBlockAdded}
          onChange={(v) => handleToggle("notifyOnBlockAdded", v)}
          C={C}
        />
      </Section>

      {/* Workflow Section */}
      <Section title="Workflow" C={C}>
        <ToggleRow
          label="Require checkpoints"
          description="Block phase transitions until required checkpoints are complete"
          checked={guardrails.requireCheckpoints}
          onChange={(v) => handleToggle("requireCheckpoints", v)}
          C={C}
        />
      </Section>

      {/* Saving indicator */}
      {saving && (
        <div style={{ fontSize: 11, color: C.t3, textAlign: "center" }}>
          Saving...
        </div>
      )}
    </div>
  );
}

// ── Section Component ────────────────────────────────────────────────────────

function Section({
  title,
  children,
  C,
}: {
  title: string;
  children: React.ReactNode;
  C: ReturnType<typeof useC>;
}) {
  return (
    <div
      style={{
        padding: 16,
        background: C.bg,
        border: `1px solid ${C.sep}`,
        borderRadius: 10,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: C.t1,
          marginBottom: 16,
          textTransform: "uppercase",
          letterSpacing: ".04em",
        }}
      >
        {title}
      </div>
      <div style={{ display: "grid", gap: 12 }}>{children}</div>
    </div>
  );
}

// ── Toggle Row Component ─────────────────────────────────────────────────────

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  C,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  C: ReturnType<typeof useC>;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
      }}
    >
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: C.t1 }}>{label}</div>
        <div style={{ fontSize: 11, color: C.t3 }}>{description}</div>
      </div>

      {/* Toggle switch */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => onChange(!checked)}
        style={{
          width: 44,
          height: 24,
          borderRadius: 12,
          background: checked ? C.blue : C.sep,
          border: "none",
          cursor: "pointer",
          position: "relative",
          transition: "background .2s",
          flexShrink: 0,
        }}
      >
        <motion.div
          animate={{ x: checked ? 20 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          style={{
            position: "absolute",
            top: 2,
            left: 2,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "#fff",
            boxShadow: "0 1px 3px rgba(0,0,0,.2)",
          }}
        />
      </motion.button>
    </div>
  );
}
