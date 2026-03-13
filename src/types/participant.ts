// ════════════════════════════════════════════════════════════════════════════
// Participant Types - People in Engagements
// Consulting OS: Role-based access control for engagement rooms
// ════════════════════════════════════════════════════════════════════════════

// ── Participant Roles ─────────────────────────────────────────────────────────

export type ParticipantRole =
  | "lead_consultant"   // Primary consultant, full access
  | "consultant"        // Supporting consultant
  | "client_contact"    // Client stakeholder, can edit shared rooms
  | "client_observer"   // Client view-only
  | "observer";         // External observer

// ── Participant Access ────────────────────────────────────────────────────────

export type ParticipantAccess = {
  canEditRooms: string[];          // Room IDs they can edit
  canViewRooms: string[];          // Room IDs they can view
  canManageParticipants: boolean;
  canChangePhase: boolean;
  canExport: boolean;
};

// ── Participant Entity ────────────────────────────────────────────────────────

export type Participant = {
  id: string;
  engagementId: string;
  userId?: string;                 // If registered user
  clientContactId?: string;        // If client contact
  name: string;
  email: string;
  role: ParticipantRole;
  access: ParticipantAccess;
  invitedAt: string;
  invitedBy?: string;
  joinedAt?: string;
  lastActiveAt?: string;
};

// ── Participant Summary (for lists) ───────────────────────────────────────────

export type ParticipantSummary = {
  id: string;
  name: string;
  email: string;
  role: ParticipantRole;
  avatarUrl?: string;
  isOnline?: boolean;
  lastActiveAt?: string;
};

// ── Invitation ────────────────────────────────────────────────────────────────

export type ParticipantInvitation = {
  id: string;
  engagementId: string;
  email: string;
  name: string;
  role: ParticipantRole;
  invitedBy: string;
  invitedAt: string;
  expiresAt: string;
  acceptedAt?: string;
  token: string;
};

// ── Default Access by Role ────────────────────────────────────────────────────

export function getDefaultAccess(role: ParticipantRole): ParticipantAccess {
  switch (role) {
    case "lead_consultant":
      return {
        canEditRooms: ["*"],       // All rooms
        canViewRooms: ["*"],
        canManageParticipants: true,
        canChangePhase: true,
        canExport: true,
      };
    case "consultant":
      return {
        canEditRooms: ["*"],
        canViewRooms: ["*"],
        canManageParticipants: false,
        canChangePhase: false,
        canExport: true,
      };
    case "client_contact":
      return {
        canEditRooms: [],          // Set per-room based on visibility
        canViewRooms: [],          // Set per-room based on visibility
        canManageParticipants: false,
        canChangePhase: false,
        canExport: false,
      };
    case "client_observer":
      return {
        canEditRooms: [],
        canViewRooms: [],          // Set per-room based on visibility
        canManageParticipants: false,
        canChangePhase: false,
        canExport: false,
      };
    case "observer":
      return {
        canEditRooms: [],
        canViewRooms: [],
        canManageParticipants: false,
        canChangePhase: false,
        canExport: false,
      };
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function createParticipantId(): string {
  return crypto.randomUUID();
}

export function createInvitationToken(): string {
  return crypto.randomUUID();
}

export function isConsultant(role: ParticipantRole): boolean {
  return role === "lead_consultant" || role === "consultant";
}

export function isClient(role: ParticipantRole): boolean {
  return role === "client_contact" || role === "client_observer";
}

export function canEditRoom(
  participant: Participant,
  roomId: string
): boolean {
  if (participant.access.canEditRooms.includes("*")) return true;
  return participant.access.canEditRooms.includes(roomId);
}

export function canViewRoom(
  participant: Participant,
  roomId: string
): boolean {
  if (participant.access.canViewRooms.includes("*")) return true;
  if (participant.access.canEditRooms.includes("*")) return true;
  if (participant.access.canEditRooms.includes(roomId)) return true;
  return participant.access.canViewRooms.includes(roomId);
}

export function getRoleLabel(role: ParticipantRole): string {
  const labels: Record<ParticipantRole, string> = {
    lead_consultant: "Lead Consultant",
    consultant: "Consultant",
    client_contact: "Client Contact",
    client_observer: "Client Observer",
    observer: "Observer",
  };
  return labels[role];
}

export function getRoleColor(role: ParticipantRole): string {
  const colors: Record<ParticipantRole, string> = {
    lead_consultant: "text-purple-500",
    consultant: "text-blue-500",
    client_contact: "text-green-500",
    client_observer: "text-gray-500",
    observer: "text-gray-400",
  };
  return colors[role];
}
