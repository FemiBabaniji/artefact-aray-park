"use client";
import { motion } from "framer-motion";
import { useC, useTheme } from "@/hooks/useC";

export function ThemeToggle() {
  const C = useC();
  const { dark, toggle } = useTheme();

  return (
    <motion.button
      onClick={toggle}
      whileHover={{ opacity: 0.7 }}
      whileTap={{ scale: 0.93 }}
      style={{
        display: "flex", alignItems: "center", gap: 7,
        padding: "5px 10px",
        border: `1px solid ${C.edge}`,
        borderRadius: 6, background: "transparent", color: C.t3,
        fontSize: 10, fontFamily: "'DM Mono', monospace", letterSpacing: ".04em",
        cursor: "pointer",
      }}
    >
      {dark
        ? <><span style={{ fontSize: 11 }}>○</span> light</>
        : <><span style={{ fontSize: 11 }}>●</span> dark</>
      }
    </motion.button>
  );
}
