import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";

type Params = {
  params: Promise<{ id: string }>;
};

// GET /api/engagements/[id]/guardrails - Get guardrail settings
export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;

  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const { supabase } = auth.context;

  try {
    // Verify engagement exists
    const { data: engagement } = await supabase
      .from("engagements")
      .select("id")
      .eq("id", id)
      .single();

    if (!engagement) {
      return NextResponse.json(
        { error: "Engagement not found" },
        { status: 404 }
      );
    }

    // Get or create guardrails
    let { data: guardrails } = await supabase
      .from("engagement_guardrails")
      .select("*")
      .eq("engagement_id", id)
      .single();

    // Create default if not exists
    if (!guardrails) {
      const { data: newGuardrails, error } = await supabase
        .from("engagement_guardrails")
        .insert({ engagement_id: id })
        .select()
        .single();

      if (error) {
        console.error("Guardrails creation error:", error);
        return NextResponse.json(
          { error: "Failed to create guardrails" },
          { status: 500 }
        );
      }

      guardrails = newGuardrails;
    }

    return NextResponse.json({
      guardrails: {
        id: guardrails.id,
        engagementId: guardrails.engagement_id,
        autoIngestEmails: guardrails.auto_ingest_emails,
        autoIngestMeetings: guardrails.auto_ingest_meetings,
        requireApproval: guardrails.require_approval,
        allowClientUploads: guardrails.allow_client_uploads,
        allowedUploadRooms: guardrails.allowed_upload_rooms,
        notifyOnPhaseChange: guardrails.notify_on_phase_change,
        notifyOnClientUpload: guardrails.notify_on_client_upload,
        notifyOnBlockAdded: guardrails.notify_on_block_added,
        requireCheckpoints: guardrails.require_checkpoints,
        createdAt: guardrails.created_at,
        updatedAt: guardrails.updated_at,
      },
    });
  } catch (error) {
    console.error("Guardrails error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/engagements/[id]/guardrails - Update guardrail settings
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;

  const auth = await requireAuth();
  if (!auth.success) return auth.response;
  const { supabase } = auth.context;

  try {
    const body = await request.json();
    const {
      autoIngestEmails,
      autoIngestMeetings,
      requireApproval,
      allowClientUploads,
      allowedUploadRooms,
      notifyOnPhaseChange,
      notifyOnClientUpload,
      notifyOnBlockAdded,
      requireCheckpoints,
    } = body;

    // Verify engagement exists
    const { data: engagement } = await supabase
      .from("engagements")
      .select("id")
      .eq("id", id)
      .single();

    if (!engagement) {
      return NextResponse.json(
        { error: "Engagement not found" },
        { status: 404 }
      );
    }

    // Build updates
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (autoIngestEmails !== undefined) updates.auto_ingest_emails = autoIngestEmails;
    if (autoIngestMeetings !== undefined) updates.auto_ingest_meetings = autoIngestMeetings;
    if (requireApproval !== undefined) updates.require_approval = requireApproval;
    if (allowClientUploads !== undefined) updates.allow_client_uploads = allowClientUploads;
    if (allowedUploadRooms !== undefined) updates.allowed_upload_rooms = allowedUploadRooms;
    if (notifyOnPhaseChange !== undefined) updates.notify_on_phase_change = notifyOnPhaseChange;
    if (notifyOnClientUpload !== undefined) updates.notify_on_client_upload = notifyOnClientUpload;
    if (notifyOnBlockAdded !== undefined) updates.notify_on_block_added = notifyOnBlockAdded;
    if (requireCheckpoints !== undefined) updates.require_checkpoints = requireCheckpoints;

    // Upsert guardrails
    const { data: guardrails, error } = await supabase
      .from("engagement_guardrails")
      .upsert(
        { engagement_id: id, ...updates },
        { onConflict: "engagement_id" }
      )
      .select()
      .single();

    if (error) {
      console.error("Guardrails update error:", error);
      return NextResponse.json(
        { error: "Failed to update guardrails" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      guardrails: {
        id: guardrails.id,
        engagementId: guardrails.engagement_id,
        autoIngestEmails: guardrails.auto_ingest_emails,
        autoIngestMeetings: guardrails.auto_ingest_meetings,
        requireApproval: guardrails.require_approval,
        allowClientUploads: guardrails.allow_client_uploads,
        allowedUploadRooms: guardrails.allowed_upload_rooms,
        notifyOnPhaseChange: guardrails.notify_on_phase_change,
        notifyOnClientUpload: guardrails.notify_on_client_upload,
        notifyOnBlockAdded: guardrails.notify_on_block_added,
        requireCheckpoints: guardrails.require_checkpoints,
        createdAt: guardrails.created_at,
        updatedAt: guardrails.updated_at,
      },
    });
  } catch (error) {
    console.error("Guardrails error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
