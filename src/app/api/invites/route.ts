import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendBulkInvites } from "@/lib/email/resend";

// POST /api/invites - Send bulk invites from CSV data
const InviteSchema = z.object({
  invites: z.array(z.object({
    email: z.string().email(),
    name: z.string().min(1),
  })),
  communityName: z.string(),
  programName: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { invites, communityName, programName } = InviteSchema.parse(body);

    // Get base URL from request
    const baseUrl = new URL(request.url).origin;

    // Send invites
    const results = await sendBulkInvites(
      invites,
      communityName,
      programName,
      baseUrl
    );

    return NextResponse.json({
      success: true,
      sent: results.sent,
      failed: results.failed,
      errors: results.errors,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid invite data", issues: error.issues },
        { status: 400 }
      );
    }
    console.error("[INVITES] Error:", error);
    return NextResponse.json(
      { error: "Failed to send invites" },
      { status: 500 }
    );
  }
}

// Helper endpoint to parse CSV
// POST /api/invites/parse - Parse CSV to invite list
export async function PUT(request: NextRequest) {
  try {
    const text = await request.text();
    const lines = text.trim().split("\n");

    // Detect header row
    const firstLine = lines[0].toLowerCase();
    const hasHeader = firstLine.includes("email") || firstLine.includes("name");
    const dataLines = hasHeader ? lines.slice(1) : lines;

    const invites: Array<{ email: string; name: string }> = [];
    const errors: string[] = [];

    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i].trim();
      if (!line) continue;

      // Support both comma and tab delimiters
      const parts = line.includes("\t")
        ? line.split("\t")
        : line.split(",").map(p => p.trim());

      if (parts.length < 2) {
        errors.push(`Line ${i + 1}: Missing name or email`);
        continue;
      }

      // Detect which column is email
      const emailIndex = parts[0].includes("@") ? 0 : 1;
      const nameIndex = emailIndex === 0 ? 1 : 0;

      const email = parts[emailIndex].trim().replace(/^["']|["']$/g, "");
      const name = parts[nameIndex].trim().replace(/^["']|["']$/g, "");

      if (!email.includes("@")) {
        errors.push(`Line ${i + 1}: Invalid email "${email}"`);
        continue;
      }

      invites.push({ email, name });
    }

    return NextResponse.json({
      invites,
      count: invites.length,
      errors,
    });
  } catch (error) {
    console.error("[INVITES] Parse error:", error);
    return NextResponse.json(
      { error: "Failed to parse CSV" },
      { status: 400 }
    );
  }
}
