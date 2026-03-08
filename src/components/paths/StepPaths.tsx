"use client";
import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";
import { SPF } from "@/lib/motion";
import { Lbl } from "@/components/primitives/Lbl";
import type { Member } from "@/types/member";
import type { Section, SectionKey } from "@/types/section";

const CPS: SectionKey[] = ["practice", "focus", "material", "influences", "series", "exhibition", "collab"];
const CP_LABELS = ["Practice", "Focus", "Material", "Influences", "Series", "Exhibition", "Collab"];

const STAGES = [
  { id: "entry",       label: "Entry" },
  { id: "foundation",  label: "Foundation" },
  { id: "development", label: "Development" },
  { id: "showcase",    label: "Showcase" },
  { id: "graduate",    label: "Graduate" },
] as const;

const STAGE_ORDER = ["pending", "entry", "foundation", "development", "showcase", "graduate"] as const;

type MemberWithSections = {
  member:   Member;
  sections: Section[];
};

type StepPathsProps = {
  members: MemberWithSections[];
};

export function StepPaths({ members }: StepPathsProps) {
  const C = useC();

  // Build checkpoint status map for each member
  const membersWithCps = members.map(({ member, sections }) => {
    const cps: Record<string, string> = {};
    sections.forEach(s => { cps[s.id] = s.status; });
    return { ...member, cps };
  });

  return (
    <div style={{ flex: 1, overflow: "auto", padding: "28px 32px 120px" }}>
      {/* Header */}
      <div style={{
        marginBottom: 24, display: "flex", alignItems: "center",
        justifyContent: "space-between", flexWrap: "wrap", gap: 12,
      }}>
        <div>
          <Lbl style={{ display: "block", marginBottom: 6 }}>program paths · spring cohort</Lbl>
          <div style={{ fontSize: 18, fontWeight: 600, color: C.t1, letterSpacing: "-.02em" }}>
            Checkpoint Matrix
          </div>
        </div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          {[
            ["accepted", C.green],
            ["submitted", C.blue],
            ["in progress", C.amber],
            ["empty", C.sep],
          ].map(([s, col]) => (
            <div key={s as string} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: col as string }} />
              <span className="mono" style={{ fontSize: 8, color: C.t4 }}>{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Matrix table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "0 0 12px", width: 160 }}><Lbl>member</Lbl></th>
              {CP_LABELS.map((lbl, i) => (
                <th key={i} style={{ textAlign: "center", padding: "0 0 12px" }}>
                  <span className="mono" style={{ fontSize: 8, color: C.t4, letterSpacing: ".04em" }}>{lbl}</span>
                </th>
              ))}
              <th style={{ textAlign: "right", padding: "0 0 12px" }}><Lbl>progress</Lbl></th>
            </tr>
          </thead>
          <tbody>
            {membersWithCps.map(m => {
              const done = CPS.filter(cp => m.cps[cp] === "accepted").length;
              const pct  = Math.round((done / CPS.length) * 100);
              return (
                <tr key={m.id} style={{ borderTop: `1px solid ${C.sep}` }}>
                  <td style={{ padding: "12px 0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 6, background: m.color, flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <span style={{
                          fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,.85)",
                          fontFamily: "'DM Sans',sans-serif",
                        }}>{m.initials}</span>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 500, color: C.t1, lineHeight: 1.2 }}>{m.name}</div>
                        <span className="mono" style={{ fontSize: 8, color: C.t4, textTransform: "capitalize" }}>{m.stage}</span>
                      </div>
                    </div>
                  </td>
                  {CPS.map(cp => {
                    const st = m.cps[cp] || "empty";
                    const bg = st === "accepted" ? C.green
                      : st === "submitted" ? C.blue
                      : st === "in_progress" ? C.amber
                      : C.sep;
                    return (
                      <td key={cp} style={{ textAlign: "center", padding: "12px 8px" }}>
                        <div style={{
                          width: 10, height: 10, borderRadius: 3, background: bg,
                          opacity: st === "empty" ? 0.2 : 1, margin: "0 auto",
                        }} />
                      </td>
                    );
                  })}
                  <td style={{ textAlign: "right", padding: "12px 0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                      <div style={{ width: 60, height: 2, background: C.sep, borderRadius: 1 }}>
                        <motion.div animate={{ width: `${pct}%` }} transition={SPF}
                          style={{ height: "100%", borderRadius: 1, background: pct === 100 ? C.green : C.blue }} />
                      </div>
                      <span className="mono" style={{
                        fontSize: 9, color: pct === 100 ? C.green : C.t3, width: 28, textAlign: "right",
                      }}>{pct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Stage distribution */}
      <div style={{ marginTop: 32, paddingTop: 24, borderTop: `1px solid ${C.sep}` }}>
        <Lbl style={{ display: "block", marginBottom: 16 }}>stage distribution</Lbl>
        <div style={{ display: "flex", gap: 8 }}>
          {STAGES.map(stage => {
            const count = membersWithCps.filter(m => m.stage === stage.id).length;
            const stageColors: Record<string, string> = {
              entry: "#3b4a3f",
              foundation: "#2e3d52",
              development: "#3d2e52",
              showcase: "#52392e",
              graduate: "#2e4a3d",
            };
            return (
              <div key={stage.id} style={{
                flex: 1, padding: "12px 14px", border: `1px solid ${C.sep}`,
                borderRadius: 8, background: count ? stageColors[stage.id] + "44" : "transparent",
              }}>
                <div style={{ fontSize: 11, color: C.t2, fontWeight: 500, marginBottom: 4 }}>{stage.label}</div>
                <div style={{ fontSize: 22, fontWeight: 300, color: count ? C.t1 : C.t4, letterSpacing: "-.03em" }}>{count}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
