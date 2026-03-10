"use client";

import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";
import { SPF } from "@/lib/motion";
import { Lbl } from "@/components/primitives/Lbl";
import { formatRelativeTime, getMemberStatus } from "@/lib/data/community";
import type { DashboardMember, MemberStatus } from "@/types/community";

type MemberDetailOverlayProps = {
  member: DashboardMember;
  onClose: () => void;
};

const STATUS_LABELS: Record<MemberStatus, string> = {
  complete: "Complete",
  in_progress: "In Progress",
  behind: "Behind",
  needs_attention: "Needs Attention",
  not_started: "Not Started",
};

export function MemberDetailOverlay({ member, onClose }: MemberDetailOverlayProps) {
  const C = useC();
  const status = getMemberStatus(member);

  const STATUS_COLORS: Record<MemberStatus, string> = {
    complete: C.green,
    in_progress: C.blue,
    behind: C.amber,
    needs_attention: "#ef4444",
    not_started: C.t4,
  };

  const statusColor = STATUS_COLORS[status];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
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
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={SPF}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.bg,
          border: `1px solid ${C.edge}`,
          borderRadius: 16,
          width: "min(520px, 90vw)",
          maxHeight: "80vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "20px 24px",
          borderBottom: `1px solid ${C.sep}`,
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}>
          {/* Avatar */}
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: member.color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <span style={{
              fontSize: 16,
              fontWeight: 700,
              color: "rgba(255,255,255,0.85)",
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {member.initials}
            </span>
          </div>

          {/* Info */}
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 16,
              fontWeight: 600,
              color: C.t1,
              letterSpacing: "-0.02em",
            }}>
              {member.name}
            </div>
            {member.company && (
              <div style={{
                fontSize: 12,
                color: C.t2,
                marginTop: 2,
              }}>
                {member.company}
              </div>
            )}
          </div>

          {/* Status badge */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 10px",
            background: statusColor + "15",
            borderRadius: 6,
          }}>
            <div style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: statusColor,
            }} />
            <span style={{
              fontSize: 11,
              fontWeight: 500,
              color: statusColor,
            }}>
              {STATUS_LABELS[status]}
            </span>
          </div>

          {/* Close button */}
          <motion.button
            whileHover={{ opacity: 0.7 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: C.edge,
              border: "none",
              color: C.t3,
              fontSize: 14,
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
        <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
          {/* Quick Stats */}
          <div style={{
            display: "flex",
            gap: 16,
            marginBottom: 20,
          }}>
            <div>
              <Lbl style={{ display: "block", marginBottom: 4, fontSize: 8 }}>stage</Lbl>
              <div style={{
                fontSize: 13,
                fontWeight: 500,
                color: C.t1,
                textTransform: "capitalize",
              }}>
                {member.stage}
              </div>
            </div>
            <div>
              <Lbl style={{ display: "block", marginBottom: 4, fontSize: 8 }}>last active</Lbl>
              <div style={{
                fontSize: 12,
                color: C.t2,
                fontFamily: "'DM Mono', monospace",
              }}>
                {formatRelativeTime(member.lastActivity)}
              </div>
            </div>
          </div>

          {/* Room Progress - Visual */}
          <div style={{
            background: C.void,
            border: `1px solid ${C.sep}`,
            borderRadius: 12,
            overflow: "hidden",
          }}>
            <div style={{
              padding: "12px 16px",
              borderBottom: `1px solid ${C.sep}`,
            }}>
              <Lbl>rooms</Lbl>
            </div>
            <div style={{ padding: "12px 16px" }}>
              {member.roomProgress.map((room, index) => {
                const isComplete = room.status === "accepted";
                const isInProgress = room.status === "in_progress" || room.status === "submitted" || room.status === "reviewed";
                const isEmpty = room.status === "empty";

                let roomStatusColor = C.t4;
                let roomStatusLabel = "Empty";
                let symbol = "\u25CB"; // ○

                if (isComplete) {
                  roomStatusColor = C.green;
                  roomStatusLabel = "Complete";
                  symbol = "\u25CF"; // ●
                } else if (isInProgress) {
                  roomStatusColor = C.amber;
                  roomStatusLabel = "In Progress";
                  symbol = "\u25D0"; // ◐
                }

                return (
                  <div
                    key={room.roomKey}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 0",
                      borderBottom: index < member.roomProgress.length - 1 ? `1px solid ${C.sep}` : "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 12, color: roomStatusColor }}>
                        {symbol}
                      </span>
                      <span style={{
                        fontSize: 13,
                        color: C.t1,
                      }}>
                        {room.roomLabel}
                      </span>
                    </div>
                    <span style={{
                      fontSize: 10,
                      color: roomStatusColor,
                      fontFamily: "'DM Mono', monospace",
                      textTransform: "uppercase",
                    }}>
                      {roomStatusLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Contact + Action */}
          <div style={{
            marginTop: 16,
            padding: "12px 16px",
            background: C.void,
            border: `1px solid ${C.sep}`,
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <div>
              <div style={{ fontSize: 10, color: C.t4, marginBottom: 2 }}>Email</div>
              <div style={{ fontSize: 12, color: C.t2 }}>{member.email}</div>
            </div>
            <motion.button
              whileHover={{ opacity: 0.8 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (member.artefactId) {
                  window.open(`/p/${member.artefactId}`, "_blank");
                }
              }}
              style={{
                padding: "7px 12px",
                background: C.blue,
                border: "none",
                borderRadius: 6,
                color: "#fff",
                fontSize: 11,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              View artefact
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
