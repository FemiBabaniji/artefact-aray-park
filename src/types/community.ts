import type { Member } from "./member";
import type { RoomStatus } from "./room";

// Room schema from community config
export type RoomSchema = {
  id: string;
  key: string;
  label: string;
  type: "about" | "projects" | "metrics" | "timeline" | "custom";
  shared: boolean;
  visibility: "public" | "community" | "private";
};

// Community configuration
export type CommunityConfig = {
  id: string;
  name: string;
  cohort?: string;
  logo?: string;
  theme: "auto" | "light" | "warm" | "dark";
  rooms: RoomSchema[];
  memberCount: number;
  createdAt: string;
  ownerId: string;
};

// Room progress for a member
export type RoomProgressItem = {
  roomKey: string;
  roomLabel: string;
  status: RoomStatus;
  completionPercent: number;
};

// Dashboard-specific member view
export type DashboardMember = Member & {
  artefactId?: string;
  company?: string;
  lastActivity: string;
  roomProgress: RoomProgressItem[];
  activityCount: number;
};

// Activity feed item
export type ActivityAction = "added" | "updated" | "uploaded" | "submitted" | "completed";

export type ActivityItem = {
  id: string;
  memberId: string;
  memberName: string;
  action: ActivityAction;
  target: string;
  targetType: "room" | "block" | "document" | "profile";
  timestamp: string;
};

// Alert types for intervention
export type AlertType = "inactive" | "missing_room" | "incomplete_profile" | "deadline";

export type Alert = {
  id: string;
  type: AlertType;
  memberId: string;
  memberName: string;
  message: string;
  severity: "warning" | "critical";
  roomKey?: string;
  daysInactive?: number;
};

// Member status for operational view
export type MemberStatus = "complete" | "in_progress" | "behind" | "needs_attention" | "not_started";

// Dashboard summary stats - operational view
export type DashboardStats = {
  memberCount: number;
  activityThisWeek: number;
  // Status breakdown instead of percentages
  statusCounts: {
    complete: number;
    inProgress: number;
    behind: number;
    needsAttention: number;
    notStarted: number;
  };
};

// Cohort progress map data
export type CohortRoomProgress = {
  key: string;
  label: string;
  completedCount: number;
  inProgressCount: number;
  emptyCount: number;
  totalMembers: number;
};

export type CohortProgressMap = {
  rooms: CohortRoomProgress[];
};
