"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";

type MCPPanelProps = {
  engagementSlug: string;
  engagementId: string;
};

export function MCPPanel({ engagementSlug, engagementId }: MCPPanelProps) {
  const C = useC();
  const [copied, setCopied] = useState<string | null>(null);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const endpoints = [
    {
      key: "resource",
      label: "Read Context",
      method: "GET",
      url: `${baseUrl}/api/mcp/resources?uri=engagement://${engagementSlug}`,
      description: "Full engagement context for AI",
    },
    {
      key: "tools",
      label: "List Tools",
      method: "GET",
      url: `${baseUrl}/api/mcp/tools`,
      description: "Available AI tools",
    },
    {
      key: "execute",
      label: "Execute Tool",
      method: "POST",
      url: `${baseUrl}/api/mcp/tools`,
      description: "Run AI tools on engagement",
    },
  ];

  const copyToClipboard = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const examplePayload = {
    tool: "engagement.logDecision",
    arguments: {
      engagementSlug,
      title: "Direction selected",
      decision: "Go with Option A",
      rationale: "Best fit for timeline",
      attendees: ["Sarah", "Jake"],
    },
  };

  return (
    <div
      style={{
        background: C.bg,
        border: `1px solid ${C.sep}`,
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: `1px solid ${C.sep}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.t1 }}>
            AI Integration (MCP)
          </div>
          <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>
            Connect Claude Desktop, Claude Code, or any MCP client
          </div>
        </div>
        <div
          style={{
            padding: "4px 10px",
            background: `${C.green}15`,
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 500,
            color: C.green,
          }}
        >
          Ready
        </div>
      </div>

      {/* Endpoints */}
      <div style={{ padding: 16 }}>
        <div style={{ fontSize: 11, color: C.t4, marginBottom: 12, textTransform: "uppercase", letterSpacing: ".04em" }}>
          Endpoints
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          {endpoints.map((ep) => (
            <div
              key={ep.key}
              style={{
                padding: 12,
                background: C.void,
                borderRadius: 8,
                border: `1px solid ${C.sep}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      padding: "2px 6px",
                      background: ep.method === "GET" ? `${C.green}20` : `${C.blue}20`,
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 600,
                      color: ep.method === "GET" ? C.green : C.blue,
                      fontFamily: "monospace",
                    }}
                  >
                    {ep.method}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: C.t1 }}>{ep.label}</span>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => copyToClipboard(ep.url, ep.key)}
                  style={{
                    padding: "4px 10px",
                    background: copied === ep.key ? C.green : "transparent",
                    border: `1px solid ${copied === ep.key ? C.green : C.sep}`,
                    borderRadius: 4,
                    fontSize: 11,
                    color: copied === ep.key ? "#fff" : C.t2,
                    cursor: "pointer",
                  }}
                >
                  {copied === ep.key ? "Copied" : "Copy"}
                </motion.button>
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontFamily: "monospace",
                  color: C.t3,
                  background: C.bg,
                  padding: "6px 8px",
                  borderRadius: 4,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {ep.url}
              </div>
              <div style={{ fontSize: 10, color: C.t4, marginTop: 6 }}>
                {ep.description}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Available Tools */}
      <div style={{ padding: "0 16px 16px" }}>
        <div style={{ fontSize: 11, color: C.t4, marginBottom: 12, textTransform: "uppercase", letterSpacing: ".04em" }}>
          Available Tools
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          {[
            { name: "engagement.addBlock", desc: "Add content to any room" },
            { name: "engagement.logDecision", desc: "Log decision to Meetings room" },
            { name: "engagement.addNote", desc: "Add note to any room" },
            { name: "engagement.updatePhase", desc: "Change engagement phase" },
            { name: "context.summarizeEmail", desc: "AI summarize email thread" },
            { name: "context.summarizeMeeting", desc: "AI extract from transcript" },
            { name: "context.ingestDocument", desc: "AI analyze document" },
          ].map((tool) => (
            <div
              key={tool.name}
              style={{
                padding: "8px 12px",
                background: C.void,
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <code style={{ fontSize: 11, color: C.blue }}>{tool.name}</code>
              <span style={{ fontSize: 10, color: C.t4 }}>{tool.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Example Payload */}
      <div style={{ padding: "0 16px 16px" }}>
        <div style={{ fontSize: 11, color: C.t4, marginBottom: 12, textTransform: "uppercase", letterSpacing: ".04em" }}>
          Example Request
        </div>
        <div
          style={{
            position: "relative",
            background: C.void,
            borderRadius: 8,
            border: `1px solid ${C.sep}`,
            overflow: "hidden",
          }}
        >
          <pre
            style={{
              margin: 0,
              padding: 12,
              fontSize: 10,
              fontFamily: "monospace",
              color: C.t2,
              overflow: "auto",
              maxHeight: 160,
            }}
          >
            {JSON.stringify(examplePayload, null, 2)}
          </pre>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => copyToClipboard(JSON.stringify(examplePayload, null, 2), "payload")}
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              padding: "4px 8px",
              background: copied === "payload" ? C.green : C.bg,
              border: `1px solid ${copied === "payload" ? C.green : C.sep}`,
              borderRadius: 4,
              fontSize: 10,
              color: copied === "payload" ? "#fff" : C.t3,
              cursor: "pointer",
            }}
          >
            {copied === "payload" ? "Copied" : "Copy"}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
