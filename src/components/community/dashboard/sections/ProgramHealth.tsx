"use client";

import { motion } from "framer-motion";
import type { useC } from "@/hooks/useC";

type ProgramHealthProps = {
  memberCount: number;
  progressing: number;
  needsSupport: number;
  completionPercentage: number;
  C: ReturnType<typeof useC>;
};

export function ProgramHealth({
  memberCount,
  progressing,
  needsSupport,
  completionPercentage,
  C,
}: ProgramHealthProps) {
  // Determine momentum status
  const momentum = completionPercentage >= 60 ? "strong" : completionPercentage >= 30 ? "steady" : "building";
  const momentumColor = momentum === "strong" ? C.green : momentum === "steady" ? C.blue : C.amber;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        background: C.bg,
        borderRadius: 12,
        padding: "24px 28px",
      }}
    >
      {/* Section Label */}
      <div style={{
        fontSize: 10,
        fontWeight: 600,
        color: C.t4,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        marginBottom: 20,
      }}>
        Cohort Health
      </div>

      {/* Stats Row */}
      <div style={{
        display: "flex",
        alignItems: "baseline",
        gap: 32,
        marginBottom: 24,
      }}>
        <Stat value={memberCount} label="founders" C={C} />
        <Stat value={progressing} label="progressing" color={C.blue} C={C} />
        {needsSupport > 0 && (
          <Stat value={needsSupport} label="need support" color={C.amber} C={C} />
        )}
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: 16 }}>
        <div style={{
          height: 8,
          background: C.sep,
          borderRadius: 4,
          overflow: "hidden",
        }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionPercentage}%` }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
            style={{
              height: "100%",
              background: C.green,
              borderRadius: 4,
            }}
          />
        </div>
      </div>

      {/* Momentum indicator */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <span style={{
          fontSize: 12,
          color: C.t3,
        }}>
          {completionPercentage}% rooms completed
        </span>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}>
          <div style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: momentumColor,
          }} />
          <span style={{
            fontSize: 11,
            color: momentumColor,
            fontWeight: 500,
          }}>
            Momentum: {momentum}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function Stat({
  value,
  label,
  color,
  C,
}: {
  value: number;
  label: string;
  color?: string;
  C: ReturnType<typeof useC>;
}) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
      <span style={{
        fontSize: 28,
        fontWeight: 300,
        color: color || C.t1,
        letterSpacing: "-0.03em",
        lineHeight: 1,
      }}>
        {value}
      </span>
      <span style={{
        fontSize: 12,
        color: color || C.t3,
      }}>
        {label}
      </span>
    </div>
  );
}
