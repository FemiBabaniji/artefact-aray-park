"use client";

import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";
import { useIsMobile } from "@/hooks/useBreakpoint";
import { TOUCH } from "@/lib/breakpoints";
import { Btn } from "@/components/primitives/Btn";

type PublishModalProps = {
  slug: string;
  publicUrl?: string | null;
  accent: string;
  onClose: () => void;
};

export function PublishModal({ slug, publicUrl, accent, onClose }: PublishModalProps) {
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
        {/* Drag handle for mobile */}
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
            background: "#22c55e22",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <span style={{ fontSize: 24, color: "#22c55e" }}>✓</span>
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: C.t1, marginBottom: 8 }}>
          Published!
        </h3>
        <p style={{ fontSize: 13, color: C.t3, marginBottom: 16, lineHeight: 1.5 }}>
          Your artefact is now live and accessible at:
        </p>
        <a
          href={publicUrl || `/p/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "block",
            padding: "12px 16px",
            background: C.void,
            borderRadius: 8,
            fontSize: 13,
            color: accent,
            textDecoration: "none",
            marginBottom: 16,
            wordBreak: "break-all",
          }}
        >
          {typeof window !== "undefined" ? window.location.origin : ""}/p/{slug}
        </a>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/p/${slug}`);
            }}
            style={{
              flex: 1,
              justifyContent: "center",
              minHeight: isMobile ? TOUCH.minTarget : undefined,
            }}
          >
            Copy Link
          </Btn>
          <Btn
            onClick={onClose}
            style={{
              flex: 1,
              justifyContent: "center",
              minHeight: isMobile ? TOUCH.minTarget : undefined,
            }}
            accent={accent}
          >
            Done
          </Btn>
        </div>
      </motion.div>
    </motion.div>
  );
}
