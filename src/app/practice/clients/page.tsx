"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ClientDirectory } from "@/components/client";
import type { ClientSummary } from "@/types/client";

// Mock owner for demo
const DEMO_OWNER_ID = "demo-user-123";

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClients() {
      try {
        const res = await fetch(`/api/clients?ownerId=${DEMO_OWNER_ID}`);
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

  const handleCreateClient = () => {
    // TODO: Open create client modal
    console.log("Open create client modal");
  };

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

  return <ClientDirectory clients={clients} onCreateClient={handleCreateClient} />;
}
