"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";
import { Lbl } from "@/components/primitives/Lbl";
import type { ClientSummary } from "@/types/client";
import { getClientInitials } from "@/types/client";

type ClientDirectoryProps = {
  clients: ClientSummary[];
  onCreateClient?: () => void;
};

export function ClientDirectory({ clients, onCreateClient }: ClientDirectoryProps) {
  const C = useC();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "engagements" | "recent">("name");

  const filteredClients = useMemo(() => {
    let result = [...clients];

    // Filter by search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.industry?.toLowerCase().includes(q)
      );
    }

    // Sort
    switch (sortBy) {
      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "engagements":
        result.sort((a, b) => b.engagementCount - a.engagementCount);
        break;
      case "recent":
        result.sort((a, b) => {
          const aDate = a.lastEngagementDate ? new Date(a.lastEngagementDate).getTime() : 0;
          const bDate = b.lastEngagementDate ? new Date(b.lastEngagementDate).getTime() : 0;
          return bDate - aDate;
        });
        break;
    }

    return result;
  }, [clients, search, sortBy]);

  const handleClientClick = (client: ClientSummary) => {
    router.push(`/practice/clients/${client.id}`);
  };

  return (
    <div
      style={{
        flex: 1,
        background: C.void,
        color: C.t1,
        overflow: "auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: `1px solid ${C.sep}`,
          background: C.bg,
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: 900,
            margin: "0 auto",
            padding: "20px 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 600 }}>Clients</div>
          {onCreateClient && (
            <motion.button
              whileHover={{ opacity: 0.8 }}
              whileTap={{ scale: 0.98 }}
              onClick={onCreateClient}
              style={{
                padding: "8px 14px",
                background: C.blue,
                border: "none",
                borderRadius: 6,
                color: "#fff",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              + New client
            </motion.button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "16px 32px",
          display: "flex",
          gap: 12,
          alignItems: "center",
        }}
      >
        <input
          type="text"
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            padding: "10px 14px",
            background: C.bg,
            border: `1px solid ${C.sep}`,
            borderRadius: 8,
            color: C.t1,
            fontSize: 13,
            outline: "none",
          }}
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          style={{
            padding: "10px 14px",
            background: C.bg,
            border: `1px solid ${C.sep}`,
            borderRadius: 8,
            color: C.t2,
            fontSize: 13,
          }}
        >
          <option value="name">Sort by name</option>
          <option value="engagements">Sort by engagements</option>
          <option value="recent">Sort by recent</option>
        </select>
      </div>

      {/* Client List */}
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "0 32px 64px",
        }}
      >
        <div
          style={{
            display: "grid",
            gap: 8,
          }}
        >
          {filteredClients.map((client) => (
            <motion.div
              key={client.id}
              whileHover={{ borderColor: C.blue }}
              onClick={() => handleClientClick(client)}
              style={{
                padding: "16px 20px",
                background: C.bg,
                border: `1px solid ${C.sep}`,
                borderRadius: 10,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 8,
                  background: client.logoUrl ? `url(${client.logoUrl}) center/cover` : C.void,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  fontWeight: 600,
                  color: C.t2,
                  flexShrink: 0,
                }}
              >
                {!client.logoUrl && getClientInitials(client.name)}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 500,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {client.name}
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                  {client.industry && (
                    <span style={{ fontSize: 12, color: C.t3 }}>{client.industry}</span>
                  )}
                  <span style={{ fontSize: 12, color: C.t4 }}>
                    {client.engagementCount} engagement{client.engagementCount !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {/* Active badge */}
              {client.activeEngagements > 0 && (
                <span
                  style={{
                    padding: "4px 10px",
                    background: `${C.green}20`,
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 500,
                    color: C.green,
                  }}
                >
                  {client.activeEngagements} active
                </span>
              )}

              {/* Arrow */}
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                style={{ color: C.t4, flexShrink: 0 }}
              >
                <path
                  d="M9 18L15 12L9 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.div>
          ))}

          {filteredClients.length === 0 && (
            <div
              style={{
                padding: "48px 20px",
                textAlign: "center",
                color: C.t3,
              }}
            >
              {search ? (
                <>No clients match "{search}"</>
              ) : (
                <>
                  <div style={{ fontSize: 14, marginBottom: 8 }}>No clients yet</div>
                  <div style={{ fontSize: 13, color: C.t4 }}>
                    Create your first client to get started
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
