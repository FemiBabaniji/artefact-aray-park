// Room types - flexible content architecture replacing hardcoded sections
// v2: Rooms are named spaces. Members add blocks (furniture) freely.

// ── v2 Types (Block-based) ─────────────────────────────────────────────────

export type Pace = "foundation" | "development" | "ongoing";

export type RoomStatusV2 = "empty" | "active" | "submitted" | "feedback" | "complete";

export type BlockType = "text" | "image" | "link" | "embed";

// Field types for structured rooms
export type FieldType = "text" | "longtext" | "number" | "date" | "file" | "url" | "select" | "boolean";

// A block is a piece of content the member adds to a room
export type Block = {
  id: string;
  blockType: BlockType;
  content?: string;       // text: markdown/html, link: url, embed: url
  storagePath?: string;   // image uploads
  caption?: string;
  metadata?: {
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    ogSiteName?: string;
    width?: number;
    height?: number;
    [key: string]: unknown;
  };
  orderIndex: number;
  createdAt?: string;
  // Freeform canvas positioning
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};

// Field definition for structured rooms (stored at program level)
export type RoomField = {
  id: string;
  roomKey: string;        // which room this field belongs to
  fieldKey: string;       // unique key within the room
  label: string;          // display label
  fieldType: FieldType;
  options?: string[];     // for select fields
  required: boolean;
  orderIndex: number;
};

// Field value (member response to a structured field)
export type RoomFieldValue = {
  id: string;
  fieldKey: string;
  valueText?: string;
  valueNumber?: number;
  valueDate?: string;
  valueBoolean?: boolean;
  storagePath?: string;   // for file uploads
  updatedAt?: string;
};

// v2 Room - a named space with blocks or structured fields
export type RoomV2 = {
  id: string;
  key: string;            // slug from program schema
  label: string;          // admin's name for this room
  purpose?: string;       // admin's instruction to the member
  pace: Pace;             // when program expects this to be worked on
  status: RoomStatusV2;
  orderIndex: number;
  isPublic: boolean;
  isStructured: boolean;  // if true, shows form fields instead of block composer
  isArchived: boolean;    // hidden from new members, read-only for existing
  feedback?: string;
  feedbackAt?: string;
  feedbackBy?: string;
  blocks?: Block[];       // content for open rooms
  fields?: RoomField[];   // field definitions for structured rooms
  fieldValues?: RoomFieldValue[]; // member's responses for structured rooms
};

// Field definition in schema (for admin configuration)
export type RoomFieldSchema = {
  fieldKey: string;
  label: string;
  fieldType: FieldType;
  options?: string[];     // for select fields
  required: boolean;
  order: number;
};

// Schema for program configuration (v2)
export type RoomSchemaV2 = {
  key: string;
  label: string;
  purpose?: string;       // instruction to the member
  pace: Pace;
  isPublic: boolean;
  isStructured: boolean;
  fields?: RoomFieldSchema[]; // only for structured rooms
  order: number;
};

// ── Legacy Types (for backwards compatibility) ─────────────────────────────

export type RoomType =
  | "text"
  | "gallery"
  | "moodboard"
  | "works"
  | "links"
  | "embed"
  | "process";

export type StageMarker = "early" | "later" | "ongoing";

export type RoomStatus =
  | "empty"
  | "in_progress"
  | "submitted"
  | "reviewed"
  | "accepted"
  | "ongoing"; // for ongoing rooms that don't have submission workflow

export type LinkMeta = {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  favicon?: string;
  type?: "article" | "video" | "image" | "website";
  fetched: boolean;
  error?: boolean;
};

// Base room structure
export type Room = {
  id: string;           // UUID
  key: string;          // slug from program schema (dynamic, not hardcoded)
  label: string;        // director's name for this room
  roomType: RoomType;
  stageMarker: StageMarker;
  prompt?: string;      // director's prompt, member-facing
  status: RoomStatus;
  orderIndex: number;
  isPublic: boolean;
  // Content is loaded separately based on roomType
  content?: RoomContent;
};

// Content types for different room types
export type TextContent = {
  body: string;         // HTML from editor
  feedback?: string;
  feedbackAt?: string;
  feedbackBy?: string;
  links?: LinkMeta[];   // Extracted from body
};

export type MediaItem = {
  id: string;
  mediaType: "image" | "link" | "text_fragment" | "embed" | "color";
  url?: string;
  storagePath?: string;
  caption?: string;
  positionX?: number;   // For moodboard freeform placement
  positionY?: number;
  width?: number;
  height?: number;
  orderIndex: number;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogSiteName?: string;
};

export type GalleryContent = {
  items: MediaItem[];
  feedback?: string;
  feedbackAt?: string;
  feedbackBy?: string;
};

export type MoodboardContent = {
  items: MediaItem[];   // Freeform positioned items
};

export type WorkItem = {
  id: string;
  title: string;
  year?: string;
  medium?: string;
  description?: string;
  url?: string;
  orderIndex: number;
};

