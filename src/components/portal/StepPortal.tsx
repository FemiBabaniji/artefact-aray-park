"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useC } from "@/hooks/useC";
import { FADE, SP } from "@/lib/motion";
import { Artefact } from "@/components/artefact/Artefact";
import { WsExpanded } from "@/components/workspace/WsExpanded";
import { Lbl } from "@/components/primitives/Lbl";
import { Btn } from "@/components/primitives/Btn";
import { Dot } from "@/components/primitives/Dot";
import { Loader } from "@/components/primitives/Loader";
import type { Member, MemberProfile } from "@/types/member";
import type { Section } from "@/types/section";

type StepPortalProps = {
  member:   Member & { profile?: MemberProfile };
  sections: Section[];
};

export function StepPortal({ member, sections: initialSections }: StepPortalProps) {
  const C = useC();
  const [sections, setSections]     = useState(initialSections);
  const [wsExpanded, setWsExpanded] = useState(false);
  const [wsContent, setWsContent]   = useState("");
  const [syncing, setSyncing]       = useState(false);
  const [wsFS, setWsFS]             = useState(false);
  const [avatarSrc, setAvatarSrc]   = useState<string | null>(member.avatarUrl || null);

  return (
    <>
      {/* ── Fullscreen workspace overlay ── */}
      <AnimatePresence>
        {wsFS && (
          <motion.div
            key="fs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={FADE}
            style={{
              position: "fixed", inset: 0, background: C.void, zIndex: 300,
              display: "flex", flexDirection: "column",
            }}
          >
            <WsExpanded
              memberId={member.id}
              memberName={member.name}
              wsContent={wsContent}
              setWsContent={setWsContent}
              sections={sections}
              setSections={setSections}
              syncing={syncing}
              setSyncing={setSyncing}
              onCollapse={() => setWsFS(false)}
              onFS={() => setWsFS(false)}
              isFS={true}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main content ── */}
      {!wsFS && (
        <div style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          overflow: "hidden", position: "relative",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
            {/* Artefact */}
            <AnimatePresence mode="wait">
              {!wsExpanded ? (
                <motion.div key="full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={FADE}>
                  <Artefact
                    member={member}
                    sections={sections}
                    setSections={setSections}
                    role="member"
                    syncing={syncing}
                    compact={false}
                    onToggleCompact={() => {}}
                    avatarSrc={avatarSrc}
                    onAvatarChange={setAvatarSrc}
                  />
                </motion.div>
              ) : (
                <motion.div key="mini" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={FADE}>
                  <MiniCard member={member} avatarSrc={avatarSrc} syncing={syncing} onClick={() => setWsExpanded(false)} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Workspace panel */}
            <AnimatePresence mode="wait">
              <motion.div
                key="ws"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={FADE}
              >
                <WorkspaceBox
                  memberId={member.id}
                  memberName={member.name}
                  sections={sections}
                  setSections={setSections}
                  wsContent={wsContent}
                  setWsContent={setWsContent}
                  syncing={syncing}
                  setSyncing={setSyncing}
                  expanded={wsExpanded}
                  onToggle={() => setWsExpanded(v => !v)}
                  onFS={() => { setWsExpanded(false); setWsFS(true); }}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Mini Card ──────────────────────────────────────────────────────────────

type MiniCardProps = {
  member:    Member;
  avatarSrc: string | null;
  syncing:   boolean;
  onClick:   () => void;
};

function MiniCard({ member, avatarSrc, syncing, onClick }: MiniCardProps) {
  const C = useC();

  return (
    <motion.div onClick={onClick} whileTap={{ scale: 0.97 }}
      animate={{ borderColor: syncing ? C.blue + "44" : C.edge, background: C.void }}
      style={{
        width: 90, height: 90, border: `1px solid ${C.edge}`, borderRadius: 12,
        cursor: "pointer", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 4,
        position: "relative", flexShrink: 0,
      }}
    >
      <Lbl style={{ position: "absolute", top: 9, fontSize: 8 }}>input_001</Lbl>
      <div style={{
        width: 26, height: 26, borderRadius: 6, background: member.color,
        display: "flex", alignItems: "center", justifyContent: "center", marginTop: 4,
      }}>
        {avatarSrc ? (
          <img src={avatarSrc} alt="" style={{ width: "100%", height: "100%", borderRadius: 6, objectFit: "cover" }} />
        ) : (
          <span style={{ fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>{member.initials}</span>
        )}
      </div>
      <Lbl style={{ color: C.t4, fontSize: 8 }}>{member.name.split(" ")[0].toLowerCase()}</Lbl>
      {/* Section dots */}
      <div style={{ display: "flex", gap: 3, position: "absolute", bottom: 9 }}>
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} style={{ width: 4, height: 4, borderRadius: 1, background: C.sep, opacity: 0.55 }} />
        ))}
      </div>
    </motion.div>
  );
}

// ─── Workspace Box ──────────────────────────────────────────────────────────

type WorkspaceBoxProps = {
  memberId:     string;
  memberName:   string;
  sections:     Section[];
  setSections:  (updater: (prev: Section[]) => Section[]) => void;
  wsContent:    string;
  setWsContent: (html: string) => void;
  syncing:      boolean;
  setSyncing:   (v: boolean) => void;
  expanded:     boolean;
  onToggle:     () => void;
  onFS:         () => void;
};

function WorkspaceBox({
  memberId, memberName, sections, setSections,
  wsContent, setWsContent, syncing, setSyncing,
  expanded, onToggle, onFS,
}: WorkspaceBoxProps) {
  const C = useC();

  const pending = sections.filter(s => ["in_progress", "submitted"].includes(s.status)).length;
  const W = expanded ? "min(56vw, 54vh)" : "158px";
  const H = expanded ? "min(72vh, 70vw)" : "136px";

  // Preview text for collapsed state
  const plain = wsContent.replace(/<[^>]+>/g, "").trim();
  const words = plain.split(/\s+/).filter(Boolean);
  const preview = words.slice(0, 12).join(" ") + (words.length > 12 ? "…" : "");
  const hasContent = plain.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5, flexShrink: 0 }}>
      {/* Syncing loader above collapsed box */}
      <AnimatePresence>
        {syncing && !expanded && (
          <motion.div
            key="sl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={FADE}
            style={{ width: W, overflow: "hidden", paddingBottom: 3 }}
          >
            <Loader cols={22} />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        onClick={!expanded ? onToggle : undefined}
        animate={{ width: W, height: H, borderColor: syncing ? C.blue + "55" : C.edge, background: C.void }}
        transition={SP}
        style={{
          border: `1px solid ${C.edge}`, borderRadius: 12, overflow: "hidden",
          flexShrink: 0, position: "relative", cursor: expanded ? "default" : "pointer",
        }}
      >
        <AnimatePresence mode="wait">
          {!expanded ? (
            <motion.div key="c" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={FADE}
              style={{ height: "100%" }}>
              {/* Compact header */}
              <div style={{
                padding: "9px 16px 7px", borderBottom: `1px solid ${C.sep}`,
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <Lbl>workspace</Lbl>
                <AnimatePresence>
                  {syncing && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <Lbl style={{ color: C.blue, fontSize: 8 }}>syncing</Lbl>
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              {/* Compact body */}
              <div style={{ padding: "10px 16px 12px", height: "calc(100% - 32px)", display: "flex", flexDirection: "column", gap: 9 }}>
                {/* Section dots */}
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {sections.map(s => (
                    <Dot key={s.id} status={s.status} hideLabel size={5} />
                  ))}
                </div>

                {hasContent ? (
                  <>
                    <div style={{ flex: 1, fontSize: 11, color: C.t3, lineHeight: 1.55, overflow: "hidden" }}>
                      {preview}
                    </div>
                    {pending > 0 && (
                      <span className="mono" style={{ fontSize: 9, color: C.blue }}>{pending} in progress</span>
                    )}
                    <Btn onClick={onToggle} style={{ textAlign: "left" }}>↓ open</Btn>
                  </>
                ) : (
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6, justifyContent: "center" }}>
                    <div style={{ fontSize: 11, color: C.t4, lineHeight: 1.6 }}>
                      Write freely — pull your notes into sections when ready.
                    </div>
                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
                      <Btn onClick={onToggle} style={{ textAlign: "left", color: C.t2 }}>↓ open to begin</Btn>
                    </motion.div>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div key="e" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={FADE}
              style={{ height: "100%" }}>
              <WsExpanded
                memberId={memberId}
                memberName={memberName}
                wsContent={wsContent}
                setWsContent={setWsContent}
                sections={sections}
                setSections={setSections}
                syncing={syncing}
                setSyncing={setSyncing}
                onCollapse={onToggle}
                onFS={onFS}
                isFS={false}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
