"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";
import { Lbl } from "@/components/primitives/Lbl";
import { formatRelativeTime, getMemberStatus } from "@/lib/data/community";
import type { DashboardMember, MemberStatus } from "@/types/community";

type SortKey = "name" | "status" | "lastActivity";
type SortDir = "asc" | "desc";

type MemberProgressTableProps = {
  members: DashboardMember[];
  onMemberClick: (member: DashboardMember) => void;
};

const STATUS_ORDER: Record<MemberStatus, number> = {
  complete: 0,
  in_progress: 1,
  behind: 2,
  needs_attention: 3,
  not_started: 4,
};

const STATUS_LABELS: Record<MemberStatus, string> = {
  complete: "Complete",
  in_progress: "In Progress",
  behind: "Behind",
  needs_attention: "Needs Attention",
  not_started: "Not Started",
};

export function MemberProgressTable({ members, onMemberClick }: MemberProgressTableProps) {
  const C = useC();
  const [sortKey, setSortKey] = useState<SortKey>("status");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const STATUS_COLORS: Record<MemberStatus, string> = {
    complete: C.green,
    in_progress: C.blue,
    behind: C.amber,
    needs_attention: "#ef4444",
    not_started: C.t4,
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir(key === "lastActivity" ? "desc" : "asc");
    }
  };

  const sortedMembers = [...members].sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case "name":
        cmp = a.name.localeCompare(b.name);
        break;
      case "status":
        cmp = STATUS_ORDER[getMemberStatus(a)] - STATUS_ORDER[getMemberStatus(b)];
        break;
      case "lastActivity":
        cmp = new Date(a.lastActivity).getTime() - new Date(b.lastActivity).getTime();
        break;
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  const SortIndicator = ({ active, dir }: { active: boolean; dir: SortDir }) => (
    <span style={{
      marginLeft: 4,
      opacity: active ? 1 : 0,
      fontSize: 8,
      color: C.t3,
    }}>
      {dir === "asc" ? "\u2191" : "\u2193"}
    </span>
  );

  return (
    <div style={{
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "16px 20px",
        borderBottom: `1px solid ${C.sep}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <span style={{ fontSize: 12, color: C.t2 }}>
          {members.length} members
        </span>
      </div>

      {/* Column Headers */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "36px 1fr 90px 100px 80px",
        alignItems: "center",
        gap: 12,
        padding: "10px 16px",
        background: C.edge,
        borderBottom: `1px solid ${C.sep}`,
      }}>
        <div /> {/* Avatar spacer */}
        <Lbl
          style={{ cursor: "pointer", userSelect: "none" }}
          onClick={() => handleSort("name")}
        >
          founder
          <SortIndicator active={sortKey === "name"} dir={sortDir} />
        </Lbl>
        <Lbl>startup</Lbl>
        <Lbl
          style={{ cursor: "pointer", userSelect: "none" }}
          onClick={() => handleSort("status")}
        >
          status
          <SortIndicator active={sortKey === "status"} dir={sortDir} />
        </Lbl>
        <Lbl
          style={{ cursor: "pointer", userSelect: "none" }}
          onClick={() => handleSort("lastActivity")}
        >
          active
          <SortIndicator active={sortKey === "lastActivity"} dir={sortDir} />
        </Lbl>
      </div>

      {/* Rows */}
      <div style={{ maxHeight: 420, overflow: "auto" }}>
        {sortedMembers.map((member, index) => {
          const status = getMemberStatus(member);
          const statusColor = STATUS_COLORS[status];

          return (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.02 }}
              onClick={() => onMemberClick(member)}
              whileHover={{ background: C.edge }}
              style={{
                display: "grid",
                gridTemplateColumns: "36px 1fr 90px 100px 80px",
                alignItems: "center",
                gap: 12,
                padding: "10px 16px",
                borderBottom: `1px solid ${C.sep}`,
                cursor: "pointer",
              }}
            >
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
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  {member.initials}
                </span>
              </div>

              {/* Name + Room Dots */}
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: C.t1,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  marginBottom: 4,
                }}>
                  {member.name}
                </div>
                {/* Room completion dots */}
                <div style={{ display: "flex", gap: 3 }}>
                  {member.roomProgress.map(room => (
                    <RoomDot
                      key={room.roomKey}
                      status={room.status}
                      label={room.roomLabel}
                      C={C}
                    />
                  ))}
                </div>
              </div>

              {/* Company */}
              <div style={{
                fontSize: 11,
                color: C.t2,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}>
                {member.company || "-"}
              </div>

              {/* Status Label */}
              <div style={{
                fontSize: 11,
                fontWeight: 500,
                color: statusColor,
              }}>
                {STATUS_LABELS[status]}
              </div>

              {/* Last Activity */}
              <div style={{
                fontSize: 10,
                color: C.t3,
                fontFamily: "'DM Mono', monospace",
              }}>
                {formatRelativeTime(member.lastActivity)}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// Room completion dot component
function RoomDot({
  status,
  label,
  C,
}: {
  status: string;
  label: string;
  C: ReturnType<typeof useC>;
}) {
  // ● complete, ◐ in progress, ○ empty
  const isComplete = status === "accepted";
  const isInProgress = status === "in_progress" || status === "submitted" || status === "reviewed";
  const isEmpty = status === "empty";

  let color = C.t4;
  let symbol = "\u25CB"; // ○ empty

  if (isComplete) {
    color = C.green;
    symbol = "\u25CF"; // ● complete
  } else if (isInProgress) {
    color = C.amber;
    symbol = "\u25D0"; // ◐ in progress
  }

  return (
    <span
      title={label}
      style={{
        fontSize: 8,
        color,
        cursor: "default",
      }}
    >
      {symbol}
    </span>
  );
}
