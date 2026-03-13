"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useC, useTheme } from "@/hooks/useC";
import { FADE } from "@/lib/motion";
import { Lbl } from "@/components/primitives/Lbl";
import {
  WizardLayout,
  StepAccordion,
  ArtefactPreviewPanel,
  useGhostTyping,
  type WizardStep,
} from "@/components/wizard";
import type { StandaloneRoom, Identity } from "@/types/artefact";
import {
  DEFAULT_ENGAGEMENT_ROOMS,
  type EngagementRoomSchema,
  type EngagementRoomVisibility,
  getVisibilityLabel,
} from "@/types/engagement";
import type { ClientSummary } from "@/types/client";
import type { ParticipantRole } from "@/types/participant";
import { getRoleLabel } from "@/types/participant";

// ── Types ─────────────────────────────────────────────────────────────────────

type PendingParticipant = {
  id: string;
  name: string;
  email: string;
  role: ParticipantRole;
};

type EngagementFormData = {
  // Identity
  name: string;
  description: string;
  // Client
  clientId: string | null;
  clientName: string;
  // Details
  value: string;
  currency: string;
  startDate: string;
  endDate: string;
  // Participants
  participants: PendingParticipant[];
  // Rooms
  rooms: EngagementRoomSchema[];
};

type EngagementCreateWizardProps = {
  clients: ClientSummary[];
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  onComplete?: (engagementId: string) => void;
};

// ── Wizard Steps ──────────────────────────────────────────────────────────────

const WIZARD_STEPS: WizardStep[] = [
  { id: "identity", num: 1, label: "Identity" },
  { id: "client", num: 2, label: "Client" },
  { id: "participants", num: 3, label: "Participants" },
  { id: "rooms", num: 4, label: "Rooms" },
  { id: "launch", num: 5, label: "Launch" },
];

// ── Visibility Badge ─────────────────────────────────────────────────────────

function VisibilityBadge({
  visibility,
  C,
}: {
  visibility: EngagementRoomVisibility;
  C: ReturnType<typeof useC>;
}) {
  const colors: Record<EngagementRoomVisibility, string> = {
    consultant_only: C.t4,
    client_view: C.blue,
    client_edit: C.green,
  };

  return (
    <span
      style={{
        fontSize: 9,
        padding: "2px 6px",
        borderRadius: 4,
        background: `${colors[visibility]}20`,
        color: colors[visibility],
        fontFamily: "'DM Mono', monospace",
        letterSpacing: ".02em",
      }}
    >
      {visibility === "consultant_only" && "private"}
      {visibility === "client_view" && "client reads"}
      {visibility === "client_edit" && "client edits"}
    </span>
  );
}

// ── Sample Content for Preview ──────────────────────────────────────────────

const SAMPLE_CONTENT: Record<string, string> = {
  scope: "Define project scope, success criteria, and key deliverables for Q1 strategic initiative.",
  research: "Market analysis indicates 23% growth opportunity in target segment. Key differentiator identified.",
  deliverables: "Comprehensive go-to-market strategy with implementation roadmap and executive materials.",
  meetings: "Initial alignment meeting with key stakeholders completed. Approved: phased rollout approach.",
  outcomes: "Target: 15% efficiency improvement within 6 months. Projected ROI of 3.2x on consulting investment.",
  documents: "Statement of work, service agreement, and mutual non-disclosure agreement.",
};

// ── Main Wizard Component ────────────────────────────────────────────────────

