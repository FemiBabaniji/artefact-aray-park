// ════════════════════════════════════════════════════════════════════════════
// Engagement Types - Consulting OS Core Model
// The atomic unit: a project room for client work with lifecycle phases
// ════════════════════════════════════════════════════════════════════════════

import type { BlockType } from "./room";

// ── Engagement Lifecycle ──────────────────────────────────────────────────────

export type EngagementPhase =
  | "intake"        // Initial inquiry received
  | "qualification" // Assessing fit
  | "proposal"      // Drafting/sent proposal
  | "negotiation"   // Back-and-forth on terms
  | "signed"        // Contract signed, not started
  | "delivery"      // Active work in progress
  | "completed"     // Deliverables accepted
  | "archived";     // Closed for reference

// Pipeline phases (pre-signed)
export const PIPELINE_PHASES: EngagementPhase[] = [
  "intake",
  "qualification",
  "proposal",
  "negotiation",
];

// Active phases (signed and working)
export const ACTIVE_PHASES: EngagementPhase[] = ["signed", "delivery"];

// Closed phases
export const CLOSED_PHASES: EngagementPhase[] = ["completed", "archived"];

// ── Room Visibility ───────────────────────────────────────────────────────────

export type EngagementRoomVisibility =
  | "consultant_only"  // Internal only
  | "client_view"      // Client can see
  | "client_edit";     // Client can contribute

// ── Room Types ────────────────────────────────────────────────────────────────

export type EngagementRoomType =
  | "scope"          // Project scope and objectives
  | "research"       // Discovery and research findings
  | "deliverables"   // Work products
  | "meetings"       // Meeting notes and decisions
  | "outcomes"       // Results and impact
  | "documents"      // Contracts, SOWs, etc.
  | "communications" // Client comms log
  | "custom";

// ── Engagement Room Schema ────────────────────────────────────────────────────

export type EngagementRoomSchema = {
  id: string;
  key: string;
  label: string;
  type: EngagementRoomType;
  visibility: EngagementRoomVisibility;
  prompt?: string;                 // Instructions for this room
  required: boolean;
  orderIndex: number;
};

// ── Engagement Room (instance with content) ───────────────────────────────────

export type EngagementRoom = EngagementRoomSchema & {
  engagementId: string;
  blocks: EngagementBlock[];
  version: number;                 // Optimistic locking version
  createdAt: string;
  updatedAt: string;
};

// ── Engagement Block ──────────────────────────────────────────────────────────

export type EngagementBlock = {
  id: string;
  roomId: string;
  blockType: BlockType;
  content?: string;
  storagePath?: string;
  caption?: string;
  metadata?: Record<string, unknown>;
  orderIndex: number;
  version: number;                 // Optimistic locking version
  createdBy?: string;              // User who added this block
  createdAt: string;
  updatedAt?: string;              // Last update timestamp
  updatedBy?: string;              // User who last updated
  updatedByType?: "user" | "ai" | "system";  // Actor type
  // Render layer fields
  featured?: boolean;              // One featured block per room for highlight renders
  maskAnnotations?: MaskAnnotation[]; // Manual sensitive data annotations
};

// Mask annotation for sensitive data
export type MaskAnnotation = {
  start: number;
  end: number;
  placeholder: string;
};

// ── Block Version History ────────────────────────────────────────────────────

export type EngagementBlockVersion = {
  version: number;
  content?: string;
  metadata?: Record<string, unknown>;
  changedBy?: string;
  changedByType: "user" | "ai" | "system";
  changedAt: string;
  isCurrent?: boolean;
};

// ── Engagement Configuration ──────────────────────────────────────────────────

// Engagement type classification
export type EngagementTypeClassification =
  | "strategy"
  | "fractional"
  | "fractional_coo"
  | "fractional_cmo"
  | "ops_transformation"
  | "org_design"
  | "strategic_advisory"
  | "implementation"
  | "advisory"
  | "due_diligence"
  | "custom";

// Billing model for the engagement
export type EngagementBillingModel = "project" | "retainer" | "hourly" | "value_based";

export type Engagement = {
  id: string;
  slug: string;                    // URL-safe identifier
  name: string;                    // "Q1 Strategy Engagement"
  clientId: string;                // FK to Client
  phase: EngagementPhase;
  startDate?: string;              // ISO date
  endDate?: string;
  value?: number;                  // Contract value ($15K-$100K typical for ICP)
  currency: string;
  theme: "auto" | "light" | "warm" | "dark";
  rooms: EngagementRoom[];
  ownerId: string;                 // Practice owner
  version: number;                 // Optimistic locking version
  shareToken?: string;             // Portal access token
  shareTokenExpiresAt?: string;    // Token expiry
  // ICP-specific fields
  engagementType?: EngagementTypeClassification; // Type of engagement
  estimatedWeeks?: number;         // Duration (6-16 weeks typical for ICP)
  billingModel?: EngagementBillingModel; // How it's billed
  shareTokenRevokedAt?: string;    // Token revocation timestamp
  createdAt: string;
  updatedAt: string;
};

// ── Engagement Summary (for lists) ────────────────────────────────────────────

export type EngagementSummary = {
  id: string;
  slug: string;
  name: string;
  clientId: string;
  clientName: string;
  clientLogoUrl?: string;
  phase: EngagementPhase;
  value?: number;
  currency: string;
  startDate?: string;
  endDate?: string;
  roomCount: number;
  participantCount: number;
  lastActivityAt?: string;
};

// ── Engagement Stats ──────────────────────────────────────────────────────────

