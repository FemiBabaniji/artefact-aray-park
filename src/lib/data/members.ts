// Data access layer — unified interface for stub and Supabase data sources.
// Set USE_SUPABASE=true in .env.local to switch to production database.

import type { Member } from "@/types/member";
import type { Section } from "@/types/section";
import type { Room, RoomStatus, TextContent, MediaItem, WorkItem } from "@/types/room";
import type { Program } from "@/types/program";
import { MEMBERS, INIT_ROOMS, PROGRAM } from "./seed";
import { roomToSection } from "@/types/section";

// Check if Supabase is configured
const useSupabase = process.env.USE_SUPABASE === "true";

// ─── Members ────────────────────────────────────────────────────────────────

export async function getMembers(cohortId?: string): Promise<Member[]> {
  if (useSupabase) {
    const { getMembersFromDb } = await import("./queries/members");
    return getMembersFromDb(cohortId);
  }
  return MEMBERS;
}

export async function getMember(memberId: string): Promise<Member | null> {
  if (useSupabase) {
    const { getMemberFromDb } = await import("./queries/members");
    return getMemberFromDb(memberId);
  }
  return MEMBERS.find((m) => m.id === memberId) ?? null;
}

export async function updateMember(
  memberId: string,
  updates: Partial<Pick<Member, "name" | "title" | "location" | "phone" | "avatarUrl">>
): Promise<Member | null> {
  if (useSupabase) {
    const { updateMemberFromDb } = await import("./queries/members");
    return updateMemberFromDb(memberId, updates);
  }
  const member = MEMBERS.find((m) => m.id === memberId);
  if (!member) return null;
  return { ...member, ...updates };
}

// ─── Rooms ──────────────────────────────────────────────────────────────────

export async function getRooms(memberId: string): Promise<Room[]> {
  if (useSupabase) {
    const { getRoomsFromDb } = await import("./queries/rooms");
    return getRoomsFromDb(memberId);
  }
  // Stub: only "am" has real data
  if (memberId === "am") return INIT_ROOMS;
  return INIT_ROOMS.map((r) => ({
    ...r,
    status: r.stageMarker === "ongoing" ? "ongoing" : "empty" as RoomStatus,
    content: r.roomType === "text"
      ? { type: "text" as const, data: { body: "" } }
      : undefined,
  }));
}

export async function getRoomWithContent(roomId: string): Promise<Room | null> {
  if (useSupabase) {
    const { getRoomWithContentFromDb } = await import("./queries/rooms");
    return getRoomWithContentFromDb(roomId);
  }
  // Stub: find room and return
  const room = INIT_ROOMS.find((r) => r.id === roomId);
  return room ?? null;
}

export async function updateRoomStatus(
  roomId: string,
  status: RoomStatus
): Promise<Room | null> {
  if (useSupabase) {
    const { updateRoomStatusFromDb } = await import("./queries/rooms");
    return updateRoomStatusFromDb(roomId, status);
  }
  const room = INIT_ROOMS.find((r) => r.id === roomId);
  if (!room) return null;
  return { ...room, status };
}

export async function updateTextContent(
  roomId: string,
  updates: { body?: string; feedback?: string; feedbackBy?: string }
): Promise<TextContent | null> {
  if (useSupabase) {
    const { updateTextContentFromDb } = await import("./queries/rooms");
    return updateTextContentFromDb(roomId, updates);
  }
  return {
    body: updates.body ?? "",
    feedback: updates.feedback,
    feedbackAt: updates.feedback ? new Date().toISOString() : undefined,
    feedbackBy: updates.feedbackBy,
  };
}

export async function submitRoom(
  roomId: string,
  content?: { body?: string }
): Promise<Room | null> {
  if (useSupabase) {
    const { submitRoomFromDb } = await import("./queries/rooms");
    return submitRoomFromDb(roomId, content);
  }
  const room = INIT_ROOMS.find((r) => r.id === roomId);
  if (!room) return null;
  return { ...room, status: "submitted" };
}

export async function reviewRoom(
  roomId: string,
  feedback: string,
  reviewerId: string,
  accept: boolean
): Promise<Room | null> {
  if (useSupabase) {
    const { reviewRoomFromDb } = await import("./queries/rooms");
    return reviewRoomFromDb(roomId, feedback, reviewerId, accept);
  }
  const room = INIT_ROOMS.find((r) => r.id === roomId);
  if (!room) return null;
  return { ...room, status: accept ? "accepted" : "reviewed" };
}

