"use client";

import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";
import { formatRelativeTime } from "@/lib/data/community";
import type { ActivityItem, ActivityAction } from "@/types/community";

type ActivityFeedProps = {
  activity: ActivityItem[];
  maxItems?: number;
};

const ACTION_LABELS: Record<ActivityAction, string> = {
  added: "added",
  updated: "updated",
  uploaded: "uploaded",
  submitted: "submitted",
  completed: "completed",
};

export function ActivityFeed({ activity, maxItems = 10 }: ActivityFeedProps) {
  const C = useC();
  const items = activity.slice(0, maxItems);

  return (
    <div style={{
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 16px",
        borderBottom: `1px solid ${C.sep}`,
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}>
        <div style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: C.green,
          animation: "pulse 2s ease-in-out infinite",
        }} />
        <span style={{ fontSize: 11, color: C.t3 }}>Live</span>
      </div>

      {/* Activity List */}
      <div style={{ maxHeight: 440, overflow: "auto" }}>
        {items.length === 0 ? (
          <div style={{
            padding: 24,
            textAlign: "center",
            color: C.t3,
            fontSize: 12,
          }}>
            No recent activity
          </div>
        ) : (
          items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              style={{
                padding: "12px 16px",
                borderBottom: `1px solid ${C.sep}`,
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
              }}
            >
              {/* Timeline dot */}
              <div style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: C.t4,
                marginTop: 6,
                flexShrink: 0,
              }} />

              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Activity text */}
                <div style={{
                  fontSize: 12,
                  color: C.t2,
                  lineHeight: 1.5,
                }}>
                  <span style={{ fontWeight: 500, color: C.t1 }}>
                    {item.memberName}
                  </span>
                  {" "}
                  {ACTION_LABELS[item.action]}
                  {" "}
                  <span style={{ color: C.t1 }}>
                    {item.target}
                  </span>
                </div>

                {/* Timestamp */}
                <div style={{
                  fontSize: 10,
                  color: C.t4,
                  marginTop: 2,
                  fontFamily: "'DM Mono', monospace",
                }}>
                  {formatRelativeTime(item.timestamp)}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
