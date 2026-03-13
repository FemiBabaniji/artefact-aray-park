"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SPF } from "@/lib/motion";
import type { Engagement, EngagementRoom, EngagementPhase } from "@/types/engagement";
import { isPipelinePhase } from "@/types/engagement";
import type { Participant } from "@/types/participant";
import { isClient } from "@/types/participant";
import { Surface } from "@/components/ds/Surface";
import { Card } from "@/components/ds/Card";
import { Stat } from "@/components/ds/Stat";
import { Badge } from "@/components/ds/Badge";
import { Empty } from "@/components/ds/Empty";
import { Section } from "@/components/ds/Section";
import { Indicator } from "@/components/ds/Indicator";

type ClientPortalPreviewProps = {
  engagement: Engagement & {
    client?: { id: string; name: string; logoUrl?: string } | null;
    participants: Participant[];
  };
  C: Record<string, string>;
};

type PhaseConfig = {
  title: string;
  subtitle: string;
  accent: string;
};

function getPhaseConfig(phase: EngagementPhase, C: Record<string, string>): PhaseConfig {
  if (isPipelinePhase(phase)) {
    return { title: "Proposal", subtitle: "Review our engagement proposal", accent: C.blue };
  }
  if (phase === "signed") {
    return { title: "Welcome", subtitle: "Your project is ready to begin", accent: C.green };
  }
  if (phase === "delivery") {
    return { title: "Data Room", subtitle: "Project workspace", accent: C.blue };
  }
  if (phase === "completed") {
    return { title: "Project Complete", subtitle: "Deliverables and outcomes", accent: C.green };
  }
  return { title: "Archive", subtitle: "Project reference", accent: C.t3 };
}

// Cleaner room card without the ugly block previews
function RoomCard({
  room,
  index,
  C,
  accent,
}: {
  room: EngagementRoom;
  index: number;
  C: Record<string, string>;
  accent: string;
}) {
  const blockCount = room.blocks?.length ?? 0;
  const hasContent = blockCount > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPF, delay: 0.05 + index * 0.03 }}
    >
      <Card
        accent={accent}
        padding={0}
        style={{ overflow: "hidden" }}
      >
        {/* Top accent bar */}
        <div
          style={{
            height: 3,
            background: hasContent ? accent : C.sep,
          }}
        />

        <div style={{ padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <Indicator
              status={hasContent ? "success" : "inactive"}
              size={6}
              style={{ marginTop: 5 }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>
                {room.label}
              </div>
              {room.prompt && (
                <div style={{ fontSize: 11, color: C.t3, lineHeight: 1.4 }}>
                  {room.prompt}
                </div>
              )}
            </div>
            {hasContent && (
              <Badge color={accent}>
                {blockCount} {blockCount === 1 ? "item" : "items"}
              </Badge>
            )}
          </div>

          {!hasContent && (
            <div style={{ marginTop: 8, fontSize: 11, color: C.t4 }}>
              No content yet
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

export function ClientPortalPreview({ engagement, C }: ClientPortalPreviewProps) {
  const config = getPhaseConfig(engagement.phase, C);

  const clientRooms = useMemo(() => {
    return engagement.rooms
      .filter((r) => r.visibility !== "consultant_only")
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }, [engagement.rooms]);

  const clientTeam = useMemo(() => {
    return engagement.participants.filter((p) => isClient(p.role));
  }, [engagement.participants]);

  const stats = useMemo(() => {
    const roomsWithContent = clientRooms.filter((r) => r.blocks && r.blocks.length > 0);
    const totalItems = clientRooms.reduce((sum, r) => sum + (r.blocks?.length ?? 0), 0);
    return {
      rooms: clientRooms.length,
      active: roomsWithContent.length,
      items: totalItems,
    };
  }, [clientRooms]);

  return (
    <div
      style={{
        height: "100%",
        background: C.void,
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Preview banner */}
      <div
        style={{
          padding: "8px 16px",
          background: `${config.accent}10`,
          borderBottom: `1px solid ${config.accent}30`,
          textAlign: "center",
        }}
      >
        <span style={{ fontSize: 11, color: config.accent, fontWeight: 500 }}>
          Client Portal Preview
        </span>
      </div>

      <div style={{ flex: 1, padding: 24 }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SPF}
          style={{ marginBottom: 24 }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.05em",
              color: config.accent,
              marginBottom: 6,
            }}
          >
            {config.title.toUpperCase()}
          </div>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
            {engagement.name}
          </div>
          <div style={{ fontSize: 12, color: C.t3 }}>
            {config.subtitle}
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPF, delay: 0.05 }}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
            marginBottom: 24,
          }}
        >
          <Surface padding="12px 14px" radius={8}>
            <Stat label="Rooms" value={stats.rooms} size="sm" />
          </Surface>
          <Surface padding="12px 14px" radius={8}>
            <Stat label="Active" value={stats.active} size="sm" />
          </Surface>
          <Surface padding="12px 14px" radius={8}>
            <Stat label="Items" value={stats.items} size="sm" />
          </Surface>
        </motion.div>

        {/* Rooms */}
        {clientRooms.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: 12,
            }}
          >
            <AnimatePresence mode="popLayout">
              {clientRooms.map((room, index) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  index={index}
                  C={C}
                  accent={config.accent}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <Empty
            title="No client-visible rooms"
            description="Mark rooms as 'Client view' to share them"
          />
        )}

        {/* Client team */}
        {clientTeam.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPF, delay: 0.2 }}
            style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${C.sep}` }}
          >
            <Section title={`Client team (${clientTeam.length})`}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {clientTeam.map((p) => (
                  <Surface key={p.id} padding="6px 10px" radius={6}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          background: `${C.green}20`,
                          color: C.green,
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 10,
                          fontWeight: 500,
                        }}
                      >
                        {p.name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <span style={{ fontSize: 12 }}>{p.name || p.email}</span>
                    </div>
                  </Surface>
                ))}
              </div>
            </Section>
          </motion.div>
        )}
      </div>
    </div>
  );
}
