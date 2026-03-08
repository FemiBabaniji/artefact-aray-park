"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useC } from "@/hooks/useC";
import { SPF, FADE } from "@/lib/motion";
import { Avatar } from "@/components/primitives/Avatar";
import { Lbl } from "@/components/primitives/Lbl";
import type { Member, MemberProfile } from "@/types/member";
import type { Section } from "@/types/section";
import type { CSSProperties } from "react";

// ── LinkButton ────────────────────────────────────────────────────────────────

type LinkButtonProps = {
  href?:     string;
  children:  React.ReactNode;
  icon?:     string;
  style?:    CSSProperties;
};

export function LinkButton({ href, children, icon = "◈", style }: LinkButtonProps) {
  const C = useC();
  return (
    <motion.a
      href={href || "#"}
      whileHover={{ opacity: 0.75, y: -1 }}
      whileTap={{ scale: 0.97 }}
      transition={SPF}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "13px 18px",
        border: `1px solid ${C.edge}`, borderRadius: 10,
        background: C.void, color: C.t1,
        fontSize: 13, fontWeight: 400, lineHeight: 1,
        textDecoration: "none", cursor: "pointer", width: "100%",
        ...style,
      }}
    >
      <span style={{ fontSize: 10, color: C.t3, fontFamily: "'DM Mono',monospace", flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{children}</span>
    </motion.a>
  );
}

// ── StepLink ──────────────────────────────────────────────────────────────────

type StepLinkProps = {
  member:   Member & { profile?: MemberProfile };
  sections: Section[];
};

export function StepLink({ member, sections }: StepLinkProps) {
  const C       = useC();
  const profile = member.profile;
  const [expanded, setExpanded] = useState<number | null>(null);

  const practiceSection = sections.find(s => s.id === "practice");
  const focusSection    = sections.find(s => s.id === "focus");

  const practiceText = (practiceSection?.status === "accepted" && practiceSection?.evidence)
    ? practiceSection.evidence
    : (profile?.practice || "");

  const focusText = (focusSection?.evidence && focusSection.status !== "empty")
    ? focusSection.evidence
    : (profile?.focus || "");

  const projects = profile?.projects || [];
  const skills   = profile?.skills;

  return (
    <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 24px 120px" }}>
      <div style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", gap: 0 }}>

        {/* Identity */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 28 }}>
          <Avatar size={56} color={member.color} />
          <div style={{ flex: 1, paddingTop: 2 }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: C.t1, letterSpacing: "-.025em", lineHeight: 1.2, marginBottom: 3 }}>
              {member.name}
            </div>
            <div style={{ fontSize: 12, color: C.t3, lineHeight: 1.4, marginBottom: 5 }}>{member.title}</div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 10, color: C.t4, fontFamily: "'DM Mono',monospace" }}>{member.location}</span>
              {profile?.availability && (
                <>
                  <span style={{ width: 1, height: 8, background: C.sep }} />
                  <span style={{ fontSize: 10, color: C.t4, fontFamily: "'DM Mono',monospace" }}>{profile.availability}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Practice */}
        <div style={{ marginBottom: 28, paddingBottom: 28, borderBottom: `1px solid ${C.sep}` }}>
          <Lbl style={{ display: "block", marginBottom: 10 }}>practice</Lbl>
          <p style={{ fontSize: 13, color: C.t2, lineHeight: 1.82, margin: 0, fontWeight: 400 }}>{practiceText}</p>
          {focusText && (
            <p style={{ fontSize: 12, color: C.t3, lineHeight: 1.75, margin: "12px 0 0", fontStyle: "italic" }}>{focusText}</p>
          )}
        </div>

        {/* Work */}
        {projects.length > 0 && (
          <div style={{ marginBottom: 28, paddingBottom: 28, borderBottom: `1px solid ${C.sep}` }}>
            <Lbl style={{ display: "block", marginBottom: 14 }}>work</Lbl>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {projects.map((p, pi) => (
                <div key={pi}>
                  <motion.div onClick={() => setExpanded(expanded === pi ? null : pi)}
                    whileHover={{ opacity: 0.8 }} whileTap={{ scale: 0.99 }}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 0", cursor: "pointer", borderBottom: `1px solid ${C.sep}` }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: C.t1 }}>{p.name}</span>
                      <span className="mono" style={{ fontSize: 9, color: C.t4 }}>{p.works.length} works</span>
                    </div>
                    <motion.span animate={{ rotate: expanded === pi ? 90 : 0 }} transition={SPF}
                      style={{ fontSize: 10, color: C.t4, display: "block", lineHeight: 1 }}>›</motion.span>
                  </motion.div>
                  <AnimatePresence>
                    {expanded === pi && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={SPF} style={{ overflow: "hidden" }}>
                        {p.works.map((w, wi) => (
                          <motion.div key={wi}
                            initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ ...FADE, delay: wi * 0.04 }}
                            style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "9px 0 9px 12px", borderBottom: wi < p.works.length - 1 ? `1px solid ${C.sep}` : "none" }}>
                            <span style={{ fontSize: 13, color: C.t2, fontWeight: 400 }}>{w.title}</span>
                            <span className="mono" style={{ fontSize: 10, color: C.t4 }}>{w.year}</span>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {skills && (
          <div style={{ marginBottom: 28, paddingBottom: 28, borderBottom: `1px solid ${C.sep}` }}>
            <Lbl style={{ display: "block", marginBottom: 14 }}>mediums & tools</Lbl>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {(Object.entries(skills) as [string, string[]][]).map(([cat, items]) => (
                <div key={cat} style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                  <Lbl style={{ color: C.t4, width: 64, flexShrink: 0 }}>{cat}</Lbl>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px" }}>
                    {items.map(item => <span key={item} style={{ fontSize: 12, color: C.t2 }}>{item}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Influences */}
        {profile?.influences && (
          <div style={{ marginBottom: 28, paddingBottom: 28, borderBottom: `1px solid ${C.sep}` }}>
            <Lbl style={{ display: "block", marginBottom: 14 }}>influences</Lbl>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 20px" }}>
              {profile.influences.map(inf => <span key={inf} style={{ fontSize: 13, color: C.t2 }}>{inf}</span>)}
            </div>
          </div>
        )}

        {/* Contact */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <LinkButton href={`mailto:${member.email}`} icon="✉">{member.email}</LinkButton>
          <LinkButton href={`/${member.id}`} icon="◈">Full portfolio</LinkButton>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 9, color: C.t4, fontFamily: "'DM Mono',monospace", letterSpacing: ".07em", textTransform: "uppercase" }}>
            artefact · creative incubator
          </span>
        </div>

      </div>
    </div>
  );
}
