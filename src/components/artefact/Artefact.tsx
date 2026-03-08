"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "qrcode";
import { useC } from "@/hooks/useC";
import { useHover } from "@/hooks/useHover";
import { mkST } from "@/lib/status";
import { SP, SPF, FADE } from "@/lib/motion";
import { Avatar } from "@/components/primitives/Avatar";
import { Dot } from "@/components/primitives/Dot";
import { Btn } from "@/components/primitives/Btn";
import { Lbl } from "@/components/primitives/Lbl";
import { Region } from "./Region";
import { LinkPreviewGrid } from "./LinkPreview";
import {
  getSectionName,
  getSectionSubtitle,
  getCheckpointName,
  formatCheckpointProgress,
  getStatusMessage,
  formatOverallProgress,
} from "@/lib/labels";
import type { Member, MemberProfile, ArtefactRole } from "@/types/member";
import type { Section, SectionKey } from "@/types/section";

type ArtefactProps = {
  member:          Member & { profile?: MemberProfile };
  sections:        Section[];
  setSections?:    (updater: (prev: Section[]) => Section[]) => void;
  role:            ArtefactRole;
  syncing:         boolean;
  compact:         boolean;
  onToggleCompact: () => void;
  avatarSrc?:      string | null;
  onAvatarChange?: (src: string | null) => void;
  // Workspace/mentor panel rendered by parent — passed as slot
  workspaceSlot?:  React.ReactNode;
};

type DrillKey = "identity" | "sections";

