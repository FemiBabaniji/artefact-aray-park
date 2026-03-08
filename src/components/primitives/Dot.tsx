"use client";
import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";
import { mkST, type AnyStatus } from "@/lib/status";
import { FADE } from "@/lib/motion";

type DotProps = {
  status:     AnyStatus;
  hideLabel?: boolean;
  size?:      number;
};

export function Dot({ status, hideLabel, size = 6 }: DotProps) {
  const C  = useC();
  const ST = mkST(C);
  const t  = ST[status];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
      <motion.div
        animate={{ background: t.dot }}
        transition={FADE}
        style={{ width: size, height: size, borderRadius: Math.max(2, size / 3) }}
      />
      {!hideLabel && (
        <span className="mono" style={{ fontSize: 8, color: t.color }}>{t.label}</span>
      )}
    </div>
  );
}
