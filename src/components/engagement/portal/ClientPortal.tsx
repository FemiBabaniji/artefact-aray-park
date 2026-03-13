"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useC } from "@/hooks/useC";
import type { Engagement, EngagementRoom, EngagementBlock } from "@/types/engagement";
import { getPhaseLabel } from "@/types/engagement";
import { BlockRenderer } from "./BlockRenderer";

type ClientPortalProps = {
  engagement: Engagement & {
    client?: { id: string; name: string; logoUrl?: string } | null;
  };
  rooms: EngagementRoom[];
  lastViewedAt?: string;
};

export function ClientPortal({ engagement, rooms, lastViewedAt }: ClientPortalProps) {
  const C = useC();
  const [activeTab, setActiveTab] = useState(rooms[0]?.key ?? "");
  const [mounted, setMounted] = useState(false);

  // Set mounted after hydration to avoid SSR/client mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const activeRoom = rooms.find((r) => r.key === activeTab);

  // Format relative time (only calculate on client after hydration)
  const formatRelativeTime = (dateStr: string): string => {
    if (!mounted) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "today";
    if (diffDays === 1) return "yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  // Check if block is new (added since last viewed)
  const isBlockNew = (block: EngagementBlock): boolean => {
    if (!lastViewedAt) return false;
    return new Date(block.createdAt) > new Date(lastViewedAt);
  };

  // Count new blocks in a room
  const getNewBlockCount = (room: EngagementRoom): number => {
    if (!lastViewedAt) return 0;
    return room.blocks.filter((b) => isBlockNew(b)).length;
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.void,
        color: C.t1,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header Band */}
      <div
        style={{
          background: C.bg,
          borderBottom: `1px solid ${C.sep}`,
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "28px 40px",
          }}
        >
          {/* Top row: Logo + Name */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {engagement.client?.logoUrl && (
              <img
                src={engagement.client.logoUrl}
                alt=""
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 10,
                  objectFit: "cover",
                  border: `1px solid ${C.sep}`,
                }}
              />
            )}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: C.t4,
                  textTransform: "uppercase",
                  letterSpacing: ".08em",
                  marginBottom: 4,
                }}
              >
                Client Portal
              </div>
              <h1
                style={{
                  fontSize: 24,
                  fontWeight: 600,
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                {engagement.name}
              </h1>
            </div>
          </div>

          {/* Meta row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginTop: 16,
              fontSize: 13,
              color: C.t3,
            }}
          >
            {engagement.client?.name && (
              <span>with {engagement.client.name}</span>
            )}
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 12px",
                background: `${C.blue}15`,
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 500,
                color: C.blue,
              }}
            >
              {getPhaseLabel(engagement.phase)}
            </span>
            {engagement.updatedAt && (
              <span>Last updated {formatRelativeTime(engagement.updatedAt)}</span>
            )}
          </div>
        </div>

        {/* Tab Bar */}
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "0 40px",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 0,
              borderBottom: "none",
            }}
          >
            {rooms.map((room) => {
              const isActive = room.key === activeTab;
              const newCount = getNewBlockCount(room);

              return (
                <button
                  key={room.key}
                  onClick={() => setActiveTab(room.key)}
                  style={{
                    position: "relative",
                    padding: "14px 24px",
                    background: "transparent",
                    border: "none",
                    borderBottom: `2px solid ${isActive ? C.blue : "transparent"}`,
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? C.t1 : C.t3,
                    transition: "all .15s",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {room.label}
                  {newCount > 0 && (
                    <span
                      style={{
                        padding: "2px 6px",
                        background: C.amber,
                        borderRadius: 10,
                        fontSize: 10,
                        fontWeight: 600,
                        color: "#fff",
                      }}
                    >
                      {newCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div
        style={{
          flex: 1,
          maxWidth: 1100,
          margin: "0 auto",
          padding: "32px 40px",
          width: "100%",
        }}
      >
        <AnimatePresence mode="wait">
          {activeRoom && (
            <motion.div
              key={activeRoom.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {/* Room Header */}
              {activeRoom.prompt && (
                <div
                  style={{
                    marginBottom: 24,
                    padding: "16px 20px",
                    background: C.bg,
                    borderRadius: 8,
                    border: `1px solid ${C.sep}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      color: C.t3,
                      lineHeight: 1.5,
                    }}
                  >
                    {activeRoom.prompt}
                  </div>
                </div>
              )}

              {/* Blocks */}
              {activeRoom.blocks.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {activeRoom.blocks
                    .sort((a, b) => a.orderIndex - b.orderIndex)
                    .map((block) => (
                      <BlockRenderer
                        key={block.id}
                        block={block}
                        isNew={isBlockNew(block)}
                      />
                    ))}
                </div>
              ) : (
                <div
                  style={{
                    padding: "64px 24px",
                    textAlign: "center",
                    color: C.t4,
                  }}
                >
                  <div style={{ fontSize: 14, marginBottom: 8 }}>
                    No content yet
                  </div>
                  <div style={{ fontSize: 13 }}>
                    Your consultant will add content to this room soon.
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "16px 40px",
          borderTop: `1px solid ${C.sep}`,
          textAlign: "center",
          fontSize: 11,
          color: C.t4,
          background: C.bg,
        }}
      >
        Powered by Consulting OS
      </div>
    </div>
  );
}
