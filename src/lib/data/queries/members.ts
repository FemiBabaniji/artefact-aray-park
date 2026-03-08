// Supabase query implementations for member data
// Types will be auto-generated once schema is deployed: npx supabase gen types typescript

import { getAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Member, MemberProfile, Stage } from "@/types/member";

// Use admin client for server-side reads (bypasses RLS when no user session)
async function getReadClient() {
  const admin = getAdminClient();
  if (admin) return admin;
  return createClient();
}

type DbMemberRow = {
  id: string;
  name: string;
  initials: string | null;
  title: string | null;
  email: string;
  phone: string | null;
  location: string | null;
  color: string;
  avatar_url: string | null;
  stage: Stage;
  member_profiles?: DbProfileRow[];
  member_progress?: DbProgressRow[];
};

type DbProfileRow = {
  practice: string | null;
  focus: string | null;
  goals: string[];
  influences: string[];
  skills: unknown;
  projects: unknown;
};

type DbProgressRow = {
  member_id: string;
  total_sections: number;
  accepted_sections: number;
};

function mapMember(row: DbMemberRow): Member {
  const profile = row.member_profiles?.[0];
  const progress = row.member_progress?.[0];

  const memberProfile: MemberProfile | undefined = profile
    ? {
        practice: profile.practice ?? "",
        focus: profile.focus ?? "",
        goals: profile.goals ?? [],
        influences: profile.influences ?? [],
        skills: (profile.skills as MemberProfile["skills"]) ?? {
          Primary: [],
          Tools: [],
          Mediums: [],
        },
        projects: (profile.projects as MemberProfile["projects"]) ?? [],
        availability: undefined,
      }
    : undefined;

  return {
    id: row.id,
    name: row.name,
    initials: row.initials ?? row.name.split(" ").map((n) => n[0]).join(""),
    title: row.title ?? "",
    email: row.email,
    phone: row.phone ?? undefined,
    location: row.location ?? "",
    avatarUrl: row.avatar_url ?? undefined,
    color: row.color,
    stage: row.stage,
    risk: false,
    sections: progress?.total_sections ?? 7,
    accepted: progress?.accepted_sections ?? 0,
    profile: memberProfile,
  };
}

export async function getMembersFromDb(cohortId?: string): Promise<Member[]> {
  const supabase = await getReadClient();

  let query = supabase
    .from("members")
    .select(`
      *,
      member_profiles (*),
      member_progress (*)
    `);

  if (cohortId) {
    query = query.eq("cohort_id", cohortId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching members:", {
      message: error.message,
      code: error.code,
      hint: error.hint,
      details: error.details,
    });

    // If the view doesn't exist, try without it
    if (error.message?.includes("member_progress") || error.code === "42P01") {
      console.log("Retrying without member_progress view...");
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("members")
        .select("*, member_profiles (*)");

      if (fallbackError) {
        console.error("Fallback query also failed:", fallbackError.message);
        return [];
      }

      return ((fallbackData as DbMemberRow[]) ?? []).map(mapMember);
    }

    return [];
  }

  return ((data as DbMemberRow[]) ?? []).map(mapMember);
}

export async function getMemberFromDb(memberId: string): Promise<Member | null> {
  const supabase = await getReadClient();

  const { data, error } = await supabase
    .from("members")
    .select(`
      *,
      member_profiles (*),
      member_progress (*)
    `)
    .eq("id", memberId)
    .single();

  if (error || !data) {
    console.error("Error fetching member:", error);
    return null;
  }

  return mapMember(data as DbMemberRow);
}

export async function updateMemberFromDb(
  memberId: string,
  updates: Partial<Pick<Member, "name" | "title" | "location" | "phone" | "avatarUrl">>
): Promise<Member | null> {
  const supabase = await createClient();

  const updateData: Record<string, string | undefined> = {};
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.location !== undefined) updateData.location = updates.location;
  if (updates.phone !== undefined) updateData.phone = updates.phone;
  if (updates.avatarUrl !== undefined) updateData.avatar_url = updates.avatarUrl;

  if (Object.keys(updateData).length === 0) {
    return getMemberFromDb(memberId);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("members") as any)
    .update(updateData)
    .eq("id", memberId);

  if (error) {
    console.error("Error updating member:", error);
    return null;
  }

  return getMemberFromDb(memberId);
}
