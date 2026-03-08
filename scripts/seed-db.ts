// Run with: npx tsx scripts/seed-db.ts
// This creates the schema and seeds test data

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function seed() {
  console.log("🌱 Seeding database...\n");

  // 1. Create a community
  console.log("Creating community...");
  const { data: community, error: communityError } = await supabase
    .from("communities")
    .upsert({
      id: "c1",
      slug: "hxouse",
      name: "HXOUSE",
      tier: "pro",
    })
    .select()
    .single();

  if (communityError) {
    console.error("Community error:", communityError.message);
    // Try to check if table exists
    if (communityError.message.includes("does not exist")) {
      console.error("\n❌ Tables don't exist! Run the migrations first:");
      console.error("   1. Go to Supabase Dashboard → SQL Editor");
      console.error("   2. Run the contents of supabase/migrations/001_schema.sql");
      console.error("   3. Run the contents of supabase/migrations/002_rls.sql");
      console.error("   4. Run this script again\n");
      process.exit(1);
    }
    return;
  }
  console.log("✓ Community:", community?.name);

  // 2. Create a program
  console.log("Creating program...");
  const { data: program, error: programError } = await supabase
    .from("programs")
    .upsert({
      id: "p1",
      community_id: "c1",
      name: "Creative Incubator",
      subtitle: "Spring 2026",
      week: 6,
      total_weeks: 20,
      live: true,
    })
    .select()
    .single();

  if (programError) {
    console.error("Program error:", programError.message);
    return;
  }
  console.log("✓ Program:", program?.name);

  // 3. Create a cohort
  console.log("Creating cohort...");
  const { data: cohort, error: cohortError } = await supabase
    .from("cohorts")
    .upsert({
      id: "co1",
      program_id: "p1",
      name: "Spring 2026",
      start_date: "2026-01-15",
    })
    .select()
    .single();

  if (cohortError) {
    console.error("Cohort error:", cohortError.message);
    return;
  }
  console.log("✓ Cohort:", cohort?.name);

  // 4. Create test members
  console.log("Creating members...");
  const members = [
    { id: "am", name: "Ava Martinez", email: "ava@example.com", color: "#6366f1", stage: "development" },
    { id: "cb", name: "Carlos Bautista", email: "carlos@example.com", color: "#ec4899", stage: "foundation" },
    { id: "sp", name: "Sofia Park", email: "sofia@example.com", color: "#14b8a6", stage: "entry" },
    { id: "jl", name: "Jordan Lee", email: "jordan@example.com", color: "#f59e0b", stage: "showcase" },
    { id: "mn", name: "Maya Nakamura", email: "maya@example.com", color: "#8b5cf6", stage: "development" },
    { id: "dr", name: "David Rodriguez", email: "david@example.com", color: "#22c55e", stage: "foundation" },
  ];

  for (const m of members) {
    const initials = m.name.split(" ").map(n => n[0]).join("");
    const { error: memberError } = await supabase
      .from("members")
      .upsert({
        id: m.id,
        community_id: "c1",
        cohort_id: "co1",
        name: m.name,
        initials,
        email: m.email,
        color: m.color,
        stage: m.stage,
        title: "Creative",
        location: "Toronto, CA",
      });

    if (memberError) {
      console.error(`Member ${m.name} error:`, memberError.message);
    } else {
      console.log(`✓ Member: ${m.name}`);
    }
  }

  // 5. Create artefacts and sections for each member
  console.log("Creating artefacts and sections...");
  const sectionKeys = [
    { key: "practice", label: "Practice Statement", cp: 1 },
    { key: "focus", label: "Current Focus", cp: 1 },
    { key: "material", label: "Material Plan", cp: 1 },
    { key: "influences", label: "Influences", cp: 1 },
    { key: "series", label: "Project Series", cp: 2 },
    { key: "exhibition", label: "Exhibition Goals", cp: 2 },
    { key: "collab", label: "Collaboration Outreach", cp: 2 },
  ];

  for (const m of members) {
    // Create artefact
    const { data: artefact, error: artefactError } = await supabase
      .from("artefacts")
      .upsert({
        id: `art-${m.id}`,
        member_id: m.id,
        ws_content: "",
      })
      .select()
      .single();

    if (artefactError) {
      console.error(`Artefact for ${m.name} error:`, artefactError.message);
      continue;
    }

    // Create sections
    for (const s of sectionKeys) {
      const { error: sectionError } = await supabase
        .from("sections")
        .upsert({
          id: `${m.id}-${s.key}`,
          artefact_id: artefact.id,
          key: s.key,
          label: s.label,
          status: "empty",
          evidence: "",
          cp: s.cp,
        });

      if (sectionError) {
        console.error(`Section ${s.key} for ${m.name} error:`, sectionError.message);
      }
    }
    console.log(`✓ Artefact + sections for: ${m.name}`);
  }

  // 6. Create member profile for Ava (demo user)
  console.log("Creating demo profile for Ava...");
  const { error: profileError } = await supabase
    .from("member_profiles")
    .upsert({
      member_id: "am",
      practice: "I build immersive light environments that explore the boundaries between physical and digital space.",
      focus: "Developing a series of responsive installations that react to viewer presence and movement.",
      goals: ["Solo exhibition at a major gallery", "Collaboration with architects", "Residency abroad"],
      influences: ["James Turrell", "Olafur Eliasson", "teamLab"],
      skills: {
        Primary: ["Light Design", "Installation Art", "Creative Coding"],
        Tools: ["TouchDesigner", "Arduino", "Blender"],
        Mediums: ["LED", "Projection", "Glass"],
      },
      projects: [
        {
          name: "Liminal Spaces",
          works: [
            { title: "Threshold I", year: "2024" },
            { title: "Threshold II", year: "2025" },
          ],
        },
      ],
    });

  if (profileError) {
    console.error("Profile error:", profileError.message);
  } else {
    console.log("✓ Profile for Ava");
  }

  // Update some sections for Ava to show progress
  console.log("Updating Ava's sections...");
  await supabase
    .from("sections")
    .update({ status: "accepted", evidence: "I build immersive light environments..." })
    .eq("id", "am-practice");

  await supabase
    .from("sections")
    .update({ status: "accepted", evidence: "Developing responsive installations..." })
    .eq("id", "am-focus");

  await supabase
    .from("sections")
    .update({ status: "submitted", evidence: "Working with LED arrays and projection..." })
    .eq("id", "am-material");

  console.log("\n✅ Database seeded successfully!");
  console.log("   You can now run: npm run dev");
}

seed().catch(console.error);
