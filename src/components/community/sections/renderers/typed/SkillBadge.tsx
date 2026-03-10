"use client";

import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";
import { SPF } from "@/lib/motion";
import type { Block } from "@/types/room";
import type { SkillBlockContent } from "@/types/structured-blocks";

type SkillBadgeProps = {
  block: Block;
  accent?: string;
  layoutId?: string;
  variant?: "badge" | "card";
};

export function SkillBadge({ block, accent, layoutId, variant = "badge" }: SkillBadgeProps) {
  const C = useC();

  // Extract skill data from block.metadata
  const data = (block.metadata as SkillBlockContent) || {};
  const name = data.name ?? block.content ?? "Skill";
  const level = data.level;
  const years = data.years;
  const category = data.category;

  const levelColors: Record<string, string> = {
    beginner: C.t4,
    intermediate: C.blue,
    advanced: C.green,
    expert: accent || C.amber,
  };

  const levelColor = level ? levelColors[level] || C.t3 : C.t3;

  if (variant === "card") {
    return (
      <motion.div
        layoutId={layoutId}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={SPF}
        style={{
          padding: "16px 20px",
          background: C.bg,
          borderRadius: 10,
          border: `1px solid ${C.sep}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: C.t1,
            }}
          >
            {name}
          </div>
          {category && (
            <div
              style={{
                fontSize: 11,
                color: C.t3,
                marginTop: 2,
              }}
            >
              {category}
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {years && (
            <span
              style={{
                fontSize: 11,
                color: C.t3,
              }}
            >
              {years}y
            </span>
          )}
          {level && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 500,
                color: levelColor,
                background: `${levelColor}15`,
                padding: "3px 8px",
                borderRadius: 4,
                textTransform: "capitalize",
              }}
            >
              {level}
            </span>
          )}
        </div>
      </motion.div>
    );
  }

  // Badge variant
  return (
    <motion.span
      layoutId={layoutId}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={SPF}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 12px",
        background: C.edge,
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 500,
        color: C.t2,
        borderLeft: level ? `3px solid ${levelColor}` : undefined,
      }}
    >
      {name}
      {years && (
        <span style={{ fontSize: 10, color: C.t4 }}>
          {years}y
        </span>
      )}
    </motion.span>
  );
}
