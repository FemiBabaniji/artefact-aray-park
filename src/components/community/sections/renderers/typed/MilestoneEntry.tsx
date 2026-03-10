"use client";

import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";
import { SPF } from "@/lib/motion";
import type { Block } from "@/types/room";
import type { MilestoneBlockContent } from "@/types/structured-blocks";

type MilestoneEntryProps = {
  block: Block;
  accent?: string;
  layoutId?: string;
  isFirst?: boolean;
  isLast?: boolean;
};

export function MilestoneEntry({ block, accent, layoutId, isFirst, isLast }: MilestoneEntryProps) {
  const C = useC();

  // Extract milestone data from block.metadata
  const data = (block.metadata as MilestoneBlockContent) || {};
  const title = data.title ?? block.content ?? "Milestone";
  const date = data.date ?? "";
  const description = data.description ?? block.caption;
  const type = data.type ?? "achievement";

  // Format date
  const formattedDate = formatDate(date);

  return (
    <motion.div
      layoutId={layoutId}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={SPF}
      style={{
        display: "flex",
        gap: 16,
        position: "relative",
      }}
    >
      {/* Timeline line + dot */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: 16,
          flexShrink: 0,
        }}
      >
        {/* Line above dot */}
        {!isFirst && (
          <div
            style={{
              width: 2,
              height: 24,
              background: C.sep,
            }}
          />
        )}

        {/* Dot */}
        <motion.div
          animate={{ background: accent || C.t3 }}
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            flexShrink: 0,
            border: `2px solid ${C.bg}`,
            boxShadow: `0 0 0 2px ${accent || C.t3}`,
          }}
        />

        {/* Line below dot */}
        {!isLast && (
          <div
            style={{
              width: 2,
              flex: 1,
              minHeight: 24,
              background: C.sep,
            }}
          />
        )}
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          paddingBottom: isLast ? 0 : 32,
        }}
      >
        {/* Date */}
        {formattedDate && (
          <div
            style={{
              fontSize: 10,
              fontWeight: 500,
              color: accent || C.t3,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: 4,
            }}
          >
            {formattedDate}
          </div>
        )}

        {/* Title */}
        <div
          style={{
            fontSize: 15,
            fontWeight: 500,
            color: C.t1,
            marginBottom: description ? 6 : 0,
          }}
        >
          {title}
        </div>

        {/* Description */}
        {description && (
          <div
            style={{
              fontSize: 13,
              color: C.t2,
              lineHeight: 1.5,
            }}
          >
            {description}
          </div>
        )}

        {/* Type badge */}
        {type !== "achievement" && (
          <span
            style={{
              display: "inline-block",
              marginTop: 8,
              fontSize: 9,
              fontWeight: 500,
              color: C.t3,
              background: C.edge,
              padding: "2px 6px",
              borderRadius: 4,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            {type}
          </span>
        )}
      </div>
    </motion.div>
  );
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}
