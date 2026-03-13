"use client";

import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";
import { SPF } from "@/lib/motion";
import type { CSSProperties } from "react";

type Step = {
  key: string;
  label: string;
};

type StepperProps = {
  steps: Step[];
  currentStep: string;
  onStepClick?: (step: string) => void;
  completedSteps?: string[];
  style?: CSSProperties;
};

export function Stepper({
  steps,
  currentStep,
  onStepClick,
  completedSteps = [],
  style,
}: StepperProps) {
  const C = useC();
  const currentIndex = steps.findIndex((s) => s.key === currentStep);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 0,
        ...style,
      }}
    >
      {steps.map((step, index) => {
        const isCurrent = step.key === currentStep;
        const isPast = completedSteps.includes(step.key) || index < currentIndex;
        const isFuture = !isCurrent && !isPast;

        return (
          <div
            key={step.key}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              position: "relative",
            }}
          >
            {/* Connector line */}
            {index > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: 14,
                  right: "50%",
                  width: "100%",
                  height: 2,
                  background: isPast || isCurrent ? C.blue : C.sep,
                  zIndex: 0,
                }}
              />
            )}

            {/* Step indicator */}
            <motion.button
              onClick={() => onStepClick?.(step.key)}
              disabled={!onStepClick}
              whileHover={onStepClick ? { scale: 1.1 } : undefined}
              whileTap={onStepClick ? { scale: 0.95 } : undefined}
              transition={SPF}
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: isCurrent ? C.blue : isPast ? `${C.blue}30` : C.void,
                border: `2px solid ${isCurrent || isPast ? C.blue : C.sep}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1,
                cursor: onStepClick ? "pointer" : "default",
              }}
            >
              {isPast && !isCurrent && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M20 6L9 17L4 12"
                    stroke={C.blue}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
              {isCurrent && (
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#fff",
                  }}
                />
              )}
            </motion.button>

            {/* Label */}
            <div
              style={{
                marginTop: 8,
                fontSize: 11,
                fontWeight: isCurrent ? 600 : 400,
                color: isCurrent ? C.t1 : isPast ? C.t2 : C.t4,
                textAlign: "center",
                lineHeight: 1.2,
              }}
            >
              {step.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
