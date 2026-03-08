"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useC } from "@/hooks/useC";
import { useDemoConfig } from "@/context/DemoConfigContext";
import { Lbl } from "@/components/primitives/Lbl";
import { Btn } from "@/components/primitives/Btn";
import { FADE } from "@/lib/motion";
import type { ReactNode } from "react";

type Step = {
  id: string;
  label: string;
  path: string;
};

const STEPS: Step[] = [
  { id: "identity", label: "Identity", path: "identity" },
  { id: "sections", label: "Sections", path: "sections" },
  { id: "stages", label: "Stages", path: "stages" },
  { id: "preview", label: "Preview", path: "preview" },
];

type DemoSetupLayoutProps = {
  children: ReactNode;
  preview: ReactNode;
  token: string;
};

export function DemoSetupLayout({ children, preview, token }: DemoSetupLayoutProps) {
  const C = useC();
  const router = useRouter();
  const pathname = usePathname();
  const { config, isSaving, showExpiryWarning, isExpired } = useDemoConfig();

  // Determine current step
  const currentStepIndex = STEPS.findIndex((s) => pathname.includes(s.path));
  const currentStep = STEPS[currentStepIndex] ?? STEPS[0];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === STEPS.length - 1;

  const navigateTo = (step: Step) => {
    router.push(`/demo/${token}/setup/${step.path}`);
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      navigateTo(STEPS[currentStepIndex - 1]);
    }
  };

  const handleNext = () => {
    if (!isLastStep) {
      navigateTo(STEPS[currentStepIndex + 1]);
    }
  };

  if (isExpired) {
    router.push("/demo/expired");
    return null;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: C.void,
      }}
    >
      {/* Expiry warning banner */}
      <AnimatePresence>
        {showExpiryWarning && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{
              background: C.amber + "15",
              borderBottom: `1px solid ${C.amber}33`,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "10px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: 12, color: C.amber }}>
                Session expires in less than 10 minutes
              </span>
              <Btn
                onClick={() => router.push(`/demo/${token}/claim`)}
                accent={C.amber}
              >
                Save your progress — claim your program
              </Btn>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header
        style={{
          padding: "16px 24px",
          borderBottom: `1px solid ${C.sep}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Lbl>demo setup</Lbl>
          <span style={{ fontSize: 13, color: C.t2, fontWeight: 500 }}>
            {config.identity.name || "Your Community"}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Step indicators */}
          {STEPS.map((step, i) => (
            <button
              key={step.id}
              onClick={() => navigateTo(step)}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                background:
                  currentStep.id === step.id ? C.edge : "transparent",
                border: `1px solid ${
                  currentStep.id === step.id ? C.edge : "transparent"
                }`,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span
                className="mono"
                style={{
                  fontSize: 9,
                  color: currentStep.id === step.id ? C.t1 : C.t3,
                }}
              >
                {i + 1}
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: currentStep.id === step.id ? C.t1 : C.t3,
                }}
              >
                {step.label}
              </span>
            </button>
          ))}

          {/* Saving indicator */}
          {isSaving && (
            <span
              className="mono"
              style={{ fontSize: 9, color: C.t4, marginLeft: 8 }}
            >
              saving...
            </span>
          )}
        </div>
      </header>

      {/* Main content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {/* Left: Configuration panel */}
        <div
          style={{
            width: 400,
            flexShrink: 0,
            borderRight: `1px solid ${C.sep}`,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Step content */}
          <div
            style={{
              flex: 1,
              overflow: "auto",
              padding: 24,
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={FADE}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation footer */}
          <div
            style={{
              padding: "16px 24px",
              borderTop: `1px solid ${C.sep}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <Btn onClick={handlePrev} disabled={isFirstStep}>
              Previous
            </Btn>
            <Btn onClick={handleNext} accent={C.green} disabled={isLastStep}>
              {isLastStep ? "Preview" : "Continue"}
            </Btn>
          </div>
        </div>

        {/* Right: Live preview */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "auto",
            padding: "32px 24px",
            background: C.bg,
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              style={{ pointerEvents: "none", userSelect: "none" }}
            >
              {preview}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
