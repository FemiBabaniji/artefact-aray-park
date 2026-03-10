"use client";

import { motion } from "framer-motion";
import type { RoomSchema } from "@/types/community";
import type { useC } from "@/hooks/useC";

type MomentumData = {
  week: string;
  completions: number;
  total: number;
};

type CohortMomentumProps = {
  data: MomentumData[];
  rooms: RoomSchema[];
  C: ReturnType<typeof useC>;
};

export function CohortMomentum({ data, rooms, C }: CohortMomentumProps) {
  const maxCompletions = Math.max(...data.map(d => d.completions), 1);

  // Calculate trend (accelerating vs stalling)
  const recentAvg = data.slice(-2).reduce((a, d) => a + d.completions, 0) / 2;
  const earlierAvg = data.slice(0, 2).reduce((a, d) => a + d.completions, 0) / 2;
  const trend = recentAvg > earlierAvg ? "accelerating" : recentAvg < earlierAvg ? "slowing" : "steady";

  const trendColor = trend === "accelerating" ? C.green : trend === "slowing" ? C.amber : C.t3;
  const trendLabel = trend === "accelerating" ? "Accelerating" : trend === "slowing" ? "Slowing" : "Steady";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      style={{
        background: C.bg,
        borderRadius: 12,
        padding: "16px 20px",
      }}
    >
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
      }}>
        <div style={{
          fontSize: 10,
          fontWeight: 600,
          color: C.t4,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}>
          Cohort Momentum
        </div>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}>
          <div style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: trendColor,
          }} />
          <span style={{
            fontSize: 11,
            color: trendColor,
            fontWeight: 500,
          }}>
            {trendLabel}
          </span>
        </div>
      </div>

      {/* Timeline bars */}
      <div style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 8,
        height: 48,
      }}>
        {data.map((week, i) => {
          const heightPct = (week.completions / maxCompletions) * 100;

          return (
            <motion.div
              key={week.week}
              initial={{ height: 0 }}
              animate={{ height: `${heightPct}%` }}
              transition={{ delay: i * 0.05, duration: 0.4, ease: "easeOut" }}
              style={{
                flex: 1,
                minHeight: 4,
                background: C.blue,
                borderRadius: 3,
                position: "relative",
              }}
            >
              {/* Tooltip on hover */}
              <motion.div
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                style={{
                  position: "absolute",
                  bottom: "100%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  marginBottom: 4,
                  padding: "4px 8px",
                  background: C.void,
                  border: `1px solid ${C.edge}`,
                  borderRadius: 4,
                  fontSize: 10,
                  color: C.t2,
                  whiteSpace: "nowrap",
                  pointerEvents: "none",
                }}
              >
                {week.completions} rooms
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* Week labels */}
      <div style={{
        display: "flex",
        gap: 8,
        marginTop: 8,
      }}>
        {data.map((week) => (
          <div
            key={week.week}
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: 9,
              color: C.t4,
              fontFamily: "'DM Mono', monospace",
            }}
          >
            {week.week}
          </div>
        ))}
      </div>

      {/* Room breakdown hint */}
      {rooms.length > 0 && (
        <div style={{
          marginTop: 12,
          paddingTop: 12,
          borderTop: `1px solid ${C.sep}`,
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
        }}>
          {rooms.slice(0, 4).map((room, i) => (
            <div
              key={room.key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <div style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                background: i === 0 ? C.green : i === 1 ? C.blue : i === 2 ? C.amber : C.t4,
                opacity: 0.6,
              }} />
              <span style={{
                fontSize: 9,
                color: C.t3,
              }}>
                {room.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
