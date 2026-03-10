"use client";

import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";
import { Lbl } from "@/components/primitives/Lbl";
import type { CohortProgressMap as CohortProgressMapType } from "@/types/community";

type CohortProgressMapProps = {
  progressMap: CohortProgressMapType;
};

export function CohortProgressMap({ progressMap }: CohortProgressMapProps) {
  const C = useC();

  if (progressMap.rooms.length === 0) return null;

  return (
    <div style={{
      background: C.void,
      border: `1px solid ${C.edge}`,
      borderRadius: 12,
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 20px",
        borderBottom: `1px solid ${C.sep}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Lbl>cohort progress map</Lbl>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: C.green }} />
            <span style={{ fontSize: 10, color: C.t3 }}>Complete</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: C.amber }} />
            <span style={{ fontSize: 10, color: C.t3 }}>In Progress</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: C.sep }} />
            <span style={{ fontSize: 10, color: C.t3 }}>Empty</span>
          </div>
        </div>
      </div>

      {/* Progress Bars */}
      <div style={{ padding: 20 }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "100px 1fr 60px",
          gap: "16px 12px",
          alignItems: "center",
        }}>
          {progressMap.rooms.map((room, index) => {
            const completePct = (room.completedCount / room.totalMembers) * 100;
            const inProgressPct = (room.inProgressCount / room.totalMembers) * 100;
            const emptyPct = (room.emptyCount / room.totalMembers) * 100;

            // Determine status indicator
            let statusIndicator = "\u2713"; // checkmark
            let statusColor = C.green;
            if (completePct < 50) {
              statusIndicator = "\u26A0"; // warning
              statusColor = C.amber;
            }
            if (completePct < 20 && emptyPct > 50) {
              statusIndicator = "\u23F3"; // hourglass
              statusColor = C.t4;
            }

            return (
              <motion.div
                key={room.key}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                style={{ display: "contents" }}
              >
                {/* Room Label */}
                <div style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: C.t1,
                }}>
                  {room.label}
                </div>

                {/* Stacked Progress Bar */}
                <div style={{
                  height: 20,
                  background: C.sep,
                  borderRadius: 4,
                  overflow: "hidden",
                  display: "flex",
                }}>
                  {/* Complete segment */}
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${completePct}%` }}
                    transition={{ duration: 0.6, delay: index * 0.05 }}
                    style={{
                      height: "100%",
                      background: C.green,
                    }}
                  />
                  {/* In Progress segment */}
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${inProgressPct}%` }}
                    transition={{ duration: 0.6, delay: index * 0.05 + 0.1 }}
                    style={{
                      height: "100%",
                      background: C.amber,
                    }}
                  />
                  {/* Empty is the remaining space (handled by background) */}
                </div>

                {/* Status indicator */}
                <div style={{
                  fontSize: 14,
                  color: statusColor,
                  textAlign: "center",
                }}>
                  {statusIndicator}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
