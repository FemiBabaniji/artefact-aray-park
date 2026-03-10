"use client";

import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";
import { SPF } from "@/lib/motion";
import type { Block } from "@/types/room";
import type { MetricBlockContent } from "@/types/structured-blocks";

type MetricCardProps = {
  block: Block;
  accent?: string;
  layoutId?: string;
};

export function MetricCard({ block, accent, layoutId }: MetricCardProps) {
  const C = useC();

  // Extract metric data from block.metadata or content
  const data = (block.metadata as MetricBlockContent) || {};
  const value = data.value ?? block.content ?? "0";
  const label = data.label ?? block.caption ?? "Metric";
  const unit = data.unit;
  const change = data.change;
  const format = data.format || "number";

  // Format the value
  const formattedValue = formatValue(value, format, unit);

  return (
    <motion.div
      layoutId={layoutId}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={SPF}
      style={{
        padding: "24px",
        background: C.bg,
        borderRadius: 12,
        border: `1px solid ${C.sep}`,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {/* Value */}
      <div
        style={{
          fontSize: 32,
          fontWeight: 600,
          color: C.t1,
          letterSpacing: "-0.02em",
          lineHeight: 1,
        }}
      >
        {formattedValue}
      </div>

      {/* Label + Change */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span
          style={{
            fontSize: 13,
            color: C.t3,
          }}
        >
          {label}
        </span>

        {change !== undefined && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: change >= 0 ? C.green : "#ef4444",
              background: change >= 0 ? `${C.green}15` : "#ef444415",
              padding: "2px 6px",
              borderRadius: 4,
            }}
          >
            {change >= 0 ? "+" : ""}{change}%
          </span>
        )}
      </div>

      {/* Period */}
      {data.period && (
        <span
          style={{
            fontSize: 10,
            color: C.t4,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {data.period}
        </span>
      )}
    </motion.div>
  );
}

function formatValue(value: number | string, format: string, unit?: string): string {
  if (typeof value === "string") return value;

  switch (format) {
    case "currency":
      return `$${value.toLocaleString()}`;
    case "percent":
      return `${value}%`;
    default:
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M${unit ? ` ${unit}` : ""}`;
      }
      if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K${unit ? ` ${unit}` : ""}`;
      }
      return `${value.toLocaleString()}${unit ? ` ${unit}` : ""}`;
  }
}
