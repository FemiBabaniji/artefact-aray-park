"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useC } from "@/hooks/useC";
import { SPF } from "@/lib/motion";
import {
  RenderIntent,
  RENDER_INTENT_DEFAULTS,
  RenderRoomSelection,
  EngagementRender,
  EngagementType,
} from "@/types/render";

type Room = {
  id: string;
  key: string;
  label: string;
  visibility: string;
};

type RenderConfigPanelProps = {
  engagementId: string;
  rooms: Room[];
  engagementType?: EngagementType;
  onClose: (render?: EngagementRender) => void;
};

// Intent options grouped by engagement type relevance
const BASE_INTENTS: { value: RenderIntent; label: string }[] = [
  { value: "client_portal", label: "Client Portal" },
  { value: "pitch_deck", label: "Pitch Deck" },
  { value: "demo_render", label: "Demo Render" },
];

const FRACTIONAL_INTENTS: { value: RenderIntent; label: string }[] = [
  { value: "client_portal", label: "CEO/Founder Dashboard" },
  { value: "weekly_update", label: "Weekly Update" },
  { value: "monthly_report", label: "Monthly Report" },
  { value: "board_prep", label: "Board Prep" },
  { value: "quarterly_review", label: "Quarterly Review" },
  { value: "demo_render", label: "Demo Render" },
];

const STRATEGY_INTENTS: { value: RenderIntent; label: string }[] = [
  { value: "client_portal", label: "Client Portal" },
  { value: "board_summary", label: "Board Summary" },
  { value: "pitch_deck", label: "Pitch Deck" },
  { value: "handover_doc", label: "Handover Doc" },
  { value: "demo_render", label: "Demo Render" },
];

const TRANSFORMATION_INTENTS: { value: RenderIntent; label: string }[] = [
  { value: "client_portal", label: "Transformation Hub" },
  { value: "steering_update", label: "Steering Committee Update" },
  { value: "exec_presentation", label: "Executive Presentation" },
  { value: "implementation_guide", label: "Implementation Guide" },
  { value: "handover_doc", label: "Handover Doc" },
  { value: "demo_render", label: "Demo Render" },
];

const ADVISORY_INTENTS: { value: RenderIntent; label: string }[] = [
  { value: "client_portal", label: "Advisory Portal" },
  { value: "session_recap", label: "Session Recap" },
  { value: "relationship_summary", label: "Relationship Summary" },
  { value: "demo_render", label: "Demo Render" },
];

function getIntentsForType(engagementType?: EngagementType): { value: RenderIntent; label: string }[] {
  switch (engagementType) {
    case "fractional":
    case "fractional_coo":
    case "fractional_cmo":
      return FRACTIONAL_INTENTS;
    case "strategy":
    case "due_diligence":
      return STRATEGY_INTENTS;
    case "ops_transformation":
    case "org_design":
    case "implementation":
      return TRANSFORMATION_INTENTS;
    case "advisory":
    case "strategic_advisory":
      return ADVISORY_INTENTS;
    default:
      return BASE_INTENTS;
  }
}

