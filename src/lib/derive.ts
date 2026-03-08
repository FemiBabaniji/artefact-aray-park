import type { Section } from "@/types/section";
import type { Room, StageMarker } from "@/types/room";
import type { Stage, Member } from "@/types/member";

export const STAGE_ORDER: Stage[] = [
  "pending", "entry", "foundation", "development", "showcase", "graduate",
];

export const STAGES: { id: Stage; label: string; color: string }[] = [
  { id: "pending",     label: "Pending",     color: "rgba(255,255,255,0.18)" },
  { id: "entry",       label: "Entry",       color: "#3b4a3f" },
  { id: "foundation",  label: "Foundation",  color: "#2e3d52" },
  { id: "development", label: "Development", color: "#3d2e52" },
  { id: "showcase",    label: "Showcase",    color: "#52432e" },
  { id: "graduate",    label: "Graduate",    color: "#2e4a3d" },
];

// ── Room-based functions ────────────────────────────────────────────────────

export function getAcceptedRoomCount(rooms: Room[]): number {
  // Exclude ongoing rooms from accepted count
  return rooms.filter(r => r.status === "accepted" && r.stageMarker !== "ongoing").length;
}

export function getTotalGatedRooms(rooms: Room[]): number {
  // Only count rooms that have a submission workflow (not ongoing)
  return rooms.filter(r => r.stageMarker !== "ongoing").length;
}

export function getRoomProgress(rooms: Room[]): number {
  const total = getTotalGatedRooms(rooms);
  if (!total) return 0;
  return Math.round((getAcceptedRoomCount(rooms) / total) * 100);
}

export function getRoomsByStageMarker(rooms: Room[], marker: StageMarker): Room[] {
  return rooms.filter(r => r.stageMarker === marker);
}

export function getEarlyRoomProgress(rooms: Room[]): { done: number; total: number; percent: number } {
  const earlyRooms = getRoomsByStageMarker(rooms, "early");
  const done = earlyRooms.filter(r => r.status === "accepted").length;
  const total = earlyRooms.length;
  return { done, total, percent: total > 0 ? Math.round((done / total) * 100) : 0 };
}

export function getLaterRoomProgress(rooms: Room[]): { done: number; total: number; percent: number } {
  const laterRooms = getRoomsByStageMarker(rooms, "later");
  const done = laterRooms.filter(r => r.status === "accepted").length;
  const total = laterRooms.length;
  return { done, total, percent: total > 0 ? Math.round((done / total) * 100) : 0 };
}

export function validateRoomStageTransition(
  rooms: Room[],
  toStage: Stage,
): { ok: boolean; reason?: string } {
  // Foundation stage requires all "early" rooms to be accepted
  if (toStage === "foundation") {
    const earlyRooms = getRoomsByStageMarker(rooms, "early");
    const allAccepted = earlyRooms.every(r => r.status === "accepted");
    if (!allAccepted) {
      const pending = earlyRooms.filter(r => r.status !== "accepted").length;
      return { ok: false, reason: `${pending} early room(s) not yet accepted` };
    }
  }

  // Development/showcase stages require all "later" rooms to be accepted
  if (toStage === "development" || toStage === "showcase") {
    const laterRooms = getRoomsByStageMarker(rooms, "later");
    const allAccepted = laterRooms.every(r => r.status === "accepted");
    if (!allAccepted) {
      const pending = laterRooms.filter(r => r.status !== "accepted").length;
      return { ok: false, reason: `${pending} later room(s) not yet accepted` };
    }
  }

  return { ok: true };
}

export function computeRoomRisk(
  rooms: Room[],
  lastActivity: Date,
  currentWeek: number,
  totalWeeks: number,
): boolean {
  const accepted = getAcceptedRoomCount(rooms);
  const total = getTotalGatedRooms(rooms);
  const daysSince = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
  const expectedByNow = Math.floor((currentWeek / totalWeeks) * total);
  return accepted < 3 && daysSince > 10 && accepted < expectedByNow;
}

// ── Legacy section-based functions (for backwards compatibility) ────────────

export function getAcceptedCount(sections: Section[]): number {
  return sections.filter(s => s.status === "accepted").length;
}

export function getProgress(sections: Section[]): number {
  if (!sections.length) return 0;
  return Math.round((getAcceptedCount(sections) / sections.length) * 100);
}

export function computeRisk(
  member: Member,
  lastActivity: Date,
  currentWeek: number,
  totalWeeks: number,
): boolean {
  const daysSince = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
  const expectedByNow = Math.floor((currentWeek / totalWeeks) * member.sections);
  return member.accepted < 3 && daysSince > 10 && member.accepted < expectedByNow;
}

export function getNextStage(current: Stage): Stage | null {
  const idx = STAGE_ORDER.indexOf(current);
  return idx >= 0 && idx < STAGE_ORDER.length - 1 ? STAGE_ORDER[idx + 1] : null;
}

export function validateStageTransition(
  sections: Section[],
  toStage: Stage,
): { ok: boolean; reason?: string } {
  // Convert sections to rooms and use room-based validation
  const rooms: Room[] = sections.map(s => ({
    id: s.id,
    key: s.id,
    label: s.label,
    roomType: "text" as const,
    stageMarker: s.cp === 1 ? "early" : "later" as const,
    status: s.status,
    orderIndex: 0,
    isPublic: true,
  }));

  return validateRoomStageTransition(rooms, toStage);
}
