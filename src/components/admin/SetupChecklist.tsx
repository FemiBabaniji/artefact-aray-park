"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";
import { FADE } from "@/lib/motion";
import { Btn } from "@/components/primitives/Btn";
import { Lbl } from "@/components/primitives/Lbl";

type SetupStep = {
  id: string;
  label: string;
  description: string;
  done: boolean;
  action?: () => void;
  actionLabel?: string;
};

type SetupChecklistProps = {
  communityName: string;
  steps: SetupStep[];
  onStepComplete?: (stepId: string) => void;
};

export function SetupChecklist({ communityName, steps, onStepComplete }: SetupChecklistProps) {
  const C = useC();
  const [expanded, setExpanded] = useState<string | null>(null);

  const completed = steps.filter(s => s.done).length;
  const total = steps.length;
  const progress = (completed / total) * 100;
  const allDone = completed === total;

  return (
    <div style={{ background: C.void, border: `1px solid ${C.edge}`, borderRadius: 12, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.sep}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <Lbl>setup {communityName}</Lbl>
          <span style={{ fontSize: 11, color: allDone ? C.green : C.t4 }}>
            {completed}/{total} complete
          </span>
        </div>

        {/* Progress bar */}
        <div style={{ height: 4, background: C.sep, borderRadius: 2, overflow: "hidden" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{ height: "100%", background: allDone ? C.green : C.blue }}
          />
        </div>
      </div>

      {/* Steps */}
      <div style={{ padding: "8px 0" }}>
        {steps.map((step, i) => (
          <div key={step.id}>
            <div
              onClick={() => setExpanded(expanded === step.id ? null : step.id)}
              style={{
                display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 20px",
                cursor: "pointer", transition: "background 0.1s",
              }}
            >
              {/* Checkbox */}
              <div style={{
                width: 18, height: 18, borderRadius: 4, flexShrink: 0, marginTop: 1,
                border: step.done ? "none" : `1.5px solid ${C.sep}`,
                background: step.done ? C.green : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {step.done && (
                  <span style={{ color: "#fff", fontSize: 11, fontWeight: 600 }}>✓</span>
                )}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13, color: step.done ? C.t3 : C.t1, fontWeight: 500,
                  textDecoration: step.done ? "line-through" : "none",
                }}>
                  {step.label}
                </div>

                {expanded === step.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={FADE}
                    style={{ marginTop: 8 }}
                  >
                    <div style={{ fontSize: 12, color: C.t3, lineHeight: 1.5, marginBottom: 12 }}>
                      {step.description}
                    </div>
                    {step.action && !step.done && (
                      <div onClick={(e) => e.stopPropagation()}>
                        <Btn
                          onClick={() => { step.action?.(); onStepComplete?.(step.id); }}
                          accent={C.blue}
                          style={{ fontSize: 11 }}
                        >
                          {step.actionLabel || "Complete"}
                        </Btn>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Expand indicator */}
              <span style={{ fontSize: 10, color: C.t4, transform: expanded === step.id ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}>
                ▶
              </span>
            </div>

            {i < steps.length - 1 && (
              <div style={{ height: 1, background: C.sep, marginLeft: 50 }} />
            )}
          </div>
        ))}
      </div>

      {/* Completion message */}
      {allDone && (
        <div style={{ padding: "16px 20px", borderTop: `1px solid ${C.sep}`, textAlign: "center" }}>
          <div style={{ fontSize: 13, color: C.green, fontWeight: 500 }}>
            Setup complete — your community is ready!
          </div>
        </div>
      )}
    </div>
  );
}

// Default setup steps for a new community
export const DEFAULT_SETUP_STEPS: Omit<SetupStep, "done">[] = [
  {
    id: "branding",
    label: "Configure branding",
    description: "Set your community name, logo, and accent color. This will appear on all member-facing pages.",
    actionLabel: "Open settings",
  },
  {
    id: "sections",
    label: "Customize sections",
    description: "Rename or reorder the 7 portfolio sections to match your program structure. Default sections work for most programs.",
    actionLabel: "Edit sections",
  },
  {
    id: "stages",
    label: "Set up stages",
    description: "Configure the progression stages for your program. Default: Entry → Foundation → Development → Showcase → Graduate.",
    actionLabel: "Edit stages",
  },
  {
    id: "mentors",
    label: "Add mentors",
    description: "Invite team members who will review submissions and provide feedback.",
    actionLabel: "Invite mentors",
  },
  {
    id: "first_invite",
    label: "Send first invite",
    description: "Invite your first cohort members to create their artefacts.",
    actionLabel: "Upload CSV",
  },
];
