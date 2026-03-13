"use client";

import { useC } from "@/hooks/useC";
import type { QueuedItem } from "./types";

type IngestionQueueProps = {
  queue: QueuedItem[];
  rooms: { id: string; name: string }[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onRetarget: (id: string, roomId: string) => void;
};

export function IngestionQueue({ queue, rooms, onApprove, onReject, onRetarget }: IngestionQueueProps) {
  const C = useC();
  const pending = queue.filter((item) => item.status === "pending");
  const visibleItems = pending.slice(0, 2);

  return (
    <div
      style={{
        border: `1px solid ${C.sep}`,
        borderRadius: 16,
        overflow: "hidden",
        background: C.bg,
      }}
    >
      <div
        style={{
          padding: "14px 16px",
          borderBottom: `1px solid ${C.sep}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: ".08em", textTransform: "uppercase", color: C.t4 }}>
          Queue
        </div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: pending.length ? C.blue : C.t4 }}>
          {pending.length} new
        </div>
      </div>

      {pending.length === 0 ? (
        <div style={{ padding: "18px 16px", fontSize: 12, color: C.t4 }}>No queued items.</div>
      ) : (
        visibleItems.map((item, index) => (
          <div
            key={item.id}
            style={{
              padding: "14px 16px",
              borderBottom: index < visibleItems.length - 1 ? `1px solid ${C.sep}` : "none",
              display: "grid",
              gap: 8,
            }}
          >
            <div style={{ fontSize: 13, color: C.t1 }}>{item.preview}</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.t4 }}>
              → {item.suggestedRoom} · {item.suggestedType} · {item.meta}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <button
                onClick={() => onApprove(item.id)}
                style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.blue, background: "none", border: "none", padding: 0 }}
              >
                Accept
              </button>
              <button
                onClick={() => onReject(item.id)}
                style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.t4, background: "none", border: "none", padding: 0 }}
              >
                Reject
              </button>
              <label style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.t4, display: "flex", alignItems: "center", gap: 6 }}>
                Edit room
                <select
                  value={item.suggestedRoom}
                  onChange={(event) => onRetarget(item.id, event.target.value)}
                  style={{
                    background: "transparent",
                    color: C.t3,
                    border: `1px solid ${C.sep}`,
                    borderRadius: 6,
                    fontSize: 10,
                    padding: "4px 6px",
                  }}
                >
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.id}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        ))
      )}

      {pending.length > visibleItems.length && (
        <div
          style={{
            padding: "12px 16px",
            borderTop: `1px solid ${C.sep}`,
            fontFamily: "'DM Mono', monospace",
            fontSize: 10,
            color: C.t4,
          }}
        >
          +{pending.length - visibleItems.length} more in queue
        </div>
      )}
    </div>
  );
}
