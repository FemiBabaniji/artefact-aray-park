"use client";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";
import { Lbl } from "@/components/primitives/Lbl";
import type { Member } from "@/types/member";
import type { Section } from "@/types/section";
import type { Stage } from "@/types/member";

type MemberWithSections = {
  member: Member;
  sections: Section[];
};

type AnalyticsViewProps = {
  members: MemberWithSections[];
  programWeek?: number;
  totalWeeks?: number;
};

export function AnalyticsView({ members, programWeek = 1, totalWeeks = 20 }: AnalyticsViewProps) {
  const C = useC();

  const stats = useMemo(() => {
    const total = members.length;
    const atRisk = members.filter(m => m.member.risk).length;

    // Stage distribution
    const stageCount: Record<Stage, number> = {
      pending: 0, entry: 0, foundation: 0, development: 0, showcase: 0, graduate: 0,
    };
    members.forEach(m => { stageCount[m.member.stage]++; });

    // Section completion rates
    const sectionStats: Record<string, { total: number; accepted: number }> = {};
    members.forEach(({ sections }) => {
      sections.forEach(s => {
        if (!sectionStats[s.id]) sectionStats[s.id] = { total: 0, accepted: 0 };
        sectionStats[s.id].total++;
        if (s.status === "accepted") sectionStats[s.id].accepted++;
      });
    });

    // Average progress
    const avgProgress = members.length > 0
      ? Math.round(members.reduce((sum, m) => {
          const accepted = m.sections.filter(s => s.status === "accepted").length;
          return sum + (accepted / m.sections.length) * 100;
        }, 0) / members.length)
      : 0;

    // Time in stage (simplified - would need real data in production)
    const avgDaysInStage = 14;

    return { total, atRisk, stageCount, sectionStats, avgProgress, avgDaysInStage };
  }, [members]);

  const StatCard = ({ label, value, color, subtext }: { label: string; value: string | number; color?: string; subtext?: string }) => (
    <div style={{
      background: C.void, border: `1px solid ${C.edge}`, borderRadius: 10, padding: "16px 20px",
    }}>
      <Lbl style={{ marginBottom: 8, display: "block" }}>{label}</Lbl>
      <div style={{ fontSize: 28, fontWeight: 600, color: color || C.t1, letterSpacing: "-0.02em" }}>
        {value}
      </div>
      {subtext && <div style={{ fontSize: 11, color: C.t4, marginTop: 4 }}>{subtext}</div>}
    </div>
  );

  const ProgressBar = ({ label, value, max, color }: { label: string; value: number; max: number; color: string }) => {
    const pct = max > 0 ? (value / max) * 100 : 0;
    return (
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 12, color: C.t2 }}>{label}</span>
          <span style={{ fontSize: 11, color: C.t4 }}>{Math.round(pct)}%</span>
        </div>
        <div style={{ height: 6, background: C.sep, borderRadius: 3, overflow: "hidden" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{ height: "100%", background: color, borderRadius: 3 }}
          />
        </div>
      </div>
    );
  };

  const STAGE_COLORS: Record<Stage, string> = {
    pending: C.t4,
    entry: C.blue,
    foundation: "#8b5cf6",
    development: C.amber,
    showcase: "#ec4899",
    graduate: C.green,
  };

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: C.t1, margin: 0, marginBottom: 4 }}>
          Cohort Analytics
        </h2>
        <Lbl>Week {programWeek} of {totalWeeks}</Lbl>
      </div>

      {/* Top stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 32 }}>
        <StatCard label="total members" value={stats.total} />
        <StatCard label="avg progress" value={`${stats.avgProgress}%`} color={C.blue} />
        <StatCard label="at risk" value={stats.atRisk} color={stats.atRisk > 0 ? C.amber : C.t4} />
        <StatCard label="graduated" value={stats.stageCount.graduate} color={C.green} />
      </div>

      {/* Two column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Stage distribution */}
        <div style={{ background: C.void, border: `1px solid ${C.edge}`, borderRadius: 12, padding: 20 }}>
          <Lbl style={{ marginBottom: 16, display: "block" }}>stage distribution</Lbl>
          {(["entry", "foundation", "development", "showcase", "graduate"] as Stage[]).map(stage => (
            <ProgressBar
              key={stage}
              label={stage.charAt(0).toUpperCase() + stage.slice(1)}
              value={stats.stageCount[stage]}
              max={stats.total}
              color={STAGE_COLORS[stage]}
            />
          ))}
        </div>

        {/* Section completion */}
        <div style={{ background: C.void, border: `1px solid ${C.edge}`, borderRadius: 12, padding: 20 }}>
          <Lbl style={{ marginBottom: 16, display: "block" }}>section completion rates</Lbl>
          {Object.entries(stats.sectionStats).map(([id, { total, accepted }]) => (
            <ProgressBar
              key={id}
              label={id.charAt(0).toUpperCase() + id.slice(1)}
              value={accepted}
              max={total}
              color={C.green}
            />
          ))}
        </div>
      </div>

      {/* Risk breakdown */}
      {stats.atRisk > 0 && (
        <div style={{
          marginTop: 24, background: C.amber + "10", border: `1px solid ${C.amber}33`,
          borderRadius: 12, padding: 20,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.amber }} />
            <Lbl style={{ color: C.amber }}>at-risk members ({stats.atRisk})</Lbl>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {members.filter(m => m.member.risk).map(({ member }) => (
              <div key={member.id} style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 10px", background: C.void, borderRadius: 6,
                border: `1px solid ${C.edge}`,
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 4, background: member.color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 8, fontWeight: 600, color: "rgba(255,255,255,0.9)",
                }}>
                  {member.initials}
                </div>
                <span style={{ fontSize: 12, color: C.t2 }}>{member.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
