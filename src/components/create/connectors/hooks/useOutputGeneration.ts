"use client";

import { useState } from "react";
import type { EngagementSnapshot, OutputConnector } from "../types";

function maskText(text: string, clientName: string) {
  return text
    .replaceAll(clientName, "[Client Name]")
    .replace(/CEO|CMO/g, "[Executive]")
    .replace(/\b12 days\b|\b5 days\b|\b4 days\b/g, "[N] days");
}

function getIncludedRooms(snapshot: EngagementSnapshot, connector: OutputConnector) {
  return snapshot.rooms.filter((room) => connector.includeRooms.includes(room.id));
}

function generateXml(snapshot: EngagementSnapshot, connector: OutputConnector) {
  const clientName = connector.maskClient ? "[masked]" : snapshot.clientName;
  const lines: string[] = [];
  lines.push("<engagement_context>");
  lines.push(`  <client name="${clientName}" />`);
  lines.push(`  <engagement phase="${snapshot.phase}" value="${snapshot.value}" duration="${snapshot.duration}" />`);

  getIncludedRooms(snapshot, connector).forEach((room) => {
    lines.push(`  <room key="${room.id}">`);
    room.blocks.forEach((block) => {
      const title = connector.maskClient ? maskText(block.title, snapshot.clientName) : block.title;
      const content = connector.maskClient ? maskText(block.content, snapshot.clientName) : block.content;
      lines.push(`    <block type="${block.type}" featured="${block.featured ? "true" : "false"}">`);
      lines.push(`      ${title}: ${content}`);
      lines.push("    </block>");
    });
    lines.push("  </room>");
  });

  lines.push("</engagement_context>");
  return lines.join("\n");
}

function generateMarkdown(snapshot: EngagementSnapshot, connector: OutputConnector) {
  const lines: string[] = [];
  lines.push(`# Engagement Context`);
  lines.push("");
  lines.push(`You are assisting with the "${snapshot.name}" engagement.`);
  lines.push("");
  lines.push(`## Current Phase`);
  lines.push(snapshot.phase);
  lines.push("");

  getIncludedRooms(snapshot, connector).forEach((room) => {
    lines.push(`## ${room.name}`);
    room.blocks.forEach((block) => {
      const title = connector.maskClient ? maskText(block.title, snapshot.clientName) : block.title;
      const content = connector.maskClient ? maskText(block.content, snapshot.clientName) : block.content;
      lines.push(`- ${title}: ${content}`);
    });
    lines.push("");
  });

  lines.push("## Guidelines");
  lines.push("- Reference decisions before suggesting changes");
  lines.push("- Flag items that need client approval");
  lines.push("- Keep deliverables aligned with scope");
  return lines.join("\n");
}

function generateRules(snapshot: EngagementSnapshot, connector: OutputConnector) {
  const lines: string[] = [];
  lines.push("# Engagement Context");
  lines.push("");
  lines.push(`You are assisting with the "${snapshot.name}" engagement.`);
  lines.push("");
  lines.push(`## Current Phase: ${snapshot.phase}`);
  lines.push("");

  getIncludedRooms(snapshot, connector).forEach((room) => {
    lines.push(`## ${room.name}`);
    room.blocks.forEach((block) => {
      const title = connector.maskClient ? maskText(block.title, snapshot.clientName) : block.title;
      lines.push(`- ${title} (${block.createdAt})`);
    });
    lines.push("");
  });

  lines.push("## Guidelines");
  lines.push("- Reference prior decisions");
  lines.push("- Flag risks early");
  lines.push("- Stay aligned with scope and outcomes");
  return lines.join("\n");
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function useOutputGeneration(snapshot: EngagementSnapshot) {
  const [generating, setGenerating] = useState<string | null>(null);
  const [completed, setCompleted] = useState<string | null>(null);

  const runOutput = async (connector: OutputConnector) => {
    setGenerating(connector.id);
    await new Promise((resolve) => window.setTimeout(resolve, 850));

    const safeName = snapshot.name.toLowerCase().replace(/\s+/g, "-");
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

    if (connector.target === "claude") {
      await navigator.clipboard.writeText(generateXml(snapshot, connector));
    } else if (connector.target === "chatgpt") {
      await navigator.clipboard.writeText(generateMarkdown(snapshot, connector));
    } else if (connector.target === "cursor") {
      download(`${safeName}.cursorrules`, generateRules(snapshot, connector), "text/plain");
    } else if (connector.target === "windsurf") {
      download(`${safeName}.windsurfrules`, generateRules(snapshot, connector), "text/plain");
    } else if (connector.target === "cline") {
      download(`${safeName}.clinerules`, generateRules(snapshot, connector), "text/plain");
    } else if (connector.target === "mcp") {
      await navigator.clipboard.writeText(`${baseUrl}/api/mcp/resources?uri=engagement://${safeName}`);
    } else if (connector.target === "resume") {
      download(`${safeName}-context.html`, generateMarkdown(snapshot, connector), "text/plain");
    } else if (connector.target === "portal") {
      await navigator.clipboard.writeText(`${baseUrl}/portal/${safeName}`);
    }

    setGenerating(null);
    setCompleted(connector.id);
    window.setTimeout(() => setCompleted((current) => (current === connector.id ? null : current)), 1800);
  };

  return {
    generating,
    completed,
    runOutput,
  };
}
