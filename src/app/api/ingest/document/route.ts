import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractPdfText, generateThumbnail } from "@/lib/ingest/extract";

// Document type for database operations (until types are regenerated)
interface DocumentRecord {
  id: string;
  artefact_id: string | null;
  filename: string;
  mime_type: string;
  size_bytes: number | null;
  file_url: string | null;
  thumbnail_url: string | null;
  extracted_text: string | null;
  page_count: number | null;
  status: string;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const artefactId = formData.get("artefactId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are supported" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const buffer = await file.arrayBuffer();

    // 1. Create document record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: doc, error: insertError } = await (supabase as any)
      .from("documents")
      .insert({
        artefact_id: artefactId,
        filename: file.name,
        mime_type: file.type,
        size_bytes: file.size,
        status: "processing",
      })
      .select()
      .single() as { data: DocumentRecord | null; error: Error | null };

    if (insertError || !doc) {
      console.error("Failed to create document record:", insertError);
      return NextResponse.json(
        { error: "Failed to create document record" },
        { status: 500 }
      );
    }

    // 2. Upload file to storage
    const filePath = `${doc.id}/${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Failed to upload file:", uploadError);
      // Update document with error
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("documents")
        .update({ status: "error", error_message: "Failed to upload file" })
        .eq("id", doc.id);
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl: fileUrl },
    } = supabase.storage.from("documents").getPublicUrl(filePath);

    // 3. Extract text (fast, no LLM)
    let text = "";
    let pageCount = 0;
    try {
      const extraction = await extractPdfText(buffer);
      text = extraction.text;
      pageCount = extraction.pageCount;
    } catch (extractError) {
      console.error("Failed to extract text:", extractError);
      // Continue anyway - text extraction is optional
    }

    // 4. Generate thumbnail
    let thumbnailUrl: string | null = null;
    try {
      const thumbnail = await generateThumbnail(buffer);
      if (thumbnail) {
        const thumbPath = `${doc.id}/thumbnail.png`;
        const { error: thumbError } = await supabase.storage
          .from("documents")
          .upload(thumbPath, thumbnail, {
            contentType: "image/png",
            upsert: true,
          });

        if (!thumbError) {
          const {
            data: { publicUrl },
          } = supabase.storage.from("documents").getPublicUrl(thumbPath);
          thumbnailUrl = publicUrl;
        }
      }
    } catch (thumbError) {
      console.error("Failed to generate thumbnail:", thumbError);
      // Continue anyway - thumbnail is optional
    }

    // 5. Update document with extracted data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from("documents")
      .update({
        status: "ready",
        file_url: fileUrl,
        thumbnail_url: thumbnailUrl,
        extracted_text: text,
        page_count: pageCount,
      })
      .eq("id", doc.id);

    if (updateError) {
      console.error("Failed to update document:", updateError);
    }

    return NextResponse.json({
      documentId: doc.id,
      filename: file.name,
      pageCount,
      thumbnailUrl,
      fileUrl,
      textLength: text.length,
    });
  } catch (error) {
    console.error("Document upload error:", error);
    return NextResponse.json(
      { error: "Failed to process document" },
      { status: 500 }
    );
  }
}

// GET: List documents for an artefact
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const artefactId = searchParams.get("artefactId");

  if (!artefactId) {
    return NextResponse.json(
      { error: "artefactId is required" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: documents, error } = await (supabase as any)
    .from("documents")
    .select("id, filename, thumbnail_url, file_url, page_count, status, created_at")
    .eq("artefact_id", artefactId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }

  return NextResponse.json({ documents });
}
