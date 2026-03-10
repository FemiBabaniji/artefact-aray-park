"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useC } from "@/hooks/useC";
import { FADE, SP } from "@/lib/motion";
import { useGuestArtefactContext } from "@/context/GuestArtefactContext";
import { Lbl } from "@/components/primitives/Lbl";
import { Btn } from "@/components/primitives/Btn";

type WorkspaceCardProps = {
  expanded: boolean;
  onToggle: () => void;
};

export function WorkspaceCard({ expanded, onToggle }: WorkspaceCardProps) {
  const C = useC();
  const { state, getRoomBlockCount } = useGuestArtefactContext();
  const [content, setContent] = useState("");
  const editorRef = useRef<HTMLDivElement>(null);

  const blockCount = getRoomBlockCount();
  const roomsWithContent = state.rooms.filter((r) => r.blocks.length > 0).length;

  const W = expanded ? "min(56vw, 54vh)" : "158px";
  const H = expanded ? "min(72vh, 70vw)" : "136px";

  // Preview text for collapsed state
  const plain = content.replace(/<[^>]+>/g, "").trim();
  const words = plain.split(/\s+/).filter(Boolean);
  const preview = words.slice(0, 12).join(" ") + (words.length > 12 ? "..." : "");
  const hasContent = plain.length > 0;

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 5,
        flexShrink: 0,
      }}
    >
      <motion.div
        onClick={!expanded ? onToggle : undefined}
        animate={{
          width: W,
          height: H,
          borderColor: C.edge,
          background: C.void,
        }}
        transition={SP}
        style={{
          border: `1px solid ${C.edge}`,
          borderRadius: 12,
          overflow: "hidden",
          flexShrink: 0,
          position: "relative",
          cursor: expanded ? "default" : "pointer",
        }}
      >
        <AnimatePresence mode="wait">
          {!expanded ? (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={FADE}
              style={{ height: "100%" }}
            >
              {/* Compact header */}
              <div
                style={{
                  padding: "9px 16px 7px",
                  borderBottom: `1px solid ${C.sep}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Lbl>workspace</Lbl>
              </div>

              {/* Compact body */}
              <div
                style={{
                  padding: "10px 16px 12px",
                  height: "calc(100% - 32px)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 9,
                }}
              >
                {/* Room dots */}
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {state.rooms.map((room) => (
                    <div
                      key={room.id}
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 2,
                        background: room.blocks.length > 0 ? C.green : C.sep,
                      }}
                    />
                  ))}
                </div>

                {hasContent ? (
                  <>
                    <div
                      style={{
                        flex: 1,
                        fontSize: 11,
                        color: C.t3,
                        lineHeight: 1.55,
                        overflow: "hidden",
                      }}
                    >
                      {preview}
                    </div>
                    <Btn onClick={onToggle} style={{ textAlign: "left" }}>
                      ↓ open
                    </Btn>
                  </>
                ) : (
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      justifyContent: "center",
                    }}
                  >
                    <div style={{ fontSize: 11, color: C.t4, lineHeight: 1.6 }}>
                      Write freely — notes for your artefact.
                    </div>
                    <motion.div
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <Btn
                        onClick={onToggle}
                        style={{ textAlign: "left", color: C.t2 }}
                      >
                        ↓ open to begin
                      </Btn>
                    </motion.div>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={FADE}
              style={{ height: "100%", display: "flex", flexDirection: "column" }}
            >
              {/* Expanded header */}
              <div
                style={{
                  padding: "12px 16px",
                  borderBottom: `1px solid ${C.sep}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Lbl>workspace</Lbl>
                <Btn onClick={onToggle} style={{ color: C.t3 }}>
                  ↑ collapse
                </Btn>
              </div>

              {/* Expanded body */}
              <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
                <div
                  ref={editorRef}
                  contentEditable
                  onInput={handleInput}
                  data-ph="Write your notes here..."
                  className="editor"
                  style={{
                    minHeight: 200,
                    outline: "none",
                    fontSize: 13,
                    lineHeight: 1.7,
                    color: C.t1,
                  }}
                />
              </div>

              {/* Footer with stats */}
              <div
                style={{
                  padding: "12px 16px",
                  borderTop: `1px solid ${C.sep}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: 10,
                  color: C.t4,
                }}
              >
                <span>
                  {roomsWithContent} of {state.rooms.length} rooms have content
                </span>
                <span>{blockCount} blocks total</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
