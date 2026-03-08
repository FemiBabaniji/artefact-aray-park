// Supabase query implementations for section data
// Types will be auto-generated once schema is deployed: npx supabase gen types typescript

import { getAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Section } from "@/types/section";

// Legacy section status (from sections table - doesn't include "ongoing")
type LegacySectionStatus = "empty" | "in_progress" | "submitted" | "reviewed" | "accepted";

// Use admin client for server-side reads (bypasses RLS when no user session)
async function getReadClient() {
  const admin = getAdminClient();
  if (admin) return admin;
  return createClient();
}

type DbSectionRow = {
  id: string;
  key: string;
  label: string;
  status: LegacySectionStatus;
  evidence: string;
  cp: number;
  feedback: string | null;
  feedback_at: string | null;
  feedback_by: string | null;
};

function mapSection(row: DbSectionRow): Section {
  return {
    id: row.key,
    label: row.label,
    status: row.status,
    evidence: row.evidence,
    cp: row.cp as 1 | 2,
    feedback: row.feedback ?? undefined,
    feedbackAt: row.feedback_at ?? undefined,
    feedbackBy: row.feedback_by ?? undefined,
  };
}

export async function getSectionsFromDb(memberId: string): Promise<Section[]> {
  const supabase = await getReadClient();

  // First get the artefact for this member
  const { data: artefact, error: artefactError } = await supabase
    .from("artefacts")
    .select("id")
    .eq("member_id", memberId)
    .single();

  if (artefactError || !artefact) {
    console.error("Error fetching artefact:", artefactError);
    return [];
  }

  const artefactId = (artefact as { id: string }).id;

  // Then get sections for that artefact
  const { data, error } = await supabase
    .from("sections")
    .select("*")
    .eq("artefact_id", artefactId)
    .order("cp", { ascending: true });

  if (error) {
    console.error("Error fetching sections:", error);
    return [];
  }

  return ((data as DbSectionRow[]) ?? []).map(mapSection);
}

export async function updateSectionFromDb(
  memberId: string,
  sectionKey: string,
  updates: {
    status?: LegacySectionStatus;
    evidence?: string;
    feedback?: string;
    feedbackBy?: string;
  }
): Promise<Section | null> {
  const supabase = await createClient();

  // Get artefact ID
  const { data: artefact, error: artefactError } = await supabase
    .from("artefacts")
    .select("id")
    .eq("member_id", memberId)
    .single();

  if (artefactError || !artefact) {
    console.error("Error fetching artefact:", artefactError);
    return null;
  }

  const artefactId = (artefact as { id: string }).id;

  const updateData: Record<string, string | undefined> = {};
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.evidence !== undefined) updateData.evidence = updates.evidence;
  if (updates.feedback !== undefined) {
    updateData.feedback = updates.feedback;
    updateData.feedback_at = new Date().toISOString();
  }
  if (updates.feedbackBy !== undefined) updateData.feedback_by = updates.feedbackBy;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("sections") as any)
    .update(updateData)
    .eq("artefact_id", artefactId)
    .eq("key", sectionKey)
    .select()
    .single();

  if (error || !data) {
    console.error("Error updating section:", error);
    return null;
  }

  return mapSection(data as DbSectionRow);
}

export async function submitSectionFromDb(
  memberId: string,
  sectionKey: string,
  evidence: string
): Promise<Section | null> {
  return updateSectionFromDb(memberId, sectionKey, {
    evidence,
    status: "submitted",
  });
}

export async function reviewSectionFromDb(
  memberId: string,
  sectionKey: string,
  feedback: string,
  reviewerId: string,
  accept: boolean
): Promise<Section | null> {
  return updateSectionFromDb(memberId, sectionKey, {
    feedback,
    feedbackBy: reviewerId,
    status: accept ? "accepted" : "reviewed",
  });
}
