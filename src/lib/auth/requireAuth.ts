import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SupabaseClient, User } from "@supabase/supabase-js";

export type AuthContext = {
  user: User;
  supabase: SupabaseClient;
};

export type AuthResult =
  | { success: true; context: AuthContext }
  | { success: false; response: NextResponse };

/**
 * Require authentication for a route handler.
 * Returns user and user-scoped Supabase client (respects RLS).
 *
 * Usage:
 * ```ts
 * export async function GET(request: NextRequest) {
 *   const auth = await requireAuth();
 *   if (!auth.success) return auth.response;
 *   const { user, supabase } = auth.context;
 *   // ... use supabase with RLS enforced
 * }
 * ```
 */
export async function requireAuth(): Promise<AuthResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 }
      ),
    };
  }

  return {
    success: true,
    context: { user, supabase },
  };
}

/**
 * Optional auth - returns user if authenticated, null otherwise.
 * Useful for routes that work differently for authenticated vs anonymous users.
 */
export async function optionalAuth(): Promise<AuthContext | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return { user, supabase };
}

/**
 * Get user ID from request, checking multiple sources:
 * 1. Session (authenticated user)
 * 2. X-Actor-Id header (for MCP/service calls with API key)
 * 3. Request body actorId field
 *
 * Returns null if no user can be identified.
 */
export async function getActorId(request: NextRequest): Promise<string | null> {
  // Try session first
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return user.id;
  }

  // Check header (for service-to-service calls)
  const headerActorId = request.headers.get("x-actor-id");
  if (headerActorId) {
    return headerActorId;
  }

  // Try to parse from body (for MCP tools)
  try {
    const body = await request.clone().json();
    if (body.actorId) {
      return body.actorId;
    }
  } catch {
    // Not JSON or no body
  }

  return null;
}

/**
 * Require ownership of an engagement.
 * Checks that the authenticated user owns the engagement.
 */
export async function requireEngagementOwner(
  engagementId: string
): Promise<AuthResult> {
  const auth = await requireAuth();
  if (!auth.success) return auth;

  const { user, supabase } = auth.context;

  const { data: engagement, error } = await supabase
    .from("engagements")
    .select("id, owner_id")
    .eq("id", engagementId)
    .single();

  if (error || !engagement) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Not found", message: "Engagement not found" },
        { status: 404 }
      ),
    };
  }

  if (engagement.owner_id !== user.id) {
    // Check if user is a participant
    const { data: participant } = await supabase
      .from("engagement_participants")
      .select("id")
      .eq("engagement_id", engagementId)
      .eq("user_id", user.id)
      .single();

    if (!participant) {
      return {
        success: false,
        response: NextResponse.json(
          { error: "Forbidden", message: "Access denied to this engagement" },
          { status: 403 }
        ),
      };
    }
  }

  return auth;
}
