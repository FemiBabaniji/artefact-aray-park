"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useC } from "@/hooks/useC";
import { SPF } from "@/lib/motion";
import type { DashboardMember, RoomSchema } from "@/types/community";
import type { RoomStatus } from "@/types/room";

type CohortProgressGridProps = {
  members: DashboardMember[];
  rooms: RoomSchema[];
  onCellClick?: (memberId: string, roomKey: string) => void;
};

type CellStatus = "complete" | "in_progress" | "empty";

type TooltipData = {
  memberName: string;
  roomLabel: string;
  status: CellStatus;
  completionPercent: number;
  x: number;
  y: number;
};

// Compute status from room progress
function getCellStatus(status: RoomStatus, pct: number): CellStatus {
  if (status === "accepted" || pct === 100) return "complete";
  if (status === "empty" || pct === 0) return "empty";
  return "in_progress";
}

// Sort members by completion (most complete first)
function sortMembersByProgress(members: DashboardMember[]): DashboardMember[] {
  return [...members].sort((a, b) => {
    const aComplete = a.roomProgress.filter(r => r.status === "accepted").length;
    const bComplete = b.roomProgress.filter(r => r.status === "accepted").length;
    if (bComplete !== aComplete) return bComplete - aComplete;
    // Secondary sort by in-progress count
    const aInProgress = a.roomProgress.filter(r => r.status !== "empty" && r.status !== "accepted").length;
    const bInProgress = b.roomProgress.filter(r => r.status !== "empty" && r.status !== "accepted").length;
    return bInProgress - aInProgress;
  });
}

