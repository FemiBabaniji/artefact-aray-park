"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useC } from "@/hooks/useC";
import { SPF } from "@/lib/motion";
import { Lbl } from "@/components/primitives/Lbl";
import { ProgramHealth } from "./sections/ProgramHealth";
import { MemberMovement } from "./sections/MemberMovement";
import { NeedsAttention } from "./sections/NeedsAttention";
import { ActivityFeed } from "./sections/ActivityFeed";
import { QuickActions } from "./sections/QuickActions";
import { MemberDirectoryPreview, type MockMember } from "../sections/MemberDirectoryPreview";
import { DirectoryMemberView } from "./sections/DirectoryMemberView";
import type {
  CommunityConfig,
  DashboardMember,
  ActivityItem,
  Alert,
  DashboardStats,
  CohortProgressMap as CohortProgressMapType,
} from "@/types/community";

type CommunityDashboardProps = {
  community: CommunityConfig;
  members: DashboardMember[];
  activity: ActivityItem[];
  alerts: Alert[];
  stats: DashboardStats;
  progressMap: CohortProgressMapType;
};

export function CommunityDashboard({
  community,
  members,
  activity,
  alerts,
  stats,
  progressMap: _progressMap,
}: CommunityDashboardProps) {
  const C = useC();
  const [selectedDirectoryMember, setSelectedDirectoryMember] = useState<MockMember | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [pathOpen, setPathOpen] = useState(false);

  // Calculate overall completion percentage
  const completionStats = useMemo(() => {
    const totalRooms = members.reduce((acc, m) => acc + m.sections, 0);
    const completedRooms = members.reduce((acc, m) => acc + m.accepted, 0);
    const percentage = totalRooms > 0 ? Math.round((completedRooms / totalRooms) * 100) : 0;

    const progressing = members.filter(m => m.accepted > 0 && m.accepted < m.sections).length;
    const needsSupport = alerts.length;

    return { percentage, progressing, needsSupport };
  }, [members, alerts]);

  const handleMemberClick = (member: DashboardMember) => {
    // Convert DashboardMember to MockMember format for DirectoryMemberView
    const mockMember: MockMember = {
      id: member.id,
      name: member.name,
      role: "Founder",
      company: member.company || "",
      stage: member.stage,
      engagement: Math.round((member.accepted / member.sections) * 100),
      lifecycle: member.accepted === member.sections ? "active" : member.accepted === 0 ? "new" : "active",
      eventsAttended: 0,
      bio: "",
      skills: [],
    };
    setSelectedDirectoryMember(mockMember);
  };

  const handleExport = () => {
    const headers = ["Name", "Company", "Email", "Stage", "Progress", "Last Activity"];
    const rows = members.map(m => [
      m.name,
      m.company || "",
      m.email,
      m.stage,
      `${Math.round((m.accepted / m.sections) * 100)}%`,
      m.lastActivity,
    ]);

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${community.name.toLowerCase().replace(/\s+/g, "-")}-directory.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = () => {
    const url = window.location.origin + `/community/${community.id}`;
    navigator.clipboard.writeText(url);
  };

  return (
    <div style={{
      flex: 1,
      background: C.void,
      color: C.t1,
      position: "relative",
      overflow: "auto",
    }}>
      {/* ═══════════════════════════════════════════════════════════════════════
          HEADER
      ═══════════════════════════════════════════════════════════════════════ */}
      <div style={{
        borderBottom: `1px solid ${C.sep}`,
        background: C.bg,
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}>
        <div style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "20px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}>
          <div style={{ minWidth: 0 }}>
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: C.t1,
                letterSpacing: "-0.02em",
                marginBottom: 2,
              }}
            >
              {community.name}
            </motion.div>
            {community.cohort && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                style={{
                  fontSize: 12,
                  color: C.t3,
                }}
              >
                {community.cohort}
              </motion.div>
            )}
          </div>
          <QuickActions
            communityId={community.id}
            onInvite={() => setInviteOpen(true)}
            onCreatePath={() => setPathOpen(true)}
            onExport={handleExport}
            onShare={handleShare}
          />
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "24px 32px 64px",
      }}>
        <AnimatePresence mode="wait">
          {selectedDirectoryMember ? (
            <motion.div
              key="member-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <DirectoryMemberView
                member={selectedDirectoryMember}
                onClose={() => setSelectedDirectoryMember(null)}
                C={C}
              />
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Cohort Health - Compact one-liner */}
              <ProgramHealth
                memberCount={stats.memberCount}
                progressing={completionStats.progressing}
                needsSupport={completionStats.needsSupport}
                completionPercentage={completionStats.percentage}
                C={C}
              />

              {/* Row 1: Founders + Activity */}
              <div
                className="dashboard-row"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 280px",
                  gap: 24,
                  marginTop: 24,
                }}
              >
                {/* FOUNDERS */}
                <div>
                  <div style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: C.t4,
                    textTransform: "uppercase",
                    letterSpacing: ".04em",
                    fontFamily: "'DM Mono', monospace",
                    marginBottom: 12,
                  }}>
                    Founders
                  </div>
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      background: C.bg,
                      borderRadius: 12,
                      overflow: "hidden",
                    }}
                  >
                    <MemberMovement
                      members={members}
                      rooms={community.rooms}
                      onMemberClick={handleMemberClick}
                      C={C}
                    />
                  </motion.div>
                </div>

                {/* ACTIVITY */}
                <div>
                  <div style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: C.t4,
                    textTransform: "uppercase",
                    letterSpacing: ".04em",
                    fontFamily: "'DM Mono', monospace",
                    marginBottom: 12,
                  }}>
                    Activity
                  </div>
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    style={{
                      background: C.bg,
                      borderRadius: 12,
                      overflow: "hidden",
                      maxHeight: 400,
                    }}
                  >
                    <ActivityFeed activity={activity} maxItems={8} />
                  </motion.div>
                </div>
              </div>

              {/* Row 2: Attention + Directory */}
              <div
                className="dashboard-row"
                style={{
                  display: "grid",
                  gridTemplateColumns: alerts.length > 0 ? "300px 1fr" : "1fr",
                  gap: 24,
                  marginTop: 24,
                }}
              >
                {/* ATTENTION */}
                {alerts.length > 0 && (
                  <div>
                    <div style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: C.t4,
                      textTransform: "uppercase",
                      letterSpacing: ".04em",
                      fontFamily: "'DM Mono', monospace",
                      marginBottom: 12,
                    }}>
                      Attention
                    </div>
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      style={{
                        background: C.bg,
                        borderRadius: 12,
                        overflow: "hidden",
                      }}
                    >
                      <NeedsAttention
                        alerts={alerts}
                        members={members}
                        onMemberClick={handleMemberClick}
                        C={C}
                      />
                    </motion.div>
                  </div>
                )}

                {/* DIRECTORY */}
                <div>
                  <div style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: C.t4,
                    textTransform: "uppercase",
                    letterSpacing: ".04em",
                    fontFamily: "'DM Mono', monospace",
                    marginBottom: 12,
                  }}>
                    Directory
                  </div>
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    style={{
                      background: C.bg,
                      borderRadius: 12,
                      overflow: "hidden",
                      height: 280,
                    }}
                  >
                    <MemberDirectoryPreview
                      compact
                      onMemberSelect={setSelectedDirectoryMember}
                    />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Responsive styles + animations */}
      <style>{`
        @media (max-width: 800px) {
          .dashboard-row {
            grid-template-columns: 1fr !important;
          }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      {/* Invite Modal */}
      <AnimatePresence>
        {inviteOpen && (
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
            onClick={() => setInviteOpen(false)}
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
                borderRadius: 12,
                padding: 24,
                width: 400,
              }}
            >
              <Lbl style={{ display: "block", marginBottom: 16 }}>invite members</Lbl>
              <input
                type="email"
                placeholder="Enter email addresses..."
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  background: C.void,
                  border: `1px solid ${C.sep}`,
                  borderRadius: 8,
                  color: C.t1,
                  fontSize: 13,
                  outline: "none",
                }}
              />
              <div style={{
                display: "flex",
                gap: 8,
                marginTop: 16,
                justifyContent: "flex-end",
              }}>
                <motion.button
                  whileHover={{ opacity: 0.8 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setInviteOpen(false)}
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
                  whileHover={{ opacity: 0.8 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    padding: "8px 16px",
                    background: C.blue,
                    border: "none",
                    borderRadius: 6,
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Send invites
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Path Modal */}
      <AnimatePresence>
        {pathOpen && (
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
            onClick={() => setPathOpen(false)}
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
                borderRadius: 12,
                padding: 24,
                width: 480,
              }}
            >
              <Lbl style={{ display: "block", marginBottom: 16 }}>create path</Lbl>
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}>
                {["Founder Journey", "Pitch Prep", "Traction Track", "Custom"].map((template) => (
                  <motion.div
                    key={template}
                    whileHover={{ borderColor: C.blue }}
                    style={{
                      padding: "16px 14px",
                      background: C.void,
                      border: `1px solid ${C.sep}`,
                      borderRadius: 8,
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 500, color: C.t1 }}>
                      {template}
                    </div>
                    <div style={{ fontSize: 11, color: C.t3, marginTop: 4 }}>
                      {template === "Custom" ? "Start from scratch" : "Pre-built room sequence"}
                    </div>
                  </motion.div>
                ))}
              </div>
              <div style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: 16,
              }}>
                <motion.button
                  whileHover={{ opacity: 0.8 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setPathOpen(false)}
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
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
