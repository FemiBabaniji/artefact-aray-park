// ════════════════════════════════════════════════════════════════════════════
// MCP Tools API
// GET /api/mcp/tools - List available tools with schemas
// POST /api/mcp/tools - Execute a tool
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getDemoAdminClient } from "@/lib/supabase/admin";
import { getToolSchemas, getToolByName, validateToolArguments } from "@/lib/mcp/tools";
import { executeTool, type ActorInfo } from "@/lib/mcp/executor";

// ── GET: List Tools ──────────────────────────────────────────────────────────

export async function GET() {
  const tools = getToolSchemas();

  return NextResponse.json({
    tools,
  });
}

// ── POST: Execute Tool ───────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const adminClient = getDemoAdminClient();

  if (!adminClient) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 500 }
    );
  }

  let body: {
    tool?: string;
    arguments?: Record<string, unknown>;
    actor?: {
      type?: "user" | "ai";
      id?: string;
      model?: string;
    };
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { tool: toolName, arguments: args } = body;

  // Validate tool name
  if (!toolName || typeof toolName !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid 'tool' field" },
      { status: 400 }
    );
  }

  // Find tool
  const tool = getToolByName(toolName);
  if (!tool) {
    return NextResponse.json(
      {
        error: `Unknown tool: ${toolName}`,
        availableTools: getToolSchemas().map((t) => t.name),
      },
      { status: 400 }
    );
  }

  // Validate arguments
  if (!args || typeof args !== "object") {
    return NextResponse.json(
      { error: "Missing or invalid 'arguments' field" },
      { status: 400 }
    );
  }

  const validation = validateToolArguments(tool, args);
  if (!validation.valid) {
    return NextResponse.json(
      {
        error: "Invalid arguments",
        details: validation.errors,
        schema: tool.inputSchema,
      },
      { status: 400 }
    );
  }

  // Determine actor (default to AI if not specified)
  const actor: ActorInfo = {
    type: body.actor?.type || "ai",
    id: body.actor?.id,
    model: body.actor?.model || "unknown",
  };

  // Execute tool
  const result = await executeTool(adminClient, toolName, args, actor);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    tool: toolName,
    result: result.data,
  });
}
