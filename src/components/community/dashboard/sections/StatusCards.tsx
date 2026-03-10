"use client";

import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";
import type { DashboardStats } from "@/types/community";

type StatusCardsProps = {
  stats: DashboardStats;
};

export function StatusCards({ stats }: StatusCardsProps) {
  const C = useC();

  const { statusCounts } = stats;

  // Build cohort status summary string
  const statusParts: string[] = [];
  if (statusCounts.inProgress > 0) statusParts.push(`${statusCounts.inProgress} In Progress`);
  if (statusCounts.needsAttention > 0) statusParts.push(`${statusCounts.needsAttention} Needs Attention`);
  if (statusCounts.complete > 0) statusParts.push(`${statusCounts.complete} Complete`);
  if (statusCounts.behind > 0) statusParts.push(`${statusCounts.behind} Behind`);
  const statusSummary = statusParts.join(" \u2022 ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        display: "grid",
        gridTemplateColumns: "120px 1fr 140px",
        gap: 24,
        background: C.bg,
        borderRadius: 12,
        padding: "20px 24px",
      }}
    >
      {/* Members */}
      <StatCard
        label="Members"
        value={stats.memberCount}
        C={C}
        delay={0}
      />

      {/* Cohort Status */}
      <div>
        <div style={{
          fontSize: 10,
          fontWeight: 600,
          color: C.t4,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 8,
        }}>
          Cohort Status
        </div>
        <div style={{
          fontSize: 14,
          color: C.t1,
          lineHeight: 1.4,
        }}>
          {statusSummary || "No activity yet"}
        </div>
      </div>

      {/* Activity */}
      <StatCard
        label="Activity"
        value={stats.activityThisWeek}
        suffix="updates this week"
        C={C}
        delay={0.1}
      />
    </motion.div>
  );
}

function StatCard({
  label,
  value,
  suffix,
  C,
  delay = 0,
}: {
  label: string;
  value: number;
  suffix?: string;
  C: ReturnType<typeof useC>;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <div style={{
        fontSize: 10,
        fontWeight: 600,
        color: C.t4,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        marginBottom: 8,
      }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{
          fontSize: 32,
          fontWeight: 300,
          color: C.t1,
          letterSpacing: "-0.03em",
          lineHeight: 1,
        }}>
          {value}
        </span>
        {suffix && (
          <span style={{
            fontSize: 11,
            color: C.t3,
          }}>
            {suffix}
          </span>
        )}
      </div>
    </motion.div>
  );
}
