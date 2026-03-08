"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useC } from "@/hooks/useC";
import { useDemoConfig } from "@/context/DemoConfigContext";
import { Btn } from "@/components/primitives/Btn";
import { Lbl } from "@/components/primitives/Lbl";
import { FADE } from "@/lib/motion";

type ClaimFormProps = {
  token: string;
};

type State = "form" | "sending" | "success" | "error";

export function ClaimForm({ token }: ClaimFormProps) {
  const C = useC();
  const { config } = useDemoConfig();

  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("form");
  const [error, setError] = useState("");

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!email.trim() || !email.includes("@")) {
        setError("Please enter a valid email address");
        return;
      }

      setState("sending");
      setError("");

      try {
        const response = await fetch(`/api/demo/${token}/claim`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to send claim email");
        }

        setState("success");
      } catch (err) {
        setState("error");
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    },
    [email, token]
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: C.void,
      }}
    >
      <div style={{ width: "100%", maxWidth: 400 }}>
        <AnimatePresence mode="wait">
          {state === "success" ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={FADE}
              style={{ textAlign: "center" }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: C.green + "20",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                }}
              >
                <span style={{ fontSize: 24 }}>&#10003;</span>
              </div>

              <h1
                style={{
                  fontSize: 20,
                  fontWeight: 500,
                  color: C.t1,
                  marginBottom: 12,
                }}
              >
                Check your email
              </h1>

              <p
                style={{
                  fontSize: 13,
                  color: C.t2,
                  lineHeight: 1.6,
                  marginBottom: 8,
                }}
              >
                We sent a magic link to{" "}
                <strong style={{ color: C.t1 }}>{email}</strong>
              </p>

              <p style={{ fontSize: 13, color: C.t3, lineHeight: 1.6 }}>
                Click the link in the email to claim your{" "}
                {config.identity.name || "community"} program and become the
                admin.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={FADE}
            >
              <div style={{ textAlign: "center", marginBottom: 32 }}>
                <Lbl style={{ marginBottom: 12 }}>claim your program</Lbl>
                <h1
                  style={{
                    fontSize: 22,
                    fontWeight: 500,
                    color: C.t1,
                    marginBottom: 8,
                  }}
                >
                  {config.identity.name || "Your Community"}
                </h1>
                <p style={{ fontSize: 13, color: C.t3 }}>
                  Enter your email to become the admin
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 16 }}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@yourcompany.com"
                    disabled={state === "sending"}
                    style={{
                      width: "100%",
                      padding: "14px 16px",
                      fontSize: 15,
                      color: C.t1,
                      background: C.bg,
                      border: `1px solid ${error ? "#ef4444" : C.edge}`,
                      borderRadius: 10,
                      outline: "none",
                      textAlign: "center",
                    }}
                  />
                  {error && (
                    <p
                      style={{
                        fontSize: 12,
                        color: "#ef4444",
                        marginTop: 8,
                        textAlign: "center",
                      }}
                    >
                      {error}
                    </p>
                  )}
                </div>

                <Btn
                  onClick={() => {}}
                  accent={C.green}
                  disabled={state === "sending"}
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  {state === "sending" ? "Sending..." : "Send magic link"}
                </Btn>
              </form>

              <p
                style={{
                  fontSize: 11,
                  color: C.t4,
                  textAlign: "center",
                  marginTop: 20,
                  lineHeight: 1.6,
                }}
              >
                Your program configuration will be preserved. You&apos;ll be
                able to invite your first cohort immediately.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
