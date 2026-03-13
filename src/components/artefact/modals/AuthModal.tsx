"use client";

import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";
import { useIsMobile } from "@/hooks/useBreakpoint";
import { TOUCH } from "@/lib/breakpoints";
import { Btn } from "@/components/primitives/Btn";

type AuthModalProps = {
  accent: string;
  error?: string | null;
  onClose: () => void;
};

export function AuthModal({ accent, error, onClose }: AuthModalProps) {
  const C = useC();
  const isMobile = useIsMobile();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: isMobile ? "flex-end" : "center",
        justifyContent: "center",
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={isMobile ? { y: "100%" } : { scale: 0.9, opacity: 0 }}
        animate={isMobile ? { y: 0 } : { scale: 1, opacity: 1 }}
        exit={isMobile ? { y: "100%" } : { scale: 0.9, opacity: 0 }}
        transition={isMobile ? { type: "spring", damping: 30, stiffness: 300 } : undefined}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.bg,
          borderRadius: isMobile ? "16px 16px 0 0" : 16,
          padding: isMobile ? "20px 20px calc(20px + env(safe-area-inset-bottom, 0px))" : 24,
          maxWidth: isMobile ? "100%" : 400,
          width: isMobile ? "100%" : "90%",
          textAlign: "center",
        }}
      >
        {isMobile && (
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: C.sep }} />
          </div>
        )}

        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: accent + "22",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <span style={{ fontSize: 24, color: accent }}>→</span>
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: C.t1, marginBottom: 8 }}>
          Sign in to publish
        </h3>
        <p style={{ fontSize: 13, color: C.t3, marginBottom: 16, lineHeight: 1.5 }}>
          {error || "You need to sign in to publish your artefact and make it publicly accessible."}
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn
            onClick={onClose}
            style={{
              flex: 1,
              justifyContent: "center",
              minHeight: isMobile ? TOUCH.minTarget : undefined,
            }}
          >
            Cancel
          </Btn>
          <a
            href="/auth/login"
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "8px 16px",
              borderRadius: 6,
              background: accent,
              color: "#000",
              fontSize: 12,
              fontWeight: 500,
              textDecoration: "none",
              minHeight: isMobile ? TOUCH.minTarget : undefined,
            }}
          >
            Sign In
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
}
