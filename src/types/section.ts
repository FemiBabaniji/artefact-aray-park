// Re-export room types for backwards compatibility
export {
  type RoomStatus as SectionStatus,
  type LegacySectionKey as SectionKey,
  type LinkMeta,
  type Room,
  type RoomType,
  type StageMarker,
  type TextContent,
  type RoomContent,
} from "./room";

// Legacy Section type - maps to Room with text content
// Used for backwards compatibility during migration
export type Section = {
  id:          string;       // was SectionKey, now dynamic
  label:       string;
  status:      "empty" | "in_progress" | "submitted" | "reviewed" | "accepted";
  evidence:    string;       // maps to TextContent.body
  cp:          1 | 2;        // maps to StageMarker (1=early, 2=later)
  feedback?:   string;
  feedbackAt?: string;
  feedbackBy?: string;
  links?:      import("./room").LinkMeta[];
};

// Helper to convert Room to legacy Section format
export function roomToSection(room: import("./room").Room): Section {
  const textContent = room.content?.type === "text" ? room.content.data : null;
  return {
    id: room.key,
    label: room.label,
    status: room.status === "ongoing" ? "in_progress" : room.status as Section["status"],
    evidence: textContent?.body ?? "",
    cp: room.stageMarker === "early" ? 1 : 2,
    feedback: textContent?.feedback,
    feedbackAt: textContent?.feedbackAt,
    feedbackBy: textContent?.feedbackBy,
    links: textContent?.links,
  };
}

// Helper to convert legacy Section to Room format
export function sectionToRoom(section: Section): import("./room").Room {
  return {
    id: section.id,
    key: section.id,
    label: section.label,
    roomType: "text",
    stageMarker: section.cp === 1 ? "early" : "later",
    status: section.status,
    orderIndex: 0,
    isPublic: true,
    content: {
      type: "text",
      data: {
        body: section.evidence,
        feedback: section.feedback,
        feedbackAt: section.feedbackAt,
        feedbackBy: section.feedbackBy,
        links: section.links,
      },
    },
  };
}