export async function addMediaItem(
  roomId: string,
  item: Omit<MediaItem, "id">
): Promise<MediaItem | null> {
  if (useSupabase) {
    const { addMediaItemFromDb } = await import("./queries/rooms");
    return addMediaItemFromDb(roomId, item);
  }
  return { ...item, id: `media_${Date.now()}` };
}

export async function deleteMediaItem(itemId: string): Promise<boolean> {
  if (useSupabase) {
    const { deleteMediaItemFromDb } = await import("./queries/rooms");
    return deleteMediaItemFromDb(itemId);
  }
  return true;
}

export async function addWorkItem(
  roomId: string,
  item: Omit<WorkItem, "id">
): Promise<WorkItem | null> {
  if (useSupabase) {
    const { addWorkItemFromDb } = await import("./queries/rooms");
    return addWorkItemFromDb(roomId, item);
  }
  return { ...item, id: `work_${Date.now()}` };
}

export async function updateWorkItem(
  itemId: string,
  updates: Partial<Omit<WorkItem, "id">>
): Promise<WorkItem | null> {
  if (useSupabase) {
    const { updateWorkItemFromDb } = await import("./queries/rooms");
    return updateWorkItemFromDb(itemId, updates);
  }
  return null;
}

export async function deleteWorkItem(itemId: string): Promise<boolean> {
  if (useSupabase) {
    const { deleteWorkItemFromDb } = await import("./queries/rooms");
    return deleteWorkItemFromDb(itemId);
  }
  return true;
}

// ─── Sections (Legacy - for backwards compatibility) ────────────────────────

export async function getSections(memberId: string): Promise<Section[]> {
  // Convert rooms to sections for backwards compatibility
  const rooms = await getRooms(memberId);
  return rooms
    .filter((r) => r.roomType === "text")
    .map(roomToSection);
}

export async function updateSection(
  memberId: string,
  sectionKey: string,
  updates: {
    status?: Section["status"];
    evidence?: string;
    feedback?: string;
    feedbackBy?: string;
  }
): Promise<Section | null> {
  if (useSupabase) {
    const { updateSectionFromDb } = await import("./queries/sections");
    return updateSectionFromDb(memberId, sectionKey, updates);
  }
  // Stub: find room and convert
  const rooms = await getRooms(memberId);
  const room = rooms.find((r) => r.key === sectionKey);
  if (!room) return null;

  const updatedRoom: Room = {
    ...room,
    status: updates.status ?? room.status,
    content: room.roomType === "text" ? {
      type: "text" as const,
      data: {
        body: updates.evidence ?? (room.content?.type === "text" ? room.content.data.body : ""),
        feedback: updates.feedback,
        feedbackAt: updates.feedback ? new Date().toISOString() : undefined,
        feedbackBy: updates.feedbackBy,
      },
    } : room.content,
  };

  return roomToSection(updatedRoom);
}

export async function submitSection(
  memberId: string,
  sectionKey: string,
  evidence: string
): Promise<Section | null> {
  if (useSupabase) {
    const { submitSectionFromDb } = await import("./queries/sections");
    return submitSectionFromDb(memberId, sectionKey, evidence);
  }
  return updateSection(memberId, sectionKey, { evidence, status: "submitted" });
}

export async function reviewSection(
  memberId: string,
  sectionKey: string,
  feedback: string,
  reviewerId: string,
  accept: boolean
): Promise<Section | null> {
  if (useSupabase) {
    const { reviewSectionFromDb } = await import("./queries/sections");
    return reviewSectionFromDb(memberId, sectionKey, feedback, reviewerId, accept);
  }
  return updateSection(memberId, sectionKey, {
    feedback,
    feedbackBy: reviewerId,
    status: accept ? "accepted" : "reviewed",
  });
}

// ─── Programs ───────────────────────────────────────────────────────────────

export async function getProgram(programId?: string): Promise<Program | null> {
  if (useSupabase) {
    const { getProgramFromDb } = await import("./queries/programs");
    return getProgramFromDb(programId);
  }
  return PROGRAM;
}

export async function getPrograms(communityId: string): Promise<Program[]> {
  if (useSupabase) {
    const { getProgramsFromDb } = await import("./queries/programs");
    return getProgramsFromDb(communityId);
  }
  return [PROGRAM];
}
