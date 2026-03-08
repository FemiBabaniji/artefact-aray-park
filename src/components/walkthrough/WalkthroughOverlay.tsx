"use client";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useC } from "@/hooks/useC";
import { SP, SPF } from "@/lib/motion";

export type WalkthroughStep = {
  id:    string;
  num:   number;
  label: string;
  title: string;
  desc:  string;
  path:  string;
};

export const STEPS: WalkthroughStep[] = [
  { id: "apply",     num: 1, label: "Apply",     path: "/apply",            title: "The application",  desc: "An applicant fills out their profile. This is the birth of the artefact — identity, practice, goals captured in one object." },
  { id: "portfolio", num: 2, label: "Portfolio",  path: "/portfolio/am",    title: "The artefact",      desc: "The application becomes a live artefact. Identity, sections, workspace — all in one object. Starts compact, expand to explore." },
  { id: "queue",     num: 3, label: "Queue",      path: "/queue",           title: "The review queue",  desc: "The artefact enters admin review. Same data object, different lens — read-only context, decision surface." },
  { id: "paths",     num: 4, label: "Paths",      path: "/paths",           title: "The program path",  desc: "Accepted members appear on the path. Checkpoints show where everyone is. Section statuses determine position." },
  { id: "accepted",  num: 5, label: "Accepted",   path: "/portal",          title: "The member portal", desc: "The artefact is now in portal context. The member continues building, mentor feedback flows in." },
  { id: "community", num: 6, label: "Community",  path: "/community",       title: "The cohort view",   desc: "All artefacts in aggregate. Who's active, who's at-risk, where the cohort is stalling." },
  { id: "link",      num: 7, label: "Link",       path: "/link/am",         title: "The public link",   desc: "Same artefact, public surface. No auth, no workspace — just the identity, works, and current focus as a shareable link page." },
];

type WalkthroughOverlayProps = {
  pathname: string;
};

export function WalkthroughOverlay({ pathname }: WalkthroughOverlayProps) {
  const C      = useC();
  const router = useRouter();

  const cur  = STEPS.find(s => pathname.startsWith(s.path)) ?? STEPS[0];
  const idx  = STEPS.indexOf(cur);
  const prev = STEPS[idx - 1];
  const next = STEPS[idx + 1];

  const go = (step: WalkthroughStep) => router.push(step.path);

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={SP}
      style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 500,
        background: C.void, borderTop: `1px solid ${C.sep}`,
        padding: "14px 32px", display: "flex", alignItems: "center", gap: 20,
      }}
    >
      {/* Animated step dots */}
      <div style={{ display: "flex", gap: 5, flexShrink: 0, alignItems: "center" }}>
        {STEPS.map(s => (
          <motion.div
            key={s.id}
            onClick={() => go(s)}
            animate={{ background: s.id === cur.id ? C.t2 : C.sep, width: s.id === cur.id ? 20 : 6 }}
            transition={SPF}
            style={{ height: 4, borderRadius: 2, cursor: "pointer" }}
          />
        ))}
      </div>

      {/* Step info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 2 }}>
          <span className="mono" style={{ fontSize: 8, color: C.t4, flexShrink: 0 }}>step {cur.num} of {STEPS.length}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.t1, letterSpacing: "-.01em" }}>{cur.title}</span>
        </div>
        <div style={{ fontSize: 11, color: C.t3, lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {cur.desc}
        </div>
      </div>

      {/* Step label tabs */}
      <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
        {STEPS.map(s => (
          <motion.button key={s.id} onClick={() => go(s)} whileHover={{ opacity: 0.8 }} whileTap={{ scale: 0.96 }}
            style={{
              padding: "5px 10px", borderRadius: 5,
              background: s.id === cur.id ? C.edge : "transparent",
              border: `1px solid ${s.id === cur.id ? C.t3 : "transparent"}`,
              color: s.id === cur.id ? C.t1 : C.t4,
              fontSize: 8, fontFamily: "'DM Mono',monospace", letterSpacing: ".04em",
              cursor: "pointer", transition: "all .15s",
            }}>
            {s.label}
          </motion.button>
        ))}
      </div>

      {/* Prev / next */}
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <motion.button onClick={() => prev && go(prev)} whileTap={{ scale: 0.96 }}
          style={{ padding: "6px 14px", border: `1px solid ${prev ? C.sep : "transparent"}`, borderRadius: 6, background: "transparent", color: prev ? C.t3 : C.t4, fontSize: 10, fontFamily: "'DM Mono',monospace", cursor: prev ? "pointer" : "default", opacity: prev ? 1 : 0.3 }}>
          ← prev
        </motion.button>
        <motion.button onClick={() => next && go(next)} whileTap={{ scale: 0.96 }}
          style={{ padding: "6px 14px", border: `1px solid ${next ? C.t2 : C.sep}`, borderRadius: 6, background: "transparent", color: next ? C.t1 : C.t4, fontSize: 10, fontFamily: "'DM Mono',monospace", cursor: next ? "pointer" : "default", opacity: next ? 1 : 0.3 }}>
          next →
        </motion.button>
      </div>
    </motion.div>
  );
}
