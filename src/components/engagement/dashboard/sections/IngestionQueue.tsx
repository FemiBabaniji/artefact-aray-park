"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useC } from "@/hooks/useC";
import { SPF } from "@/lib/motion";

type QueueItem = {
  id: string;
  sourceType: "email" | "meeting" | "slack" | "discord";
  sourceId: string;
  sourceData: {
    subject?: string;
    from?: string;
    preview?: string;
    meetingTitle?: string;
    author?: string;
    threadId?: string;
    threadCount?: number;
  };
  suggestedRoom: string;
  suggestedBlock: {
    type: string;
    content: string;
  };
  summary: string;
  status: "pending" | "approved" | "rejected" | "auto_ingested";
  createdAt: string;
};

type IngestionQueueProps = {
  engagementId: string;
};

const SOURCE_CONFIG = {
  email: { label: "Email", color: "#EA4335", icon: "@" },
  meeting: { label: "Meeting", color: "#2D8CFF", icon: "V" },
  slack: { label: "Slack", color: "#4A154B", icon: "#" },
  discord: { label: "Discord", color: "#5865F2", icon: "D" },
};

export function IngestionQueue({ engagementId }: IngestionQueueProps) {
  const C = useC();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);

  useEffect(() => {
    fetchQueue();
  }, [engagementId, filter]);

  const fetchQueue = async () => {
    try {
      const url = filter === "pending"
        ? `/api/engagements/${engagementId}/ingestion?status=pending`
        : `/api/engagements/${engagementId}/ingestion`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (err) {
      console.error("Failed to fetch queue:", err);
    } finally {
      setLoading(false);
    }
  };

  const processItem = async (itemId: string, action: "approve" | "reject") => {
    setProcessing((prev) => new Set(prev).add(itemId));
    try {
      await fetch(`/api/engagements/${engagementId}/ingestion/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action === "approve" ? "approved" : "rejected" }),
      });
      await fetchQueue();
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    } catch (err) {
      console.error("Failed to process item:", err);
    } finally {
      setProcessing((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const processBulk = async (action: "approve" | "reject") => {
    if (selectedIds.size === 0) return;

    setBulkProcessing(true);
    try {
      const res = await fetch(`/api/engagements/${engagementId}/ingestion/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemIds: Array.from(selectedIds),
          action,
        }),
      });

      if (res.ok) {
        await fetchQueue();
        setSelectedIds(new Set());
      }
    } catch (err) {
      console.error("Failed to process bulk:", err);
    } finally {
      setBulkProcessing(false);
    }
  };

  const toggleSelect = useCallback((itemId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    const pendingIds = filteredItems
      .filter((i) => i.status === "pending")
      .map((i) => i.id);
    setSelectedIds(new Set(pendingIds));
  }, [items, sourceFilter, searchQuery]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Filter items
  const filteredItems = items.filter((item) => {
    if (sourceFilter && item.sourceType !== sourceFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSubject = item.sourceData.subject?.toLowerCase().includes(query);
      const matchesFrom = item.sourceData.from?.toLowerCase().includes(query);
      const matchesSummary = item.summary?.toLowerCase().includes(query);
      const matchesTitle = item.sourceData.meetingTitle?.toLowerCase().includes(query);
      if (!matchesSubject && !matchesFrom && !matchesSummary && !matchesTitle) return false;
    }
    return true;
  });

  const pendingCount = filteredItems.filter((i) => i.status === "pending").length;
  const selectedCount = selectedIds.size;

  // Get unique source types for filter
  const availableSources = Array.from(new Set(items.map((i) => i.sourceType)));

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: C.t4 }}>
        Loading queue...
      </div>
    );
  }

  return (
    <div
      style={{
        background: C.bg,
        border: `1px solid ${C.sep}`,
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: `1px solid ${C.sep}`,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.t1 }}>
              Ingestion Queue
            </div>
            {pendingCount > 0 && (
              <span
                style={{
                  padding: "2px 8px",
                  background: "#F97316",
                  borderRadius: 10,
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#fff",
                }}
              >
                {pendingCount} pending
              </span>
            )}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            {/* Status Filter */}
            <div
              style={{
                display: "flex",
                background: C.void,
                borderRadius: 6,
                padding: 2,
                border: `1px solid ${C.sep}`,
              }}
            >
              {(["pending", "all"] as const).map((f) => (
                <motion.button
                  key={f}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: "4px 10px",
                    background: filter === f ? C.bg : "transparent",
                    border: "none",
                    borderRadius: 4,
                    color: filter === f ? C.t1 : C.t3,
                    fontSize: 11,
                    cursor: "pointer",
                    fontWeight: filter === f ? 500 : 400,
                    textTransform: "capitalize",
                  }}
                >
                  {f}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Search and Source Filter Row */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Search */}
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              padding: "8px 12px",
              background: C.void,
              border: `1px solid ${C.sep}`,
              borderRadius: 6,
              fontSize: 12,
              color: C.t1,
              outline: "none",
            }}
          />

          {/* Source Filter */}
          {availableSources.length > 1 && (
            <div style={{ display: "flex", gap: 4 }}>
              {availableSources.map((source) => {
                const config = SOURCE_CONFIG[source];
                const isActive = sourceFilter === source;
                return (
                  <motion.button
                    key={source}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSourceFilter(isActive ? null : source)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: isActive ? `${config.color}20` : C.void,
                      border: `1px solid ${isActive ? config.color : C.sep}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      color: isActive ? config.color : C.t3,
                      cursor: "pointer",
                    }}
                    title={config.label}
                  >
                    {config.icon}
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>

        {/* Bulk Actions Bar */}
        {pendingCount > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 12px",
              background: C.void,
              borderRadius: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={selectedCount > 0 ? deselectAll : selectAll}
                style={{
                  padding: "4px 10px",
                  background: "transparent",
                  border: `1px solid ${C.sep}`,
                  borderRadius: 4,
                  fontSize: 11,
                  color: C.t2,
                  cursor: "pointer",
                }}
              >
                {selectedCount > 0 ? "Deselect all" : "Select all"}
              </motion.button>

              {selectedCount > 0 && (
                <span style={{ fontSize: 11, color: C.t3 }}>
                  {selectedCount} selected
                </span>
              )}
            </div>

            <div style={{ display: "flex", gap: 6 }}>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => processBulk("approve")}
                disabled={selectedCount === 0 || bulkProcessing}
                style={{
                  padding: "6px 12px",
                  background: selectedCount > 0 ? C.green : C.sep,
                  border: "none",
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 500,
                  color: selectedCount > 0 ? "#fff" : C.t3,
                  cursor: selectedCount > 0 && !bulkProcessing ? "pointer" : "not-allowed",
                  opacity: bulkProcessing ? 0.6 : 1,
                }}
              >
                {bulkProcessing ? "Processing..." : `Approve${selectedCount > 0 ? ` (${selectedCount})` : ""}`}
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => processBulk("reject")}
                disabled={selectedCount === 0 || bulkProcessing}
                style={{
                  padding: "6px 12px",
                  background: "transparent",
                  border: `1px solid ${selectedCount > 0 ? "#ef4444" : C.sep}`,
                  borderRadius: 6,
                  fontSize: 11,
                  color: selectedCount > 0 ? "#ef4444" : C.t3,
                  cursor: selectedCount > 0 && !bulkProcessing ? "pointer" : "not-allowed",
                }}
              >
                Reject
              </motion.button>
            </div>
          </div>
        )}
      </div>

      {/* Items */}
      <div style={{ maxHeight: 500, overflow: "auto" }}>
        {filteredItems.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: C.t4 }}>
            {filter === "pending" ? "No pending items" : "No items in queue"}
          </div>
        ) : (
          <div>
            {filteredItems.map((item) => {
              const config = SOURCE_CONFIG[item.sourceType];
              const isExpanded = expandedId === item.id;
              const isProcessing = processing.has(item.id);
              const isSelected = selectedIds.has(item.id);
              const isPending = item.status === "pending";

              return (
                <motion.div
                  key={item.id}
                  layout
                  style={{
                    borderBottom: `1px solid ${C.sep}`,
                    background: isSelected ? `${C.blue}08` : "transparent",
                  }}
                >
                  {/* Item header */}
                  <div
                    style={{
                      padding: "12px 16px",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    {/* Checkbox */}
                    {isPending && (
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => toggleSelect(item.id)}
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 4,
                          border: `2px solid ${isSelected ? C.blue : C.sep}`,
                          background: isSelected ? C.blue : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          flexShrink: 0,
                        }}
                      >
                        {isSelected && (
                          <span style={{ color: "#fff", fontSize: 12, lineHeight: 1 }}>
                            ✓
                          </span>
                        )}
                      </motion.button>
                    )}

                    {/* Source icon */}
                    <div
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 6,
                        background: `${config.color}15`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                        fontWeight: 600,
                        color: config.color,
                        flexShrink: 0,
                        cursor: "pointer",
                      }}
                    >
                      {config.icon}
                    </div>

                    {/* Content */}
                    <div
                      style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          color: C.t1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        {item.sourceData.subject || item.sourceData.meetingTitle || "Untitled"}
                        {item.sourceData.threadCount && item.sourceData.threadCount > 1 && (
                          <span
                            style={{
                              padding: "1px 5px",
                              background: `${config.color}20`,
                              borderRadius: 8,
                              fontSize: 9,
                              color: config.color,
                            }}
                          >
                            {item.sourceData.threadCount} in thread
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: C.t3 }}>
                        {item.sourceData.from || item.sourceData.author || config.label} •{" "}
                        {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Status / Actions */}
                    {isPending ? (
                      <div style={{ display: "flex", gap: 6 }}>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            processItem(item.id, "approve");
                          }}
                          disabled={isProcessing}
                          style={{
                            padding: "6px 12px",
                            background: C.green,
                            border: "none",
                            borderRadius: 4,
                            fontSize: 11,
                            color: "#fff",
                            cursor: isProcessing ? "wait" : "pointer",
                            opacity: isProcessing ? 0.6 : 1,
                          }}
                        >
                          Approve
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            processItem(item.id, "reject");
                          }}
                          disabled={isProcessing}
                          style={{
                            padding: "6px 12px",
                            background: "transparent",
                            border: `1px solid ${C.sep}`,
                            borderRadius: 4,
                            fontSize: 11,
                            color: C.t2,
                            cursor: isProcessing ? "wait" : "pointer",
                          }}
                        >
                          Skip
                        </motion.button>
                      </div>
                    ) : (
                      <span
                        style={{
                          padding: "4px 8px",
                          background:
                            item.status === "approved" || item.status === "auto_ingested"
                              ? `${C.green}15`
                              : `${C.t4}15`,
                          borderRadius: 4,
                          fontSize: 10,
                          color:
                            item.status === "approved" || item.status === "auto_ingested"
                              ? C.green
                              : C.t3,
                          textTransform: "capitalize",
                        }}
                      >
                        {item.status.replace("_", " ")}
                      </span>
                    )}
                  </div>

                  {/* Expanded content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={SPF}
                        style={{ overflow: "hidden" }}
                      >
                        <div
                          style={{
                            padding: isPending ? "0 16px 16px 78px" : "0 16px 16px 60px",
                          }}
                        >
                          {/* Summary */}
                          <div
                            style={{
                              padding: 12,
                              background: C.void,
                              borderRadius: 8,
                              fontSize: 12,
                              color: C.t2,
                              lineHeight: 1.5,
                              marginBottom: 12,
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {item.summary || item.sourceData.preview || "No summary available"}
                          </div>

                          {/* Suggested action */}
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 11, color: C.t3 }}>
                              Suggested:
                            </span>
                            <span
                              style={{
                                padding: "2px 8px",
                                background: `${C.blue}15`,
                                borderRadius: 4,
                                fontSize: 11,
                                color: C.blue,
                              }}
                            >
                              {item.suggestedBlock?.type || "note"} → {item.suggestedRoom || "meetings"}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
