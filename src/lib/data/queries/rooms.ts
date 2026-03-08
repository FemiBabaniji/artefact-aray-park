// Supabase query implementations for room data
// Note: Types for new tables (rooms, room_content_*) are not yet generated.
// Use `as any` to bypass strict typing until schema is deployed and types regenerated.

import { getAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type {
  Room,
  RoomType,
  StageMarker,
  RoomStatus,
  TextContent,
  MediaItem,
  WorkItem,
  ProcessEntry,
} from "@/types/room";

async function getReadClient() {
  const admin = getAdminClient();
  if (admin) return admin;
  return createClient();
}

// Database row types
type DbRoomRow = {
  id: string;
  artefact_id: string;
  key: string;
  label: string;
  room_type: RoomType;
  stage_marker: StageMarker;
  prompt: string | null;
  status: RoomStatus;
  order_index: number;
  is_public: boolean;
};

type DbTextContentRow = {
  room_id: string;
  body: string;
  feedback: string | null;
  feedback_at: string | null;
  feedback_by: string | null;
};

type DbMediaRow = {
  id: string;
  room_id: string;
  media_type: string;
  url: string | null;
  storage_path: string | null;
  caption: string | null;
  position_x: number | null;
  position_y: number | null;
  width: number | null;
  height: number | null;
  order_index: number;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  og_site_name: string | null;
};

type DbWorksRow = {
  id: string;
  room_id: string;
  title: string;
  year: string | null;
  medium: string | null;
  description: string | null;
  url: string | null;
  order_index: number;
};

type DbProcessRow = {
  id: string;
  room_id: string;
  entry_date: string;
  note: string | null;
  order_index: number;
};

// Mappers
function mapRoom(row: DbRoomRow): Room {
  return {
    id: row.id,
    key: row.key,
    label: row.label,
    roomType: row.room_type,
    stageMarker: row.stage_marker,
    prompt: row.prompt ?? undefined,
    status: row.status,
    orderIndex: row.order_index,
    isPublic: row.is_public,
  };
}

function mapMediaItem(row: DbMediaRow): MediaItem {
  return {
    id: row.id,
    mediaType: row.media_type as MediaItem["mediaType"],
    url: row.url ?? undefined,
    storagePath: row.storage_path ?? undefined,
    caption: row.caption ?? undefined,
    positionX: row.position_x ?? undefined,
    positionY: row.position_y ?? undefined,
    width: row.width ?? undefined,
    height: row.height ?? undefined,
    orderIndex: row.order_index,
    ogTitle: row.og_title ?? undefined,
    ogDescription: row.og_description ?? undefined,
    ogImage: row.og_image ?? undefined,
    ogSiteName: row.og_site_name ?? undefined,
  };
}

function mapWorkItem(row: DbWorksRow): WorkItem {
  return {
    id: row.id,
    title: row.title,
    year: row.year ?? undefined,
    medium: row.medium ?? undefined,
    description: row.description ?? undefined,
    url: row.url ?? undefined,
    orderIndex: row.order_index,
  };
}

// Get all rooms for a member
export async function getRoomsFromDb(memberId: string): Promise<Room[]> {
  const supabase = await getReadClient();

  // Get artefact for this member
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

  // Get rooms
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("artefact_id", artefactId)
    .order("order_index", { ascending: true });

  if (error) {
    console.error("Error fetching rooms:", error);
    return [];
  }

  return ((data as DbRoomRow[]) ?? []).map(mapRoom);
}

// Get room with content
export async function getRoomWithContentFromDb(roomId: string): Promise<Room | null> {
  const supabase = await getReadClient();

  // Get room
  const { data: roomData, error: roomError } = await supabase
    .from("rooms")
    .select("*")
    .eq("id", roomId)
    .single();

  if (roomError || !roomData) {
    console.error("Error fetching room:", roomError);
    return null;
  }

  const room = mapRoom(roomData as DbRoomRow);

  // Load content based on room type
  switch (room.roomType) {
    case "text": {
      const { data } = await supabase
        .from("room_content_text")
        .select("*")
        .eq("room_id", roomId)
        .single();

      if (data) {
        const row = data as DbTextContentRow;
        room.content = {
          type: "text",
          data: {
            body: row.body,
            feedback: row.feedback ?? undefined,
            feedbackAt: row.feedback_at ?? undefined,
            feedbackBy: row.feedback_by ?? undefined,
          },
        };
      }
      break;
    }

    case "gallery":
    case "moodboard":
    case "links":
    case "embed": {
      const { data } = await supabase
        .from("room_content_media")
        .select("*")
        .eq("room_id", roomId)
        .order("order_index", { ascending: true });

      if (data) {
        const items = (data as DbMediaRow[]).map(mapMediaItem);
        if (room.roomType === "embed") {
          room.content = { type: "embed", data: { item: items[0] } };
        } else if (room.roomType === "gallery") {
          room.content = { type: "gallery", data: { items } };
        } else if (room.roomType === "moodboard") {
          room.content = { type: "moodboard", data: { items } };
        } else {
          room.content = { type: "links", data: { items } };
        }
      }
      break;
    }

    case "works": {
      const { data } = await supabase
        .from("room_content_works")
        .select("*")
        .eq("room_id", roomId)
        .order("order_index", { ascending: true });

      if (data) {
        room.content = {
          type: "works",
          data: { items: (data as DbWorksRow[]).map(mapWorkItem) },
        };
      }
      break;
    }

    case "process": {
      const { data: entries } = await supabase
        .from("room_content_process")
        .select("*, room_process_images(*)")
        .eq("room_id", roomId)
        .order("order_index", { ascending: true });

      if (entries) {
        room.content = {
          type: "process",
          data: {
            entries: (entries as (DbProcessRow & { room_process_images: { id: string; storage_path: string; caption: string | null; order_index: number }[] })[]).map(e => ({
              id: e.id,
              entryDate: e.entry_date,
              note: e.note ?? undefined,
              orderIndex: e.order_index,
              images: e.room_process_images.map(img => ({
                id: img.id,
                storagePath: img.storage_path,
                caption: img.caption ?? undefined,
                orderIndex: img.order_index,
              })),
            })),
          },
        };
      }
      break;
    }
  }

  return room;
}

// Update room status
export async function updateRoomStatusFromDb(
  roomId: string,
  status: RoomStatus
): Promise<Room | null> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("rooms") as any)
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", roomId)
    .select()
    .single();

  if (error || !data) {
    console.error("Error updating room status:", error);
    return null;
  }

  return mapRoom(data as DbRoomRow);
}

