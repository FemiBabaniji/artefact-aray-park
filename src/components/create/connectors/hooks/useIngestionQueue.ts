"use client";

import { useMemo, useState } from "react";
import type { QueuedItem } from "../types";

const INITIAL_QUEUE: QueuedItem[] = [
  {
    id: "q1",
    sourceType: "email",
    sourceId: "gmail-thread-1",
    preview: 'Email: "Q1 Planning Decision"',
    suggestedRoom: "meetings",
    suggestedType: "decision",
    status: "pending",
    createdAt: "2m ago",
    meta: "from: ceo@client.com",
  },
  {
    id: "q2",
    sourceType: "slack",
    sourceId: "slack-msg-21",
    preview: 'Slack: "#project - Budget approved"',
    suggestedRoom: "discovery",
    suggestedType: "note",
    status: "pending",
    createdAt: "5m ago",
    meta: "#general",
  },
  {
    id: "q3",
    sourceType: "meeting",
    sourceId: "zoom-0311",
    preview: 'Zoom: "Steering Committee 03/11"',
    suggestedRoom: "meetings",
    suggestedType: "note",
    status: "pending",
    createdAt: "11m ago",
    meta: "transcript available",
  },
];

export function useIngestionQueue() {
  const [queue, setQueue] = useState<QueuedItem[]>(INITIAL_QUEUE);

  const pendingCount = useMemo(
    () => queue.filter((item) => item.status === "pending").length,
    [queue],
  );

  const approve = (id: string) => {
    const item = queue.find((entry) => entry.id === id);
    setQueue((current) => current.map((entry) => (entry.id === id ? { ...entry, status: "approved" } : entry)));
    return item ?? null;
  };

  const reject = (id: string) => {
    setQueue((current) => current.map((entry) => (entry.id === id ? { ...entry, status: "rejected" } : entry)));
  };

  const retarget = (id: string, roomId: string) => {
    setQueue((current) => current.map((entry) => (entry.id === id ? { ...entry, suggestedRoom: roomId } : entry)));
  };

  return {
    queue,
    pendingCount,
    approve,
    reject,
    retarget,
  };
}
