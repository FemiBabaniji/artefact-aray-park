"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";

// Floating illustration components
function FloatingDashboard({ style }: { style?: React.CSSProperties }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.8 }}
      style={{
        width: 200,
        height: 140,
        background: "#fafafa",
        borderRadius: 12,
        border: "1px solid #e5e5e5",
        padding: 16,
        ...style,
      }}
    >
      {/* Mini dashboard */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#f0e6ff" }} />
        <div>
          <div style={{ width: 60, height: 6, background: "#e5e5e5", borderRadius: 3, marginBottom: 4 }} />
          <div style={{ width: 40, height: 4, background: "#f0f0f0", borderRadius: 2 }} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1, height: 40, background: "#e8f5e9", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#4caf50" }}>87%</span>
        </div>
        <div style={{ flex: 1, height: 40, background: "#fff3e0", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#ff9800" }}>Q2</span>
        </div>
      </div>
      <div style={{ marginTop: 8, height: 20, display: "flex", gap: 4 }}>
        {[30, 45, 35, 55, 40, 60].map((h, i) => (
          <div key={i} style={{ flex: 1, background: `hsl(${240 + i * 20}, 70%, 85%)`, borderRadius: 2, height: `${h}%`, alignSelf: "flex-end" }} />
        ))}
      </div>
    </motion.div>
  );
}

function FloatingRooms({ style }: { style?: React.CSSProperties }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.8 }}
      style={{
        width: 180,
        background: "#fafafa",
        borderRadius: 12,
        border: "1px solid #e5e5e5",
        overflow: "hidden",
        ...style,
      }}
    >
      {["Scope", "Deliverables", "Meetings", "Outcomes"].map((room, i) => (
        <div
          key={room}
          style={{
            padding: "10px 14px",
            borderBottom: i < 3 ? "1px solid #e5e5e5" : "none",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: ["#a5d6a7", "#90caf9", "#ffcc80", "#ce93d8"][i],
            }}
          />
          <span style={{ fontSize: 12, color: "#666" }}>{room}</span>
        </div>
      ))}
    </motion.div>
  );
}

function FloatingTimeline({ style }: { style?: React.CSSProperties }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.7, duration: 0.8 }}
      style={{
        width: 160,
        background: "#fafafa",
        borderRadius: 12,
        border: "1px solid #e5e5e5",
        padding: 16,
        ...style,
      }}
    >
      <div style={{ fontSize: 10, color: "#999", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>Timeline</div>
      {["Discovery", "Strategy", "Delivery", "Close"].map((phase, i) => (
        <div key={phase} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: i < 3 ? 10 : 0 }}>
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: i < 2 ? "#4caf50" : i === 2 ? "#2196f3" : "#e0e0e0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10,
              color: "#fff",
            }}
          >
            {i < 2 ? "✓" : ""}
          </div>
          <span style={{ fontSize: 11, color: i < 3 ? "#333" : "#999" }}>{phase}</span>
        </div>
      ))}
    </motion.div>
  );
}

function FloatingGlobe({ style }: { style?: React.CSSProperties }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.4, duration: 0.8 }}
      style={{
        width: 120,
        height: 120,
        borderRadius: "50%",
        background: "#fffde7",
        border: "1px solid #e5e5e5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
    >
      <svg width="70" height="70" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#3f51b5" strokeWidth="2" />
        <ellipse cx="50" cy="50" rx="40" ry="18" fill="none" stroke="#3f51b5" strokeWidth="1.5" />
        <ellipse cx="50" cy="50" rx="18" ry="40" fill="none" stroke="#3f51b5" strokeWidth="1.5" />
        <line x1="10" y1="50" x2="90" y2="50" stroke="#3f51b5" strokeWidth="1" />
        {/* Connection dots */}
        <circle cx="30" cy="35" r="4" fill="#4caf50" />
        <circle cx="70" cy="45" r="4" fill="#4caf50" />
        <circle cx="50" cy="70" r="4" fill="#4caf50" />
        <line x1="30" y1="35" x2="70" y2="45" stroke="#4caf50" strokeWidth="1" strokeDasharray="3,3" />
        <line x1="70" y1="45" x2="50" y2="70" stroke="#4caf50" strokeWidth="1" strokeDasharray="3,3" />
      </svg>
    </motion.div>
  );
}

