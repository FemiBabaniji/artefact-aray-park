// ════════════════════════════════════════════════════════════════════════════
// Checkpoint Types - Engagement Workflow Milestones
// ════════════════════════════════════════════════════════════════════════════

import type { EngagementPhase } from "./engagement";

export type CheckpointType =
  | "approval"   // Client or stakeholder approval required
  | "delivery"   // Deliverable must be completed
  | "decision"   // Decision must be documented
  | "document"   // Document must be uploaded/shared
  | "review";    // Review must be completed

export type CheckpointStatus =
  | "pending"      // Not started
  | "in_progress"  // Currently being worked on
  | "completed"    // Done
  | "blocked"      // Cannot proceed
  | "skipped";     // Intentionally skipped

export type Checkpoint = {
  id: string;
  engagementId: string;
  label: string;
  description?: string;
  phase: EngagementPhase;
  checkpointType: CheckpointType;
  required: boolean;
  orderIndex: number;
  status: CheckpointStatus;
  completedAt?: string;
  completedBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type Guardrails = {
  id: string;
  engagementId: string;
  autoIngestEmails: boolean;
  autoIngestMeetings: boolean;
  requireApproval: boolean;
  allowClientUploads: boolean;
  allowedUploadRooms: string[];
  notifyOnPhaseChange: boolean;
  notifyOnClientUpload: boolean;
  notifyOnBlockAdded: boolean;
  requireCheckpoints: boolean;
  createdAt: string;
  updatedAt: string;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

export function getCheckpointTypeLabel(type: CheckpointType): string {
  const labels: Record<CheckpointType, string> = {
    approval: "Approval",
    delivery: "Delivery",
    decision: "Decision",
    document: "Document",
    review: "Review",
  };
  return labels[type];
}

export function getCheckpointStatusLabel(status: CheckpointStatus): string {
  const labels: Record<CheckpointStatus, string> = {
    pending: "Pending",
    in_progress: "In Progress",
    completed: "Completed",
    blocked: "Blocked",
    skipped: "Skipped",
  };
  return labels[status];
}

export function isCheckpointComplete(checkpoint: Checkpoint): boolean {
  return checkpoint.status === "completed" || checkpoint.status === "skipped";
}

export function canTransitionPhase(
  checkpoints: Checkpoint[],
  currentPhase: EngagementPhase,
  requireCheckpoints: boolean
): { canTransition: boolean; blockers: Checkpoint[] } {
  if (!requireCheckpoints) {
    return { canTransition: true, blockers: [] };
  }

  const phaseCheckpoints = checkpoints.filter(
    (c) => c.phase === currentPhase && c.required
  );

  const blockers = phaseCheckpoints.filter((c) => !isCheckpointComplete(c));

  return {
    canTransition: blockers.length === 0,
    blockers,
  };
}

// ── Default Checkpoints by Phase ─────────────────────────────────────────────

export const DEFAULT_CHECKPOINTS: Omit<Checkpoint, "id" | "engagementId" | "createdAt" | "updatedAt" | "status" | "completedAt" | "completedBy" | "notes">[] = [
  // Intake phase
  {
    label: "Initial call completed",
    description: "Complete discovery call with client",
    phase: "intake",
    checkpointType: "review",
    required: false,
    orderIndex: 0,
  },
  // Proposal phase
  {
    label: "Proposal approved",
    description: "Client has approved the project proposal",
    phase: "proposal",
    checkpointType: "approval",
    required: true,
    orderIndex: 0,
  },
  // Signed phase
  {
    label: "Contract signed",
    description: "Engagement contract has been signed",
    phase: "signed",
    checkpointType: "document",
    required: true,
    orderIndex: 0,
  },
  // Delivery phase
  {
    label: "Kickoff completed",
    description: "Project kickoff meeting completed",
    phase: "delivery",
    checkpointType: "review",
    required: false,
    orderIndex: 0,
  },
  {
    label: "First deliverable shared",
    description: "Initial deliverable shared with client",
    phase: "delivery",
    checkpointType: "delivery",
    required: true,
    orderIndex: 1,
  },
  // Completed phase
  {
    label: "Final review completed",
    description: "Client has reviewed and accepted final deliverables",
    phase: "completed",
    checkpointType: "approval",
    required: true,
    orderIndex: 0,
  },
];
