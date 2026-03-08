import { NextRequest, NextResponse } from "next/server";
import { getMembers } from "@/lib/data/members";

// GET /api/members?cohortId=xxx
export async function GET(request: NextRequest) {
  const cohortId = request.nextUrl.searchParams.get("cohortId") ?? undefined;

  const members = await getMembers(cohortId);

  return NextResponse.json(members);
}
