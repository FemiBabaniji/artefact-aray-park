"use client";
import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";
import { SP } from "@/lib/motion";
import type { CSSProperties } from "react";

type RegionProps = {
  tag:          string;
  children:     React.ReactNode;
  flex?:        string | number;
  onClick?:     () => void;
  syncBorder?:  string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
};

export function Region({ tag, children, flex, onClick, syncBorder, onMouseEnter, onMouseLeave }: RegionProps) {
  const C = useC();
  return (
    <motion.div layout transition={SP}
      style={{ flex, minHeight: 0, display: "flex", flexDirection: "column" }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <motion.div
        layout transition={SP}
        whileHover={onClick ? { opacity: 0.8 } : {}}
        animate={{ borderTopColor: syncBorder || C.sep }}
        style={{
          flex: 1, minHeight: 0,
          borderTop: `1px solid ${C.sep}`, paddingTop: 10,
          display: "flex", flexDirection: "column",
          overflow: "hidden",
          cursor: onClick ? "pointer" : "default",
        }}
        onClick={onClick}
      >
        <span className="mono" style={{ fontSize: 9, color: C.t3, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 8, display: "block", flexShrink: 0 }}>
          {tag}
        </span>
        <div style={{ flex: 1, minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}
