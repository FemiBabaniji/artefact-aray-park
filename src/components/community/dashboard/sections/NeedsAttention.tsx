"use client";

import { motion } from "framer-motion";
import type { useC } from "@/hooks/useC";
import type { Alert, DashboardMember } from "@/types/community";

type NeedsAttentionProps = {
  alerts: Alert[];
  members: DashboardMember[];
  onMemberClick: (member: DashboardMember) => void;
  C: ReturnType<typeof useC>;
};

export function NeedsAttention({ alerts, members, onMemberClick, C }: NeedsAttentionProps) {
  // Get unique members who need attention
  const memberAlerts = alerts.reduce((acc, alert) => {
    if (!acc[alert.memberId]) {
      const member = members.find(m => m.id === alert.memberId);
      if (member) {
        acc[alert.memberId] = {
          member,
          alerts: [],
        };
      }
    }
    if (acc[alert.memberId]) {
      acc[alert.memberId].alerts.push(alert);
    }
    return acc;
  }, {} as Record<string, { member: DashboardMember; alerts: Alert[] }>);

  const alertCards = Object.values(memberAlerts);

  return (
    <div>
      {/* Section Label */}
      <div style={{
        fontSize: 10,
        fontWeight: 600,
        color: C.t4,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        marginBottom: 16,
      }}>
        Needs Attention
      </div>

      {/* Alert Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: 12,
      }}>
        {alertCards.map(({ member, alerts: memberAlertList }, index) => (
          <AlertCard
            key={member.id}
            member={member}
            alerts={memberAlertList}
            index={index}
            onClick={() => onMemberClick(member)}
            C={C}
          />
        ))}
      </div>
    </div>
  );
}

function AlertCard({
  member,
  alerts,
  index,
  onClick,
  C,
}: {
  member: DashboardMember;
  alerts: Alert[];
  index: number;
  onClick: () => void;
  C: ReturnType<typeof useC>;
}) {
  const primaryAlert = alerts[0];
  const isCritical = alerts.some(a => a.severity === "critical");

  // Generate reason text
  const reason = primaryAlert.type === "inactive"
    ? `Inactive ${primaryAlert.daysInactive} days`
    : primaryAlert.type === "missing_room"
    ? `Missing ${primaryAlert.roomKey} room`
    : primaryAlert.type === "incomplete_profile"
    ? "Incomplete profile"
    : "Approaching deadline";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      style={{
        background: C.bg,
        border: `1px solid ${isCritical ? "#ef444433" : C.sep}`,
        borderRadius: 12,
        padding: "16px 18px",
        cursor: "pointer",
        transition: "transform 160ms ease",
      }}
    >
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 12,
      }}>
        {/* Avatar */}
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: member.color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            color: "rgba(255,255,255,0.85)",
          }}>
            {member.initials}
          </span>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 13,
            fontWeight: 500,
            color: C.t1,
          }}>
            {member.name}
          </div>
          {member.company && (
            <div style={{
              fontSize: 11,
              color: C.t3,
            }}>
              {member.company}
            </div>
          )}
        </div>
      </div>

      {/* Alert Reason */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 14,
      }}>
        <div style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: isCritical ? "#ef4444" : C.amber,
        }} />
        <span style={{
          fontSize: 12,
          color: isCritical ? "#ef4444" : C.amber,
        }}>
          {reason}
        </span>
      </div>

      {/* Action Button */}
      <motion.button
        whileHover={{ background: C.edge }}
        whileTap={{ scale: 0.98 }}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        style={{
          width: "100%",
          padding: "8px 12px",
          background: C.void,
          border: `1px solid ${C.sep}`,
          borderRadius: 6,
          fontSize: 11,
          fontWeight: 500,
          color: C.t2,
          cursor: "pointer",
        }}
      >
        Open artefact
      </motion.button>
    </motion.div>
  );
}
