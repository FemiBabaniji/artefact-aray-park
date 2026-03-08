"use client";
import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";
import type { CSSProperties } from "react";

type BtnProps = {
  children:  React.ReactNode;
  onClick?:  (e?: React.MouseEvent) => void;
  disabled?: boolean;
  accent?:   string;
  style?:    CSSProperties;
};

export function Btn({ children, onClick, disabled, accent, style }: BtnProps) {
  const C = useC();
  return (
    <motion.button
      onClick={(e) => { e.stopPropagation(); onClick?.(e); }}
      disabled={disabled}
      whileHover={{ opacity: disabled ? 1 : 0.7 }}
      whileTap={{ scale: disabled ? 1 : 0.96 }}
      style={{
        fontSize: 10,
        fontFamily: "'DM Mono', monospace",
        letterSpacing: ".04em",
        color: accent || C.t3,
        opacity: disabled ? 0.3 : 1,
        cursor: disabled ? "default" : "pointer",
        padding: "2px 0",
        ...style,
      }}
    >
      {children}
    </motion.button>
  );
}