export type WorksContent = {
  items: WorkItem[];
  feedback?: string;
  feedbackAt?: string;
  feedbackBy?: string;
};

export type LinksContent = {
  items: MediaItem[];   // Link cards with og:image
};

export type EmbedContent = {
  item?: MediaItem;     // Single embed (video, audio, interactive)
};

export type ProcessEntry = {
  id: string;
  entryDate: string;    // ISO date
  note?: string;
  images: {
    id: string;
    storagePath: string;
    caption?: string;
    orderIndex: number;
  }[];
  orderIndex: number;
};

export type ProcessContent = {
  entries: ProcessEntry[];
};

// Union type for all content types
export type RoomContent =
  | { type: "text"; data: TextContent }
  | { type: "gallery"; data: GalleryContent }
  | { type: "moodboard"; data: MoodboardContent }
  | { type: "works"; data: WorksContent }
  | { type: "links"; data: LinksContent }
  | { type: "embed"; data: EmbedContent }
  | { type: "process"; data: ProcessContent };

// Room with loaded content (convenience type)
export type RoomWithContent<T extends RoomType = RoomType> = Room & {
  content: T extends "text"
    ? { type: "text"; data: TextContent }
    : T extends "gallery"
    ? { type: "gallery"; data: GalleryContent }
    : T extends "moodboard"
    ? { type: "moodboard"; data: MoodboardContent }
    : T extends "works"
    ? { type: "works"; data: WorksContent }
    : T extends "links"
    ? { type: "links"; data: LinksContent }
    : T extends "embed"
    ? { type: "embed"; data: EmbedContent }
    : T extends "process"
    ? { type: "process"; data: ProcessContent }
    : RoomContent;
};

// Schema for program configuration
export type RoomSchemaItem = {
  key: string;
  label: string;
  roomType: RoomType;
  stageMarker: StageMarker;
  prompt?: string;
  isPublic: boolean;
  order: number;
};

// For backwards compatibility during migration
export type LegacySectionKey =
  | "practice"
  | "focus"
  | "material"
  | "influences"
  | "series"
  | "exhibition"
  | "collab";

// ── v2 Helpers ─────────────────────────────────────────────────────────────

// Check if a room is ongoing (no submission workflow)
export function isOngoingRoomV2(room: RoomV2): boolean {
  return room.pace === "ongoing";
}

// Get icon for block type
export function getBlockTypeIcon(blockType: BlockType): string {
  switch (blockType) {
    case "text":  return "\u270E"; // pencil
    case "image": return "\u25A3"; // square
    case "link":  return "\u2197"; // arrow
    case "embed": return "\u25B6"; // play
    default:      return "\u25A1"; // square
  }
}

// Convert pace to display label
export function getPaceLabel(pace: Pace): string {
  switch (pace) {
    case "foundation":  return "Foundation";
    case "development": return "Development";
    case "ongoing":     return "Ongoing";
    default:            return pace;
  }
}

// Convert stageMarker to pace (for migration)
export function stageMarkerToPace(marker: StageMarker): Pace {
  switch (marker) {
    case "early":   return "foundation";
    case "later":   return "development";
    case "ongoing": return "ongoing";
    default:        return "foundation";
  }
}

// Get field type display label
export function getFieldTypeLabel(fieldType: FieldType): string {
  switch (fieldType) {
    case "text":      return "Text";
    case "longtext":  return "Long text";
    case "number":    return "Number";
    case "date":      return "Date";
    case "file":      return "File";
    case "url":       return "URL";
    case "select":    return "Select";
    case "boolean":   return "Yes / No";
    default:          return fieldType;
  }
}

// Field type icons
export function getFieldTypeIcon(fieldType: FieldType): string {
  switch (fieldType) {
    case "text":      return "T";
    case "longtext":  return "\u00B6"; // paragraph
    case "number":    return "#";
    case "date":      return "\u2630"; // calendar-ish
    case "file":      return "\u2191"; // upload
    case "url":       return "\u2197"; // link
    case "select":    return "\u25BC"; // dropdown
    case "boolean":   return "\u2713"; // check
    default:          return "\u25A1";
  }
}

// ── Legacy Helpers (backwards compatibility) ───────────────────────────────

// Helper to check if a room supports submission workflow
export function roomSupportsSubmission(roomType: RoomType): boolean {
  return roomType === "text" || roomType === "gallery" || roomType === "works";
}

// Helper to check if a room is ongoing (no submission workflow)
export function isOngoingRoom(room: Room): boolean {
  return room.stageMarker === "ongoing" || room.status === "ongoing";
}

// Helper to get icon for room type
export function getRoomTypeIcon(roomType: RoomType): string {
  switch (roomType) {
    case "text":      return "T";
    case "gallery":   return "\u229E"; // grid
    case "moodboard": return "\u25A6"; // square with fill
    case "works":     return "\u2261"; // triple bar
    case "links":     return "\u2197"; // arrow
    case "embed":     return "\u25B6"; // play
    case "process":   return "\u21BB"; // cycle
    default:          return "\u25A1"; // square
  }
}
