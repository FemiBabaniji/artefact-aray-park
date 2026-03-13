"use client";

import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useC } from "@/hooks/useC";
import type { WizardStep } from "./types";

type StepAccordionProps = {
  steps: WizardStep[];
  currentStep: number;
  doneSteps: Set<string>;
  onStepClick: (stepNum: number) => void;
  renderStepContent: (step: WizardStep) => ReactNode;
  renderStepAction: (step: WizardStep) => ReactNode;
};

/**
 * Reusable step accordion for wizard navigation.
 * Shows steps as expandable sections with done/current indicators.
 */
export function StepAccordion({
  steps,
  currentStep,
  doneSteps,
  onStepClick,
  renderStepContent,
  renderStepAction,
}: StepAccordionProps) {
  const C = useC();

  return (
    <div>
      {steps.map((s, idx) => {
        const isCurrent = currentStep === s.num;
        const isDone = doneSteps.has(s.id);

        return (
          <div key={s.id}>
            <motion.div
              onClick={() => isDone && onStepClick(s.num)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 0",
                cursor: isDone ? "pointer" : "default",
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 6,
                  background: isDone ? C.green : isCurrent ? C.edge : "transparent",
                  border: `1px solid ${isDone ? C.green : isCurrent ? C.t3 : C.sep}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 9,
                  color: isDone ? "#fff" : isCurrent ? C.t1 : C.t4,
                  fontWeight: 500,
                  transition: "all 0.2s",
                }}
              >
                {isDone ? "✓" : s.num}
              </div>
              <span
                style={{
                  fontSize: 12,
                  color: isCurrent ? C.t1 : isDone ? C.t2 : C.t4,
                  fontWeight: isCurrent ? 500 : 400,
                }}
              >
                {s.label}
              </span>
            </motion.div>

            <AnimatePresence>
              {isCurrent && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{ overflow: "hidden", marginLeft: 30, paddingBottom: 16 }}
                >
                  <div style={{ paddingTop: 4 }}>
                    {renderStepContent(s)}
                    {renderStepAction(s)}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {idx < steps.length - 1 && (
              <div
                style={{
                  marginLeft: 10,
                  width: 1,
                  height: isCurrent ? 0 : 12,
                  background: C.sep,
                  transition: "height .2s",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