export function EngagementCreateWizard({
  clients,
  ownerId,
  ownerName,
  ownerEmail,
  onComplete,
}: EngagementCreateWizardProps) {
  const C = useC();
  const { dark } = useTheme();
  const router = useRouter();

  const [wizStep, setWizStep] = useState(1);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [launched, setLaunched] = useState(false);
  const [started, setStarted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedRoomId, setExpandedRoomId] = useState<string | null>(null);

  const [formData, setFormData] = useState<EngagementFormData>({
    name: "",
    description: "",
    clientId: null,
    clientName: "",
    value: "",
    currency: "USD",
    startDate: "",
    endDate: "",
    participants: [],
    rooms: DEFAULT_ENGAGEMENT_ROOMS.map((r, i) => ({ ...r, id: `room_${i}` })),
  });

  const [newClientMode, setNewClientMode] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newParticipantMode, setNewParticipantMode] = useState(false);
  const [newParticipant, setNewParticipant] = useState({
    name: "",
    email: "",
    role: "client_contact" as ParticipantRole,
  });

  // Build content map for ghost typing
  const contentMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const room of formData.rooms) {
      map[room.key] = SAMPLE_CONTENT[room.key] || "Sample content for this section.";
    }
    return map;
  }, [formData.rooms]);

  const { getDisplayedContent } = useGhostTyping(contentMap);

  // Convert to StandaloneRoom format for preview
  const mockRooms: StandaloneRoom[] = useMemo(() => {
    return formData.rooms.map((room, idx) => ({
      id: room.id,
      key: room.key,
      label: room.label,
      prompt: room.prompt,
      visibility: room.visibility === "consultant_only" ? ("private" as const) : ("public" as const),
      orderIndex: idx,
      blocks: [
        {
          id: `${room.key}_content`,
          blockType: "text" as const,
          content: getDisplayedContent(room.key, room.prompt || ""),
          orderIndex: 0,
        },
      ],
    }));
  }, [formData.rooms, getDisplayedContent]);

  const mockIdentity: Identity = useMemo(() => ({
    name: formData.name || "Untitled Engagement",
    title: formData.clientName || "Client Project",
    bio: formData.description || (formData.value
      ? `${formData.currency} ${parseFloat(formData.value).toLocaleString()} engagement`
      : "Consulting engagement"),
    location: "",
    skills: [],
    links: [],
  }), [formData.name, formData.clientName, formData.description, formData.value, formData.currency]);

  const updateField = useCallback(<K extends keyof EngagementFormData>(
    key: K,
    value: EngagementFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleClientSelect = (client: ClientSummary | null) => {
    if (client) {
      updateField("clientId", client.id);
      updateField("clientName", client.name);
      setNewClientMode(false);
    } else {
      updateField("clientId", null);
      updateField("clientName", "");
    }
  };

  const handleCreateClient = async () => {
    if (!newClientName.trim()) return;

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newClientName.trim(),
          ownerId,
        }),
      });

      if (!res.ok) throw new Error("Failed to create client");

      const { client } = await res.json();
      updateField("clientId", client.id);
      updateField("clientName", client.name);
      setNewClientMode(false);
      setNewClientName("");
    } catch {
      setError("Failed to create client");
    }
  };

  const handleAddParticipant = () => {
    if (!newParticipant.name.trim() || !newParticipant.email.trim()) return;

    const participant: PendingParticipant = {
      id: crypto.randomUUID(),
      name: newParticipant.name.trim(),
      email: newParticipant.email.trim(),
      role: newParticipant.role,
    };

    updateField("participants", [...formData.participants, participant]);
    setNewParticipant({ name: "", email: "", role: "client_contact" });
    setNewParticipantMode(false);
  };

  const handleRemoveParticipant = (id: string) => {
    updateField("participants", formData.participants.filter((p) => p.id !== id));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError("Engagement name is required");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/engagements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          clientId: formData.clientId,
          ownerId,
          ownerName,
          ownerEmail,
          value: formData.value ? parseFloat(formData.value) : null,
          currency: formData.currency,
          startDate: formData.startDate || null,
          endDate: formData.endDate || null,
          rooms: formData.rooms,
          participants: formData.participants,
        }),
      });

      if (!res.ok) throw new Error("Failed to create engagement");

      const { engagement } = await res.json();
      setLaunched(true);

      if (onComplete) {
        onComplete(engagement.id);
      }
    } catch {
      setError("Failed to create engagement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleRoom = (roomKey: string) => {
    const exists = formData.rooms.find((r) => r.key === roomKey);
    if (exists) {
      updateField("rooms", formData.rooms.filter((r) => r.key !== roomKey));
    } else {
      const template = DEFAULT_ENGAGEMENT_ROOMS.find((r) => r.key === roomKey);
      if (template) {
        updateField("rooms", [
          ...formData.rooms,
          { ...template, id: `room_${formData.rooms.length}` },
        ]);
      }
    }
  };

  const updateRoomVisibility = (roomKey: string, visibility: EngagementRoomVisibility) => {
    updateField(
      "rooms",
      formData.rooms.map((r) => (r.key === roomKey ? { ...r, visibility } : r))
    );
  };

  const advance = () => {
    if (!started) {
      setStarted(true);
      return;
    }
    setDone((d) => new Set([...d, WIZARD_STEPS[wizStep - 1].id]));
    if (wizStep < WIZARD_STEPS.length) {
      setWizStep((w) => w + 1);
    } else {
      handleSubmit();
    }
  };

  // ── Launched State ──────────────────────────────────────────────────────────

  if (launched) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={FADE}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          gap: 24,
          textAlign: "center",
          padding: 40,
          background: C.void,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: C.edge,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: `1px solid ${C.sep}`,
          }}
        >
          <span style={{ fontSize: 20, color: C.green, fontWeight: 600 }}>✓</span>
        </div>

        <div>
          <div style={{ fontSize: 20, fontWeight: 600, color: C.t1, letterSpacing: "-.025em" }}>
            {formData.name || "Your engagement"} is ready
          </div>
          <div style={{ fontSize: 13, color: C.t3, maxWidth: 360, lineHeight: 1.7, marginTop: 8 }}>
            Your artefact is set up with {formData.rooms.length} rooms
            {formData.participants.length > 0 && ` and ${formData.participants.length} participants invited`}.
          </div>
        </div>

        {/* MCP Connection Info */}
        <div
          style={{
            background: C.edge,
            border: `1px solid ${C.sep}`,
            borderRadius: 10,
            padding: "16px 20px",
            maxWidth: 360,
            textAlign: "left",
          }}
        >
          <div style={{ fontSize: 10, color: C.t4, marginBottom: 8, fontFamily: "'DM Mono', monospace", letterSpacing: ".04em", textTransform: "uppercase" }}>
            AI Integration
          </div>
          <div style={{ fontSize: 12, color: C.t2, lineHeight: 1.6 }}>
            This engagement is now accessible via MCP. Claude can read and write to your rooms directly.
          </div>
          <div style={{ fontSize: 10, color: C.t4, marginTop: 8, fontFamily: "'DM Mono', monospace" }}>
            mcp://engagement/{formData.name.toLowerCase().replace(/\s+/g, "-")}/rooms
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <motion.button
            whileHover={{ opacity: 0.8 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push("/practice")}
            style={{
              padding: "9px 20px",
              border: `1px solid ${C.t2}`,
              borderRadius: 8,
              background: "transparent",
              color: C.t1,
              fontSize: 11,
              fontFamily: "'DM Mono', monospace",
              letterSpacing: ".04em",
              cursor: "pointer",
            }}
          >
            View engagements
          </motion.button>
        </div>
      </motion.div>
    );
  }

  // ── Render Step Content ─────────────────────────────────────────────────────

  const renderStepContent = (step: WizardStep) => {
    if (step.id === "identity") {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 11, color: C.t3, marginBottom: 4, lineHeight: 1.6 }}>
            Give your engagement an identity. This is how it appears to participants.
          </div>
          <div>
            <Lbl style={{ display: "block", marginBottom: 6, fontSize: 10 }}>Name</Lbl>
            <input
              type="text"
              placeholder="Q1 Strategy Engagement"
              value={formData.name}
              onChange={(e) => updateField("name", e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                background: C.bg,
                border: `1px solid ${C.sep}`,
                borderRadius: 6,
                color: C.t1,
                fontSize: 12,
                outline: "none",
              }}
            />
          </div>
          <div>
            <Lbl style={{ display: "block", marginBottom: 6, fontSize: 10 }}>Description</Lbl>
            <textarea
              placeholder="What is this engagement about? What are the goals?"
              value={formData.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={3}
              style={{
                width: "100%",
                padding: "10px 12px",
                background: C.bg,
                border: `1px solid ${C.sep}`,
                borderRadius: 6,
                color: C.t1,
                fontSize: 12,
                outline: "none",
                resize: "none",
                lineHeight: 1.5,
              }}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 80px", gap: 8 }}>
            <div>
              <Lbl style={{ display: "block", marginBottom: 6, fontSize: 10 }}>Value</Lbl>
              <input
                type="number"
                placeholder="Contract value"
                value={formData.value}
                onChange={(e) => updateField("value", e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: C.bg,
                  border: `1px solid ${C.sep}`,
                  borderRadius: 6,
                  color: C.t1,
                  fontSize: 12,
                  outline: "none",
                }}
              />
            </div>
            <div>
              <Lbl style={{ display: "block", marginBottom: 6, fontSize: 10 }}>Currency</Lbl>
              <select
                value={formData.currency}
                onChange={(e) => updateField("currency", e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 8px",
                  background: C.bg,
                  border: `1px solid ${C.sep}`,
                  borderRadius: 6,
                  color: C.t1,
                  fontSize: 12,
                  outline: "none",
                }}
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="NGN">NGN</option>
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <Lbl style={{ display: "block", marginBottom: 6, fontSize: 10 }}>Start</Lbl>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => updateField("startDate", e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: C.bg,
                  border: `1px solid ${C.sep}`,
                  borderRadius: 6,
                  color: C.t1,
                  fontSize: 12,
                  outline: "none",
                }}
              />
            </div>
            <div>
              <Lbl style={{ display: "block", marginBottom: 6, fontSize: 10 }}>End</Lbl>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => updateField("endDate", e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: C.bg,
                  border: `1px solid ${C.sep}`,
                  borderRadius: 6,
                  color: C.t1,
                  fontSize: 12,
                  outline: "none",
                }}
              />
            </div>
          </div>
        </div>
      );
    }

    if (step.id === "client") {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 11, color: C.t3, marginBottom: 8, lineHeight: 1.6 }}>
            Attach a client to this engagement.
          </div>
          {!newClientMode ? (
            <>
              {clients.map((client) => (
                <motion.div
                  key={client.id}
                  whileHover={{ borderColor: C.blue }}
                  onClick={() => handleClientSelect(client)}
                  style={{
                    padding: "12px 14px",
                    background: C.bg,
                    border: `1px solid ${formData.clientId === client.id ? C.blue : C.sep}`,
                    borderRadius: 8,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 5,
                      background: C.void,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 600,
                      color: C.t2,
                    }}
                  >
                    {client.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{client.name}</div>
                    {client.industry && (
                      <div style={{ fontSize: 10, color: C.t3 }}>{client.industry}</div>
                    )}
                  </div>
                </motion.div>
              ))}

              {clients.length === 0 && (
                <div style={{ padding: 16, textAlign: "center", color: C.t3, fontSize: 11 }}>
                  No clients yet
                </div>
              )}

              <motion.button
                whileHover={{ borderColor: C.t3 }}
                onClick={() => setNewClientMode(true)}
                style={{
                  padding: "10px 14px",
                  background: "transparent",
                  border: `1px dashed ${C.sep}`,
                  borderRadius: 8,
                  color: C.t3,
                  fontSize: 11,
                  cursor: "pointer",
                  textAlign: "center",
                }}
              >
                + New client
              </motion.button>
            </>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              <input
                type="text"
                placeholder="Client name"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                style={{
                  padding: "10px 12px",
                  background: C.bg,
                  border: `1px solid ${C.sep}`,
                  borderRadius: 6,
                  color: C.t1,
                  fontSize: 12,
                  outline: "none",
                }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setNewClientMode(false)}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    background: "transparent",
                    border: `1px solid ${C.sep}`,
                    borderRadius: 6,
                    color: C.t2,
                    fontSize: 11,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreateClient}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    background: C.blue,
                    border: "none",
                    borderRadius: 6,
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Create
                </motion.button>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (step.id === "participants") {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 11, color: C.t3, marginBottom: 8, lineHeight: 1.6 }}>
            Invite participants. They&apos;ll see rooms based on visibility settings.
          </div>

          {/* Owner (always shown) */}
          <div
            style={{
              padding: "12px 14px",
              background: C.edge,
              border: `1px solid ${C.sep}`,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 5,
                background: C.blue + "20",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 600,
                color: C.blue,
              }}
            >
              {ownerName.slice(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500 }}>{ownerName}</div>
              <div style={{ fontSize: 10, color: C.t3 }}>{ownerEmail}</div>
            </div>
            <span style={{ fontSize: 9, color: C.t4, fontFamily: "'DM Mono', monospace" }}>
              Owner
            </span>
          </div>

          {/* Pending participants */}
          {formData.participants.map((p) => (
            <div
              key={p.id}
              style={{
                padding: "12px 14px",
                background: C.bg,
                border: `1px solid ${C.sep}`,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 5,
                  background: C.void,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 600,
                  color: C.t2,
                }}
              >
                {p.name.slice(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{p.name}</div>
                <div style={{ fontSize: 10, color: C.t3 }}>{p.email}</div>
              </div>
              <span style={{ fontSize: 9, color: C.t4, fontFamily: "'DM Mono', monospace" }}>
                {getRoleLabel(p.role)}
              </span>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handleRemoveParticipant(p.id)}
                style={{
                  width: 20,
                  height: 20,
                  background: "transparent",
                  border: "none",
                  color: C.t4,
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                ×
              </motion.button>
            </div>
          ))}

          {/* Add participant form */}
          {!newParticipantMode ? (
            <motion.button
              whileHover={{ borderColor: C.t3 }}
              onClick={() => setNewParticipantMode(true)}
              style={{
                padding: "10px 14px",
                background: "transparent",
                border: `1px dashed ${C.sep}`,
                borderRadius: 8,
                color: C.t3,
                fontSize: 11,
                cursor: "pointer",
                textAlign: "center",
              }}
            >
              + Invite participant
            </motion.button>
          ) : (
            <div
              style={{
                padding: "12px 14px",
                background: C.bg,
                border: `1px solid ${C.sep}`,
                borderRadius: 8,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <input
                  type="text"
                  placeholder="Name"
                  value={newParticipant.name}
                  onChange={(e) => setNewParticipant({ ...newParticipant, name: e.target.value })}
                  style={{
                    padding: "8px 10px",
                    background: C.void,
                    border: `1px solid ${C.sep}`,
                    borderRadius: 6,
                    color: C.t1,
                    fontSize: 11,
                    outline: "none",
                  }}
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={newParticipant.email}
                  onChange={(e) => setNewParticipant({ ...newParticipant, email: e.target.value })}
                  style={{
                    padding: "8px 10px",
                    background: C.void,
                    border: `1px solid ${C.sep}`,
                    borderRadius: 6,
                    color: C.t1,
                    fontSize: 11,
                    outline: "none",
                  }}
                />
              </div>
              <select
                value={newParticipant.role}
                onChange={(e) => setNewParticipant({ ...newParticipant, role: e.target.value as ParticipantRole })}
                style={{
                  padding: "8px 10px",
                  background: C.void,
                  border: `1px solid ${C.sep}`,
                  borderRadius: 6,
                  color: C.t1,
                  fontSize: 11,
                  outline: "none",
                }}
              >
                <option value="client_contact">Client Contact (can edit shared rooms)</option>
                <option value="client_observer">Client Observer (view only)</option>
                <option value="consultant">Consultant</option>
                <option value="observer">Observer</option>
              </select>
              <div style={{ display: "flex", gap: 8 }}>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setNewParticipantMode(false)}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    background: "transparent",
                    border: `1px solid ${C.sep}`,
                    borderRadius: 6,
                    color: C.t2,
                    fontSize: 11,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddParticipant}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    background: C.blue,
                    border: "none",
                    borderRadius: 6,
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Add
                </motion.button>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (step.id === "rooms") {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <div style={{ fontSize: 11, color: C.t3, marginBottom: 12, lineHeight: 1.6 }}>
            Configure rooms. Each room has visibility that controls who can see it.
          </div>
          {DEFAULT_ENGAGEMENT_ROOMS.map((template) => {
            const active = formData.rooms.find((r) => r.key === template.key);
            const isExpanded = expandedRoomId === template.key;

            return (
              <div key={template.key}>
                <motion.div
                  whileHover={{ borderColor: active ? C.blue : C.t3 }}
                  onClick={() => {
                    if (active) {
                      setExpandedRoomId(isExpanded ? null : template.key);
                    } else {
                      toggleRoom(template.key);
                    }
                  }}
                  style={{
                    padding: "12px 14px",
                    background: C.bg,
                    border: `1px solid ${active ? C.blue : C.sep}`,
                    borderRadius: isExpanded ? "8px 8px 0 0" : 8,
                    marginBottom: isExpanded ? 0 : 8,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={!!active}
                    onChange={() => toggleRoom(template.key)}
                    onClick={(e) => e.stopPropagation()}
                    style={{ accentColor: C.blue }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 500 }}>{template.label}</span>
                      {active && <VisibilityBadge visibility={active.visibility} C={C} />}
                    </div>
                    {template.prompt && (
                      <div style={{ fontSize: 10, color: C.t3, marginTop: 2 }}>
                        {template.prompt}
                      </div>
                    )}
                  </div>
                  {active && <span style={{ fontSize: 10, color: C.t4 }}>{isExpanded ? "−" : "+"}</span>}
                </motion.div>

                <AnimatePresence>
                  {isExpanded && active && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{
                        background: C.bg,
                        border: `1px solid ${C.blue}`,
                        borderTop: "none",
                        borderRadius: "0 0 8px 8px",
                        padding: "12px 14px",
                        marginBottom: 8,
                      }}
                    >
                      <Lbl style={{ display: "block", marginBottom: 8, fontSize: 10 }}>Visibility</Lbl>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {(["consultant_only", "client_view", "client_edit"] as const).map((vis) => (
                          <label
                            key={vis}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              cursor: "pointer",
                              padding: "6px 8px",
                              borderRadius: 6,
                              background: active.visibility === vis ? `${C.blue}10` : "transparent",
                            }}
                          >
                            <input
                              type="radio"
                              name={`visibility-${template.key}`}
                              checked={active.visibility === vis}
                              onChange={() => updateRoomVisibility(template.key, vis)}
                              style={{ accentColor: C.blue }}
                            />
                            <span style={{ fontSize: 11, color: active.visibility === vis ? C.t1 : C.t2 }}>
                              {getVisibilityLabel(vis)}
                            </span>
                          </label>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      );
    }

    if (step.id === "launch") {
      const clientRooms = formData.rooms.filter((r) => r.visibility !== "consultant_only");
      const privateRooms = formData.rooms.filter((r) => r.visibility === "consultant_only");

      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 12, color: C.t2, lineHeight: 1.65 }}>
            Your artefact is ready to launch.
          </div>

          {/* Summary */}
          <div
            style={{
              background: C.edge,
              border: `1px solid ${C.sep}`,
              borderRadius: 8,
              padding: "12px 14px",
            }}
          >
            <div style={{ fontSize: 10, color: C.t4, marginBottom: 8, fontFamily: "'DM Mono', monospace", letterSpacing: ".04em", textTransform: "uppercase" }}>
              Summary
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                <span style={{ color: C.t3 }}>Client-visible rooms</span>
                <span style={{ color: C.t1 }}>{clientRooms.length}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                <span style={{ color: C.t3 }}>Private rooms</span>
                <span style={{ color: C.t1 }}>{privateRooms.length}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                <span style={{ color: C.t3 }}>Participants</span>
                <span style={{ color: C.t1 }}>{formData.participants.length + 1}</span>
              </div>
              {formData.value && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                  <span style={{ color: C.t3 }}>Value</span>
                  <span style={{ color: C.t1 }}>{formData.currency} {parseFloat(formData.value).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* MCP Info */}
          <div
            style={{
              background: `${C.blue}10`,
              border: `1px solid ${C.blue}30`,
              borderRadius: 8,
              padding: "12px 14px",
            }}
          >
            <div style={{ fontSize: 10, color: C.blue, marginBottom: 6, fontFamily: "'DM Mono', monospace" }}>
              AI-Ready
            </div>
            <div style={{ fontSize: 11, color: C.t2, lineHeight: 1.5 }}>
              This engagement will be accessible via MCP. AI can read context and write content directly to rooms.
            </div>
          </div>

          {error && (
            <div
              style={{
                padding: "10px 12px",
                background: "rgba(239, 68, 68, 0.15)",
                border: "1px solid #ef4444",
                borderRadius: 6,
                color: "#ef4444",
                fontSize: 11,
              }}
            >
              {error}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  const renderStepAction = (step: WizardStep) => (
    <motion.button
      onClick={advance}
      disabled={isSubmitting}
      whileHover={{ opacity: 0.8 }}
      whileTap={{ scale: 0.97 }}
      style={{
        marginTop: 16,
        padding: "9px 22px",
        border: `1px solid ${C.t2}`,
        borderRadius: 8,
        background: "transparent",
        color: C.t1,
        fontSize: 11,
        fontFamily: "'DM Mono', monospace",
        letterSpacing: ".04em",
        cursor: isSubmitting ? "not-allowed" : "pointer",
        opacity: isSubmitting ? 0.7 : 1,
      }}
    >
      {step.id === "launch" ? (isSubmitting ? "Creating..." : "Launch artefact →") : "Continue →"}
    </motion.button>
  );

  // ── Welcome Content ─────────────────────────────────────────────────────────

  const welcomeContent = (
    <>
      {/* Minimal branded header */}
      <div
        style={{
          width: "100%",
          padding: "20px 32px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            background: `linear-gradient(135deg, ${C.blue}40 0%, ${C.blue}20 100%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: `1px solid ${C.sep}`,
          }}
        >
          <span style={{ fontSize: 10, color: C.blue, fontWeight: 600 }}>E</span>
        </div>
        <span style={{ fontSize: 11, color: C.t3, fontFamily: "'DM Sans', sans-serif" }}>
          {formData.name || "New Engagement"}
        </span>
      </div>

      {/* Main welcome content */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px 80px" }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 16,
                  background: `linear-gradient(135deg, ${C.blue}15 0%, ${C.blue}05 100%)`,
                  border: `2px solid ${C.sep}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                }}
              >
                <span style={{ fontSize: 24, color: C.blue, fontWeight: 600 }}>E</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div style={{ fontSize: 11, color: C.t4, marginBottom: 8, fontFamily: "'DM Mono', monospace", letterSpacing: ".04em", textTransform: "uppercase" }}>
                Create your artefact
              </div>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Engagement Name"
                style={{
                  width: "100%",
                  maxWidth: 280,
                  fontSize: 24,
                  fontWeight: 600,
                  color: C.t1,
                  background: "transparent",
                  border: "none",
                  borderBottom: `1px solid ${formData.name ? "transparent" : C.sep}`,
                  textAlign: "center",
                  outline: "none",
                  padding: "8px 0",
                  fontFamily: "'DM Sans', sans-serif",
                  letterSpacing: "-.025em",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => e.target.style.borderBottomColor = C.t3}
                onBlur={(e) => e.target.style.borderBottomColor = formData.name ? "transparent" : C.sep}
              />
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              style={{ fontSize: 13, color: C.t3, marginTop: 16, lineHeight: 1.7, maxWidth: 340, margin: "16px auto 0" }}
            >
              A structured container for your engagement with identity, rooms, history, and access control.
            </motion.p>
          </div>

          {/* Steps preview */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            style={{
              background: C.edge,
              borderRadius: 12,
              padding: "16px 20px",
              marginBottom: 24,
              border: `1px solid ${C.sep}`,
            }}
          >
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {WIZARD_STEPS.map((s, idx) => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 6, opacity: 0.7 }}>
                  <span style={{ fontSize: 9, color: C.t4, fontFamily: "'DM Mono', monospace" }}>{idx + 1}</span>
                  <span style={{ fontSize: 11, color: C.t2 }}>{s.label}</span>
                  {idx < WIZARD_STEPS.length - 1 && <span style={{ color: C.sep, marginLeft: 6 }}>·</span>}
                </div>
              ))}
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            style={{ textAlign: "center" }}
          >
            <motion.button
              onClick={advance}
              whileHover={{ opacity: 0.9, y: -1 }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: "12px 32px",
                background: `linear-gradient(135deg, ${C.t1} 0%, ${dark ? "#555" : "#333"} 100%)`,
                border: "none",
                borderRadius: 10,
                color: C.bg,
                fontSize: 13,
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 500,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                boxShadow: dark ? "0 4px 20px rgba(0,0,0,0.4)" : "0 4px 20px rgba(0,0,0,0.12)",
              }}
            >
              Start setup
              <span style={{ fontSize: 14, opacity: 0.8 }}>→</span>
            </motion.button>
            <div style={{ fontSize: 10, color: C.t4, marginTop: 12, fontFamily: "'DM Mono', monospace" }}>
              Takes about 2 minutes
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );

  // ── Left Panel Header ───────────────────────────────────────────────────────

  const leftPanelHeader = (
    <>
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: 5,
          background: C.edge,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: `1px solid ${C.sep}`,
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 9, color: C.t3, fontWeight: 600 }}>E</span>
      </div>
      <span style={{ fontSize: 12, color: C.t1, fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>
        {formData.name || "New Engagement"}
      </span>
    </>
  );

  // ── Left Panel Content ──────────────────────────────────────────────────────

  const leftPanelContent = (
    <>
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontSize: 11,
            color: C.t4,
            marginBottom: 4,
            fontFamily: "'DM Mono', monospace",
            letterSpacing: ".04em",
            textTransform: "uppercase",
          }}
        >
          Setup progress
        </div>
      </div>

      <StepAccordion
        steps={WIZARD_STEPS}
        currentStep={wizStep}
        doneSteps={done}
        onStepClick={setWizStep}
        renderStepContent={renderStepContent}
        renderStepAction={renderStepAction}
      />
    </>
  );

  // ── Right Panel Content ─────────────────────────────────────────────────────

  const isFullscreen = wizStep === 4 && expandedRoomId;

  const rightPanelContent = (
    <AnimatePresence mode="wait">
      {isFullscreen ? (
        <motion.div
          key="fullscreen-preview"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.28, ease: [0.22, 0.1, 0.36, 1] }}
          style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, padding: 24 }}
        >
          <ArtefactPreviewPanel
            rooms={mockRooms}
            identity={mockIdentity}
            showExpanded
            focusedRoomId={expandedRoomId}
            fullscreen
          />
        </motion.div>
      ) : (
        <motion.div
          key="compact-preview"
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.28, ease: [0.22, 0.1, 0.36, 1] }}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            position: "relative",
            zIndex: 1,
          }}
        >
          <motion.span
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.2 }}
            className="mono"
            style={{
              fontSize: 8,
              color: C.t4,
              letterSpacing: ".08em",
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            artefact preview
          </motion.span>

          <motion.div
            key={JSON.stringify(formData.rooms) + wizStep}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 0.1, 0.36, 1] }}
          >
            <ArtefactPreviewPanel
              rooms={mockRooms}
              identity={mockIdentity}
              showExpanded={false}
              focusedRoomId={null}
            />
          </motion.div>

          <motion.span
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.2 }}
            style={{ fontSize: 11, color: C.t4, lineHeight: 1.6 }}
          >
            Updates live as you configure each step.
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <WizardLayout
      started={started}
      dark={dark}
      welcomeContent={welcomeContent}
      leftPanelHeader={leftPanelHeader}
      leftPanelContent={leftPanelContent}
      rightPanelContent={rightPanelContent}
      rightPanelFullscreen={!!isFullscreen}
    />
  );
}
