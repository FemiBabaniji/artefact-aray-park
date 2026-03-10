// ════════════════════════════════════════════════════════════════════════════
// Artefact Publish API
// POST /api/artefact/publish - Sync artefact to database and publish
// Requires authentication - guests must sign in first
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Identity, StandaloneRoom } from "@/types/artefact";
import type { RoomSemanticDB, BlockTypeDB, RoomVisibilityDB } from "@/lib/supabase/types";

type PublishRequest = {
  identity: Identity;
  rooms: StandaloneRoom[];
  slug?: string;
};

type PublishResponse = {
  success: boolean;
  artefactId?: string;
  slug?: string;
  publicUrl?: string;
  message?: string;
};

// Generate URL-safe slug from name
function generateSlug(name: string, fallback: string): string {
  if (!name) return fallback;
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32) || fallback;
}

// Type for artefact row
type ArtefactRow = { id: string; user_id: string | null };

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = (await request.json()) as PublishRequest;
    const { identity, rooms, slug: requestedSlug } = body;

    if (!identity) {
      return NextResponse.json(
        { success: false, message: "Identity is required" },
        { status: 400 }
      );
    }

    // Require authentication - guests cannot publish
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: "Authentication required. Please sign in to publish your artefact." },
        { status: 401 }
      );
    }

    // Generate slug
    const baseSlug = requestedSlug || generateSlug(identity.name, `artefact-${Date.now().toString(36)}`);

    // Check if slug is available
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingData } = await (supabase as any)
      .from("standalone_artefacts")
      .select("id, user_id")
      .eq("slug", baseSlug)
      .single();

    const existingSlug = existingData as ArtefactRow | null;

    let finalSlug = baseSlug;
    let artefactId: string;

    // If slug exists and belongs to current user, update it
    if (existingSlug) {
      if (user && existingSlug.user_id === user.id) {
        artefactId = existingSlug.id;
      } else {
        // Generate unique slug
        finalSlug = `${baseSlug}-${Date.now().toString(36).slice(-4)}`;

        // Create new artefact
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: newArtefactData, error: createError } = await (supabase as any)
          .from("standalone_artefacts")
          .insert({
            user_id: user?.id || null,
            slug: finalSlug,
            identity: identity,
          })
          .select("id")
          .single();

        const newArtefact = newArtefactData as { id: string } | null;

        if (createError || !newArtefact) {
          console.error("Create artefact error:", createError);
          return NextResponse.json(
            { success: false, message: "Failed to create artefact" },
            { status: 500 }
          );
        }
        artefactId = newArtefact.id;
      }
    } else {
      // Create new artefact
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: newArtefactData, error: createError } = await (supabase as any)
        .from("standalone_artefacts")
        .insert({
          user_id: user?.id || null,
          slug: finalSlug,
          identity: identity,
        })
        .select("id")
        .single();

      const newArtefact = newArtefactData as { id: string } | null;

      if (createError || !newArtefact) {
        console.error("Create artefact error:", createError);
        return NextResponse.json(
          { success: false, message: "Failed to create artefact" },
          { status: 500 }
        );
      }
      artefactId = newArtefact.id;
    }

    // Update artefact identity if it already existed
    if (existingSlug && user && existingSlug.user_id === user.id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("standalone_artefacts")
        .update({ identity: identity })
        .eq("id", artefactId);

      // Delete existing rooms (cascade deletes blocks)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("standalone_rooms")
        .delete()
        .eq("artefact_id", artefactId);
    }

    // Insert rooms and blocks
    for (const room of rooms) {
      // Map room semantic from key
      const semanticMap: Record<string, RoomSemanticDB> = {
        about: "about",
        projects: "projects",
        skills: "skills",
        experience: "experience",
        education: "education",
        timeline: "timeline",
        metrics: "metrics",
        network: "network",
      };
      const semantic: RoomSemanticDB = semanticMap[room.key] || "custom";
      const visibility: RoomVisibilityDB = (room.visibility || "public") as RoomVisibilityDB;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: newRoomData, error: roomError } = await (supabase as any)
        .from("standalone_rooms")
        .insert({
          artefact_id: artefactId,
          key: room.key,
          label: room.label,
          prompt: room.prompt || null,
          semantic: semantic,
          visibility: visibility,
          order_index: room.orderIndex,
        })
        .select("id")
        .single();

      const newRoom = newRoomData as { id: string } | null;

      if (roomError || !newRoom) {
        console.error("Create room error:", roomError);
        continue;
      }

      // Insert blocks
      if (room.blocks && room.blocks.length > 0) {
        const blocksToInsert = room.blocks.map((block) => {
          // Map block type - handle both old and new format
          const blockType: BlockTypeDB = (block.blockType || "text") as BlockTypeDB;

          // Build content object based on block type
          let content: Record<string, unknown> = {};

          if (blockType === "text" || blockType === "image" || blockType === "link" || blockType === "embed") {
            // Legacy block format
            content = {
              body: block.content || "",
              storagePath: block.storagePath,
              caption: block.caption,
              ...block.metadata,
            };
          } else {
            // Typed block format - content is already structured
            content = block.metadata || {};
            if (block.content) {
              content.body = block.content;
            }
          }

          return {
            room_id: newRoom.id,
            type: blockType,
            content: content,
            order_index: block.orderIndex,
          };
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: blocksError } = await (supabase as any)
          .from("standalone_blocks")
          .insert(blocksToInsert);

        if (blocksError) {
          console.error("Create blocks error:", blocksError);
        }
      }
    }

    const response: PublishResponse = {
      success: true,
      artefactId,
      slug: finalSlug,
      publicUrl: `/p/${finalSlug}`,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Publish error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
