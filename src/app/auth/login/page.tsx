"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useC } from "@/hooks/useC";

export default function LoginPage() {
  const C = useC();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Check your email for the login link.");
    }
    setLoading(false);
  };

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
        width: "100%",
        maxWidth: 360,
        background: C.bg,
        border: `1px solid ${C.sep}`,
        borderRadius: 12,
        padding: 32,
      }}>
        <div style={{
          fontSize: 9,
          color: C.t4,
          fontFamily: "'DM Mono',monospace",
          letterSpacing: ".07em",
          textTransform: "uppercase",
          marginBottom: 8,
        }}>
          creative incubator
        </div>
        <h1 style={{
          fontSize: 22,
          fontWeight: 600,
          color: C.t1,
          marginBottom: 24,
          letterSpacing: "-.02em",
        }}>
          Sign in
        </h1>

        <form onSubmit={handleLogin}>
          <label style={{
            display: "block",
            fontSize: 11,
            color: C.t3,
            marginBottom: 6,
            fontFamily: "'DM Mono',monospace",
          }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "12px 14px",
              border: `1px solid ${C.sep}`,
              borderRadius: 8,
              background: C.void,
              color: C.t1,
              fontSize: 14,
              marginBottom: 20,
              outline: "none",
            }}
            placeholder="you@example.com"
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px 20px",
              background: C.green,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              cursor: loading ? "wait" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Sending link..." : "Send magic link"}
          </button>
        </form>

        {message && (
          <div style={{
            marginTop: 16,
            padding: 12,
            background: message.includes("Check") ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
            borderRadius: 8,
            fontSize: 12,
            color: message.includes("Check") ? C.green : "#ef4444",
            textAlign: "center",
          }}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
