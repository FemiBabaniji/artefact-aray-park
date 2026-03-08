"use client";
import Link from "next/link";
import { useC } from "@/hooks/useC";

export default function AuthErrorPage() {
  const C = useC();

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: C.void,
      padding: 32,
    }}>
      <div style={{
        textAlign: "center",
        maxWidth: 400,
      }}>
        <div style={{
          fontSize: 48,
          marginBottom: 16,
        }}>
          :(
        </div>
        <h1 style={{
          fontSize: 20,
          fontWeight: 600,
          color: C.t1,
          marginBottom: 12,
        }}>
          Authentication failed
        </h1>
        <p style={{
          fontSize: 14,
          color: C.t3,
          marginBottom: 24,
          lineHeight: 1.6,
        }}>
          The login link may have expired or already been used.
          Please try signing in again.
        </p>
        <Link
          href="/auth/login"
          style={{
            display: "inline-block",
            padding: "12px 24px",
            background: C.edge,
            color: C.t1,
            border: `1px solid ${C.sep}`,
            borderRadius: 8,
            fontSize: 13,
            textDecoration: "none",
          }}
        >
          Back to login
        </Link>
      </div>
    </div>
  );
}
