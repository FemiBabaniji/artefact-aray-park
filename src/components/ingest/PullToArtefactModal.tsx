"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useC } from "@/hooks/useC";
import { FADE } from "@/lib/motion";
import { Btn } from "@/components/primitives/Btn";
import { Lbl } from "@/components/primitives/Lbl";
import { Loader } from "@/components/primitives/Loader";
import type { StandaloneRoom } from "@/types/artefact";

type PullTarget = {
  type: "identity" | "room" | "new_room";
  roomId?: string;
  roomLabel?: string;
};

type PullToArtefactModalProps = {
  content: string;
  sourceLabel?: string;
  rooms: StandaloneRoom[];
  onConfirm: (target: PullTarget, parsedContent: ParsedResult) => void;
  onDismiss: () => void;
};

type ParsedResult = {
  summary: string;
  blocks: Array<{
    type: "text" | "metric" | "project" | "skill" | "experience";
    content: string;
    metadata?: Record<string, unknown>;
  }>;
};

export function PullToArtefactModal({
  content,
  sourceLabel,
  rooms,
  onConfirm,
  onDismiss,
}: PullToArtefactModalProps) {
  const C = useC();
  const [target, setTarget] = useState<PullTarget>({ type: "new_room" });
  const [newRoomLabel, setNewRoomLabel] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParsedResult | null>(null);
  const [showRoomSelector, setShowRoomSelector] = useState(false);

  const preview = content.slice(0, 200) + (content.length > 200 ? "..." : "");

  const handleParse = async () => {
    setIsParsing(true);

    // Simulate LLM parsing (in production, call API)
    await new Promise((r) => setTimeout(r, 1500));

    // Extract basic structure from content
    const lines = content.split("\n").filter((l) => l.trim());
    const summary = lines[0]?.slice(0, 140) || "Extracted content";

    const blocks: ParsedResult["blocks"] = [];

    // Simple extraction heuristics
    if (content.length > 100) {
      blocks.push({
        type: "text",
        content: content.slice(0, 500),
      });
    }

    // Look for metrics (numbers with context)
    const metricMatches = content.match(/\d+(?:,\d{3})*(?:\.\d+)?%?\s*(?:users?|customers?|revenue|mrr|arr|growth)/gi);
    if (metricMatches) {
      metricMatches.slice(0, 3).forEach((match) => {
        blocks.push({
          type: "metric",
          content: match,
        });
      });
    }

    setParsedResult({ summary, blocks });
    setIsParsing(false);
  };

  const handleConfirm = () => {
    if (!parsedResult) return;

    const finalTarget = { ...target };
    if (target.type === "new_room") {
      finalTarget.roomLabel = newRoomLabel || "Imported content";
    }

    onConfirm(finalTarget, parsedResult);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={FADE}
      style={{
        position: "absolute",
        inset: 0,
        background: C.void + "ee",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        backdropFilter: "blur(6px)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={FADE}
        style={{
          background: C.void,
          border: `1px solid ${C.edge}`,
          borderRadius: 12,
          padding: "22px 24px",
          width: 380,
          maxWidth: "90vw",
          maxHeight: "80vh",
          overflow: "auto",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: C.t1,
              marginBottom: 4,
              letterSpacing: "-.01em",
            }}
          >
            Pull to artefact
          </div>
          {sourceLabel && (
            <div style={{ fontSize: 10, color: C.t4, lineHeight: 1.4 }}>
              from: {sourceLabel}
            </div>
          )}
        </div>

        {/* Content preview */}
        <div
          style={{
            marginBottom: 16,
            padding: "12px 14px",
            background: C.sep + "22",
            borderRadius: 8,
            borderLeft: `3px solid ${C.blue}`,
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: C.t2,
              lineHeight: 1.6,
              fontStyle: "italic",
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 4,
              WebkitBoxOrient: "vertical",
            }}
          >
            "{preview}"
          </div>
          <div style={{ marginTop: 8, fontSize: 10, color: C.t4 }}>
            {content.length} characters
          </div>
        </div>

        {/* Parse button / results */}
        <AnimatePresence mode="wait">
          {isParsing ? (
            <motion.div
              key="parsing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ marginBottom: 16 }}
            >
              <Loader cols={40} />
              <div
                style={{
                  fontSize: 10,
                  color: C.t3,
                  textAlign: "center",
                  marginTop: 8,
                }}
              >
                Extracting structured content...
              </div>
            </motion.div>
          ) : parsedResult ? (
            <motion.div
              key="parsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ marginBottom: 16 }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: C.green,
                  marginBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: ".05em",
                }}
              >
                Extracted {parsedResult.blocks.length} block
                {parsedResult.blocks.length !== 1 ? "s" : ""}
              </div>
              {parsedResult.blocks.slice(0, 3).map((block, i) => (
                <div
                  key={i}
                  style={{
                    padding: "8px 10px",
                    background: C.sep + "33",
                    borderRadius: 6,
                    marginBottom: 6,
                  }}
                >
                  <div
                    style={{
                      fontSize: 9,
                      color: C.t4,
                      marginBottom: 2,
                      textTransform: "uppercase",
                    }}
                  >
                    {block.type}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: C.t2,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {block.content.slice(0, 80)}
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="parse-btn"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ marginBottom: 16 }}
            >
              <Btn
                onClick={handleParse}
                accent={C.blue}
                style={{ width: "100%", justifyContent: "center" }}
              >
                Extract structured content
              </Btn>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Target selector */}
        {parsedResult && (
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 10,
                color: C.t4,
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: ".05em",
              }}
            >
              Send to
            </div>

            {/* Target options */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {/* New room option */}
              <motion.button
                onClick={() => setTarget({ type: "new_room" })}
                whileHover={{ background: C.sep }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  background: target.type === "new_room" ? C.sep : "transparent",
                  border: `1px solid ${target.type === "new_room" ? C.edge : C.sep}`,
                  borderRadius: 8,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: target.type === "new_room" ? C.green : C.sep,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: C.t1 }}>New room</div>
                  <div style={{ fontSize: 10, color: C.t4 }}>
                    Create a new room with extracted content
                  </div>
                </div>
              </motion.button>

              {target.type === "new_room" && (
                <input
                  type="text"
                  value={newRoomLabel}
                  onChange={(e) => setNewRoomLabel(e.target.value)}
                  placeholder="Room name (optional)"
                  style={{
                    marginLeft: 18,
                    padding: "8px 12px",
                    background: "transparent",
                    border: `1px solid ${C.sep}`,
                    borderRadius: 6,
                    fontSize: 12,
                    color: C.t1,
                    outline: "none",
                  }}
                />
              )}

              {/* Existing room option */}
              <motion.button
                onClick={() => setShowRoomSelector(!showRoomSelector)}
                whileHover={{ background: C.sep }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  background: target.type === "room" ? C.sep : "transparent",
                  border: `1px solid ${target.type === "room" ? C.edge : C.sep}`,
                  borderRadius: 8,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: target.type === "room" ? C.green : C.sep,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: C.t1 }}>
                    {target.type === "room" && target.roomLabel
                      ? target.roomLabel
                      : "Existing room"}
                  </div>
                  <div style={{ fontSize: 10, color: C.t4 }}>
                    Add to an existing room
                  </div>
                </div>
                <span style={{ fontSize: 10, color: C.t4 }}>
                  {showRoomSelector ? "\u25B2" : "\u25BC"}
                </span>
              </motion.button>

              {showRoomSelector && (
                <div
                  style={{
                    marginLeft: 18,
                    maxHeight: 120,
                    overflow: "auto",
                    border: `1px solid ${C.sep}`,
                    borderRadius: 6,
                  }}
                >
                  {rooms.map((room) => (
                    <motion.button
                      key={room.id}
                      onClick={() => {
                        setTarget({ type: "room", roomId: room.id, roomLabel: room.label });
                        setShowRoomSelector(false);
                      }}
                      whileHover={{ background: C.sep }}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        background: "transparent",
                        border: "none",
                        borderBottom: `1px solid ${C.sep}`,
                        cursor: "pointer",
                        textAlign: "left",
                        fontSize: 12,
                        color: C.t2,
                      }}
                    >
                      {room.label}
                    </motion.button>
                  ))}
                  {rooms.length === 0 && (
                    <div style={{ padding: "8px 12px", fontSize: 11, color: C.t4 }}>
                      No rooms yet
                    </div>
                  )}
                </div>
              )}

              {/* Identity option */}
              <motion.button
                onClick={() => setTarget({ type: "identity" })}
                whileHover={{ background: C.sep }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  background: target.type === "identity" ? C.sep : "transparent",
                  border: `1px solid ${target.type === "identity" ? C.edge : C.sep}`,
                  borderRadius: 8,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: target.type === "identity" ? C.green : C.sep,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: C.t1 }}>Identity</div>
                  <div style={{ fontSize: 10, color: C.t4 }}>
                    Update your profile info
                  </div>
                </div>
              </motion.button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 10,
            paddingTop: 8,
            borderTop: `1px solid ${C.sep}`,
          }}
        >
          <Btn onClick={onDismiss}>cancel</Btn>
          <Btn
            onClick={handleConfirm}
            disabled={!parsedResult}
            accent={parsedResult ? C.green : undefined}
          >
            Pull content
          </Btn>
        </div>
      </motion.div>
    </motion.div>
  );
}