function FloatingPortfolio({ style }: { style?: React.CSSProperties }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.8 }}
      style={{
        width: 140,
        height: 180,
        background: "linear-gradient(135deg, #f3e5f5 0%, #e8eaf6 100%)",
        borderRadius: 12,
        border: "1px solid #e5e5e5",
        padding: 12,
        display: "flex",
        flexDirection: "column",
        ...style,
      }}
    >
      <div style={{ width: "100%", flex: 1, background: "#fff", borderRadius: 8, marginBottom: 8 }} />
      <div style={{ height: 6, background: "#ce93d8", borderRadius: 3, marginBottom: 4 }} />
      <div style={{ height: 4, width: "70%", background: "#e1bee7", borderRadius: 2 }} />
      <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 10, color: "#7b1fa2" }}>Case Study</div>
        <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#9c27b0", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: "#fff", fontSize: 10 }}>→</span>
        </div>
      </div>
    </motion.div>
  );
}

// Feature card component
function FeatureCard({
  title,
  description,
  color,
  delay = 0,
}: {
  title: string;
  description: string;
  color: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay, duration: 0.5 }}
      style={{
        background: "#fff",
        borderRadius: 16,
        padding: 32,
        border: "1px solid #e5e5e5",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: color,
          marginBottom: 20,
        }}
      />
      <h3 style={{ fontSize: 20, fontWeight: 600, color: "#111", marginBottom: 12 }}>{title}</h3>
      <p style={{ fontSize: 15, color: "#666", lineHeight: 1.6 }}>{description}</p>
    </motion.div>
  );
}

