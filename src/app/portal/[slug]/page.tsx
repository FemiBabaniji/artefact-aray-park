"use client";

import { useState, useEffect, use } from "react";
import { useC } from "@/hooks/useC";
import type { Engagement, EngagementRoom } from "@/types/engagement";
import { ClientPortal } from "@/components/engagement/portal";

type PortalEngagement = Engagement & {
  client?: { id: string; name: string; logoUrl?: string } | null;
  rooms: EngagementRoom[];
};

export default function ClientPortalPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const C = useC();
  const [engagement, setEngagement] = useState<PortalEngagement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEngagement() {
      try {
        // In production, this would validate the client's access token
        const res = await fetch(`/api/portal/${resolvedParams.slug}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError("Engagement not found");
          } else if (res.status === 403) {
            setError("Access denied");
          } else {
            setError("Failed to load engagement");
          }
          return;
        }
        const data = await res.json();
        setEngagement(data.engagement);
      } catch (err) {
        setError("Failed to load engagement");
      } finally {
        setLoading(false);
      }
    }
    fetchEngagement();
  }, [resolvedParams.slug]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: C.void,
          color: C.t3,
        }}
      >
        Loading...
      </div>
    );
  }

  if (error || !engagement) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: C.void,
          color: C.t3,
          gap: 16,
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 500, color: C.t1 }}>
          {error || "Not found"}
        </div>
        <div style={{ fontSize: 13 }}>
          Please check the link or contact your consultant.
        </div>
      </div>
    );
  }

  // Filter rooms to only show client-visible ones
  const visibleRooms = engagement.rooms.filter(
    (room) => room.visibility === "client_view" || room.visibility === "client_edit"
  );

  return (
    <ClientPortal
      engagement={engagement}
      rooms={visibleRooms}
    />
  );
}
