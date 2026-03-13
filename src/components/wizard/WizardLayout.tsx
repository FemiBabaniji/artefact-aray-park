"use client";

import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useC } from "@/hooks/useC";

type WizardLayoutProps = {
  started: boolean;
  dark: boolean;
  welcomeContent: ReactNode;
  leftPanelHeader: ReactNode;
  leftPanelContent: ReactNode;
  rightPanelContent: ReactNode;
  rightPanelFullscreen?: boolean;
  accentColor?: string;
};

/**
 * Two-phase wizard layout matching CommunityCreateWizard pattern.
 * Phase 1: Fullscreen welcome
 * Phase 2: Split layout (left config, right preview)
 */
export function WizardLayout({
  started,
  dark,
  welcomeContent,
  leftPanelHeader,
  leftPanelContent,
  rightPanelContent,
  rightPanelFullscreen = false,
  accentColor,
}: WizardLayoutProps) {
  const C = useC();
  const accent = accentColor || C.blue;

  return (
    <div style={{ flex: 1, overflow: "hidden", position: "relative", minHeight: "100vh", background: C.void }}>
      {/* PHASE 1: Fullscreen welcome */}
      <motion.div
        key="welcome-phase"
        animate={{
          opacity: started ? 0 : 1,
          x: started ? -60 : 0,
          pointerEvents: started ? "none" : "auto",
        }}
        transition={{ duration: 0.38, ease: [0.4, 0, 0.2, 1] }}
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          overflow: "auto",
          willChange: "transform, opacity",
          background: `linear-gradient(180deg, ${C.bg} 0%, ${dark ? "rgba(30,30,35,1)" : "rgba(250,250,252,1)"} 100%)`,
        }}
      >
        {welcomeContent}
      </motion.div>

      {/* PHASE 2: Split layout */}
      <motion.div
        key="split-phase"
        animate={{
          opacity: started ? 1 : 0,
          x: started ? 0 : 60,
          pointerEvents: started ? "auto" : "none",
        }}
        transition={{ duration: 0.42, ease: [0.22, 0.1, 0.36, 1], delay: started ? 0.12 : 0 }}
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          overflow: "hidden",
          willChange: "transform, opacity",
        }}
      >
        {/* LEFT panel */}
        <motion.div
          animate={{ x: started ? 0 : -40, opacity: started ? 1 : 0 }}
          transition={{ duration: 0.44, ease: [0.22, 0.1, 0.36, 1], delay: started ? 0.18 : 0 }}
          style={{
            width: 440,
            flexShrink: 0,
            borderRight: `1px solid ${C.sep}`,
            overflow: "auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Branded header */}
          <div
            style={{
              padding: "16px 24px",
              borderBottom: `1px solid ${C.sep}`,
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexShrink: 0,
            }}
          >
            {leftPanelHeader}
          </div>

          <div style={{ padding: "24px 32px 80px", flex: 1, overflow: "auto" }}>
            {leftPanelContent}
          </div>
        </motion.div>

        {/* RIGHT panel - Preview */}
        <motion.div
          animate={{
            x: started ? 0 : 50,
            opacity: started ? 1 : 0,
          }}
          transition={{ duration: 0.44, ease: [0.22, 0.1, 0.36, 1], delay: started ? 0.22 : 0 }}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: rightPanelFullscreen ? "stretch" : "center",
            justifyContent: rightPanelFullscreen ? "stretch" : "center",
            background: C.bg,
            overflow: "hidden",
            position: "relative",
            transition: "align-items 0.28s ease, justify-content 0.28s ease",
          }}
        >
          {/* Radial gradient background */}
          <AnimatePresence>
            {!rightPanelFullscreen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.2 }}
                transition={{ duration: 0.3 }}
                style={{
                  position: "absolute",
                  width: 300,
                  height: 300,
                  borderRadius: "50%",
                  background: `radial-gradient(circle, ${accent}08 0%, transparent 70%)`,
                  pointerEvents: "none",
                }}
              />
            )}
          </AnimatePresence>

          {rightPanelContent}
        </motion.div>
      </motion.div>
    </div>
  );
}
