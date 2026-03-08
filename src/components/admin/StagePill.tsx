"use client";
import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";
import type { StageToken } from "@/types/program";

type StagePillProps = {
  stage:   StageToken;
  count:   number;
  active:  string;
  onClick: (id: string) => void;
};

export function StagePill({ stage, count, active, onClick }: StagePillProps) {
  const C        = useC();
  const isActive = active === stage.id;
  return (
    <motion.button onClick={() => onClick(stage.id)} whileHover={{ opacity: 0.85 }} whileTap={{ scale: 0.97 }}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "8px 16px", borderRadius: 20,
        border: `1px solid ${isActive ? C.t2 : C.sep}`,
        background: isActive ? C.edge : "transparent",
        cursor: "pointer", transition: "all .15s",
      }}>
      <div style={{ width: 8, height: 8, borderRadius: 2, background: stage.color, flexShrink: 0 }} />
      <span style={{ fontSize: 12, color: isActive ? C.t1 : C.t3, fontFamily: "'DM Sans',sans-serif" }}>
        {stage.label}
      </span>
      <span className="mono" style={{ fontSize: 9, color: isActive ? C.t2 : C.t4 }}>{count}</span>
    </motion.button>
  );
}
