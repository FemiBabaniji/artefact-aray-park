"use client";

import { motion } from "framer-motion";
import type { useC } from "@/hooks/useC";
import type { DashboardMember, RoomSchema } from "@/types/community";

type MemberMovementProps = {
  members: DashboardMember[];
  rooms: RoomSchema[];
  onMemberClick: (member: DashboardMember) => void;
  C: ReturnType<typeof useC>;
};

export function MemberMovement({ members, rooms, onMemberClick, C }: MemberMovementProps) {
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
        Member Progress
      </div>

      {/* Member Cards */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        style={{
          background: C.bg,
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {members.map((member, index) => (
          <MemberRow
            key={member.id}
            member={member}
            rooms={rooms}
            index={index}
            isLast={index === members.length - 1}
            onClick={() => onMemberClick(member)}
            C={C}
          />
        ))}
      </motion.div>
    </div>
  );
}

function MemberRow({
  member,
  rooms,
  index,
  isLast,
  onClick,
  C,
}: {
  member: DashboardMember;
  rooms: RoomSchema[];
  index: number;
  isLast: boolean;
  onClick: () => void;
  C: ReturnType<typeof useC>;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={onClick}
      whileHover={{ background: C.edge }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "14px 20px",
        borderBottom: isLast ? "none" : `1px solid ${C.sep}`,
        cursor: "pointer",
      }}
    >
      {/* Avatar */}
      <div style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        background: member.color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}>
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          color: "rgba(255,255,255,0.85)",
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {member.initials}
        </span>
      </div>

      {/* Name + Company */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14,
          fontWeight: 500,
          color: C.t1,
          marginBottom: 2,
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

      {/* Room Progress Dots */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}>
        {rooms.map((room) => {
          const progress = member.roomProgress.find(r => r.roomKey === room.key);
          const status = progress?.status || "empty";
          const isComplete = status === "accepted";
          const isInProgress = status === "in_progress" || status === "submitted" || status === "reviewed";

          return (
            <RoomDot
              key={room.key}
              label={room.label}
              isComplete={isComplete}
              isInProgress={isInProgress}
              C={C}
            />
          );
        })}
      </div>
    </motion.div>
  );
}

function RoomDot({
  label,
  isComplete,
  isInProgress,
  C,
}: {
  label: string;
  isComplete: boolean;
  isInProgress: boolean;
  C: ReturnType<typeof useC>;
}) {
  const bgColor = isComplete ? C.green : isInProgress ? C.blue : "transparent";
  const borderColor = isComplete ? C.green : isInProgress ? C.blue : C.t4;

  return (
    <div
      title={label}
      style={{
        width: 10,
        height: 10,
        borderRadius: "50%",
        background: bgColor,
        border: `1.5px solid ${borderColor}`,
      }}
    />
  );
}
