"use client";
import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";
import { SPF } from "@/lib/motion";
import { Lbl } from "@/components/primitives/Lbl";
import type { Member } from "@/types/member";

const STAGES = [
  { id: "pending",     label: "Pending" },
  { id: "entry",       label: "Entry" },
  { id: "foundation",  label: "Foundation" },
  { id: "development", label: "Development" },
  { id: "showcase",    label: "Showcase" },
  { id: "graduate",    label: "Graduate" },
] as const;

type StepCommunityProps = {
  members: Member[];
};

export function StepCommunity({ members }: StepCommunityProps) {
  const C = useC();

  const total   = members.length;
  const active  = members.filter(m => !["pending", "graduate"].includes(m.stage)).length;
  const atRisk  = members.filter(m => m.risk).length;
  const avgPct  = Math.round(members.reduce((a, m) => a + (m.accepted / m.sections), 0) / members.length * 100);

  const riskMember = members.find(m => m.risk);

  return (
    <div style={{ flex: 1, overflow: "auto", padding: "28px 32px 120px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Lbl style={{ display: "block", marginBottom: 6 }}>cohort overview · spring program</Lbl>
        <div style={{ fontSize: 18, fontWeight: 600, color: C.t1, letterSpacing: "-.02em" }}>Community</div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 10, marginBottom: 28 }}>
        {[
          ["total", total, C.t1],
          ["active", active, C.blue],
          ["at risk", atRisk, C.amber],
          ["avg progress", avgPct + "%", C.green],
        ].map(([lbl, val, col]) => (
          <div key={lbl as string} style={{
            flex: 1, border: `1px solid ${C.sep}`, borderRadius: 10, padding: "14px 16px",
          }}>
            <Lbl style={{ display: "block", marginBottom: 8, color: C.t4 }}>{lbl as string}</Lbl>
            <div style={{
              fontSize: 26, fontWeight: 300, color: col as string, letterSpacing: "-.03em", lineHeight: 1,
            }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Member grid */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: 10, marginBottom: 28,
      }}>
        {members.map(m => {
          const pct   = Math.round((m.accepted / m.sections) * 100);
          const stage = STAGES.find(s => s.id === m.stage);
          return (
            <motion.div key={m.id} whileHover={{ opacity: 0.9 }}
              style={{
                background: m.color + "88", borderRadius: 12, padding: "16px 16px 14px",
                position: "relative", border: "1px solid transparent",
              }}
            >
              {/* Risk dot */}
              {m.risk && (
                <div style={{
                  position: "absolute", top: 12, right: 12,
                  width: 6, height: 6, borderRadius: "50%", background: C.amber,
                }} />
              )}

              {/* Avatar */}
              <div style={{
                width: 40, height: 40, borderRadius: 9, background: "rgba(255,255,255,.12)",
                display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10,
              }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.85)",
                  fontFamily: "'DM Sans',sans-serif",
                }}>{m.initials}</span>
              </div>

              {/* Name */}
              <div style={{
                fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,.9)", letterSpacing: "-.01em",
                marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>{m.name}</div>

              {/* Stage */}
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 10 }}>
                <span className="mono" style={{
                  fontSize: 8, color: "rgba(255,255,255,.4)", textTransform: "capitalize",
                }}>{stage?.label}</span>
                {m.risk && (
                  <span className="mono" style={{ fontSize: 8, color: C.amber }}>· at risk</span>
                )}
              </div>

              {/* Progress bar */}
              <div style={{ height: 2, background: "rgba(255,255,255,.1)", borderRadius: 1 }}>
                <motion.div animate={{ width: `${pct}%` }} transition={SPF}
                  style={{
                    height: "100%", borderRadius: 1,
                    background: pct === 100 ? "#4ade80" : "rgba(255,255,255,.5)",
                  }} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Risk alert */}
      {riskMember && (
        <div style={{
          padding: "16px 18px", border: `1px solid ${C.sep}`, borderRadius: 8,
          display: "flex", alignItems: "flex-start", gap: 12,
        }}>
          <span style={{ fontSize: 18, opacity: 0.5 }}>⚠</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: C.amber, marginBottom: 4 }}>
              {riskMember.name} is at risk
            </div>
            <div style={{ fontSize: 11, color: C.t3, lineHeight: 1.6 }}>
              Only {riskMember.accepted} of {riskMember.sections} sections submitted.
              No activity in 14 days. Foundation checkpoint deadline in 6 days.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
