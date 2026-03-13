"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";

type FeaturedStarProps = {
  engagementId: string;
  roomKey: string;
  blockId: string;
  featured: boolean;
  onToggle: () => void;
};

export function FeaturedStar({
  engagementId,
  roomKey,
  blockId,
  featured,
  onToggle,
}: FeaturedStarProps) {
  const C = useC();
  const [loading, setLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (loading) return;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/engagements/${engagementId}/rooms/${roomKey}/blocks/${blockId}/feature`,
        { method: "POST" }
      );
      if (res.ok) {
        onToggle();
      }
    } catch (err) {
      console.error("Failed to toggle featured:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      <motion.button
        whileTap={{ scale: 0.85 }}
        animate={{ scale: loading ? 0.9 : 1 }}
        onClick={handleClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        disabled={loading}
        style={{
          background: "transparent",
          border: "none",
          padding: 4,
          cursor: loading ? "wait" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: loading ? 0.6 : 1,
        }}
        aria-label={featured ? "Remove from featured" : "Set as featured"}
      >
        {featured ? (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill={C.amber}
            stroke={C.amber}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        ) : (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke={C.t3}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        )}
      </motion.button>

      {showTooltip && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          style={{
            position: "absolute",
            bottom: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            marginBottom: 6,
            padding: "6px 10px",
            background: C.edge,
            borderRadius: 6,
            fontSize: 11,
            color: C.t2,
            whiteSpace: "nowrap",
            pointerEvents: "none",
            zIndex: 100,
          }}
        >
          This is the headline block for this room - appears in pitch decks and summaries
        </motion.div>
      )}
    </div>
  );
}
