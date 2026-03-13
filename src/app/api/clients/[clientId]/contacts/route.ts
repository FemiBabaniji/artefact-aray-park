import { NextRequest, NextResponse } from "next/server";
import { getDemoAdminClient } from "@/lib/supabase/admin";
import { createContactId } from "@/types/client";

type Params = {
  params: Promise<{ clientId: string }>;
};

// GET /api/clients/[clientId]/contacts - List contacts
export async function GET(request: NextRequest, { params }: Params) {
  const { clientId } = await params;
  const supabase = getDemoAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 500 }
    );
  }

  try {
    const { data, error } = await supabase
      .from("client_contacts")
      .select("*")
      .eq("client_id", clientId)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to fetch contacts:", error);
      return NextResponse.json(
        { error: "Failed to fetch contacts" },
        { status: 500 }
      );
    }

    return NextResponse.json({ contacts: data ?? [] });
  } catch (error) {
    console.error("Contacts fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/clients/[clientId]/contacts - Add contact
export async function POST(request: NextRequest, { params }: Params) {
  const { clientId } = await params;
  const supabase = getDemoAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { name, email, phone, title, isPrimary, notes } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "name and email are required" },
        { status: 400 }
      );
    }

    // If this is primary, unset other primary contacts
    if (isPrimary) {
      await supabase
        .from("client_contacts")
        .update({ is_primary: false })
        .eq("client_id", clientId);
    }

    const contactId = createContactId();

    const { data, error } = await supabase
      .from("client_contacts")
      .insert({
        id: contactId,
        client_id: clientId,
        name,
        email,
        phone,
        title,
        is_primary: isPrimary ?? false,
        notes,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create contact:", error);
      return NextResponse.json(
        { error: "Failed to create contact" },
        { status: 500 }
      );
    }

    return NextResponse.json({ contact: data }, { status: 201 });
  } catch (error) {
    console.error("Contact creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/clients/[clientId]/contacts - Delete contact (contactId in body)
export async function DELETE(request: NextRequest, { params }: Params) {
  const { clientId } = await params;
  const supabase = getDemoAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { contactId } = body;

    if (!contactId) {
      return NextResponse.json(
        { error: "contactId is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("client_contacts")
      .delete()
      .eq("id", contactId)
      .eq("client_id", clientId);

    if (error) {
      console.error("Failed to delete contact:", error);
      return NextResponse.json(
        { error: "Failed to delete contact" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact deletion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
