"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useC } from "@/hooks/useC";
import { SPF } from "@/lib/motion";
import type { Engagement, EngagementPhase } from "@/types/engagement";
import { getPhaseLabel } from "@/types/engagement";
import type { Participant } from "@/types/participant";
import { isConsultant, isClient } from "@/types/participant";

import { Surface } from "@/components/ds/Surface";
import { Card } from "@/components/ds/Card";
import { Stat } from "@/components/ds/Stat";
import { Badge } from "@/components/ds/Badge";
import { Section } from "@/components/ds/Section";
import { Indicator } from "@/components/ds/Indicator";
import { ListRow, ListRowTitle, ListRowSubtitle } from "@/components/ds/ListRow";
import { Empty } from "@/components/ds/Empty";

import { PhaseTimeline } from "./dashboard/sections/PhaseTimeline";
import { ParticipantList } from "./dashboard/sections/ParticipantList";
import { RoomList } from "./dashboard/sections/RoomList";
import { ActivityFeed } from "./dashboard/sections/ActivityFeed";
import { ClientPortalPreview } from "./dashboard/ClientPortalPreview";
import { SharePanel } from "./SharePanel";
import { MCPPanel } from "./dashboard/sections/MCPPanel";
import { IntegrationSettings } from "./dashboard/sections/IntegrationSettings";
import { IngestionQueue } from "./dashboard/sections/IngestionQueue";

type ViewMode = "manage" | "preview" | "integrations";

type EngagementDashboardProps = {
  engagement: Engagement & {
    client?: { id: string; name: string; logoUrl?: string } | null;
    participants: Participant[];
    events: Array<{ id: string; event_type: string; payload: unknown; actor_id: string; created_at: string }>;
    phaseTransitions: Array<{ id: string; from_phase: string | null; to_phase: string; created_at: string }>;
  };
  onPhaseChange?: (toPhase: EngagementPhase) => void;
  onInvite?: () => void;
};

