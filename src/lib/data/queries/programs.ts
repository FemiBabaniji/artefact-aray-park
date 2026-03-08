// Supabase query implementations for program data
// Types will be auto-generated once schema is deployed: npx supabase gen types typescript

import { createClient } from "@/lib/supabase/server";
import type { Program } from "@/types/program";

type DbProgramRow = {
  id: string;
  name: string;
  subtitle: string | null;
  week: number;
  total_weeks: number;
  live: boolean;
};

function mapProgram(row: DbProgramRow): Program {
  return {
    name: row.name,
    subtitle: row.subtitle ?? "",
    week: row.week,
    totalWeeks: row.total_weeks,
    live: row.live,
  };
}

export async function getProgramFromDb(programId?: string): Promise<Program | null> {
  const supabase = await createClient();

  let query = supabase.from("programs").select("*");

  if (programId) {
    query = query.eq("id", programId);
  } else {
    // Get the first live program if no ID specified
    query = query.eq("live", true);
  }

  const { data, error } = await query.limit(1).single();

  if (error || !data) {
    console.error("Error fetching program:", error);
    return null;
  }

  return mapProgram(data as DbProgramRow);
}

export async function getProgramsFromDb(communityId: string): Promise<Program[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("programs")
    .select("*")
    .eq("community_id", communityId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching programs:", error);
    return [];
  }

  return ((data as DbProgramRow[]) ?? []).map(mapProgram);
}

export async function updateProgramWeekFromDb(
  programId: string,
  week: number
): Promise<Program | null> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("programs") as any)
    .update({ week })
    .eq("id", programId)
    .select()
    .single();

  if (error || !data) {
    console.error("Error updating program:", error);
    return null;
  }

  return mapProgram(data as DbProgramRow);
}
