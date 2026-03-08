// Data access layer — unified interface for stub and Supabase data sources.
// Set USE_SUPABASE=true in .env.local to switch to production database.

import type { Member } from "@/types/member";
import type { Section, SectionStatus } from "@/types/section";
import type { Program } from "@/types/program";
import { MEMBERS, INIT, PROGRAM } from "./seed";

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
  // Stub: return updated member in memory (not persisted)
  const member = MEMBERS.find((m) => m.id === memberId);
  if (!member) return null;
  return { ...member, ...updates };
}

// ─── Sections ───────────────────────────────────────────────────────────────

export async function getSections(memberId: string): Promise<Section[]> {
  if (useSupabase) {
    const { getSectionsFromDb } = await import("./queries/sections");
    return getSectionsFromDb(memberId);
  }
  // Stub: only "am" has real data
  if (memberId === "am") return INIT;
  return INIT.map((s) => ({
    ...s,
    status: "empty" as const,
    evidence: "",
    feedback: undefined,
    feedbackAt: undefined,
  }));
}

export async function updateSection(
  memberId: string,
  sectionKey: string,
  updates: {
    status?: SectionStatus;
    evidence?: string;
    feedback?: string;
    feedbackBy?: string;
  }
): Promise<Section | null> {
  if (useSupabase) {
    const { updateSectionFromDb } = await import("./queries/sections");
    return updateSectionFromDb(memberId, sectionKey, updates);
  }
  // Stub: return updated section (not persisted)
  const section = INIT.find((s) => s.id === sectionKey);
  if (!section) return null;
  return {
    ...section,
    ...updates,
    feedbackAt: updates.feedback ? new Date().toISOString() : section.feedbackAt,
  };
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
