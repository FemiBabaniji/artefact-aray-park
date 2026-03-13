"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { EngagementCreateWizard } from "@/components/engagement";
import type { ClientSummary } from "@/types/client";

// Mock owner for demo (would come from auth in production)
const DEMO_OWNER = {
  id: "demo-user-123",
  name: "Demo Consultant",
  email: "demo@example.com",
};

export default function NewEngagementPage() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClients() {
      try {
        const res = await fetch(`/api/clients?ownerId=${DEMO_OWNER.id}`);
        if (res.ok) {
          const data = await res.json();
          setClients(data.clients);
        }
      } catch (error) {
        console.error("Failed to fetch clients:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchClients();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          color: "#888",
        }}
      >
        Loading...
      </div>
    );
  }

  const handleComplete = (engagementId: string) => {
    router.push(`/practice/engagements/${engagementId}`);
  };

  return (
    <EngagementCreateWizard
      clients={clients}
      ownerId={DEMO_OWNER.id}
      ownerName={DEMO_OWNER.name}
      ownerEmail={DEMO_OWNER.email}
      onComplete={handleComplete}
    />
  );
}