export function RenderConfigPanel({
  engagementId,
  rooms,
  engagementType,
  onClose,
}: RenderConfigPanelProps) {
  const C = useC();
  const intentOptions = getIntentsForType(engagementType);

  // Layer 1: Intent selection
  const [selectedIntent, setSelectedIntent] = useState<RenderIntent | null>(null);

  // Layer 2: Room selection
  const [roomSelections, setRoomSelections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    rooms.forEach((r) => {
      initial[r.id] = true;
    });
    return initial;
  });
  const [featuredOnly, setFeaturedOnly] = useState(false);

  // Layer 3: Save options
  const [renderName, setRenderName] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Apply intent defaults
  const handleIntentChange = useCallback(
    (intent: RenderIntent) => {
      setSelectedIntent(intent);
      const defaults = RENDER_INTENT_DEFAULTS[intent];

      // Auto-set name if empty
      if (!renderName) {
        setRenderName(defaults.name);
      }

      // Set featured only from defaults
      setFeaturedOnly(defaults.showFeaturedOnly);

      // Set room selections based on defaults
      const newSelections: Record<string, boolean> = {};
      rooms.forEach((r) => {
        newSelections[r.id] = defaults.rooms.includes(r.key);
      });
      setRoomSelections(newSelections);
    },
    [rooms, renderName]
  );

  // Toggle room selection
  const toggleRoom = useCallback((roomId: string) => {
    setRoomSelections((prev) => ({
      ...prev,
      [roomId]: !prev[roomId],
    }));
  }, []);

  // Build room selections array
  const buildRoomSelections = useCallback((): RenderRoomSelection[] => {
    return rooms.map((r) => ({
      roomId: r.id,
      roomKey: r.key,
      included: roomSelections[r.id] ?? false,
    }));
  }, [rooms, roomSelections]);

  // Save render
  const handleSave = async () => {
    if (!selectedIntent || !renderName.trim()) {
      setError("Please select an intent and enter a name");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/engagements/${engagementId}/renders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: renderName.trim(),
          intent: selectedIntent,
          roomSelections: buildRoomSelections(),
          renderConfig: {
            intent: selectedIntent,
            showFeaturedOnly: featuredOnly,
            masks: RENDER_INTENT_DEFAULTS[selectedIntent].defaultMasks,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save render");
      }

      const data = await res.json();
      onClose(data.render);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save render");
    } finally {
      setSaving(false);
    }
  };

  // Save as practice template
  const handleSaveAsTemplate = async () => {
    if (!selectedIntent || !renderName.trim()) {
      setError("Please select an intent and enter a name");
      return;
    }

    setSavingTemplate(true);
    setError(null);

    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: renderName.trim(),
          description: RENDER_INTENT_DEFAULTS[selectedIntent].description,
          roomSchema: rooms.map((r) => ({
            key: r.key,
            label: r.label,
            visibility: r.visibility,
            required: roomSelections[r.id] ?? false,
          })),
          renderIntents: {
            [selectedIntent]: {
              ...RENDER_INTENT_DEFAULTS[selectedIntent],
              name: renderName.trim(),
              rooms: rooms.filter((r) => roomSelections[r.id]).map((r) => r.key),
              showFeaturedOnly: featuredOnly,
            },
          },
          visibility: "practice",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save template");
      }

      const data = await res.json();
      onClose(data.template);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save template");
    } finally {
      setSavingTemplate(false);
    }
  };

  const selectedRoomCount = Object.values(roomSelections).filter(Boolean).length;

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={SPF}
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        width: 420,
        background: C.bg,
        borderLeft: `1px solid ${C.sep}`,
        display: "flex",
        flexDirection: "column",
        zIndex: 1000,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: `1px solid ${C.sep}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 600, color: C.t1 }}>
          Configure Render
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onClose()}
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: "transparent",
            border: `1px solid ${C.sep}`,
            color: C.t3,
            fontSize: 16,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          x
        </motion.button>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        {/* Layer 1: Render Intent */}
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: C.t2,
              marginBottom: 12,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            1. Render Intent
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {intentOptions.map((option) => {
              const defaults = RENDER_INTENT_DEFAULTS[option.value];
              const isSelected = selectedIntent === option.value;

              return (
                <motion.button
                  key={option.value}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleIntentChange(option.value)}
                  style={{
                    padding: "12px 14px",
                    background: isSelected ? `${C.blue}15` : "transparent",
                    border: `1px solid ${isSelected ? C.blue : C.sep}`,
                    borderRadius: 8,
                    cursor: "pointer",
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      border: `2px solid ${isSelected ? C.blue : C.t4}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: C.blue,
                        }}
                      />
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: C.t1 }}>
                      {option.label}
                    </div>
                    <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>
                      {defaults.description}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Layer 2: Room Selection */}
        <AnimatePresence>
          {selectedIntent && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={SPF}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: C.t2,
                  marginBottom: 12,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                2. Room Selection
                <span style={{ color: C.t4, fontWeight: 400, marginLeft: 8 }}>
                  ({selectedRoomCount} of {rooms.length})
                </span>
              </div>

              <div
                style={{
                  background: C.void,
                  border: `1px solid ${C.sep}`,
                  borderRadius: 10,
                  overflow: "hidden",
                }}
              >
                {rooms.map((room, idx) => {
                  const isIncluded = roomSelections[room.id] ?? false;
                  const isConsultantOnly = room.visibility === "consultant_only";

                  return (
                    <motion.div
                      key={room.id}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => toggleRoom(room.id)}
                      style={{
                        padding: "12px 14px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        borderBottom: idx < rooms.length - 1 ? `1px solid ${C.sep}` : "none",
                        background: isIncluded ? `${C.blue}08` : "transparent",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: 4,
                            border: `2px solid ${isIncluded ? C.blue : C.t4}`,
                            background: isIncluded ? C.blue : "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          {isIncluded && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                            >
                              ✓
                            </motion.span>
                          )}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: C.t1 }}>
                            {room.label}
                          </div>
                          <div style={{ fontSize: 11, color: C.t4 }}>{room.key}</div>
                        </div>
                      </div>

                      {isConsultantOnly && (
                        <div
                          title="Consultant only - not visible to clients"
                          style={{
                            padding: "2px 6px",
                            background: `${C.amber}15`,
                            borderRadius: 4,
                            fontSize: 10,
                            color: C.amber,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <span style={{ fontSize: 9 }}>🔒</span>
                          Private
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Featured only toggle */}
              <div
                style={{
                  marginTop: 12,
                  padding: "12px 14px",
                  background: C.void,
                  border: `1px solid ${C.sep}`,
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: C.t1 }}>
                    Featured blocks only
                  </div>
                  <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>
                    Only include blocks marked as featured
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFeaturedOnly(!featuredOnly)}
                  style={{
                    width: 40,
                    height: 22,
                    borderRadius: 11,
                    background: featuredOnly ? C.green : C.sep,
                    border: "none",
                    cursor: "pointer",
                    position: "relative",
                  }}
                >
                  <motion.div
                    animate={{ x: featuredOnly ? 18 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    style={{
                      position: "absolute",
                      top: 2,
                      left: 2,
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: "#fff",
                    }}
                  />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Layer 3: Save Options */}
        <AnimatePresence>
          {selectedIntent && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={SPF}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: C.t2,
                  marginBottom: 12,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                3. Save Options
              </div>

              {/* Name input */}
              <div style={{ marginBottom: 12 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 500,
                    color: C.t2,
                    marginBottom: 6,
                  }}
                >
                  Render Name
                </label>
                <input
                  type="text"
                  value={renderName}
                  onChange={(e) => setRenderName(e.target.value)}
                  placeholder="e.g., Q1 Client Portal"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    background: C.void,
                    border: `1px solid ${C.sep}`,
                    borderRadius: 8,
                    fontSize: 13,
                    color: C.t1,
                    outline: "none",
                  }}
                />
              </div>

              {/* Error message */}
              {error && (
                <div
                  style={{
                    marginBottom: 12,
                    padding: "10px 12px",
                    background: "#ef444415",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "#ef4444",
                  }}
                >
                  {error}
                </div>
              )}

              {/* Save buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  disabled={saving || savingTemplate}
                  style={{
                    padding: "12px 16px",
                    background: C.blue,
                    border: "none",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#fff",
                    cursor: saving ? "wait" : "pointer",
                    opacity: saving || savingTemplate ? 0.7 : 1,
                  }}
                >
                  {saving ? "Saving..." : "Save Render"}
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSaveAsTemplate}
                  disabled={saving || savingTemplate}
                  style={{
                    padding: "12px 16px",
                    background: "transparent",
                    border: `1px solid ${C.sep}`,
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 500,
                    color: C.t2,
                    cursor: savingTemplate ? "wait" : "pointer",
                    opacity: saving || savingTemplate ? 0.7 : 1,
                  }}
                >
                  {savingTemplate ? "Saving..." : "Save as Practice Template"}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer hint */}
      <div
        style={{
          padding: "12px 20px",
          borderTop: `1px solid ${C.sep}`,
          fontSize: 11,
          color: C.t4,
          textAlign: "center",
        }}
      >
        Renders can be shared with clients via a unique link
      </div>
    </motion.div>
  );
}
