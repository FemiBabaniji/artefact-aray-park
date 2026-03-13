"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useC } from "@/hooks/useC";
import { Lbl } from "@/components/primitives/Lbl";
import { Btn } from "@/components/primitives/Btn";
import { FADE, SPF } from "@/lib/motion";
import type { EngagementRoom, EngagementBlock } from "@/types/engagement";

// Mock owner for demo
const DEMO_OWNER_ID = "demo-user-123";

type EngagementBlockType = "text" | "decision" | "file" | "outcome";

export default function EngagementRoomPage({
  params,
}: {
  params: Promise<{ id: string; roomKey: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const C = useC();
  const [room, setRoom] = useState<EngagementRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingBlock, setAddingBlock] = useState(false);
  const [selectedBlockType, setSelectedBlockType] = useState<EngagementBlockType | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state for different block types
  const [textContent, setTextContent] = useState("");
  const [decisionData, setDecisionData] = useState({
    title: "",
    decision: "",
    rationale: "",
    attendees: "",
    decidedAt: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    async function fetchRoom() {
      try {
        const res = await fetch(
          `/api/engagements/${resolvedParams.id}/rooms/${resolvedParams.roomKey}`
        );
        if (!res.ok) {
          if (res.status === 404) {
            setError("Room not found");
          } else {
            setError("Failed to load room");
          }
          return;
        }
        const data = await res.json();
        setRoom(data.room);
      } catch (err) {
        setError("Failed to load room");
      } finally {
        setLoading(false);
      }
    }
    fetchRoom();
  }, [resolvedParams.id, resolvedParams.roomKey]);

  const handleAddBlock = async () => {
    if (!selectedBlockType || !room) return;

    setSaving(true);
    try {
      let blockData: Record<string, unknown> = { blockType: selectedBlockType };

      if (selectedBlockType === "text") {
        blockData.content = textContent;
      } else if (selectedBlockType === "decision") {
        blockData.content = decisionData.decision;
        blockData.metadata = {
          title: decisionData.title,
          rationale: decisionData.rationale,
          attendees: decisionData.attendees.split(",").map((a) => a.trim()).filter(Boolean),
          decidedAt: decisionData.decidedAt,
        };
      } else if (selectedBlockType === "outcome") {
        blockData.content = textContent;
      }

      const res = await fetch(
        `/api/engagements/${resolvedParams.id}/rooms/${resolvedParams.roomKey}/blocks`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...blockData,
            actorId: DEMO_OWNER_ID,
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        setRoom((prev) =>
          prev ? { ...prev, blocks: [...prev.blocks, data.block] } : prev
        );
        resetForm();
      }
    } catch (err) {
      console.error("Failed to add block:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    if (!room) return;

    try {
      const res = await fetch(
        `/api/engagements/${resolvedParams.id}/rooms/${resolvedParams.roomKey}/blocks/${blockId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ actorId: DEMO_OWNER_ID }),
        }
      );

      if (res.ok) {
        setRoom((prev) =>
          prev
            ? { ...prev, blocks: prev.blocks.filter((b) => b.id !== blockId) }
            : prev
        );
      }
    } catch (err) {
      console.error("Failed to delete block:", err);
    }
  };

  const resetForm = () => {
    setAddingBlock(false);
    setSelectedBlockType(null);
    setTextContent("");
    setDecisionData({
      title: "",
      decision: "",
      rationale: "",
      attendees: "",
      decidedAt: new Date().toISOString().split("T")[0],
    });
  };

  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case "client_view":
        return C.green;
      case "client_edit":
        return C.blue;
      default:
        return C.t4;
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: C.void,
          color: C.t3,
        }}
      >
        Loading...
      </div>
    );
  }

  if (error || !room) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: C.void,
          color: C.t3,
          gap: 16,
        }}
      >
        <div>{error || "Room not found"}</div>
        <Btn onClick={() => router.back()}>Go back</Btn>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.void,
        color: C.t1,
      }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: `1px solid ${C.sep}`,
          background: C.bg,
        }}
      >
        <div
          style={{
            maxWidth: 900,
            margin: "0 auto",
            padding: "20px 32px",
          }}
        >
          {/* Back + Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <Btn onClick={() => router.push(`/practice/engagements/${resolvedParams.id}`)}>
              &larr; Back
            </Btn>
            <span style={{ color: C.t4, fontSize: 12 }}>/</span>
            <span style={{ color: C.t3, fontSize: 12 }}>{room.label}</span>
          </div>

          {/* Room title and visibility */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>{room.label}</h1>
            <span
              style={{
                padding: "4px 10px",
                background: `${getVisibilityColor(room.visibility)}20`,
                borderRadius: 4,
                fontSize: 10,
                fontWeight: 500,
                color: getVisibilityColor(room.visibility),
                textTransform: "uppercase",
              }}
            >
              {room.visibility.replace("_", " ")}
            </span>
          </div>

          {room.prompt && (
            <p style={{ fontSize: 13, color: C.t3, marginTop: 8, marginBottom: 0 }}>
              {room.prompt}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "32px",
        }}
      >
        {/* Add block button */}
        {!addingBlock && (
          <motion.button
            onClick={() => setAddingBlock(true)}
            whileHover={{ borderColor: C.blue }}
            whileTap={{ scale: 0.98 }}
            style={{
              width: "100%",
              padding: "16px 20px",
              background: "transparent",
              border: `1px dashed ${C.sep}`,
              borderRadius: 10,
              color: C.t3,
              fontSize: 13,
              cursor: "pointer",
              marginBottom: 24,
              transition: "border-color 0.15s",
            }}
          >
            + Add block
          </motion.button>
        )}

        {/* Block type selector */}
        <AnimatePresence>
          {addingBlock && !selectedBlockType && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={FADE}
              style={{
                padding: 20,
                background: C.bg,
                border: `1px solid ${C.sep}`,
                borderRadius: 10,
                marginBottom: 24,
              }}
            >
              <Lbl style={{ marginBottom: 12 }}>Select block type</Lbl>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {(["text", "decision", "outcome"] as EngagementBlockType[]).map((type) => (
                  <motion.button
                    key={type}
                    onClick={() => setSelectedBlockType(type)}
                    whileHover={{ borderColor: C.blue }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      padding: "10px 16px",
                      background: "transparent",
                      border: `1px solid ${C.sep}`,
                      borderRadius: 6,
                      color: C.t2,
                      fontSize: 12,
                      cursor: "pointer",
                      textTransform: "capitalize",
                    }}
                  >
                    {type}
                  </motion.button>
                ))}
              </div>
              <Btn onClick={resetForm} style={{ marginTop: 12, color: C.t4 }}>
                Cancel
              </Btn>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Block forms */}
        <AnimatePresence>
          {selectedBlockType === "text" && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={FADE}
              style={{
                padding: 20,
                background: C.bg,
                border: `1px solid ${C.sep}`,
                borderRadius: 10,
                marginBottom: 24,
              }}
            >
              <Lbl style={{ marginBottom: 8 }}>Text Block</Lbl>
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Enter your content..."
                style={{
                  width: "100%",
                  minHeight: 120,
                  padding: 12,
                  background: C.void,
                  border: `1px solid ${C.sep}`,
                  borderRadius: 6,
                  color: C.t1,
                  fontSize: 13,
                  resize: "vertical",
                  outline: "none",
                }}
              />
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <Btn onClick={handleAddBlock} disabled={saving || !textContent.trim()}>
                  {saving ? "Saving..." : "Add"}
                </Btn>
                <Btn onClick={resetForm} style={{ color: C.t4 }}>
                  Cancel
                </Btn>
              </div>
            </motion.div>
          )}

          {selectedBlockType === "decision" && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={FADE}
              style={{
                padding: 20,
                background: C.bg,
                border: `1px solid ${C.sep}`,
                borderRadius: 10,
                marginBottom: 24,
              }}
            >
              <Lbl style={{ marginBottom: 12 }}>Decision Block</Lbl>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <input
                  type="text"
                  value={decisionData.title}
                  onChange={(e) => setDecisionData((d) => ({ ...d, title: e.target.value }))}
                  placeholder="Decision title"
                  style={{
                    padding: 10,
                    background: C.void,
                    border: `1px solid ${C.sep}`,
                    borderRadius: 6,
                    color: C.t1,
                    fontSize: 13,
                    outline: "none",
                  }}
                />
                <textarea
                  value={decisionData.decision}
                  onChange={(e) => setDecisionData((d) => ({ ...d, decision: e.target.value }))}
                  placeholder="The decision made"
                  style={{
                    minHeight: 80,
                    padding: 10,
                    background: C.void,
                    border: `1px solid ${C.sep}`,
                    borderRadius: 6,
                    color: C.t1,
                    fontSize: 13,
                    resize: "vertical",
                    outline: "none",
                  }}
                />
                <textarea
                  value={decisionData.rationale}
                  onChange={(e) => setDecisionData((d) => ({ ...d, rationale: e.target.value }))}
                  placeholder="Rationale (optional)"
                  style={{
                    minHeight: 60,
                    padding: 10,
                    background: C.void,
                    border: `1px solid ${C.sep}`,
                    borderRadius: 6,
                    color: C.t1,
                    fontSize: 13,
                    resize: "vertical",
                    outline: "none",
                  }}
                />
                <input
                  type="text"
                  value={decisionData.attendees}
                  onChange={(e) => setDecisionData((d) => ({ ...d, attendees: e.target.value }))}
                  placeholder="Attendees (comma separated)"
                  style={{
                    padding: 10,
                    background: C.void,
                    border: `1px solid ${C.sep}`,
                    borderRadius: 6,
                    color: C.t1,
                    fontSize: 13,
                    outline: "none",
                  }}
                />
                <input
                  type="date"
                  value={decisionData.decidedAt}
                  onChange={(e) => setDecisionData((d) => ({ ...d, decidedAt: e.target.value }))}
                  style={{
                    padding: 10,
                    background: C.void,
                    border: `1px solid ${C.sep}`,
                    borderRadius: 6,
                    color: C.t1,
                    fontSize: 13,
                    outline: "none",
                    width: "fit-content",
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <Btn
                  onClick={handleAddBlock}
                  disabled={saving || !decisionData.title.trim() || !decisionData.decision.trim()}
                >
                  {saving ? "Saving..." : "Add Decision"}
                </Btn>
                <Btn onClick={resetForm} style={{ color: C.t4 }}>
                  Cancel
                </Btn>
              </div>
            </motion.div>
          )}

          {selectedBlockType === "outcome" && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={FADE}
              style={{
                padding: 20,
                background: C.bg,
                border: `1px solid ${C.sep}`,
                borderRadius: 10,
                marginBottom: 24,
              }}
            >
              <Lbl style={{ marginBottom: 8 }}>Outcome Block</Lbl>
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Describe the outcome or impact..."
                style={{
                  width: "100%",
                  minHeight: 120,
                  padding: 12,
                  background: C.void,
                  border: `1px solid ${C.sep}`,
                  borderRadius: 6,
                  color: C.t1,
                  fontSize: 13,
                  resize: "vertical",
                  outline: "none",
                }}
              />
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <Btn onClick={handleAddBlock} disabled={saving || !textContent.trim()}>
                  {saving ? "Saving..." : "Add Outcome"}
                </Btn>
                <Btn onClick={resetForm} style={{ color: C.t4 }}>
                  Cancel
                </Btn>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Block list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {room.blocks.map((block) => (
            <BlockCard
              key={block.id}
              block={block}
              onDelete={() => handleDeleteBlock(block.id)}
              C={C}
            />
          ))}

          {room.blocks.length === 0 && !addingBlock && (
            <div
              style={{
                padding: 48,
                textAlign: "center",
                color: C.t4,
              }}
            >
              <div style={{ fontSize: 14, marginBottom: 8 }}>No content yet</div>
              <div style={{ fontSize: 12 }}>Add blocks to start documenting.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Block display card
function BlockCard({
  block,
  onDelete,
  C,
}: {
  block: EngagementBlock;
  onDelete: () => void;
  C: Record<string, string>;
}) {
  const [showActions, setShowActions] = useState(false);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (block.blockType === "decision") {
    const meta = block.metadata as {
      title?: string;
      rationale?: string;
      attendees?: string[];
      decidedAt?: string;
    } | undefined;

    return (
      <motion.div
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
        style={{
          padding: 20,
          background: C.bg,
          border: `1px solid ${C.sep}`,
          borderRadius: 10,
          borderLeft: `3px solid ${C.blue}`,
          position: "relative",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div style={{ flex: 1 }}>
            <Lbl style={{ marginBottom: 4, color: C.blue }}>Decision</Lbl>
            {meta?.title && (
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{meta.title}</div>
            )}
            <div style={{ fontSize: 14, color: C.t1, lineHeight: 1.6 }}>{block.content}</div>
            {meta?.rationale && (
              <div style={{ fontSize: 13, color: C.t3, marginTop: 8, fontStyle: "italic" }}>
                Rationale: {meta.rationale}
              </div>
            )}
            <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 11, color: C.t4 }}>
              {meta?.attendees && meta.attendees.length > 0 && (
                <span>Attendees: {meta.attendees.join(", ")}</span>
              )}
              {meta?.decidedAt && <span>{formatDate(meta.decidedAt)}</span>}
            </div>
          </div>
          <AnimatePresence>
            {showActions && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Btn onClick={onDelete} style={{ color: "#ef4444", fontSize: 10 }}>
                  Delete
                </Btn>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  }

  if (block.blockType === "file") {
    const meta = block.metadata as {
      fileName?: string;
      fileSize?: number;
    } | undefined;

    return (
      <motion.div
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
        style={{
          padding: 16,
          background: C.bg,
          border: `1px solid ${C.sep}`,
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          gap: 12,
          position: "relative",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            background: C.void,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            color: C.t3,
          }}
        >
          {"\u25A4"}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 500 }}>{meta?.fileName || "File"}</div>
          {block.caption && (
            <div style={{ fontSize: 12, color: C.t3, marginTop: 2 }}>{block.caption}</div>
          )}
        </div>
        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Btn onClick={onDelete} style={{ color: "#ef4444", fontSize: 10 }}>
                Delete
              </Btn>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // Default: text or outcome
  return (
    <motion.div
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      style={{
        padding: 20,
        background: C.bg,
        border: `1px solid ${C.sep}`,
        borderRadius: 10,
        borderLeft: block.blockType === "outcome" ? `3px solid ${C.green}` : undefined,
        position: "relative",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ flex: 1 }}>
          {block.blockType === "outcome" && (
            <Lbl style={{ marginBottom: 8, color: C.green }}>Outcome</Lbl>
          )}
          <div style={{ fontSize: 14, color: C.t1, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
            {block.content}
          </div>
          <div style={{ fontSize: 11, color: C.t4, marginTop: 8 }}>
            {formatDate(block.createdAt)}
          </div>
        </div>
        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Btn onClick={onDelete} style={{ color: "#ef4444", fontSize: 10 }}>
                Delete
              </Btn>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
