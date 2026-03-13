"use client";

import { useMemo } from "react";
import { useC } from "@/hooks/useC";
import { ListRow, ListRowTitle, ListRowSubtitle } from "@/components/ds/ListRow";
import { Empty } from "@/components/ds/Empty";

type ActivityEvent = {
  id: string;
  event_type: string;
  payload: unknown;
  actor_id: string;
  created_at: string;
};

type ActivityFeedProps = {
  events: ActivityEvent[];
  maxItems?: number;
  C: Record<string, string>;
};

const EVENT_LABELS: Record<string, string> = {
  engagement_created: "created this engagement",
  engagement_updated: "updated engagement details",
  engagement_phase_changed: "changed phase",
  engagement_archived: "archived this engagement",
  participant_invited: "invited a participant",
  participant_joined: "joined the engagement",
  participant_removed: "removed a participant",
  room_added: "added a room",
  room_updated: "updated a room",
  room_removed: "removed a room",
  block_added: "added content",
  block_updated: "updated content",
  block_removed: "removed content",
};

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

function EventIcon({ type }: { type: string }) {
  const C = useC();
  const isDestructive = type.includes("removed") || type.includes("archived");
  const color = isDestructive ? C.amber : C.t3;

  if (type.includes("phase")) {
    return (
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: `${C.blue}15`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke={C.blue} strokeWidth="2" />
          <path d="M12 6V12L16 14" stroke={C.blue} strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  if (type.includes("participant")) {
    return (
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: C.void,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="8" r="4" stroke={color} strokeWidth="2" />
          <path d="M4 20C4 16.686 7.582 14 12 14C16.418 14 20 16.686 20 20" stroke={color} strokeWidth="2" />
        </svg>
      </div>
    );
  }

  if (type.includes("room") || type.includes("block")) {
    return (
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: C.void,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
          <path d="M3 9H21" stroke={color} strokeWidth="2" />
        </svg>
      </div>
    );
  }

  return (
    <div
      style={{
        width: 24,
        height: 24,
        borderRadius: "50%",
        background: C.void,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
    </div>
  );
}

export function ActivityFeed({ events, maxItems = 10 }: ActivityFeedProps) {
  const displayEvents = useMemo(() => {
    return events.slice(0, maxItems).map((event) => ({
      ...event,
      label: EVENT_LABELS[event.event_type] || event.event_type,
      timeAgo: getTimeAgo(event.created_at),
    }));
  }, [events, maxItems]);

  if (events.length === 0) {
    return <Empty title="No activity yet" compact />;
  }

  return (
    <div style={{ padding: "4px 0", overflow: "auto" }}>
      {displayEvents.map((event, index) => (
        <ListRow
          key={event.id}
          leading={<EventIcon type={event.event_type} />}
          divider={index < displayEvents.length - 1}
          padding="10px 16px"
        >
          <ListRowTitle>
            <span style={{ fontWeight: 500 }}>Someone</span>{" "}
            <span style={{ fontWeight: 400 }}>{event.label}</span>
          </ListRowTitle>
          <ListRowSubtitle>{event.timeAgo}</ListRowSubtitle>
        </ListRow>
      ))}
    </div>
  );
}
