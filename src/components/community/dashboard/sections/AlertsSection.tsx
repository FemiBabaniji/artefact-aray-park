"use client";

import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";
import type { Alert, AlertType } from "@/types/community";

type AlertsSectionProps = {
  alerts: Alert[];
  onAlertClick?: (alert: Alert) => void;
};

const ALERT_GROUPS: { type: AlertType; label: string }[] = [
  { type: "inactive", label: "Inactive members" },
  { type: "missing_room", label: "Missing rooms" },
  { type: "incomplete_profile", label: "Incomplete profiles" },
  { type: "deadline", label: "Approaching deadlines" },
];

export function AlertsSection({ alerts, onAlertClick }: AlertsSectionProps) {
  const C = useC();

  // Group alerts by type
  const groupedAlerts = ALERT_GROUPS.map(group => ({
    ...group,
    alerts: alerts.filter(a => a.type === group.type),
  })).filter(g => g.alerts.length > 0);

  if (alerts.length === 0) return null;

  const criticalCount = alerts.filter(a => a.severity === "critical").length;

  return (
    <div style={{
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 20px",
        borderBottom: `1px solid ${C.sep}`,
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}>
        <div style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: criticalCount > 0 ? "#ef4444" : C.amber,
        }} />
        <span style={{
          fontSize: 12,
          color: criticalCount > 0 ? "#ef4444" : C.amber,
          fontWeight: 500,
        }}>
          {alerts.length} {alerts.length === 1 ? "alert" : "alerts"}
        </span>
      </div>

      {/* Alert Groups */}
      <div style={{ padding: "12px 20px" }}>
        {groupedAlerts.map((group, groupIndex) => (
          <div
            key={group.type}
            style={{
              marginBottom: groupIndex < groupedAlerts.length - 1 ? 16 : 0,
            }}
          >
            {/* Group Header */}
            <div style={{
              fontSize: 11,
              fontWeight: 500,
              color: C.t3,
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}>
              {group.alerts.length} {group.label.toLowerCase()}
            </div>

            {/* Alert Items */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {group.alerts.map((alert, index) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => onAlertClick?.(alert)}
                  whileHover={{ background: C.edge }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 12px",
                    background: C.void,
                    border: `1px solid ${alert.severity === "critical" ? "#ef444433" : C.sep}`,
                    borderRadius: 8,
                    cursor: onAlertClick ? "pointer" : "default",
                  }}
                >
                  {/* Severity indicator */}
                  <div style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: alert.severity === "critical" ? "#ef4444" : C.amber,
                  }} />

                  {/* Member name */}
                  <span style={{
                    fontSize: 12,
                    color: C.t1,
                    fontWeight: 500,
                  }}>
                    {alert.memberName}
                  </span>

                  {/* Alert detail */}
                  {alert.daysInactive && (
                    <span style={{
                      fontSize: 10,
                      color: C.t4,
                      fontFamily: "'DM Mono', monospace",
                    }}>
                      {alert.daysInactive}d
                    </span>
                  )}
                  {alert.roomKey && (
                    <span style={{
                      fontSize: 10,
                      color: C.t4,
                      fontFamily: "'DM Mono', monospace",
                    }}>
                      {alert.roomKey}
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
