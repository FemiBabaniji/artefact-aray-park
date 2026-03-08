/**
 * Database Seed Script
 *
 * Run with: npx tsx scripts/seed-database.ts
 *
 * Prerequisites:
 * - Supabase project created
 * - Environment variables set in .env.local
 * - Schema migrations applied
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/supabase/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing environment variables. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, serviceRoleKey);

const SECTION_SCHEMA = [
  { key: "practice",   label: "Practice Statement",    cp: 1 },
  { key: "focus",      label: "Current Focus",         cp: 1 },
  { key: "material",   label: "Material Sourcing Plan", cp: 1 },
  { key: "influences", label: "Influences & Context",   cp: 1 },
  { key: "series",     label: "Project Series",         cp: 2 },
  { key: "exhibition", label: "Exhibition Goals",       cp: 2 },
  { key: "collab",     label: "Collaboration Outreach", cp: 2 },
];

async function seed() {
  console.log("Seeding database...\n");

  // 1. Create community
  console.log("Creating community...");
  const { data: community, error: communityError } = await supabase
    .from("communities")
    .upsert({
      slug: "artefact",
      name: "Artefact",
      tagline: "Creative Incubator",
      accent_color: "#3b4f42",
    }, { onConflict: "slug" })
    .select()
    .single();

  if (communityError) {
    console.error("Error creating community:", communityError);
    process.exit(1);
  }
  console.log(`  Created community: ${community.name} (${community.id})\n`);

  // 2. Create program
  console.log("Creating program...");
  const { data: program, error: programError } = await supabase
    .from("programs")
    .upsert({
      community_id: community.id,
      name: "Creative Incubator",
      subtitle: "Spring Cohort 2025",
      week: 6,
      total_weeks: 20,
      live: true,
      section_schema: SECTION_SCHEMA,
    }, { onConflict: "community_id,name" })
    .select()
    .single();

  if (programError) {
    console.error("Error creating program:", programError);
    process.exit(1);
  }
  console.log(`  Created program: ${program.name} (${program.id})\n`);

  // 3. Create cohort
  console.log("Creating cohort...");
  const { data: cohort, error: cohortError } = await supabase
    .from("cohorts")
    .upsert({
      program_id: program.id,
      name: "Spring 2025",
    }, { onConflict: "program_id,name" })
    .select()
    .single();

  if (cohortError) {
    console.error("Error creating cohort:", cohortError);
    process.exit(1);
  }
  console.log(`  Created cohort: ${cohort.name} (${cohort.id})\n`);

  // 4. Create members
  console.log("Creating members...");
  const membersData = [
    {
      name: "Ava Martinez",
      initials: "AM",
      title: "Visual Artist & Spatial Designer",
      email: "ava@avamartinez.studio",
      phone: "+1 416 555 0192",
      location: "Toronto, ON",
      color: "#3b4f42",
      stage: "foundation" as const,
    },
    {
      name: "Marcus Chen",
      initials: "MC",
      title: "Interdisciplinary Artist",
      email: "mc@example.com",
      location: "Vancouver, BC",
      color: "#2e3d52",
      stage: "development" as const,
    },
    {
      name: "Elena Rodriguez",
      initials: "ER",
      title: "Sculptor & Installation Artist",
      email: "er@example.com",
      location: "Montreal, QC",
      color: "#4a3d5a",
      stage: "foundation" as const,
    },
    {
      name: "James Okonkwo",
      initials: "JO",
      title: "Performance & Media Artist",
      email: "jo@example.com",
      location: "Toronto, ON",
      color: "#52432e",
      stage: "showcase" as const,
    },
    {
      name: "Maya Patel",
      initials: "MP",
      title: "Digital & Textile Artist",
      email: "mp@example.com",
      location: "Calgary, AB",
      color: "#2e4a3d",
      stage: "graduate" as const,
    },
    {
      name: "David Kim",
      initials: "DK",
      title: "Photographer & Visual Artist",
      email: "dk@example.com",
      location: "Ottawa, ON",
      color: "#2e3a52",
      stage: "pending" as const,
    },
  ];

  for (const memberData of membersData) {
    const { data: member, error: memberError } = await supabase
      .from("members")
      .upsert({
        community_id: community.id,
        cohort_id: cohort.id,
        ...memberData,
      }, { onConflict: "community_id,email" })
      .select()
      .single();

    if (memberError) {
      console.error(`Error creating member ${memberData.name}:`, memberError);
      continue;
    }
    console.log(`  Created member: ${member.name}`);

    // Create artefact for member
    const { data: artefact, error: artefactError } = await supabase
      .from("artefacts")
      .upsert({
        member_id: member.id,
        ws_content: "",
      }, { onConflict: "member_id" })
      .select()
      .single();

    if (artefactError) {
      console.error(`Error creating artefact for ${memberData.name}:`, artefactError);
      continue;
    }

    // Create sections for artefact
    for (const schema of SECTION_SCHEMA) {
      const { error: sectionError } = await supabase
        .from("sections")
        .upsert({
          artefact_id: artefact.id,
          key: schema.key,
          label: schema.label,
          cp: schema.cp,
          status: "empty",
          evidence: "",
        }, { onConflict: "artefact_id,key" });

      if (sectionError) {
        console.error(`Error creating section ${schema.key}:`, sectionError);
      }
    }
  }

  // 5. Add sample data for Ava Martinez
  console.log("\nAdding sample data for Ava Martinez...");
  const { data: ava } = await supabase
    .from("members")
    .select("id")
    .eq("email", "ava@avamartinez.studio")
    .single();

  if (ava) {
    // Update profile
    await supabase.from("member_profiles").upsert({
      member_id: ava.id,
      practice: "I build environments that hold a feeling. Each project begins with a question: what does this space want to remember? Light as primary material — shifting perceptual ground beneath a viewer's feet.",
      focus: "Currently developing a new body of work around bioluminescent systems and civic space.",
      goals: ["International exhibition presence", "Bioluminescent materials research", "Urban planner collaborations"],
      influences: ["James Turrell", "Olafur Eliasson", "Ann Hamilton", "Rirkrit Tiravanija"],
      skills: {
        Primary: ["Environmental Design", "Light Sculpture", "Spatial Narrative"],
        Tools: ["Rhino 3D", "TouchDesigner", "QLab"],
        Mediums: ["Light", "Glass", "Resin", "Sound"],
      },
      projects: [
        { name: "Threshold Studies", works: [{ title: "Liminal I", year: "2025" }, { title: "Liminal II", year: "2025" }, { title: "Passage Membrane", year: "2024" }] },
        { name: "Memory Architectures", works: [{ title: "Residue", year: "2024" }, { title: "Palimpsest", year: "2023" }, { title: "Soft Infrastructure", year: "2023" }] },
      ],
    }, { onConflict: "member_id" });

    // Update sections with sample data
    const { data: artefact } = await supabase
      .from("artefacts")
      .select("id")
      .eq("member_id", ava.id)
      .single();

    if (artefact) {
      await supabase.from("sections").update({
        status: "accepted",
        evidence: "I build environments that hold a feeling…",
        feedback: "Strong opening. The light-as-material framing is distinctive. Consider adding one concrete example of a past work that embodies this.",
        feedback_at: new Date("2025-02-28").toISOString(),
      }).eq("artefact_id", artefact.id).eq("key", "practice");

      await supabase.from("sections").update({
        status: "submitted",
        evidence: "Bioluminescent systems + civic space",
      }).eq("artefact_id", artefact.id).eq("key", "focus");

      await supabase.from("sections").update({
        status: "in_progress",
      }).eq("artefact_id", artefact.id).eq("key", "material");

      await supabase.from("sections").update({
        status: "accepted",
        evidence: "Turrell, Eliasson, Hamilton",
        feedback: "Good range. Could you add one less-obvious influence to show independent thinking?",
        feedback_at: new Date("2025-03-01").toISOString(),
      }).eq("artefact_id", artefact.id).eq("key", "influences");

      await supabase.from("sections").update({
        status: "in_progress",
      }).eq("artefact_id", artefact.id).eq("key", "series");
    }

    console.log("  Updated Ava's profile and sections");
  }

  console.log("\nSeed complete!");
}

seed().catch(console.error);
