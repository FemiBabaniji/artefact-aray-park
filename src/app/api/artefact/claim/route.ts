// ════════════════════════════════════════════════════════════════════════════
// Artefact Claim API
// POST /api/artefact/claim - Claim a guest artefact with authenticated user
// GET /api/artefact/claim - Check if user has a claimed artefact
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ArtefactEvent } from "@/types/events";
import type { RoomSemanticDB, BlockTypeDB, RoomVisibilityDB } from "@/lib/supabase/types";

type ClaimRequest = {
  artefactId: string;
  sessionId: string;
  events: ArtefactEvent[];
  slug?: string;
};

type ClaimResponse = {
  success: boolean;
  artefactId?: string;
  ownerId?: string;
  slug?: string;
  message?: string;
};

// Generate URL-safe slug
function generateSlug(email: string, fallback: string): string {
  const base = email.split("@")[0] || fallback;
  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
}

// Reconstruct state from events
function reconstructState(events: ArtefactEvent[]) {
  let identity = {
    name: "",
    title: "",
    bio: "",
    location: "",
    skills: [] as string[],
    links: [] as { label: string; url: string }[],
  };

  const roomsMap = new Map<
    string,
    {
      id: string;
      key: string;
      label: string;
      prompt?: string;
      visibility: string;
      orderIndex: number;
      blocks: Array<{
        id: string;
        blockType: string;
        content: string;
        orderIndex: number;
        metadata?: Record<string, unknown>;
      }>;
    }
  >();

  for (const event of events) {
    switch (event.type) {
      case "identity_updated":
        identity = { ...identity, ...event.payload };
        break;

      case "room_added": {
        const room = event.payload.room;
        roomsMap.set(room.id, {
          id: room.id,
          key: room.key,
          label: room.label,
          prompt: room.prompt,
          visibility: room.visibility || "public",
          orderIndex: room.orderIndex ?? roomsMap.size,
          blocks: [],
        });
        break;
      }

      case "room_updated": {
        const room = roomsMap.get(event.payload.roomId);
        if (room) {
          Object.assign(room, event.payload.updates);
        }
        break;
      }

      case "room_removed":
        roomsMap.delete(event.payload.roomId);
        break;

      case "block_added": {
        const room = roomsMap.get(event.payload.roomId);
        if (room) {
          room.blocks.push({
            id: event.payload.block.id,
            blockType: event.payload.block.blockType || "text",
            content: event.payload.block.content || "",
            orderIndex: event.payload.block.orderIndex ?? room.blocks.length,
            metadata: event.payload.block.metadata,
          });
        }
        break;
      }

      case "block_updated": {
        const room = roomsMap.get(event.payload.roomId);
        if (room) {
          const blockIdx = room.blocks.findIndex(
            (b) => b.id === event.payload.blockId
          );
          if (blockIdx !== -1) {
            room.blocks[blockIdx] = {
              ...room.blocks[blockIdx],
              ...event.payload.updates,
            };
          }
        }
        break;
      }

      case "block_removed": {
        const room = roomsMap.get(event.payload.roomId);
        if (room) {
          room.blocks = room.blocks.filter(
            (b) => b.id !== event.payload.blockId
          );
        }
        break;
      }

      case "blocks_reordered": {
        const room = roomsMap.get(event.payload.roomId);
        if (room) {
          const blockIds = event.payload.blockIds as string[];
          room.blocks.sort((a, b) => {
            const aIdx = blockIds.indexOf(a.id);
            const bIdx = blockIds.indexOf(b.id);
            return aIdx - bIdx;
          });
          room.blocks.forEach((block, idx) => {
            block.orderIndex = idx;
          });
        }
        break;
      }
    }
  }

  return {
    identity,
    rooms: Array.from(roomsMap.values()).sort(
      (a, b) => a.orderIndex - b.orderIndex
    ),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbClient = any;

export async function POST(request: NextRequest) {
  try {
    const supabase = (await createClient()) as DbClient;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<ClaimResponse>(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as ClaimRequest;
    const { sessionId, events, slug: requestedSlug } = body;

    if (!sessionId || !events) {
      return NextResponse.json<ClaimResponse>(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    if (events.length === 0 || events[0].type !== "artefact_created") {
      return NextResponse.json<ClaimResponse>(
        { success: false, message: "Invalid event log" },
        { status: 400 }
      );
    }

    const { identity, rooms } = reconstructState(events);
    const baseSlug =
      requestedSlug || generateSlug(user.email || "", sessionId.slice(0, 8));

    const { data: existingArtefact } = (await supabase
      .from("standalone_artefacts")
      .select("id, slug")
      .eq("user_id", user.id)
      .single()) as { data: { id: string; slug: string | null } | null };

    let artefactId: string;
    let finalSlug: string;

    if (existingArtefact) {
      artefactId = existingArtefact.id;
      finalSlug = existingArtefact.slug || baseSlug;

      await supabase
        .from("standalone_artefacts")
        .update({ identity, slug: finalSlug })
        .eq("id", artefactId);

      await supabase
        .from("standalone_rooms")
        .delete()
        .eq("artefact_id", artefactId);
    } else {
      const { data: slugTaken } = (await supabase
        .from("standalone_artefacts")
        .select("id")
        .eq("slug", baseSlug)
        .single()) as { data: { id: string } | null };

      finalSlug = slugTaken
        ? `${baseSlug}-${Date.now().toString(36).slice(-4)}`
        : baseSlug;

      const { data: newArtefact, error: createError } = (await supabase
        .from("standalone_artefacts")
        .insert({
          user_id: user.id,
          slug: finalSlug,
          identity,
        })
        .select("id")
        .single()) as { data: { id: string } | null; error: unknown };

      if (createError || !newArtefact) {
        console.error("Create artefact error:", createError);
        return NextResponse.json<ClaimResponse>(
          { success: false, message: "Failed to create artefact" },
          { status: 500 }
        );
      }

      artefactId = newArtefact.id;
    }

    for (const room of rooms) {
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
      const visibility: RoomVisibilityDB = (room.visibility ||
        "public") as RoomVisibilityDB;

      const { data: newRoom, error: roomError } = (await supabase
        .from("standalone_rooms")
        .insert({
          artefact_id: artefactId,
          key: room.key,
          label: room.label,
          prompt: room.prompt || null,
          semantic,
          visibility,
          order_index: room.orderIndex,
        })
        .select("id")
        .single()) as { data: { id: string } | null; error: unknown };

      if (roomError || !newRoom) {
        console.error("Create room error:", roomError);
        continue;
      }

      if (room.blocks.length > 0) {
        const blocksToInsert = room.blocks.map((block) => {
          const blockType: BlockTypeDB = (block.blockType ||
            "text") as BlockTypeDB;

          return {
            room_id: newRoom.id,
            type: blockType,
            content: {
              body: block.content || "",
              ...block.metadata,
            },
            order_index: block.orderIndex,
          };
        });

        const { error: blocksError } = await supabase
          .from("standalone_blocks")
          .insert(blocksToInsert);

        if (blocksError) {
          console.error("Create blocks error:", blocksError);
        }
      }
    }

    return NextResponse.json<ClaimResponse>({
      success: true,
      artefactId,
      ownerId: user.id,
      slug: finalSlug,
    });
  } catch (error) {
    console.error("Claim error:", error);
    return NextResponse.json<ClaimResponse>(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = (await createClient()) as DbClient;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({
        claimed: false,
        authenticated: false,
      });
    }

    const { data: artefact } = (await supabase
      .from("standalone_artefacts")
      .select("id, slug")
      .eq("user_id", user.id)
      .single()) as { data: { id: string; slug: string | null } | null };

    return NextResponse.json({
      claimed: !!artefact,
      authenticated: true,
      userId: user.id,
      artefactId: artefact?.id,
      slug: artefact?.slug,
    });
  } catch (error) {
    console.error("Claim check error:", error);
    return NextResponse.json(
      { claimed: false, authenticated: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
