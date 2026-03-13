import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";

type Params = {
  params: Promise<{ id: string; roomKey: string; blockId: string }>;
};

// GET /api/engagements/[id]/rooms/[roomKey]/blocks/[blockId]/history - Get block version history
export async function GET(request: NextRequest, { params }: Params) {
  const { id, roomKey, blockId } = await params;
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const { supabase } = auth.context;

  try {
    // Verify room exists and belongs to engagement
    const { data: room } = await supabase
      .from("engagement_rooms")
      .select("id")
      .eq("engagement_id", id)
      .eq("key", roomKey)
      .single();

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Verify block exists
    const { data: block } = await supabase
      .from("engagement_blocks")
      .select("id, version, content, metadata, updated_by, updated_by_type, updated_at")
      .eq("id", blockId)
      .eq("room_id", room.id)
      .single();

    if (!block) {
      return NextResponse.json({ error: "Block not found" }, { status: 404 });
    }

    // Fetch version history
    const { data: versions, error } = await supabase
      .from("engagement_block_versions")
      .select("*")
      .eq("block_id", blockId)
      .order("version", { ascending: false });

    if (error) {
      console.error("Failed to fetch block history:", error);
      return NextResponse.json(
        { error: "Failed to fetch history" },
        { status: 500 }
      );
    }

    // Include current version as first entry
    const allVersions = [
      {
        version: block.version,
        content: block.content,
        metadata: block.metadata,
        changedBy: block.updated_by,
        changedByType: block.updated_by_type,
        changedAt: block.updated_at,
        isCurrent: true,
      },
      ...(versions ?? []).map((v) => ({
        version: v.version,
        content: v.content,
        metadata: v.metadata,
        changedBy: v.changed_by,
        changedByType: v.changed_by_type,
        changedAt: v.changed_at,
        isCurrent: false,
      })),
    ];

    return NextResponse.json({ versions: allVersions });
  } catch (error) {
    console.error("Block history error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