export function EngagementDashboard({
  engagement,
  onPhaseChange,
  onInvite,
}: EngagementDashboardProps) {
  const C = useC();
  const [viewMode, setViewMode] = useState<ViewMode>("manage");
  const [showPhaseModal, setShowPhaseModal] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<EngagementPhase | null>(null);

  const stats = useMemo(() => {
    const consultants = engagement.participants.filter((p) => isConsultant(p.role));
    const clients = engagement.participants.filter((p) => isClient(p.role));
    const roomsWithContent = engagement.rooms.filter((r) => r.blocks && r.blocks.length > 0);
    return {
      consultantCount: consultants.length,
      clientCount: clients.length,
      roomCount: engagement.rooms.length,
      completedRooms: roomsWithContent.length,
    };
  }, [engagement]);

  const aiEvents = useMemo(() => {
    return engagement.events
      .filter((e) => {
        const payload = e.payload as { actorType?: string } | null;
        return payload?.actorType === "ai";
      })
      .slice(0, 5);
  }, [engagement.events]);

  const handlePhaseSelect = (phase: EngagementPhase) => {
    setSelectedPhase(phase);
    setShowPhaseModal(true);
  };

  const confirmPhaseChange = () => {
    if (selectedPhase && onPhaseChange) {
      onPhaseChange(selectedPhase);
    }
    setShowPhaseModal(false);
    setSelectedPhase(null);
  };

  return (
    <div style={{ flex: 1, background: C.void, color: C.t1, overflow: "auto" }}>
      {/* Header */}
      <div
        style={{
          borderBottom: `1px solid ${C.sep}`,
          background: C.bg,
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "20px 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 4 }}>
              {engagement.name}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {engagement.client && (
                <span style={{ fontSize: 13, color: C.t2 }}>{engagement.client.name}</span>
              )}
              <Badge>{getPhaseLabel(engagement.phase)}</Badge>
              {engagement.value && (
                <span style={{ fontSize: 12, color: C.t3 }}>
                  {engagement.currency} {engagement.value.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <Surface variant="sunken" padding={2} radius={6}>
              <div style={{ display: "flex" }}>
                {(["manage", "preview", "integrations"] as ViewMode[]).map((mode) => (
                  <motion.button
                    key={mode}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setViewMode(mode)}
                    style={{
                      padding: "6px 12px",
                      background: viewMode === mode ? C.bg : "transparent",
                      border: "none",
                      borderRadius: 4,
                      color: viewMode === mode ? C.t1 : C.t3,
                      fontSize: 12,
                      cursor: "pointer",
                      fontWeight: viewMode === mode ? 500 : 400,
                    }}
                  >
                    {mode === "manage" ? "Manage" : mode === "preview" ? "Client view" : "AI & Integrations"}
                  </motion.button>
                ))}
              </div>
            </Surface>

            <motion.button
              whileHover={{ opacity: 0.8 }}
              whileTap={{ scale: 0.98 }}
              onClick={onInvite}
              style={{
                padding: "8px 14px",
                background: "transparent",
                border: `1px solid ${C.sep}`,
                borderRadius: 6,
                color: C.t2,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Invite
            </motion.button>
            <motion.button
              whileHover={{ opacity: 0.8 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handlePhaseSelect(engagement.phase)}
              style={{
                padding: "8px 14px",
                background: C.blue,
                border: "none",
                borderRadius: 6,
                color: "#fff",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Change phase
            </motion.button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {viewMode === "manage" ? (
          <motion.div
            key="manage"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={SPF}
            style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 32px 64px" }}
          >
            <PhaseTimeline
              currentPhase={engagement.phase}
              transitions={engagement.phaseTransitions}
              onPhaseClick={handlePhaseSelect}
              C={C}
            />

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginTop: 24 }}>
              {[
                { label: "Consultants", value: stats.consultantCount },
                { label: "Client contacts", value: stats.clientCount },
                { label: "Rooms", value: stats.roomCount },
                { label: "With content", value: stats.completedRooms },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Surface padding="16px 20px">
                    <Stat label={stat.label} value={stat.value} />
                  </Surface>
                </motion.div>
              ))}
            </div>

            {/* Main Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, marginTop: 24 }}>
              <Section title="Rooms">
                <Surface padding={0} style={{ overflow: "hidden" }}>
                  <RoomList rooms={engagement.rooms} engagementId={engagement.id} C={C} />
                </Surface>
              </Section>

              <div style={{ display: "grid", gap: 24, alignContent: "start" }}>
                <SharePanel slug={engagement.slug} engagementName={engagement.name} />

                <Section title="Team">
                  <Surface padding={0} style={{ overflow: "hidden" }}>
                    <ParticipantList participants={engagement.participants} onInvite={onInvite} C={C} />
                  </Surface>
                </Section>

                <Section title="Activity">
                  <Surface padding={0} style={{ overflow: "hidden", maxHeight: 300 }}>
                    <ActivityFeed events={engagement.events} C={C} />
                  </Surface>
                </Section>
              </div>
            </div>
          </motion.div>
        ) : viewMode === "preview" ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={SPF}
            style={{ display: "grid", gridTemplateColumns: "1fr 400px", height: "calc(100vh - 80px)" }}
          >
            <div style={{ borderRight: `1px solid ${C.sep}`, overflow: "hidden" }}>
              <ClientPortalPreview engagement={engagement} C={C} />
            </div>

            <div style={{ background: C.bg, padding: 24, overflow: "auto" }}>
              <Section title="Room visibility">
                <div style={{ fontSize: 12, color: C.t3, marginBottom: 16 }}>
                  Toggle room visibility to update the client portal
                </div>

                <div style={{ display: "grid", gap: 8 }}>
                  {[...engagement.rooms]
                    .sort((a, b) => a.orderIndex - b.orderIndex)
                    .map((room) => {
                      const isClientVisible = room.visibility !== "consultant_only";
                      return (
                        <Card
                          key={room.id}
                          active={isClientVisible}
                          accent={C.green}
                          padding="12px 14px"
                          radius={8}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                            <div style={{ minWidth: 0 }}>
                              <ListRowTitle>{room.label}</ListRowTitle>
                              <ListRowSubtitle>{room.blocks?.length ?? 0} items</ListRowSubtitle>
                            </div>
                            <Indicator status={isClientVisible ? "success" : "inactive"} />
                          </div>
                        </Card>
                      );
                    })}
                </div>
              </Section>

              <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${C.sep}` }}>
                <Section title="Team">
                  <ParticipantList participants={engagement.participants} onInvite={onInvite} C={C} />
                </Section>
              </div>
            </div>
          </motion.div>
        ) : viewMode === "integrations" ? (
          <motion.div
            key="integrations"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={SPF}
            style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 32px 64px" }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              <div style={{ display: "grid", gap: 24, alignContent: "start" }}>
                <MCPPanel engagementSlug={engagement.slug} engagementId={engagement.id} />

                <Section title="Channel Integrations">
                  <IntegrationSettings engagementId={engagement.id} engagementSlug={engagement.slug} />
                </Section>
              </div>

              <div style={{ display: "grid", gap: 24, alignContent: "start" }}>
                <IngestionQueue engagementId={engagement.id} />

                <Surface padding={20}>
                  <Section title="AI Activity">
                    {aiEvents.length > 0 ? (
                      <div style={{ display: "grid", gap: 8 }}>
                        {aiEvents.map((event) => (
                          <ListRow
                            key={event.id}
                            leading={<Indicator status="active" size={6} />}
                            divider={false}
                            padding="8px 12px"
                            style={{ background: C.void, borderRadius: 6 }}
                          >
                            <ListRowTitle>{event.event_type.replace(/_/g, " ")}</ListRowTitle>
                            <ListRowSubtitle>
                              {new Date(event.created_at).toLocaleString()}
                            </ListRowSubtitle>
                          </ListRow>
                        ))}
                      </div>
                    ) : (
                      <Empty title="No AI activity yet" compact />
                    )}
                  </Section>
                </Surface>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Phase Change Modal */}
      <AnimatePresence>
        {showPhaseModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              background: `${C.void}ee`,
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 100,
            }}
            onClick={() => setShowPhaseModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={SPF}
              onClick={(e) => e.stopPropagation()}
            >
              <Surface padding={24} radius={12} style={{ width: 400 }}>
                <Section title="Change phase">
                  <div style={{ display: "grid", gap: 8, marginBottom: 20 }}>
                    {(["intake", "qualification", "proposal", "negotiation", "signed", "delivery", "completed", "archived"] as EngagementPhase[]).map((phase) => (
                      <Card
                        key={phase}
                        onClick={() => setSelectedPhase(phase)}
                        active={selectedPhase === phase}
                        padding="12px 14px"
                        radius={8}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontSize: 13, fontWeight: 500 }}>{getPhaseLabel(phase)}</span>
                          {phase === engagement.phase && (
                            <Badge variant="muted">Current</Badge>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>

                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowPhaseModal(false)}
                      style={{
                        padding: "8px 16px",
                        background: "transparent",
                        border: `1px solid ${C.sep}`,
                        borderRadius: 6,
                        color: C.t2,
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={confirmPhaseChange}
                      disabled={!selectedPhase || selectedPhase === engagement.phase}
                      style={{
                        padding: "8px 16px",
                        background: selectedPhase && selectedPhase !== engagement.phase ? C.blue : C.sep,
                        border: "none",
                        borderRadius: 6,
                        color: selectedPhase && selectedPhase !== engagement.phase ? "#fff" : C.t4,
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: selectedPhase && selectedPhase !== engagement.phase ? "pointer" : "not-allowed",
                      }}
                    >
                      Confirm
                    </motion.button>
                  </div>
                </Section>
              </Surface>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