export function Artefact({
  member, sections, role, syncing, compact,
  onToggleCompact, avatarSrc, onAvatarChange, workspaceSlot,
}: ArtefactProps) {
  const C  = useC();
  const ST = mkST(C);
  const [drilled, setDrilled] = useState<DrillKey | null>(null);
  const ph = useHover(350);

  const profile  = member.profile;
  const cp1Total = sections.filter(s => s.cp === 1).length;
  const cp1Done  = sections.filter(s => s.cp === 1 && s.status === "accepted").length;
  const cp2Total = sections.filter(s => s.cp === 2).length;
  const cp2Done  = sections.filter(s => s.cp === 2 && s.status === "accepted").length;

  // ── COMPACT ─────────────────────────────────────────────────────────────────
  if (compact) {
    return (
      <CompactCard
        member={member}
        syncing={syncing}
        avatarSrc={avatarSrc}
        onAvatarChange={onAvatarChange}
        onExpand={onToggleCompact}
      />
    );
  }

  // ── EXPANDED ────────────────────────────────────────────────────────────────
  const SZ = "min(70vw, 70vh)";

  return (
    <div style={{ position: "relative", width: SZ, height: SZ, flexShrink: 0 }}>
      {/* Floating label */}
      <div style={{ position: "absolute", top: -18, left: 0, display: "flex", alignItems: "center", gap: 8 }}>
        <Lbl style={{ fontSize: 8 }}>input_001</Lbl>
        <span style={{ fontSize: 10, color: C.t4 }}>{member.name} — {member.title}</span>
      </div>

      <motion.div
        animate={{ borderColor: syncing ? C.blue + "44" : C.edge, background: C.void }}
        style={{
          width: "100%", height: "100%",
          border: `1px solid ${C.edge}`, borderRadius: 14,
          display: "grid", gridTemplateColumns: "1fr 1fr",
          overflow: "hidden", position: "relative",
        }}
      >
        {/* LEFT column */}
        <div style={{ display: "flex", flexDirection: "column", padding: "22px 24px", height: "100%", overflow: "hidden", borderRight: `1px solid ${C.sep}` }}>
          {/* Identity region */}
          <Region tag="identity" flex="none">
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
              <Avatar size={40} imgSrc={avatarSrc} onImgChange={onAvatarChange || undefined}
                onClick={() => setDrilled("identity")} style={{ cursor: "pointer" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 17, fontWeight: 600, color: C.t1, letterSpacing: "-.025em", marginBottom: 3, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {member.name}
                </div>
                <div style={{ fontSize: 12, color: C.t3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.4 }}>
                  {member.title}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 16, paddingBottom: 16 }}>
              <span style={{ fontSize: 11, color: C.t3 }}>{member.email}</span>
              <span style={{ fontSize: 11, color: C.t4 }}>{member.location}</span>
            </div>
          </Region>

          {/* Sections region */}
          <Region tag="sections" onClick={() => setDrilled("sections")} flex={1}
            syncBorder={syncing ? C.blue + "33" : C.sep}>
            {/* Checkpoint progress bars */}
            <div style={{ display: "flex", gap: 14, marginBottom: 14, flexShrink: 0 }}>
              {([[1, cp1Done, cp1Total], [2, cp2Done, cp2Total]] as const).map(([cp, done, total]) => (
                <div key={cp} style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <Lbl style={{ fontSize: 9 }}>{getCheckpointName(cp)}</Lbl>
                    <span className="mono" style={{ fontSize: 9, color: done === total ? C.green : C.t3 }}>
                      {done === 0 ? "not started" : done === total ? "complete" : `${done}/${total}`}
                    </span>
                  </div>
                  <div style={{ height: 1, background: C.sep }}>
                    <motion.div animate={{ width: `${(done / total) * 100}%` }} transition={SPF}
                      style={{ height: "100%", background: done === total ? C.green : C.blue }} />
                  </div>
                </div>
              ))}
            </div>
            {/* Section rows */}
            <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              {sections.slice(0, 4).map((s, i, arr) => {
                const showSubtitle = s.status === "empty" || s.status === "in_progress";
                const hasFeedback = !!s.feedback;
                return (
                  <motion.div key={s.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={FADE}
                    style={{ display: "flex", flexDirection: "column", padding: "8px 0", borderBottom: i < arr.length - 1 ? `1px solid ${C.sep}` : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 13, color: C.t2, fontWeight: 400 }}>{getSectionName(s.id)}</span>
                      <Dot status={s.status} />
                    </div>
                    {/* Subtitle when empty/in progress */}
                    {showSubtitle && (
                      <div style={{ fontSize: 11, color: C.t4, marginTop: 3, lineHeight: 1.4 }}>
                        {getSectionSubtitle(s.id)}
                      </div>
                    )}
                    {/* Link previews (compact) */}
                    {s.links && s.links.length > 0 && (
                      <div style={{ marginTop: 6 }}>
                        <LinkPreviewGrid links={s.links} compact maxItems={2} />
                      </div>
                    )}
                    {/* Feedback message for member */}
                    {role === "member" && (s.status === "reviewed" || s.status === "in_progress") && hasFeedback && (
                      <div style={{ fontSize: 11, color: C.t3, lineHeight: 1.55, marginTop: 5, padding: "6px 10px", borderLeft: `2px solid ${s.status === "reviewed" ? C.amber : C.sep}`, background: s.status === "reviewed" ? C.amber + "08" : "transparent" }}>
                        <div style={{ fontSize: 10, color: s.status === "reviewed" ? C.amber : C.t4, marginBottom: 4, fontWeight: 500 }}>
                          {getStatusMessage(s.status, hasFeedback)}
                        </div>
                        <div style={{ fontStyle: "italic" }}>
                          {s.feedback}
                          {s.feedbackAt && <span className="mono" style={{ fontSize: 8, color: C.t4, marginLeft: 8, fontStyle: "normal" }}>{s.feedbackAt}</span>}
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </Region>
        </div>

        {/* RIGHT column */}
        <div style={{ display: "flex", flexDirection: "column", padding: "22px 24px", height: "100%", overflow: "hidden" }}>
          {/* Workspace/mentor slot or practice region */}
          {workspaceSlot
            ? <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>{workspaceSlot}</div>
            : (
              <>
                <Region tag="practice" onClick={() => setDrilled("sections")} flex={ph.active ? 3 : 1} {...ph}>
                  <div style={{ overflow: "auto", flex: 1 }}>
                    <p style={{ fontSize: 14, color: C.t2, lineHeight: 1.82, margin: 0, fontWeight: 400 }}>
                      {profile?.practice || ""}
                    </p>
                    <AnimatePresence>
                      {ph.active && (
                        <motion.div key="f" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }} transition={SPF} style={{ overflow: "hidden" }}>
                          <div style={{ height: 1, background: C.sep, margin: "13px 0" }} />
                          <p style={{ fontSize: 13, color: C.t3, lineHeight: 1.75, margin: 0 }}>{profile?.focus || ""}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </Region>
                <Region tag="connect" onClick={() => setDrilled("identity")} flex={ph.active ? 1 : 2}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ fontSize: 14, color: C.t2, fontWeight: 400 }}>{member.email}</div>
                    <div style={{ fontSize: 14, color: C.t2, fontWeight: 400 }}>{member.phone}</div>
                    <div style={{ fontSize: 12, color: C.t3, marginTop: 2 }}>{profile?.availability || ""}</div>
                  </div>
                </Region>
              </>
            )
          }
        </div>

        {/* Drill overlay */}
        <AnimatePresence>
          {drilled && (
            <DrillOverlay
              key={drilled}
              drillKey={drilled}
              member={member}
              sections={sections}
              avatarSrc={avatarSrc}
              onAvatarChange={onAvatarChange}
              onBack={() => setDrilled(null)}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// ── Compact card ─────────────────────────────────────────────────────────────

type CompactCardProps = {
  member:          Member & { profile?: MemberProfile };
  syncing:         boolean;
  avatarSrc?:      string | null;
  onAvatarChange?: (src: string | null) => void;
  onExpand:        () => void;
};

function CompactCard({ member, syncing, avatarSrc, onAvatarChange, onExpand }: CompactCardProps) {
  const C = useC();
  const [showQR, setShowQR] = useState(false);

  const vcard = [
    "BEGIN:VCARD", "VERSION:3.0",
    `FN:${member.name}`,
    `TITLE:${member.title}`,
    `EMAIL:${member.email}`,
    member.phone ? `TEL:${member.phone}` : "",
    `ADR:${member.location}`,
    "END:VCARD",
  ].filter(Boolean).join("\n");

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1, borderColor: syncing ? C.blue + "44" : C.edge, background: C.void }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={SP}
      style={{ border: `1px solid ${C.edge}`, borderRadius: 14, overflow: "hidden", width: 300, flexShrink: 0 }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 18px 10px", borderBottom: `1px solid ${C.sep}` }}>
        <Lbl style={{ fontSize: 8 }}>input_001</Lbl>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Btn onClick={() => setShowQR(v => !v)} accent={showQR ? C.blue : undefined} style={{ fontSize: 9 }}>⊞ qr</Btn>
          <Btn onClick={onExpand} style={{ fontSize: 9 }}>⊞ expand</Btn>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {showQR ? (
          <motion.div key="qr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={FADE}
            style={{ padding: "24px 22px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <QRDisplay value={vcard} size={148} />
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.t1, letterSpacing: "-.015em" }}>{member.name}</div>
              <div style={{ fontSize: 10, color: C.t3, fontFamily: "'DM Mono', monospace" }}>scan to save contact</div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="id" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={FADE}
            style={{ padding: "20px 22px 22px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
              <Avatar size={44} imgSrc={avatarSrc} onImgChange={onAvatarChange || undefined} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 600, color: C.t1, letterSpacing: "-.025em", marginBottom: 3, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {member.name}
                </div>
                <div style={{ fontSize: 12, color: C.t3, lineHeight: 1.4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {member.title}
                </div>
              </div>
            </div>
            <div style={{ height: 1, background: C.sep, marginBottom: 14 }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 12, color: C.t2 }}>{member.email}</div>
              <div style={{ fontSize: 12, color: C.t3 }}>{member.phone}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
                <span style={{ fontSize: 11, color: C.t4 }}>{member.location}</span>
                <span style={{ fontSize: 10, color: member.accepted === member.sections ? C.green : C.t3, fontFamily: "'DM Mono', monospace" }}>
                  {formatOverallProgress(member.accepted, member.sections)}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── QR display (lazy-loads qrcodejs) ─────────────────────────────────────────

function QRDisplay({ value, size }: { value: string; size: number }) {
  const C = useC();
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(value, {
      width: size,
      margin: 1,
      color: { dark: "#000000", light: "#ffffff" },
    })
      .then(setDataUrl)
      .catch(console.error);
  }, [value, size]);

  if (!dataUrl) {
    return (
      <div style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center",
        background: C.sep, borderRadius: 8, color: C.t4, fontSize: 9, fontFamily: "monospace" }}>
        Loading...
      </div>
    );
  }

  return (
    <img
      src={dataUrl}
      alt="QR Code"
      style={{ width: size, height: size, borderRadius: 8 }}
    />
  );
}

// ── Drill overlay ─────────────────────────────────────────────────────────────

type DrillOverlayProps = {
  drillKey:        DrillKey;
  member:          Member & { profile?: MemberProfile };
  sections:        Section[];
  avatarSrc?:      string | null;
  onAvatarChange?: (src: string | null) => void;
  onBack:          () => void;
};

function DrillOverlay({ drillKey, member, sections, avatarSrc, onAvatarChange, onBack }: DrillOverlayProps) {
  const C       = useC();
  const profile = member.profile;
  const [aL, setAL] = useState(0);
  const [aR, setAR] = useState(1);

  const quads = drillKey === "identity"
    ? [
        { tag: "profile",  content: <ProfileQuad member={member} avatarSrc={avatarSrc} onAvatarChange={onAvatarChange} /> },
        { tag: "social",   content: <SocialQuad profile={profile} /> },
        { tag: "goals",    content: <GoalsQuad profile={profile} /> },
        { tag: "focus",    content: <FocusQuad profile={profile} /> },
      ]
    : [
        { tag: getCheckpointName(1), content: <Cp1Quad sections={sections} /> },
        { tag: getCheckpointName(2), content: <Cp2Quad sections={sections} /> },
        { tag: "works",              content: <WorksQuad profile={profile} /> },
        { tag: "skills",             content: <SkillsQuad profile={profile} /> },
      ];

  const L = [quads[0], quads[2]];
  const R = [quads[1], quads[3]];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={FADE}
      style={{ position: "absolute", inset: 0, background: C.void, border: `1px solid ${C.edge}`, borderRadius: 14, display: "flex", flexDirection: "column", zIndex: 10, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px 10px", borderBottom: `1px solid ${C.sep}`, flexShrink: 0 }}>
        <Btn onClick={onBack}>← back</Btn>
        <div style={{ width: 1, background: C.sep, alignSelf: "stretch" }} />
        <Lbl style={{ color: C.t2 }}>{drillKey}</Lbl>
      </div>
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", overflow: "hidden" }}>
        {[{ items: L, a: aL, setA: setAL }, { items: R, a: aR, setA: setAR }].map(({ items, a, setA }, ci) => (
          <div key={ci} style={{ display: "flex", flexDirection: "column", padding: "14px 18px", height: "100%", overflow: "hidden", borderRight: ci === 0 ? `1px solid ${C.sep}` : "none" }}>
            {items.map((q, i) => (
              <motion.div key={i} layout transition={SP} style={{ flex: a === i ? 3 : 1, minHeight: 0, display: "flex", flexDirection: "column", cursor: "pointer" }} onClick={() => setA(i)}>
                <div style={{ borderTop: `1px solid ${C.sep}`, paddingTop: 11, flex: 1, minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                  <Lbl style={{ marginBottom: 8, display: "block", flexShrink: 0 }}>{q.tag}</Lbl>
                  <AnimatePresence mode="wait">
                    {a === i
                      ? <motion.div key="o" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.11 }} style={{ overflow: "auto", height: "100%" }}>{q.content}</motion.div>
                      : <motion.div key="c" initial={{ opacity: 0 }} animate={{ opacity: 0.2 }} exit={{ opacity: 0 }} style={{ fontSize: 10, color: C.t3 }}>{q.tag}</motion.div>
                    }
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// Drill quad content components

function ProfileQuad({ member, avatarSrc, onAvatarChange }: { member: Member & { profile?: MemberProfile }; avatarSrc?: string | null; onAvatarChange?: (src: string | null) => void }) {
  const C = useC();
  return (
    <div>
      <div style={{ marginBottom: 14 }}><Avatar size={42} imgSrc={avatarSrc} onImgChange={onAvatarChange || undefined} /></div>
      <div style={{ fontSize: 20, fontWeight: 600, color: C.t1, marginBottom: 4, letterSpacing: "-.025em", lineHeight: 1.2 }}>{member.name}</div>
      <div style={{ fontSize: 13, color: C.t2, marginBottom: 14, lineHeight: 1.4 }}>{member.title}</div>
      <div style={{ height: 1, background: C.sep, marginBottom: 14 }} />
      {[member.email, member.phone, member.location].map((v, i) => v && <div key={i} style={{ fontSize: 13, color: C.t2, marginBottom: 7, lineHeight: 1.5 }}>{v}</div>)}
    </div>
  );
}

function SocialQuad({ profile }: { profile?: MemberProfile }) {
  const C = useC();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {["instagram", "twitter", "linkedin"].map(s => <div key={s} style={{ fontSize: 14, color: C.t2, padding: "10px 0", borderBottom: `1px solid ${C.sep}`, fontWeight: 400 }}>{s}</div>)}
      <div style={{ fontSize: 13, color: C.t3, lineHeight: 1.65, marginTop: 12 }}>{profile?.availability || ""}</div>
    </div>
  );
}

function GoalsQuad({ profile }: { profile?: MemberProfile }) {
  const C = useC();
  const goals = profile?.goals || [];
  return (
    <div>
      {goals.map((g, i, a) => <div key={i} style={{ fontSize: 13, color: C.t2, lineHeight: 1.65, padding: "10px 0", borderBottom: i < a.length - 1 ? `1px solid ${C.sep}` : "none" }}>{g}</div>)}
    </div>
  );
}

function FocusQuad({ profile }: { profile?: MemberProfile }) {
  const C = useC();
  return <div style={{ fontSize: 14, color: C.t2, lineHeight: 1.82, fontWeight: 400 }}>{profile?.focus || ""}</div>;
}

function Cp1Quad({ sections }: { sections: Section[] }) {
  const C = useC();
  return (
    <div>
      {sections.filter(s => s.cp === 1).map((s, i, a) => {
        const showSubtitle = s.status === "empty" || s.status === "in_progress";
        return (
          <div key={s.id} style={{ padding: "10px 0", borderBottom: i < a.length - 1 ? `1px solid ${C.sep}` : "none" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: s.evidence || s.links?.length || showSubtitle ? 5 : 0 }}>
              <span style={{ fontSize: 13, color: C.t1, fontWeight: 500 }}>{getSectionName(s.id)}</span><Dot status={s.status} />
            </div>
            {showSubtitle && (
              <div style={{ fontSize: 10, color: C.t4, marginBottom: 4 }}>{getSectionSubtitle(s.id)}</div>
            )}
            {s.evidence && <div style={{ fontSize: 11, color: C.t3, lineHeight: 1.55, marginTop: 3 }}>{s.evidence.slice(0, 80)}…</div>}
            {s.links && s.links.length > 0 && (
              <div style={{ marginTop: 6 }}>
                <LinkPreviewGrid links={s.links} compact maxItems={2} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Cp2Quad({ sections }: { sections: Section[] }) {
  const C = useC();
  return (
    <div>
      {sections.filter(s => s.cp === 2).map((s, i, a) => {
        const showSubtitle = s.status === "empty" || s.status === "in_progress";
        return (
          <div key={s.id} style={{ padding: "10px 0", borderBottom: i < a.length - 1 ? `1px solid ${C.sep}` : "none" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: showSubtitle ? 4 : 0 }}>
              <span style={{ fontSize: 13, color: C.t1, fontWeight: 500 }}>{getSectionName(s.id)}</span><Dot status={s.status} />
            </div>
            {showSubtitle && (
              <div style={{ fontSize: 10, color: C.t4 }}>{getSectionSubtitle(s.id)}</div>
            )}
            {s.links && s.links.length > 0 && (
              <div style={{ marginTop: 6 }}>
                <LinkPreviewGrid links={s.links} compact maxItems={2} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function WorksQuad({ profile }: { profile?: MemberProfile }) {
  const C = useC();
  const projects = profile?.projects || [];
  return (
    <div>
      {projects.map((p, pi) => (
        <div key={pi} style={{ marginBottom: 16 }}>
          <span className="mono" style={{ fontSize: 10, color: C.t3, textTransform: "uppercase", letterSpacing: ".07em", display: "block", marginBottom: 8 }}>{p.name}</span>
          {p.works.map((w, wi, a) => (
            <div key={wi} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "8px 0", borderBottom: wi < a.length - 1 ? `1px solid ${C.sep}` : "none" }}>
              <span style={{ fontSize: 13, color: C.t2, fontWeight: 400 }}>{w.title}</span>
              <span className="mono" style={{ fontSize: 10, color: C.t3 }}>{w.year}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function SkillsQuad({ profile }: { profile?: MemberProfile }) {
  const C = useC();
  const skills = profile?.skills || { Primary: [], Tools: [], Mediums: [] };
  return (
    <div>
      {(Object.entries(skills) as [string, string[]][]).map(([cat, items]) => (
        <div key={cat} style={{ marginBottom: 16 }}>
          <span className="mono" style={{ fontSize: 10, color: C.t3, textTransform: "uppercase", letterSpacing: ".07em", display: "block", marginBottom: 9 }}>{cat}</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {items.map(item => <span key={item} style={{ fontSize: 13, color: C.t2, fontWeight: 400 }}>{item}</span>)}
          </div>
        </div>
      ))}
    </div>
  );
}
