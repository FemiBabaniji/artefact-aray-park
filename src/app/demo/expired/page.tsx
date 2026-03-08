"use client";

import { useC } from "@/hooks/useC";
import { Btn } from "@/components/primitives/Btn";
import { useRouter } from "next/navigation";

export default function DemoExpiredPage() {
  const C = useC();
  const router = useRouter();

  const handleCreateNew = () => {
    router.push("/demo/new");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: C.void,
      }}
    >
      <div
        style={{
          maxWidth: 400,
          textAlign: "center",
        }}
      >
        <div
          className="mono"
          style={{
            fontSize: 11,
            color: C.t3,
            marginBottom: 12,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Session Expired
        </div>

        <h1
          style={{
            fontSize: 20,
            fontWeight: 500,
            color: C.t1,
            marginBottom: 16,
          }}
        >
          This demo has expired
        </h1>

        <p
          style={{
            fontSize: 13,
            color: C.t2,
            lineHeight: 1.6,
            marginBottom: 32,
          }}
        >
          Demo sessions last 2 hours. Start a new session to continue
          configuring your community.
        </p>

        <Btn onClick={handleCreateNew} accent={C.green}>
          Start new demo
        </Btn>
      </div>
    </div>
  );
}
