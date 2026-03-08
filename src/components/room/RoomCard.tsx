"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useC } from "@/hooks/useC";
import { Lbl } from "@/components/primitives/Lbl";
import { Dot } from "@/components/primitives/Dot";
import { BlockComposer } from "./BlockComposer";
import type { RoomV2, Block, Pace, RoomStatusV2 } from "@/types/room";
import type { ArtefactRole } from "@/types/member";

const SP = { type: "spring", stiffness: 300, damping: 30 } as const;

type RoomCardProps = {
  room: RoomV2;
  role: ArtefactRole;
  onUpdate: (updates: Partial<RoomV2>) => void;
  isActive?: boolean;
  onActivate?: () => void;
};

export function RoomCard({
  room,
  role,
  onUpdate,
  isActive = false,
  onActivate,
}: RoomCardProps) {
  const C = useC();
  const [feedbackText, setFeedbackText] = useState("");

  const paceColors: Record<Pace, string> = {
    foundation: C.green,
    development: C.blue,
    ongoing: C.t3,
  };

  const handleBlocksChange = (blocks: Block[]) => {
    onUpdate({
      blocks,
      status: blocks.length > 0 ? "active" : "empty",
    });
  };

  const handleSubmit = () => {
    if (room.pace === "ongoing") return; // Ongoing rooms don't submit
    onUpdate({ status: "submitted" });
  };

  const handleFeedback = (decision: "feedback" | "complete") => {
    onUpdate({
      status: decision,
      feedback: feedbackText,
      feedbackAt: new Date().toISOString(),
    });
    setFeedbackText("");
  };

  return (
    <motion.div
      layout
      transition={SP}
      onClick={onActivate}
      style={{
        flex: isActive ? 3 : 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        borderBottom: `1px solid ${C.sep}`,
        cursor: onActivate ? "pointer" : "default",
        overflow: "hidden",
      }}
    >
      {/* Header - always visible */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Lbl style={{ fontSize: 10 }}>{room.label}</Lbl>
          <span
            className="mono"
            style={{
              fontSize: 8,
              padding: "2px 5px",
              borderRadius: 3,
              background: paceColors[room.pace] + "20",
              color: paceColors[room.pace],
              textTransform: "uppercase",
            }}
          >
            {room.pace}
          </span>
        </div>
        <Dot status={room.status as RoomStatusV2} />
      </div>

      {/* Expanded content */}
      <AnimatePresence mode="wait">
        {isActive ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              flex: 1,
              overflow: "auto",
              padding: "0 14px 14px",
              minHeight: 0,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Member view - BlockComposer */}
            {role === "member" && (
              <>
                <BlockComposer
                  blocks={room.blocks || []}
                  purpose={room.purpose}
                  onChange={handleBlocksChange}
                  onSubmit={room.pace !== "ongoing" ? handleSubmit : undefined}
                  readOnly={room.status === "submitted"}
                />

                {/* Feedback from mentor */}
                {room.feedback && (
                  <div
                    style={{
                      marginTop: 12,
                      padding: 10,
                      background:
                        room.status === "feedback"
                          ? C.amber + "10"
                          : C.green + "10",
                      borderLeft: `2px solid ${
                        room.status === "feedback" ? C.amber : C.green
                      }`,
                      borderRadius: 4,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        color:
                          room.status === "feedback" ? C.amber : C.green,
                        marginBottom: 4,
                        fontWeight: 500,
                      }}
                    >
                      {room.status === "feedback"
                        ? "Needs revision"
                        : "Approved"}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: C.t2,
                        lineHeight: 1.5,
                        fontStyle: "italic",
                      }}
                    >
                      {room.feedback}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Mentor view - read-only blocks + feedback input */}
            {role === "mentor" && (
              <>
                <BlockComposer
                  blocks={room.blocks || []}
                  purpose={room.purpose}
                  onChange={() => {}}
                  readOnly
                />

                {room.status === "submitted" && (
                  <div
                    style={{
                      marginTop: 16,
                      paddingTop: 12,
                      borderTop: `1px solid ${C.sep}`,
                    }}
                  >
                    <textarea
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Write feedback..."
                      style={{
                        width: "100%",
                        padding: 10,
                        fontSize: 12,
                        color: C.t1,
                        background: C.edge + "30",
                        border: "none",
                        borderRadius: 4,
                        outline: "none",
                        resize: "vertical",
                        minHeight: 60,
                        lineHeight: 1.5,
                      }}
                    />
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        marginTop: 8,
                        justifyContent: "flex-end",
                      }}
                    >
                      <button
                        onClick={() => handleFeedback("feedback")}
                        style={{
                          padding: "6px 12px",
                          fontSize: 11,
                          color: C.amber,
                          background: C.amber + "15",
                          border: "none",
                          borderRadius: 4,
                          cursor: "pointer",
                        }}
                      >
                        Needs revision
                      </button>
                      <button
                        onClick={() => handleFeedback("complete")}
                        style={{
                          padding: "6px 12px",
                          fontSize: 11,
                          color: C.green,
                          background: C.green + "15",
                          border: "none",
                          borderRadius: 4,
                          cursor: "pointer",
                        }}
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Admin view - summary */}
            {role === "admin" && (
              <div>
                <p style={{ fontSize: 12, color: C.t3, margin: 0 }}>
                  {room.purpose}
                </p>
                {room.blocks && room.blocks.length > 0 && (
                  <div
                    style={{ marginTop: 10, fontSize: 11, color: C.t4 }}
                  >
                    {room.blocks.length} block
                    {room.blocks.length !== 1 ? "s" : ""} added
                  </div>
                )}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            style={{
              padding: "0 14px 10px",
              fontSize: 11,
              color: C.t4,
              lineHeight: 1.4,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {room.blocks && room.blocks.length > 0
              ? `${room.blocks.length} block${room.blocks.length !== 1 ? "s" : ""}`
              : room.purpose?.slice(0, 50) || "..."}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
