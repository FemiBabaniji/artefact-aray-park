"use client";
// contentEditable lives exclusively in this file. Never import from a server component.
import { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useC } from "@/hooks/useC";
import { FADE } from "@/lib/motion";
import { Btn } from "@/components/primitives/Btn";
import { Lbl } from "@/components/primitives/Lbl";
import { Loader } from "@/components/primitives/Loader";
import { Dot } from "@/components/primitives/Dot";
import { PullModal } from "./PullModal";
import { LinkPreviewGrid } from "@/components/artefact/LinkPreview";
import { useLinks } from "@/hooks/useLinks";
import { getSectionName, getSectionSubtitle } from "@/lib/labels";
import type { Section } from "@/types/section";

type WsExpandedProps = {
  memberId:     string;
  wsContent:    string;
  setWsContent: (html: string) => void;
  sections:     Section[];
  setSections:  (updater: (prev: Section[]) => Section[]) => void;
  syncing:      boolean;
  setSyncing:   (v: boolean) => void;
  onCollapse:   () => void;
  onFS?:        () => void;
  isFS?:        boolean;
  memberName:   string;
};

// Cursor-aware HTML insertion — preserves selection after node insertion
function insCursor(html: string): void {
  const sel = window.getSelection();
  if (!sel?.rangeCount) return;
  const r = sel.getRangeAt(0);
  r.deleteContents();
  const el = document.createElement("div");
  el.innerHTML = html;
  const f = document.createDocumentFragment();
  let last: Node | undefined;
  let n: ChildNode | null;
  while ((n = el.firstChild)) { last = f.appendChild(n); }
  r.insertNode(f);
  if (last) {
    const r2 = r.cloneRange();
    r2.setStartAfter(last);
    r2.collapse(true);
    sel.removeAllRanges();
    sel.addRange(r2);
  }
}

const KEYWORDS: Record<string, string[]> = {
  material:    ["material", "biolum", "resin", "glass"],
  focus:       ["focus", "developing", "research"],
  practice:    ["practice", "build", "environment", "light"],
  series:      ["liminal", "threshold", "series", "project"],
  exhibition:  ["exhibition", "show", "gallery"],
  collab:      ["collaboration", "outreach", "partner"],
  influences:  ["turrell", "eliasson", "influence"],
};

