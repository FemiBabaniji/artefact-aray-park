import { SupabaseClient } from "@supabase/supabase-js";

const ENGAGEMENT_FILES_BUCKET = "engagement-files";

export type FileUploadResult = {
  storagePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
};

/**
 * Upload a file to engagement storage
 * Path: engagements/{engagementId}/{roomKey}/{timestamp}-{filename}
 */
export async function uploadEngagementFile(
  supabase: SupabaseClient,
  file: File,
  engagementId: string,
  roomKey: string
): Promise<FileUploadResult> {
  const timestamp = Date.now();
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const storagePath = `engagements/${engagementId}/${roomKey}/${timestamp}-${sanitizedFileName}`;

  const { error } = await supabase.storage
    .from(ENGAGEMENT_FILES_BUCKET)
    .upload(storagePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  return {
    storagePath,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
  };
}

/**
 * Get a signed URL for downloading a file
 */
export async function getEngagementFileUrl(
  supabase: SupabaseClient,
  storagePath: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(ENGAGEMENT_FILES_BUCKET)
    .createSignedUrl(storagePath, expiresIn);

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to get file URL: ${error?.message || "Unknown error"}`);
  }

  return data.signedUrl;
}

/**
 * Delete a file from engagement storage
 */
export async function deleteEngagementFile(
  supabase: SupabaseClient,
  storagePath: string
): Promise<void> {
  const { error } = await supabase.storage
    .from(ENGAGEMENT_FILES_BUCKET)
    .remove([storagePath]);

  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

/**
 * List files in an engagement room
 */
export async function listEngagementFiles(
  supabase: SupabaseClient,
  engagementId: string,
  roomKey?: string
): Promise<{ name: string; size: number; createdAt: string }[]> {
  const path = roomKey
    ? `engagements/${engagementId}/${roomKey}`
    : `engagements/${engagementId}`;

  const { data, error } = await supabase.storage
    .from(ENGAGEMENT_FILES_BUCKET)
    .list(path);

  if (error) {
    throw new Error(`Failed to list files: ${error.message}`);
  }

  return (data ?? []).map((file) => ({
    name: file.name,
    size: file.metadata?.size ?? 0,
    createdAt: file.created_at,
  }));
}
