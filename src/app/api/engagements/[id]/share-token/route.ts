import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import crypto from "crypto";

type Params = {
  params: Promise<{ id: string }>;
};

// GET /api/engagements/[id]/share-token - Get current token info
export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const { supabase } = auth.context;

  try {
    const { data: engagement, error } = await supabase
      .from("engagements")
      .select("id, slug, share_token, share_token_expires_at, share_token_revoked_at")
      .eq("id", id)
      .single();

    if (error || !engagement) {
      return NextResponse.json({ error: "Engagement not found" }, { status: 404 });
    }

    const isExpired = engagement.share_token_expires_at
      ? new Date(engagement.share_token_expires_at) < new Date()
      : false;

    const isRevoked = !!engagement.share_token_revoked_at;

    return NextResponse.json({
      token: engagement.share_token,
      expiresAt: engagement.share_token_expires_at,
      revokedAt: engagement.share_token_revoked_at,
      isValid: !isExpired && !isRevoked,
      portalUrl: `/portal/${engagement.slug}?token=${engagement.share_token}`,
    });
  } catch (error) {
    console.error("Share token fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/engagements/[id]/share-token - Regenerate token
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const { user, supabase } = auth.context;

  try {
    const body = await request.json().catch(() => ({}));
    const { expiresInDays = 90 } = body;

    // Get current engagement
    const { data: engagement, error: fetchError } = await supabase
      .from("engagements")
      .select("id, slug, share_token")
      .eq("id", id)
      .single();

    if (fetchError || !engagement) {
      return NextResponse.json({ error: "Engagement not found" }, { status: 404 });
    }

    const oldToken = engagement.share_token;
    const newToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Log old token revocation
    if (oldToken) {
      await supabase.from("share_token_revocations").insert({
        engagement_id: id,
        old_token: oldToken,
        revoked_by: user.id,
        reason: "Token regenerated",
      });
    }

    // Update with new token
    const { data: updated, error: updateError } = await supabase
      .from("engagements")
      .update({
        share_token: newToken,
        share_token_expires_at: expiresAt.toISOString(),
        share_token_revoked_at: null,
      })
      .eq("id", id)
      .select("id, slug, share_token, share_token_expires_at")
      .single();

    if (updateError) {
      console.error("Failed to regenerate token:", updateError);
      return NextResponse.json(
        { error: "Failed to regenerate token" },
        { status: 500 }
      );
    }

    // Log event
    await supabase.rpc("insert_engagement_event", {
      p_engagement_id: id,
      p_event_type: "share_token_regenerated",
      p_payload: {
        expiresAt: expiresAt.toISOString(),
        previousTokenRevoked: !!oldToken,
      },
      p_actor_id: user.id,
      p_actor_type: "user",
    });

    return NextResponse.json({
      token: updated.share_token,
      expiresAt: updated.share_token_expires_at,
      portalUrl: `/portal/${updated.slug}?token=${updated.share_token}`,
    });
  } catch (error) {
    console.error("Token regeneration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/engagements/[id]/share-token - Extend or revoke token
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const { user, supabase } = auth.context;

  try {
    const body = await request.json();
    const { action, expiresInDays, reason } = body;

    if (!action || !["extend", "revoke", "unrevoke"].includes(action)) {
      return NextResponse.json(
        { error: "action must be 'extend', 'revoke', or 'unrevoke'" },
        { status: 400 }
      );
    }

    const { data: engagement, error: fetchError } = await supabase
      .from("engagements")
      .select("id, slug, share_token, share_token_expires_at")
      .eq("id", id)
      .single();

    if (fetchError || !engagement) {
      return NextResponse.json({ error: "Engagement not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};
    let eventType = "";
    let eventPayload: Record<string, unknown> = {};

    if (action === "extend") {
      const days = expiresInDays ?? 90;
      const newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + days);
      updates.share_token_expires_at = newExpiry.toISOString();
      eventType = "share_token_extended";
      eventPayload = { expiresAt: newExpiry.toISOString(), extendedByDays: days };
    } else if (action === "revoke") {
      updates.share_token_revoked_at = new Date().toISOString();
      eventType = "share_token_revoked";
      eventPayload = { reason: reason ?? "Manual revocation" };

      // Log to revocations table
      await supabase.from("share_token_revocations").insert({
        engagement_id: id,
        old_token: engagement.share_token,
        revoked_by: user.id,
        reason: reason ?? "Manual revocation",
      });
    } else if (action === "unrevoke") {
      updates.share_token_revoked_at = null;
      // Also extend expiry if it was expired
      const currentExpiry = engagement.share_token_expires_at
        ? new Date(engagement.share_token_expires_at)
        : null;
      if (!currentExpiry || currentExpiry < new Date()) {
        const newExpiry = new Date();
        newExpiry.setDate(newExpiry.getDate() + (expiresInDays ?? 30));
        updates.share_token_expires_at = newExpiry.toISOString();
      }
      eventType = "share_token_unrevoked";
      eventPayload = { newExpiresAt: updates.share_token_expires_at ?? engagement.share_token_expires_at };
    }

    const { data: updated, error: updateError } = await supabase
      .from("engagements")
      .update(updates)
      .eq("id", id)
      .select("id, slug, share_token, share_token_expires_at, share_token_revoked_at")
      .single();

    if (updateError) {
      console.error("Failed to update token:", updateError);
      return NextResponse.json(
        { error: "Failed to update token" },
        { status: 500 }
      );
    }

    // Log event
    await supabase.rpc("insert_engagement_event", {
      p_engagement_id: id,
      p_event_type: eventType,
      p_payload: eventPayload,
      p_actor_id: user.id,
      p_actor_type: "user",
    });

    const isExpired = updated.share_token_expires_at
      ? new Date(updated.share_token_expires_at) < new Date()
      : false;
    const isRevoked = !!updated.share_token_revoked_at;

    return NextResponse.json({
      token: updated.share_token,
      expiresAt: updated.share_token_expires_at,
      revokedAt: updated.share_token_revoked_at,
      isValid: !isExpired && !isRevoked,
      portalUrl: `/portal/${updated.slug}?token=${updated.share_token}`,
    });
  } catch (error) {
    console.error("Token update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
