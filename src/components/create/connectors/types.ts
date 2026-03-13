"use client";

export type ConnectorProvider = "gmail" | "outlook" | "slack" | "discord" | "zoom" | "manual";
export type ConnectorStatus = "disconnected" | "connecting" | "connected" | "syncing" | "error";
export type OutputTarget = "claude" | "chatgpt" | "cursor" | "windsurf" | "cline" | "mcp" | "resume" | "portal";
export type OutputFormat = "xml" | "markdown" | "rules" | "json" | "html" | "url";
export type OutputAction = "copy" | "download" | "open" | "serve";
export type QueueSourceType = "email" | "slack" | "discord" | "meeting" | "document";
export type BlockType =
  | "decision"
  | "outcome"
  | "deliverable"
  | "status"
  | "milestone"
  | "note"
  | "metric"
  | "risk";

export type ConnectorRoom = {
  id: string;
  name: string;
  blocks: {
    id: string;
    title: string;
    content: string;
    type: BlockType;
    featured: boolean;
    createdAt: string;
  }[];
};

export type EngagementSnapshot = {
  name: string;
  clientName: string;
  consultantName: string;
  phase: string;
  value: string;
  duration: string;
  rooms: ConnectorRoom[];
};

export type InputConnector = {
  id: string;
  provider: ConnectorProvider;
  status: ConnectorStatus;
  lastSync?: string;
  itemsQueued: number;
  autoIngest: boolean;
  accountLabel?: string;
  targetRoom: string;
};

export type OutputConnector = {
  id: string;
  target: OutputTarget;
  format: OutputFormat;
  action: OutputAction;
  includeRooms: string[];
  maskClient: boolean;
};

export type QueuedItem = {
  id: string;
  sourceType: QueueSourceType;
  sourceId: string;
  preview: string;
  suggestedRoom: string;
  suggestedType: BlockType;
  status: "pending" | "approved" | "rejected" | "ingested";
  createdAt: string;
  meta: string;
};
