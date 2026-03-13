"use client";

import { useState, useEffect } from "react";
import { useC } from "@/hooks/useC";

type SharePanelProps = {
  slug: string;
  engagementName: string;
};

export function SharePanel({ slug, engagementName }: SharePanelProps) {
  const C = useC();
  const [copied, setCopied] = useState(false);
  const [portalUrl, setPortalUrl] = useState(`/portal/${slug}`);

  // Set full URL after hydration to avoid mismatch
  useEffect(() => {
    setPortalUrl(`${window.location.origin}/portal/${slug}`);
  }, [slug]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(portalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div
      style={{
        padding: "16px 20px",
        background: C.bg,
        border: `1px solid ${C.sep}`,
        borderRadius: 12,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: `${C.blue}15`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 5.12548 15.0077 5.24917 15.0227 5.37061L8.08261 9.17206C7.54305 8.46329 6.7252 8 5.80002 8C4.25362 8 3 9.25362 3 10.8C3 12.3464 4.25362 13.6 5.80002 13.6C6.72518 13.6 7.54305 13.1367 8.08261 12.4279L15.0227 16.2294C15.0077 16.3508 15 16.4745 15 16.6C15 18.2569 16.3431 19.6 18 19.6C19.6569 19.6 21 18.2569 21 16.6C21 14.9431 19.6569 13.6 18 13.6C17.0748 13.6 16.2569 14.0633 15.7174 14.7721L8.77739 10.9706C8.79234 10.8492 8.80002 10.7255 8.80002 10.6C8.80002 10.4745 8.79234 10.3508 8.77739 10.2294L15.7174 6.42786C16.2569 7.13671 17.0748 7.6 18 7.6"
              stroke={C.blue}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.t1 }}>
            Client Portal
          </div>
          <div style={{ fontSize: 11, color: C.t4 }}>
            Share this link with your client
          </div>
        </div>
      </div>

      {/* URL Row */}
      <div
        style={{
          display: "flex",
          gap: 8,
        }}
      >
        <div
          style={{
            flex: 1,
            padding: "10px 14px",
            background: C.void,
            border: `1px solid ${C.sep}`,
            borderRadius: 8,
            fontSize: 13,
            color: C.t2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontFamily: "monospace",
          }}
        >
          {portalUrl}
        </div>
        <button
          onClick={handleCopy}
          style={{
            padding: "10px 16px",
            background: copied ? C.green : C.blue,
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            fontWeight: 500,
            color: "#fff",
            transition: "background .15s",
          }}
        >
          {copied ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Copied
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2" />
                <path d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5" stroke="currentColor" strokeWidth="2" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>

      {/* Info */}
      <div
        style={{
          marginTop: 12,
          fontSize: 11,
          color: C.t4,
          lineHeight: 1.5,
        }}
      >
        Clients can view Scope, Deliverables, Meetings, and Outcomes rooms.
        Internal rooms (Research, Documents) remain private.
      </div>
    </div>
  );
}
