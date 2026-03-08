import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const ApplicationSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  title: z.string().optional(),
  location: z.string().optional(),
  phone: z.string().optional(),
  practice: z.string().optional(),
  focus: z.string().optional(),
  goals: z.array(z.string()).optional(),
  influences: z.array(z.string()).optional(),
  communityId: z.string().uuid().optional(),
});

// Default section schema for new artefacts
const SECTION_SCHEMA = [
  { key: "practice", label: "Practice Statement", cp: 1 },
  { key: "focus", label: "Current Focus", cp: 1 },
  { key: "material", label: "Material Sourcing Plan", cp: 1 },
  { key: "influences", label: "Influences & Context", cp: 1 },
  { key: "series", label: "Project Series", cp: 2 },
  { key: "exhibition", label: "Exhibition Goals", cp: 2 },
  { key: "collab", label: "Collaboration Outreach", cp: 2 },
];

// Generate a color from name for visual identity
function generateColor(name: string): string {
  const colors = ["#3b4f42", "#2e3d52", "#4a3d5a", "#52432e", "#2e4a3d", "#2e3a52"];
  const hash = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

// POST /api/apply
// Creates a new member application with artefact and sections
export async function POST(request: NextRequest) {
  if (process.env.USE_SUPABASE !== "true") {
    // Stub mode - return fake success with fake ID
    return NextResponse.json({
      success: true,
      memberId: "stub-" + Date.now(),
      message: "Application saved (stub mode - not persisted)",
    });
  }

  try {
    const body = await request.json();
    const data = ApplicationSchema.parse(body);

    const supabase = await createClient();

    // Get default community if not specified
    let communityId = data.communityId;
    if (!communityId) {
      const { data: community } = await supabase
        .from("communities")
        .select("id")
        .limit(1)
        .single();
      communityId = (community as { id: string } | null)?.id;
    }

    if (!communityId) {
      return NextResponse.json(
        { error: "No community found. Please set up a community first." },
        { status: 400 }
      );
    }

    // Generate initials
    const initials = data.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    // Create member
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: member, error: memberError } = await (supabase.from("members") as any)
      .insert({
        community_id: communityId,
        name: data.name,
        email: data.email,
        initials,
        title: data.title,
        location: data.location,
        phone: data.phone,
        color: generateColor(data.name),
        stage: "pending",
      })
      .select()
      .single();

    if (memberError) {
      console.error("Error creating member:", memberError);
      if (memberError.code === "23505") {
        return NextResponse.json(
          { error: "An application with this email already exists." },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: "Failed to create application" }, { status: 500 });
    }

    const memberId = (member as { id: string }).id;

    // Create member profile
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("member_profiles") as any).insert({
      member_id: memberId,
      practice: data.practice,
      focus: data.focus,
      goals: data.goals ?? [],
      influences: data.influences ?? [],
    });

    // Create artefact
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: artefact, error: artefactError } = await (supabase.from("artefacts") as any)
      .insert({
        member_id: memberId,
        ws_content: "",
      })
      .select()
      .single();

    if (artefactError) {
      console.error("Error creating artefact:", artefactError);
      return NextResponse.json({ error: "Failed to create artefact" }, { status: 500 });
    }

    const artefactId = (artefact as { id: string }).id;

    // Create sections
    const sectionsToCreate = SECTION_SCHEMA.map((s) => ({
      artefact_id: artefactId,
      key: s.key,
      label: s.label,
      cp: s.cp,
      status: "empty",
      evidence: "",
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("sections") as any).insert(sectionsToCreate);

    return NextResponse.json({
      success: true,
      memberId,
      message: "Application submitted successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", issues: error.issues },
        { status: 400 }
      );
    }
    console.error("Application error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
