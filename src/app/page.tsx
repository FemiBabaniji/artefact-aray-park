"use client";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useC } from "@/hooks/useC";
import { ThemeToggle } from "@/components/primitives/ThemeToggle";
import { STEPS } from "@/components/walkthrough/WalkthroughOverlay";

export default function LandingPage() {
  const C = useC();
  const router = useRouter();

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: C.void }}>
      {/* Header */}
      <div style={{ padding: "20px 32px", display: "flex", justifyContent: "flex-end" }}>
        <ThemeToggle />
      </div>

      {/* Hero */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px 80px" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ maxWidth: 560, textAlign: "center" }}
        >
          <div style={{ fontSize: 9, color: C.t4, fontFamily: "'DM Mono',monospace", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 16 }}>
            Creative Incubator
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 600, color: C.t1, letterSpacing: "-.03em", lineHeight: 1.2, marginBottom: 16 }}>
            The artefact system.
          </h1>
          <p style={{ fontSize: 14, color: C.t3, lineHeight: 1.7, marginBottom: 40 }}>
            A unified data object that follows each member from application to completion.
            One artefact, many views — identity, portfolio, review, progress, and public presence.
          </p>

          <motion.button
            onClick={() => router.push("/apply")}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              padding: "14px 32px",
              border: `1px solid ${C.t2}`,
              borderRadius: 10,
              background: "transparent",
              color: C.t1,
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              letterSpacing: "-.01em",
            }}
          >
            Start walkthrough
          </motion.button>
        </motion.div>

        {/* Steps preview */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          style={{ marginTop: 64, display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center" }}
        >
          {STEPS.map((step, i) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.05 }}
              style={{
                padding: "6px 12px",
                border: `1px solid ${C.sep}`,
                borderRadius: 6,
                fontSize: 9,
                fontFamily: "'DM Mono',monospace",
                color: C.t4,
                letterSpacing: ".03em",
              }}
            >
              {step.num}. {step.label}
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Footer hint */}
      <div style={{ padding: "20px 32px", textAlign: "center" }}>
        <div style={{ fontSize: 10, color: C.t4, fontFamily: "'DM Mono',monospace" }}>
          7 steps · interactive demo
        </div>
      </div>
    </div>
  );
}
