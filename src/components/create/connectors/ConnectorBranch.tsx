"use client";

import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";

type ConnectorBranchProps = {
  direction: "input" | "output";
  count: number;
  activeIndex: number;
  activeColor: string;
  syncing?: boolean;
  compact?: boolean;
};

export function ConnectorBranch({
  direction,
  count,
  activeIndex,
  activeColor,
  syncing = false,
  compact = false,
}: ConnectorBranchProps) {
  const C = useC();
  const width = compact ? 88 : 120;
  const height = compact ? 170 : 230;
  const centerY = height / 2;
  const startX = direction === "input" ? width : 0;
  const endX = direction === "input" ? 0 : width;
  const trunkX = width / 2;

  const offsets = Array.from({ length: count }, (_, index) => {
    if (count === 1) return centerY;
    return 24 + (index * (height - 48)) / (count - 1);
  });

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible", flexShrink: 0 }}>
      <defs>
        <filter id={`connector-glow-${direction}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {offsets.map((y, index) => {
        const isActive = index === activeIndex;
        const bendA = direction === "input" ? trunkX + 10 : trunkX - 10;
        const bendB = direction === "input" ? trunkX - 12 : trunkX + 12;
        const path = `M ${startX} ${y} H ${bendA} Q ${trunkX} ${y} ${trunkX} ${centerY} Q ${trunkX} ${centerY} ${bendB} ${centerY} H ${endX}`;

        return (
          <motion.path
            key={`${direction}-${index}`}
            d={path}
            fill="none"
            strokeLinecap="round"
            strokeWidth={2}
            filter={isActive ? `url(#connector-glow-${direction})` : undefined}
            initial={{ pathLength: 0 }}
            animate={{
              pathLength: 1,
              stroke: isActive ? activeColor : C.sep,
              opacity: isActive ? 1 : 0.25,
            }}
            transition={{
              pathLength: { duration: 0.75, delay: index * 0.08 },
              stroke: { duration: 0.25 },
              opacity: { duration: 0.25 },
            }}
          />
        );
      })}

      <motion.circle
        r={compact ? 2.5 : 3}
        fill={activeColor}
        filter={`url(#connector-glow-${direction})`}
        initial={{ opacity: 0 }}
        animate={{
          opacity: syncing ? [0, 1, 1, 0] : [0, 1, 1, 0],
          cx: direction === "input" ? [startX, trunkX + 12, trunkX - 12, endX] : [startX, trunkX - 12, trunkX + 12, endX],
          cy: [offsets[activeIndex] ?? centerY, offsets[activeIndex] ?? centerY, centerY, centerY],
        }}
        transition={{
          duration: syncing ? 1.2 : 1.5,
          repeat: Infinity,
          repeatDelay: syncing ? 0.7 : 1.5,
          ease: "easeInOut",
        }}
      />
    </svg>
  );
}