export function CohortProgressGrid({ members, rooms, onCellClick }: CohortProgressGridProps) {
  const C = useC();
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [recentlyCompleted, setRecentlyCompleted] = useState<Set<string>>(new Set());

  const sortedMembers = useMemo(() => sortMembersByProgress(members), [members]);

  // Column summary - how many complete per room
  const roomSummary = useMemo(() => {
    return rooms.map(room => {
      let complete = 0;
      let inProgress = 0;
      let empty = 0;

      members.forEach(member => {
        const rp = member.roomProgress.find(r => r.roomKey === room.key);
        const status = getCellStatus(rp?.status || "empty", rp?.completionPercent || 0);
        if (status === "complete") complete++;
        else if (status === "in_progress") inProgress++;
        else empty++;
      });

      return { key: room.key, complete, inProgress, empty, total: members.length };
    });
  }, [members, rooms]);

  // Find the most stuck room
  const mostStuckRoom = useMemo(() => {
    if (roomSummary.length === 0) return null;
    return roomSummary.reduce((worst, room) =>
      room.empty > worst.empty ? room : worst
    );
  }, [roomSummary]);

  const handleCellHover = (
    member: DashboardMember,
    room: RoomSchema,
    e: React.MouseEvent
  ) => {
    const rp = member.roomProgress.find(r => r.roomKey === room.key);
    const status = getCellStatus(rp?.status || "empty", rp?.completionPercent || 0);

    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setTooltip({
      memberName: member.name,
      roomLabel: room.label,
      status,
      completionPercent: rp?.completionPercent || 0,
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
    });
  };

  const handleCellClick = (memberId: string, roomKey: string) => {
    onCellClick?.(memberId, roomKey);
  };

  // Grid layout: first column for names, then one column per room
  const gridCols = `140px repeat(${rooms.length}, 1fr)`;

  return (
    <div style={{
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 20px",
        borderBottom: `1px solid ${C.sep}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {mostStuckRoom && mostStuckRoom.empty > members.length / 2 && (
            <span style={{
              fontSize: 11,
              color: C.amber,
              fontWeight: 500,
            }}>
              {mostStuckRoom.empty} stuck on {rooms.find(r => r.key === mostStuckRoom.key)?.label}
            </span>
          )}
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: C.green,
            }} />
            <span style={{ fontSize: 10, color: C.t3 }}>Complete</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: C.blue,
            }} />
            <span style={{ fontSize: 10, color: C.t3 }}>In Progress</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: C.sep,
              border: `1px solid ${C.t4}`,
            }} />
            <span style={{ fontSize: 10, color: C.t3 }}>Empty</span>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div style={{ padding: "12px 20px 20px", overflowX: "auto" }}>
        {/* Room headers row */}
        <div style={{
          display: "grid",
          gridTemplateColumns: gridCols,
          gap: 8,
          marginBottom: 8,
          minWidth: 500,
        }}>
          <div /> {/* Empty corner cell */}
          {rooms.map((room, idx) => {
            const summary = roomSummary.find(s => s.key === room.key);
            const isStuck = summary && summary.empty > members.length / 2;

            return (
              <motion.div
                key={room.key}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                style={{
                  textAlign: "center",
                  padding: "8px 4px",
                }}
              >
                <div style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: isStuck ? C.amber : C.t1,
                  marginBottom: 4,
                }}>
                  {room.label}
                </div>
                <div style={{
                  fontSize: 9,
                  color: C.t4,
                  fontFamily: "'DM Mono', monospace",
                }}>
                  {summary?.complete}/{members.length}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Member rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 500 }}>
          {sortedMembers.map((member, memberIdx) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: memberIdx * 0.02 }}
              style={{
                display: "grid",
                gridTemplateColumns: gridCols,
                gap: 8,
                alignItems: "center",
                padding: "6px 0",
                borderRadius: 6,
              }}
            >
              {/* Member name */}
              <div style={{
                fontSize: 12,
                fontWeight: 500,
                color: C.t1,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                paddingRight: 8,
              }}>
                {member.name}
              </div>

              {/* Room cells */}
              {rooms.map((room, roomIdx) => {
                const rp = member.roomProgress.find(r => r.roomKey === room.key);
                const status = getCellStatus(rp?.status || "empty", rp?.completionPercent || 0);
                const cellKey = `${member.id}-${room.key}`;
                const isRecent = recentlyCompleted.has(cellKey);

                return (
                  <ProgressCell
                    key={room.key}
                    status={status}
                    isRecent={isRecent}
                    delay={(memberIdx * rooms.length + roomIdx) * 0.01}
                    C={C}
                    onHover={(e) => handleCellHover(member, room, e)}
                    onLeave={() => setTooltip(null)}
                    onClick={() => handleCellClick(member.id, room.key)}
                  />
                );
              })}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "fixed",
              left: tooltip.x,
              top: tooltip.y,
              transform: "translate(-50%, -100%)",
              background: C.bg,
              border: `1px solid ${C.edge}`,
              borderRadius: 8,
              padding: "8px 12px",
              zIndex: 1000,
              pointerEvents: "none",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}
          >
            <div style={{
              fontSize: 11,
              fontWeight: 500,
              color: C.t1,
              marginBottom: 2,
            }}>
              {tooltip.memberName}
            </div>
            <div style={{
              fontSize: 10,
              color: C.t3,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}>
              <span>{tooltip.roomLabel}</span>
              <span style={{ color: C.sep }}>-</span>
              <span style={{
                color: tooltip.status === "complete" ? C.green
                  : tooltip.status === "in_progress" ? C.blue
                  : C.t4,
                fontWeight: 500,
              }}>
                {tooltip.status === "complete" ? "Complete"
                  : tooltip.status === "in_progress" ? `${tooltip.completionPercent}%`
                  : "Empty"}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Individual progress cell with animations
function ProgressCell({
  status,
  isRecent,
  delay,
  C,
  onHover,
  onLeave,
  onClick,
}: {
  status: CellStatus;
  isRecent: boolean;
  delay: number;
  C: ReturnType<typeof useC>;
  onHover: (e: React.MouseEvent) => void;
  onLeave: () => void;
  onClick: () => void;
}) {
  const getColor = () => {
    switch (status) {
      case "complete": return C.green;
      case "in_progress": return C.blue;
      default: return "transparent";
    }
  };

  const getBorderColor = () => {
    switch (status) {
      case "complete": return C.green;
      case "in_progress": return C.blue;
      default: return C.t4;
    }
  };

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay, type: "spring", stiffness: 500, damping: 30 }}
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: 28,
      }}
    >
      <motion.div
        onMouseEnter={onHover}
        onMouseLeave={onLeave}
        onClick={onClick}
        whileHover={{ scale: 1.3 }}
        whileTap={{ scale: 0.9 }}
        animate={isRecent ? {
          scale: [1, 1.4, 1],
          opacity: [1, 0.8, 1],
        } : {}}
        transition={isRecent ? {
          duration: 0.6,
          ease: "easeOut",
        } : SPF}
        style={{
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: getColor(),
          border: `1.5px solid ${getBorderColor()}`,
          cursor: "pointer",
          position: "relative",
        }}
      >
        {/* Pulse ring for recently completed */}
        {isRecent && (
          <motion.div
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{ scale: 2.5, opacity: 0 }}
            transition={{ duration: 1, repeat: 2 }}
            style={{
              position: "absolute",
              inset: -2,
              borderRadius: "50%",
              border: `2px solid ${C.green}`,
            }}
          />
        )}
      </motion.div>
    </motion.div>
  );
}
