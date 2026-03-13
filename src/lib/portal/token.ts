import { SupabaseClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { createHash } from "crypto";

/**
 * Validate share token and return engagement if valid
 */
export async function validateShareToken(
  supabase: SupabaseClient,
  token: string
): Promise<{ id: string; slug: string; name: string } | null> {
  const { data, error } = await supabase
    .from("engagements")
    .select("id, slug, name")
    .eq("share_token", token)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

/**
 * Generate a viewer token from request (hash of IP + User-Agent)
 * Used for anonymous view tracking without storing PII
 */
export function generateViewerToken(request: NextRequest): string {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim()
    || request.headers.get("x-real-ip")
    || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";

  // Create a hash that's consistent for the same client but not reversible
  const hash = createHash("sha256")
    .update(`${ip}:${userAgent}`)
    .digest("hex")
    .slice(0, 32);

  return hash;
}

/**
 * Track a portal view (upsert)
 * Returns the last viewed timestamp for NEW badge calculation
 */
export async function trackPortalView(
  supabase: SupabaseClient,
  engagementId: string,
  viewerToken: string
): Promise<{ lastViewedAt: string | null }> {
  // First get the existing view record to return the previous timestamp
  const { data: existing } = await supabase
    .from("portal_views")
    .select("last_viewed_at")
    .eq("engagement_id", engagementId)
    .eq("viewer_token", viewerToken)
    .single();

  const previousViewedAt = existing?.last_viewed_at ?? null;

  // Upsert the view record
  const currentCount = (existing as { view_count?: number })?.view_count ?? 0;
  await supabase
    .from("portal_views")
    .upsert(
      {
        engagement_id: engagementId,
        viewer_token: viewerToken,
        last_viewed_at: new Date().toISOString(),
        view_count: currentCount + 1,
      },
      {
        onConflict: "engagement_id,viewer_token",
      }
    );

  return { lastViewedAt: previousViewedAt };
}

/**
 * Get portal URL for an engagement
 */
export function getPortalUrl(slug: string, shareToken?: string, baseUrl?: string): string {
  const base = baseUrl || (typeof window !== "undefined" ? window.location.origin : "");
  const url = new URL(`/portal/${slug}`, base);

  if (shareToken) {
    url.searchParams.set("token", shareToken);
  }

  return url.toString();
}