export type EngagementStats = {
  totalEngagements: number;
  activeEngagements: number;
  pipelineValue: number;
  deliveredValue: number;
  phaseBreakdown: Record<EngagementPhase, number>;
};

// ── Phase Transition ──────────────────────────────────────────────────────────

export type PhaseTransition = {
  id: string;
  engagementId: string;
  fromPhase: EngagementPhase | null; // null for initial creation
  toPhase: EngagementPhase;
  reason?: string;
  transitionedBy: string;
  transitionedAt: string;
};

// ── Default Room Templates ────────────────────────────────────────────────────

export const DEFAULT_ENGAGEMENT_ROOMS: Omit<EngagementRoomSchema, "id">[] = [
  {
    key: "scope",
    label: "Scope & Objectives",
    type: "scope",
    visibility: "client_view",
    prompt: "Define the project scope, objectives, and success criteria.",
    required: true,
    orderIndex: 0,
  },
  {
    key: "research",
    label: "Research & Discovery",
    type: "research",
    visibility: "consultant_only",
    prompt: "Document research findings, analysis, and insights.",
    required: false,
    orderIndex: 1,
  },
  {
    key: "deliverables",
    label: "Deliverables",
    type: "deliverables",
    visibility: "client_view",
    prompt: "Share completed work products and deliverables.",
    required: true,
    orderIndex: 2,
  },
  {
    key: "meetings",
    label: "Meetings & Decisions",
    type: "meetings",
    visibility: "client_view",
    prompt: "Record meeting notes, action items, and key decisions.",
    required: false,
    orderIndex: 3,
  },
  {
    key: "outcomes",
    label: "Outcomes & Impact",
    type: "outcomes",
    visibility: "client_view",
    prompt: "Track results, metrics, and impact achieved.",
    required: false,
    orderIndex: 4,
  },
  {
    key: "documents",
    label: "Documents",
    type: "documents",
    visibility: "consultant_only",
    prompt: "Store contracts, SOWs, and internal documents.",
    required: false,
    orderIndex: 5,
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

export function createEngagementId(): string {
  return crypto.randomUUID();
}

export function createEngagementRoomId(): string {
  return crypto.randomUUID();
}

export function createEngagementBlockId(): string {
  return crypto.randomUUID();
}

export function slugifyEngagementName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

export function isPipelinePhase(phase: EngagementPhase): boolean {
  return PIPELINE_PHASES.includes(phase);
}

export function isActivePhase(phase: EngagementPhase): boolean {
  return ACTIVE_PHASES.includes(phase);
}

export function isClosedPhase(phase: EngagementPhase): boolean {
  return CLOSED_PHASES.includes(phase);
}

export function getPhaseLabel(phase: EngagementPhase): string {
  const labels: Record<EngagementPhase, string> = {
    intake: "Intake",
    qualification: "Qualification",
    proposal: "Proposal",
    negotiation: "Negotiation",
    signed: "Signed",
    delivery: "Delivery",
    completed: "Completed",
    archived: "Archived",
  };
  return labels[phase];
}

export function getPhaseColor(phase: EngagementPhase): string {
  const colors: Record<EngagementPhase, string> = {
    intake: "text-gray-500",
    qualification: "text-yellow-500",
    proposal: "text-blue-500",
    negotiation: "text-orange-500",
    signed: "text-green-500",
    delivery: "text-purple-500",
    completed: "text-emerald-500",
    archived: "text-gray-400",
  };
  return colors[phase];
}

export function getRoomTypeLabel(type: EngagementRoomType): string {
  const labels: Record<EngagementRoomType, string> = {
    scope: "Scope",
    research: "Research",
    deliverables: "Deliverables",
    meetings: "Meetings",
    outcomes: "Outcomes",
    documents: "Documents",
    communications: "Communications",
    custom: "Custom",
  };
  return labels[type];
}

export function getVisibilityLabel(visibility: EngagementRoomVisibility): string {
  const labels: Record<EngagementRoomVisibility, string> = {
    consultant_only: "Consultant only",
    client_view: "Client can view",
    client_edit: "Client can edit",
  };
  return labels[visibility];
}

// ── Ingestion Job (Webhook reliability) ──────────────────────────────────────

export type IngestionJobStatus = "pending" | "processing" | "completed" | "failed" | "dead";
export type IngestionSource = "zoom" | "slack" | "email" | "teams" | "meet" | "discord" | "manual";

export type IngestionJob = {
  id: string;
  idempotencyKey: string;
  source: IngestionSource;
  sourceEventId?: string;
  sourcePayload?: Record<string, unknown>;
  engagementId?: string;
  matchedBy?: string;
  status: IngestionJobStatus;
  attempts: number;
  lastAttemptAt?: string;
  nextRetryAt?: string;
  errorMessage?: string;
  createdBlocks?: string[];
  transcriptId?: string;
  receivedAt: string;
  completedAt?: string;
  createdAt: string;
};

// ── Valid Phase Transitions ──────────────────────────────────────────────────

export const VALID_PHASE_TRANSITIONS: Record<EngagementPhase, EngagementPhase[]> = {
  intake: ["qualification", "archived"],
  qualification: ["intake", "proposal", "archived"],
  proposal: ["qualification", "negotiation", "signed", "archived"],
  negotiation: ["proposal", "signed", "archived"],
  signed: ["delivery", "archived"],
  delivery: ["completed", "archived"],
  completed: ["archived"],
  archived: [],
};

export function canTransitionPhase(from: EngagementPhase, to: EngagementPhase): boolean {
  return VALID_PHASE_TRANSITIONS[from].includes(to);
}