// ICP Card
function ICPCard({
  title,
  description,
  stats,
  delay = 0,
}: {
  title: string;
  description: string;
  stats: { label: string; value: string }[];
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      style={{
        background: "#fff",
        borderRadius: 16,
        padding: 32,
        border: "1px solid #e5e5e5",
      }}
    >
      <h3 style={{ fontSize: 22, fontWeight: 600, color: "#111", marginBottom: 8 }}>{title}</h3>
      <p style={{ fontSize: 15, color: "#666", lineHeight: 1.6, marginBottom: 24 }}>{description}</p>
      <div style={{ display: "flex", gap: 24 }}>
        {stats.map((stat) => (
          <div key={stat.label}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#111" }}>{stat.value}</div>
            <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>{stat.label}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function GTMLandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -100]);

  return (
    <div ref={containerRef} style={{ background: "#fff", minHeight: "100vh" }}>
      {/* Navigation */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: "16px 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(255,255,255,0.9)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(0,0,0,0.05)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            }}
          />
          <span style={{ fontSize: 18, fontWeight: 600, color: "#111" }}>Artefact</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <Link href="#features" style={{ fontSize: 14, color: "#666", textDecoration: "none" }}>
            Features
          </Link>
          <Link href="#customers" style={{ fontSize: 14, color: "#666", textDecoration: "none" }}>
            Customers
          </Link>
          <Link href="#pricing" style={{ fontSize: 14, color: "#666", textDecoration: "none" }}>
            Pricing
          </Link>
          <motion.a
            href="/auth/login"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              padding: "10px 20px",
              background: "#111",
              borderRadius: 8,
              color: "#fff",
              fontSize: 13,
              fontWeight: 500,
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span style={{ fontSize: 12 }}>↗</span> BOOK A DEMO
          </motion.a>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
          paddingTop: 80,
        }}
      >
        {/* Floating illustrations */}
        <motion.div style={{ y: y1 }}>
          <FloatingDashboard style={{ position: "absolute", top: 120, left: 60 }} />
        </motion.div>
        <FloatingRooms style={{ position: "absolute", top: 200, right: 80 }} />
        <motion.div style={{ y: y2 }}>
          <FloatingTimeline style={{ position: "absolute", bottom: 200, left: 100 }} />
        </motion.div>
        <FloatingGlobe style={{ position: "absolute", top: 100, right: 200 }} />
        <FloatingPortfolio style={{ position: "absolute", bottom: 150, right: 120 }} />

        {/* Main content */}
        <div style={{ textAlign: "center", maxWidth: 800, padding: "0 24px", position: "relative", zIndex: 10 }}>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              fontSize: 64,
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              color: "#111",
              marginBottom: 24,
            }}
          >
            Client delivery for{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              boutique consultants
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            style={{
              fontSize: 20,
              color: "#666",
              lineHeight: 1.6,
              marginBottom: 40,
              maxWidth: 600,
              margin: "0 auto 40px",
            }}
          >
            Turn every engagement into a living artefact. Give clients real-time visibility into progress, decisions, and outcomes.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <motion.a
              href="/auth/login"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "16px 32px",
                background: "#111",
                borderRadius: 10,
                color: "#fff",
                fontSize: 15,
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              <span style={{ fontSize: 14 }}>↗</span> BOOK A DEMO
            </motion.a>
          </motion.div>
        </div>
      </section>

      {/* Problem Section */}
      <section style={{ padding: "120px 40px", background: "#fafafa" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{ textAlign: "center", marginBottom: 60 }}
          >
            <h2 style={{ fontSize: 42, fontWeight: 600, color: "#111", marginBottom: 20, letterSpacing: "-0.02em" }}>
              The visibility problem
            </h2>
            <p style={{ fontSize: 18, color: "#666", lineHeight: 1.6, maxWidth: 700, margin: "0 auto" }}>
              Clients feel anxious during multi-week engagements because they have no window into what's happening. That anxiety kills repeat business, causes scope creep, and creates payment disputes — not because the work is bad, but because the client can't see it.
            </p>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
            {[
              { stat: "67%", label: "of clients report feeling 'in the dark' during engagements" },
              { stat: "3.2x", label: "more likely to have scope disputes without visibility" },
              { stat: "40%", label: "drop in repeat business from communication gaps" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                style={{
                  background: "#fff",
                  borderRadius: 16,
                  padding: 32,
                  textAlign: "center",
                  border: "1px solid #e5e5e5",
                }}
              >
                <div style={{ fontSize: 48, fontWeight: 700, color: "#111", marginBottom: 8 }}>{item.stat}</div>
                <div style={{ fontSize: 14, color: "#666" }}>{item.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={{ padding: "120px 40px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: "center", marginBottom: 60 }}
          >
            <h2 style={{ fontSize: 42, fontWeight: 600, color: "#111", marginBottom: 20, letterSpacing: "-0.02em" }}>
              Everything consultants need,{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                nothing they don't
              </span>
            </h2>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
            <FeatureCard
              title="Structured Rooms"
              description="Scope, Research, Deliverables, Meetings, Outcomes — each engagement gets purpose-built rooms that keep work organized and client-visible."
              color="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              delay={0}
            />
            <FeatureCard
              title="Living Portal"
              description="Clients see a curated view of their engagement in real-time. No more 'where are we?' emails. Progress is always visible."
              color="linear-gradient(135deg, #11998e 0%, #38ef7d 100%)"
              delay={0.1}
            />
            <FeatureCard
              title="Render Layer"
              description="Turn any engagement into a pitch deck, board summary, or case study with one click. Same content, different audiences."
              color="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
              delay={0.2}
            />
            <FeatureCard
              title="Phase Tracking"
              description="Intake → Qualification → Proposal → Signed → Delivery → Complete. Visual pipeline that clients and consultants both understand."
              color="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
              delay={0.3}
            />
            <FeatureCard
              title="AI Ingestion"
              description="Meeting transcripts, emails, and Slack threads automatically summarized and filed into the right rooms."
              color="linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
              delay={0.4}
            />
            <FeatureCard
              title="Practice Intelligence"
              description="See your engagement patterns, win rates, and revenue metrics. Build templates from your best work."
              color="linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)"
              delay={0.5}
            />
          </div>
        </div>
      </section>

      {/* ICP Section */}
      <section id="customers" style={{ padding: "120px 40px", background: "#fafafa" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: "center", marginBottom: 60 }}
          >
            <h2 style={{ fontSize: 42, fontWeight: 600, color: "#111", marginBottom: 20, letterSpacing: "-0.02em" }}>
              Built for{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                independent consultants
              </span>
            </h2>
            <p style={{ fontSize: 18, color: "#666", lineHeight: 1.6, maxWidth: 700, margin: "0 auto" }}>
              Fractional executives, boutique strategy firms, and senior advisors running project-based or retainer engagements.
            </p>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 24 }}>
            <ICPCard
              title="Fractional COOs & CMOs"
              description="Running ongoing retainers with startup founders. Need to show weekly/monthly progress and justify the investment."
              stats={[
                { label: "Typical retainer", value: "$8-15K" },
                { label: "Duration", value: "6-12mo" },
              ]}
              delay={0}
            />
            <ICPCard
              title="Boutique Strategy Firms"
              description="2-5 person shops doing strategy, ops, or transformation work. Need polished client deliverables without enterprise overhead."
              stats={[
                { label: "Engagement size", value: "$15-100K" },
                { label: "Duration", value: "6-16wk" },
              ]}
              delay={0.1}
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: "120px 40px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: "center", marginBottom: 60 }}
          >
            <h2 style={{ fontSize: 42, fontWeight: 600, color: "#111", marginBottom: 20, letterSpacing: "-0.02em" }}>
              How it works
            </h2>
          </motion.div>

          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {[
              {
                num: "01",
                title: "Create an engagement",
                description: "Start from a template or blank. Define rooms, set visibility, invite clients.",
              },
              {
                num: "02",
                title: "Work in structured rooms",
                description: "Add blocks — text, files, metrics, decisions. Everything timestamped and versioned.",
              },
              {
                num: "03",
                title: "Share the portal",
                description: "Clients get a live view of their engagement. See progress without asking.",
              },
              {
                num: "04",
                title: "Render for any audience",
                description: "Export as pitch deck, board summary, or case study. Mask sensitive data automatically.",
              },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                style={{
                  display: "flex",
                  gap: 32,
                  alignItems: "flex-start",
                  padding: 32,
                  background: "#fafafa",
                  borderRadius: 16,
                  border: "1px solid #e5e5e5",
                }}
              >
                <div
                  style={{
                    fontSize: 32,
                    fontWeight: 700,
                    color: "#e0e0e0",
                    fontFamily: "monospace",
                  }}
                >
                  {step.num}
                </div>
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 600, color: "#111", marginBottom: 8 }}>{step.title}</h3>
                  <p style={{ fontSize: 15, color: "#666", lineHeight: 1.6 }}>{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={{ padding: "120px 40px", background: "#111" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 style={{ fontSize: 42, fontWeight: 600, color: "#fff", marginBottom: 20, letterSpacing: "-0.02em" }}>
              Simple, founder-friendly pricing
            </h2>
            <p style={{ fontSize: 18, color: "rgba(255,255,255,0.7)", marginBottom: 40 }}>
              Start free. Pay when you're ready.
            </p>

            <div
              style={{
                display: "inline-block",
                background: "rgba(255,255,255,0.1)",
                borderRadius: 20,
                padding: 48,
                textAlign: "left",
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 24 }}>
                <span style={{ fontSize: 56, fontWeight: 700, color: "#fff" }}>$49</span>
                <span style={{ fontSize: 18, color: "rgba(255,255,255,0.6)" }}>/month</span>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {[
                  "Unlimited engagements",
                  "Unlimited clients",
                  "Client portal access",
                  "All render formats",
                  "AI ingestion (100/mo)",
                  "Practice templates",
                ].map((feature, i) => (
                  <li
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      color: "rgba(255,255,255,0.9)",
                      fontSize: 15,
                      marginBottom: 12,
                    }}
                  >
                    <span style={{ color: "#38ef7d" }}>✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <motion.a
                href="/auth/login"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  display: "block",
                  marginTop: 32,
                  padding: "16px 32px",
                  background: "#fff",
                  borderRadius: 10,
                  color: "#111",
                  fontSize: 15,
                  fontWeight: 600,
                  textDecoration: "none",
                  textAlign: "center",
                }}
              >
                Start free trial
              </motion.a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: "120px 40px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 style={{ fontSize: 42, fontWeight: 600, color: "#111", marginBottom: 20, letterSpacing: "-0.02em" }}>
              Ready to transform client delivery?
            </h2>
            <p style={{ fontSize: 18, color: "#666", marginBottom: 40, lineHeight: 1.6 }}>
              Join consultants who've eliminated "where are we?" emails and turned their best work into repeatable templates.
            </p>

            <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
              <motion.a
                href="/auth/login"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "16px 32px",
                  background: "#111",
                  borderRadius: 10,
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                <span style={{ fontSize: 14 }}>↗</span> BOOK A DEMO
              </motion.a>
              <motion.a
                href="/apply"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "16px 32px",
                  background: "#fff",
                  border: "1px solid #e5e5e5",
                  borderRadius: 10,
                  color: "#111",
                  fontSize: 15,
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                See walkthrough
              </motion.a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: "40px", borderTop: "1px solid #e5e5e5" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              }}
            />
            <span style={{ fontSize: 14, color: "#666" }}>Engagement Artefact</span>
          </div>
          <div style={{ fontSize: 13, color: "#999" }}>Solo founder · Canada → USA · 2026</div>
        </div>
      </footer>
    </div>
  );
}
