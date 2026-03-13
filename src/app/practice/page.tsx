"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";
import { Lbl } from "@/components/primitives/Lbl";
import type { EngagementSummary, EngagementPhase } from "@/types/engagement";
import { getPhaseLabel, isPipelinePhase, isActivePhase, isClosedPhase } from "@/types/engagement";

// Mock owner ID for demo (would come from auth in production)
const DEMO_OWNER_ID = "demo-user-123";

export default function PracticeDashboard() {
  const C = useC();
  const router = useRouter();
  const [engagements, setEngagements] = useState<EngagementSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pipeline" | "active" | "closed">("all");

  useEffect(() => {
    async function fetchEngagements() {
      try {
        const res = await fetch(`/api/engagements?ownerId=${DEMO_OWNER_ID}`);
        if (res.ok) {
          const data = await res.json();
          setEngagements(data.engagements);
        }
      } catch (error) {
        console.error("Failed to fetch engagements:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchEngagements();
  }, []);

  const filteredEngagements = engagements.filter((e) => {
    if (filter === "all") return true;
    if (filter === "pipeline") return isPipelinePhase(e.phase);
    if (filter === "active") return isActivePhase(e.phase);
    if (filter === "closed") return isClosedPhase(e.phase);
    return true;
  });

  const stats = {
    pipeline: engagements.filter((e) => isPipelinePhase(e.phase)).length,
    active: engagements.filter((e) => isActivePhase(e.phase)).length,
    pipelineValue: engagements
      .filter((e) => isPipelinePhase(e.phase))
      .reduce((sum, e) => sum + (e.value || 0), 0),
    deliveredValue: engagements
      .filter((e) => e.phase === "completed")
      .reduce((sum, e) => sum + (e.value || 0), 0),
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.void,
        color: C.t1,
      }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: `1px solid ${C.sep}`,
          background: C.bg,
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "20px 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 600 }}>Practice</div>
          <div style={{ display: "flex", gap: 8 }}>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push("/practice/clients")}
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
              Clients
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push("/practice/engagements/new")}
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
              + New engagement
            </motion.button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "24px 32px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
          }}
        >
          {[
            { label: "Pipeline", value: stats.pipeline, color: C.blue },
            { label: "Active", value: stats.active, color: C.green },
            { label: "Pipeline value", value: `$${stats.pipelineValue.toLocaleString()}`, color: C.t1 },
            { label: "Delivered", value: `$${stats.deliveredValue.toLocaleString()}`, color: C.t1 },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                padding: "16px 20px",
                background: C.bg,
                borderRadius: 10,
              }}
            >
              <div style={{ fontSize: 11, color: C.t4, marginBottom: 4 }}>
                {stat.label.toUpperCase()}
              </div>
              <div style={{ fontSize: 24, fontWeight: 600, color: stat.color }}>
                {stat.value}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Filter tabs */}
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "0 32px",
        }}
      >
        <div style={{ display: "flex", gap: 4 }}>
          {(["all", "pipeline", "active", "closed"] as const).map((f) => (
            <motion.button
              key={f}
              whileTap={{ scale: 0.98 }}
              onClick={() => setFilter(f)}
              style={{
                padding: "8px 16px",
                background: filter === f ? C.bg : "transparent",
                border: "none",
                borderRadius: "6px 6px 0 0",
                color: filter === f ? C.t1 : C.t3,
                fontSize: 12,
                fontWeight: filter === f ? 500 : 400,
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {f}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Engagements list */}
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "0 32px 64px",
        }}
      >
        <div
          style={{
            background: C.bg,
            borderRadius: "0 10px 10px 10px",
            overflow: "hidden",
          }}
        >
          {loading ? (
            <div style={{ padding: 32, textAlign: "center", color: C.t3 }}>
              Loading...
            </div>
          ) : filteredEngagements.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center" }}>
              <div style={{ fontSize: 14, color: C.t2, marginBottom: 8 }}>
                No engagements
              </div>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push("/practice/engagements/new")}
                style={{
                  padding: "8px 16px",
                  background: C.blue,
                  border: "none",
                  borderRadius: 6,
                  color: "#fff",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Create your first engagement
              </motion.button>
            </div>
          ) : (
            filteredEngagements.map((engagement, index) => (
              <motion.div
                key={engagement.id}
                whileHover={{ background: C.void }}
                onClick={() => router.push(`/practice/engagements/${engagement.id}`)}
                style={{
                  padding: "16px 20px",
                  borderBottom: index < filteredEngagements.length - 1 ? `1px solid ${C.sep}` : undefined,
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  cursor: "pointer",
                }}
              >
                {/* Client avatar */}
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    background: engagement.clientLogoUrl
                      ? `url(${engagement.clientLogoUrl}) center/cover`
                      : C.void,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    fontWeight: 600,
                    color: C.t3,
                    flexShrink: 0,
                  }}
                >
                  {!engagement.clientLogoUrl &&
                    (engagement.clientName?.slice(0, 2).toUpperCase() || "?")}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {engagement.name}
                  </div>
                  <div style={{ fontSize: 12, color: C.t3 }}>
                    {engagement.clientName || "No client"}
                  </div>
                </div>

                {/* Phase badge */}
                <span
                  style={{
                    padding: "4px 10px",
                    background:
                      isPipelinePhase(engagement.phase)
                        ? `${C.blue}20`
                        : isActivePhase(engagement.phase)
                        ? `${C.green}20`
                        : C.void,
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 500,
                    color:
                      isPipelinePhase(engagement.phase)
                        ? C.blue
                        : isActivePhase(engagement.phase)
                        ? C.green
                        : C.t3,
                  }}
                >
                  {getPhaseLabel(engagement.phase)}
                </span>

                {/* Value */}
                {engagement.value && (
                  <span style={{ fontSize: 12, color: C.t3, minWidth: 80, textAlign: "right" }}>
                    {engagement.currency} {engagement.value.toLocaleString()}
                  </span>
                )}

                {/* Arrow */}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{ color: C.t4 }}
                >
                  <path
                    d="M9 18L15 12L9 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