export function WsExpanded({
  memberId, wsContent, setWsContent, sections, setSections,
  syncing, setSyncing, onCollapse, onFS, isFS, memberName,
}: WsExpandedProps) {
  const C = useC();
  const eRef = useRef<HTMLDivElement>(null);
  const [showPull, setShowPull]   = useState(false);
  const [suggested, setSuggested] = useState<Section | null>(null);
  const [pulling, setPulling]     = useState(false);
  const { links, detectLinks, removeIndex, isLoading: linksLoading } = useLinks({ maxLinks: 6 });

  // Initialize editor with saved content on mount
  useEffect(() => {
    if (eRef.current && wsContent && !eRef.current.innerHTML) {
      eRef.current.innerHTML = wsContent;
    }
  }, [wsContent]);

  const handleInput = () => {
    if (eRef.current) {
      const html = eRef.current.innerHTML;
      setWsContent(html);
      detectLinks(html);
    }
  };

  const suggest = useCallback((content: string): Section | null => {
    const text = content.toLowerCase().replace(/<[^>]+>/g, "");
    let best: string | null = null;
    let bs = 0;
    for (const [id, ks] of Object.entries(KEYWORDS) as [string, string[]][]) {
      const sc = ks.filter(k => text.includes(k)).length;
      if (sc > bs) { bs = sc; best = id; }
    }
    return best ? (sections.find(s => s.id === best && s.status !== "accepted") ?? null) : null;
  }, [sections]);

  const doPull = () => {
    setSuggested(suggest(eRef.current?.innerHTML || wsContent));
    setShowPull(true);
  };

  const confirmPull = (sid: string) => {
    setShowPull(false);
    setPulling(true);
    setSyncing(true);

    const txt = (eRef.current?.innerHTML || wsContent)
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 140);

    // Capture fetched links to include with section
    const fetchedLinks = links.filter(l => l.fetched && !l.error);

    // Animation duration for visual feedback
    setTimeout(() => {
      // Update local state immediately (include links)
      setSections(prev => prev.map(s =>
        s.id === sid ? { ...s, status: "submitted", evidence: txt || s.evidence, links: fetchedLinks.length > 0 ? fetchedLinks : s.links } : s
      ));

      // Optional: try API call in background (non-blocking)
      fetch(`/api/sections/${memberId}?action=submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionKey: sid, evidence: txt, links: fetchedLinks }),
      }).catch(() => { /* ignore API errors for demo */ });

      setPulling(false);
      setSyncing(false);
    }, 2800);
  };

  const hasText = (wsContent || "").replace(/<[^>]+>/g, "").trim().length > 0;

  const cmd = (c: string, v?: string) => { eRef.current?.focus(); document.execCommand(c, false, v); };
  const ins = (h: string) => { eRef.current?.focus(); insCursor(h); };

  // Image upload handler
  const imgRef = useRef<HTMLInputElement>(null);
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      ins(`<img src="${dataUrl}" style="max-width:100%;border-radius:6px;margin:8px 0;" />`);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const tools = [
    { l: "H1", a: () => cmd("formatBlock", "h1") },
    { l: "H2", a: () => cmd("formatBlock", "h2") },
    { l: "B",  a: () => cmd("bold"),         fw: 600 },
    { l: "I",  a: () => cmd("italic"),        fi: "italic" },
    { l: "—",  a: () => ins("<hr/>") },
    { l: "·",  a: () => cmd("insertUnorderedList") },
    { l: "1.", a: () => cmd("insertOrderedList") },
    { l: "☐",  a: () => ins('<p><input type="checkbox"> </p>') },
    { l: "❝",  a: () => cmd("formatBlock", "blockquote") },
    { l: "`",  a: () => ins("<code>&nbsp;</code>"), ff: "monospace" },
    { l: "⌼", a: () => imgRef.current?.click() },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", position: "relative", background: C.void }}>
      <AnimatePresence>
        {pulling && (
          <motion.div key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={FADE}
            style={{ flexShrink: 0, padding: "8px 16px 0" }}>
            <Loader cols={70} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 18px 10px", borderBottom: `1px solid ${C.sep}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Lbl>workspace</Lbl>
          <div style={{ width: 1, background: C.sep, alignSelf: "stretch" }} />
          <Lbl style={{ color: C.t4 }}>{memberName.split(" ")[0].toLowerCase()}</Lbl>
          <AnimatePresence>
            {syncing && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={FADE}>
                <Lbl style={{ color: C.blue }}>pulling…</Lbl>
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <div style={{ display: "flex", gap: 14 }}>
          <Btn onClick={doPull} disabled={!hasText || pulling} accent={hasText && !pulling ? C.green : undefined}>↙ pull</Btn>
          {onFS && <Btn onClick={onFS}>{isFS ? "↙ exit" : "⊡"}</Btn>}
          {!isFS && <Btn onClick={onCollapse}>↙ close</Btn>}
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 1, padding: "5px 16px", borderBottom: `1px solid ${C.sep}`, flexShrink: 0, flexWrap: "wrap" }}>
        <input ref={imgRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} />
        {tools.map(t => (
          <motion.button key={t.l} onClick={t.a} whileHover={{ color: C.t2 }}
            style={{ color: C.t4, fontSize: t.ff ? 9 : 10, fontWeight: t.fw || 400, fontStyle: t.fi || "normal", fontFamily: t.ff || "'DM Mono',monospace", padding: "2px 6px", letterSpacing: ".03em", transition: "color .1s" }}>
            {t.l}
          </motion.button>
        ))}
      </div>

      {/* Editor + section sidebar */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 180px", overflow: "hidden" }}>
        <div style={{ overflow: "auto", padding: "18px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            ref={eRef}
            className="editor"
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            data-ph="Write freely. Pull to artefact when ready."
            style={{ flex: 1, minHeight: 120 }}
          />
          {/* Link previews */}
          {links.length > 0 && (
            <div style={{ borderTop: `1px solid ${C.sep}`, paddingTop: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Lbl>detected links</Lbl>
                {linksLoading && (
                  <span style={{ fontSize: 9, color: C.blue, fontFamily: "'DM Mono', monospace" }}>
                    fetching...
                  </span>
                )}
              </div>
              <LinkPreviewGrid links={links} onRemove={removeIndex} maxItems={4} />
            </div>
          )}
        </div>
        <div style={{ borderLeft: `1px solid ${C.sep}`, overflow: "auto", padding: "14px 16px" }}>
          <Lbl style={{ display: "block", marginBottom: 14 }}>sections</Lbl>
          {sections.map((s, i) => {
            const showSubtitle = s.status === "empty" || s.status === "in_progress";
            return (
              <div key={s.id} style={{ paddingBottom: 10, marginBottom: 10, borderBottom: i < sections.length - 1 ? `1px solid ${C.sep}` : "none" }}>
                <div style={{ fontSize: 12, color: C.t2, marginBottom: 4, lineHeight: 1.35, fontWeight: 400 }}>{getSectionName(s.id)}</div>
                {showSubtitle && (
                  <div style={{ fontSize: 10, color: C.t4, marginBottom: 4, lineHeight: 1.4 }}>{getSectionSubtitle(s.id)}</div>
                )}
                <Dot status={s.status} />
                {s.evidence && <div style={{ fontSize: 11, color: C.t4, marginTop: 4, lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{s.evidence}</div>}
              </div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {showPull && (
          <PullModal
            sections={sections}
            suggested={suggested}
            evidence={(eRef.current?.innerHTML || wsContent).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 140)}
            onConfirm={confirmPull}
            onDismiss={() => setShowPull(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