// Update text content
export async function updateTextContentFromDb(
  roomId: string,
  updates: {
    body?: string;
    feedback?: string;
    feedbackBy?: string;
  }
): Promise<TextContent | null> {
  const supabase = await createClient();

  const updateData: Record<string, unknown> = {};
  if (updates.body !== undefined) updateData.body = updates.body;
  if (updates.feedback !== undefined) {
    updateData.feedback = updates.feedback;
    updateData.feedback_at = new Date().toISOString();
  }
  if (updates.feedbackBy !== undefined) updateData.feedback_by = updates.feedbackBy;

  // Upsert to handle case where content doesn't exist yet
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("room_content_text") as any)
    .upsert({ room_id: roomId, ...updateData }, { onConflict: "room_id" })
    .select()
    .single();

  if (error || !data) {
    console.error("Error updating text content:", error);
    return null;
  }

  const row = data as DbTextContentRow;
  return {
    body: row.body,
    feedback: row.feedback ?? undefined,
    feedbackAt: row.feedback_at ?? undefined,
    feedbackBy: row.feedback_by ?? undefined,
  };
}

// Submit room (for text, gallery, works rooms)
export async function submitRoomFromDb(
  roomId: string,
  content?: { body?: string }
): Promise<Room | null> {
  const supabase = await createClient();

  // Update content if provided
  if (content?.body !== undefined) {
    await updateTextContentFromDb(roomId, { body: content.body });
  }

  // Update status
  return updateRoomStatusFromDb(roomId, "submitted");
}

// Review room
export async function reviewRoomFromDb(
  roomId: string,
  feedback: string,
  reviewerId: string,
  accept: boolean
): Promise<Room | null> {
  const supabase = await createClient();

  // Get room to check type
  const { data: roomData } = await supabase
    .from("rooms")
    .select("room_type")
    .eq("id", roomId)
    .single();

  if (!roomData) return null;

  const roomType = (roomData as { room_type: RoomType }).room_type;

  // For text rooms, update the feedback in content table
  if (roomType === "text") {
    await updateTextContentFromDb(roomId, { feedback, feedbackBy: reviewerId });
  }

  // Update status
  return updateRoomStatusFromDb(roomId, accept ? "accepted" : "reviewed");
}

// Add media item
export async function addMediaItemFromDb(
  roomId: string,
  item: Omit<MediaItem, "id">
): Promise<MediaItem | null> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("room_content_media") as any)
    .insert({
      room_id: roomId,
      media_type: item.mediaType,
      url: item.url,
      storage_path: item.storagePath,
      caption: item.caption,
      position_x: item.positionX,
      position_y: item.positionY,
      width: item.width,
      height: item.height,
      order_index: item.orderIndex,
      og_title: item.ogTitle,
      og_description: item.ogDescription,
      og_image: item.ogImage,
      og_site_name: item.ogSiteName,
    })
    .select()
    .single();

  if (error || !data) {
    console.error("Error adding media item:", error);
    return null;
  }

  return mapMediaItem(data as DbMediaRow);
}

// Delete media item
export async function deleteMediaItemFromDb(itemId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("room_content_media")
    .delete()
    .eq("id", itemId);

  if (error) {
    console.error("Error deleting media item:", error);
    return false;
  }

  return true;
}

// Add work item
export async function addWorkItemFromDb(
  roomId: string,
  item: Omit<WorkItem, "id">
): Promise<WorkItem | null> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("room_content_works") as any)
    .insert({
      room_id: roomId,
      title: item.title,
      year: item.year,
      medium: item.medium,
      description: item.description,
      url: item.url,
      order_index: item.orderIndex,
    })
    .select()
    .single();

  if (error || !data) {
    console.error("Error adding work item:", error);
    return null;
  }

  return mapWorkItem(data as DbWorksRow);
}

// Update work item
export async function updateWorkItemFromDb(
  itemId: string,
  updates: Partial<Omit<WorkItem, "id">>
): Promise<WorkItem | null> {
  const supabase = await createClient();

  const updateData: Record<string, unknown> = {};
  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.year !== undefined) updateData.year = updates.year;
  if (updates.medium !== undefined) updateData.medium = updates.medium;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.url !== undefined) updateData.url = updates.url;
  if (updates.orderIndex !== undefined) updateData.order_index = updates.orderIndex;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("room_content_works") as any)
    .update(updateData)
    .eq("id", itemId)
    .select()
    .single();

  if (error || !data) {
    console.error("Error updating work item:", error);
    return null;
  }

  return mapWorkItem(data as DbWorksRow);
}

// Delete work item
export async function deleteWorkItemFromDb(itemId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("room_content_works")
    .delete()
    .eq("id", itemId);

  if (error) {
    console.error("Error deleting work item:", error);
    return false;
  }

  return true;
}
