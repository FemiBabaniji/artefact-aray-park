"use client";

import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";

type WelcomeMessageProps = {
  title: string;
  subtitle: string;
};

export function WelcomeMessage({ title, subtitle }: WelcomeMessageProps) {
  const C = useC();

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2 }}
      style={{
        position: "absolute",
        top: 0,
        bottom: "50%",
        left: 0,
        right: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        paddingBottom: 20,
      }}
    >
      <div
        style={{
          fontSize: 28,
          fontWeight: 600,
          color: C.t1,
          letterSpacing: "-.03em",
          lineHeight: 1.25,
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: 14, color: C.t3, lineHeight: 1.6 }}>
        {subtitle}
      </div>
    </motion.div>
  );
}
