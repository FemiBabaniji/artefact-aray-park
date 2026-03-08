"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";
import { FADE } from "@/lib/motion";
import { Lbl } from "@/components/primitives/Lbl";

type Identity = {
  name:     string;
  title:    string;
  email:    string;
  location: string;
  practice: string;
  goals:    string;
};

const DEFAULT: Identity = {
  name:     "", title: "", email: "", location: "",
  practice: "I build environments that hold a feeling.",
  goals:    "",
};

const FIELDS: { key: keyof Identity; label: string; placeholder: string; multiline?: boolean }[] = [
  { key: "name",     label: "full name",     placeholder: "Ava Martinez" },
  { key: "title",    label: "practice title", placeholder: "Visual Artist & Spatial Designer" },
  { key: "email",    label: "email",          placeholder: "ava@avamartinez.studio" },
  { key: "location", label: "location",       placeholder: "Toronto, ON" },
  { key: "practice", label: "practice statement", placeholder: "Describe your practice…", multiline: true },
  { key: "goals",    label: "goals",          placeholder: "What do you want from this program?", multiline: true },
];

export default function ApplyPage() {
  const C = useC();
  const [identity, setIdentity] = useState<Identity>(DEFAULT);
  const [submitted, setSubmitted] = useState(false);

  // Read from localStorage after mount — never in useState initialiser (SSR safe)
  useEffect(() => {
    try {
      const stored = localStorage.getItem("ava_identity");
      if (stored) setIdentity(prev => ({ ...prev, ...JSON.parse(stored) }));
    } catch {}
  }, []);

  const update = (key: keyof Identity, value: string) => {
    setIdentity(prev => {
      const next = { ...prev, [key]: value };
      try { localStorage.setItem("ava_identity", JSON.stringify(next)); } catch {}
      return next;
    });
  };

  if (submitted) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={FADE}
        style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <div style={{ fontSize: 32, color: C.green }}>✓</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: C.t1 }}>Application submitted.</div>
        <div style={{ fontSize: 12, color: C.t3 }}>Your artefact has been created.</div>
      </motion.div>
    );
  }

  return (
    <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 24px 80px" }}>
      <div style={{ width: "100%", maxWidth: 480 }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 22, fontWeight: 600, color: C.t1, letterSpacing: "-.025em", marginBottom: 6 }}>
            Creative Incubator · Spring Cohort
          </div>
          <div style={{ fontSize: 12, color: C.t3, lineHeight: 1.6 }}>
            This form creates your artefact. Everything you enter here persists throughout the program.
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {FIELDS.map(f => (
            <div key={f.key}>
              <Lbl style={{ display: "block", marginBottom: 6 }}>{f.label}</Lbl>
              {f.multiline ? (
                <textarea
                  value={identity[f.key]}
                  onChange={e => update(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  rows={3}
                  style={{ width: "100%", background: "transparent", border: `1px solid ${C.sep}`, borderRadius: 8, padding: "10px 14px", color: C.t1, fontSize: 13, fontFamily: "'DM Sans',sans-serif", lineHeight: 1.6, outline: "none", resize: "vertical", transition: "border-color .15s" }}
                  onFocus={e => { e.target.style.borderColor = C.t3; }}
                  onBlur={e => { e.target.style.borderColor = C.sep; }}
                />
              ) : (
                <input
                  type={f.key === "email" ? "email" : "text"}
                  value={identity[f.key]}
                  onChange={e => update(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  style={{ width: "100%", background: "transparent", border: `1px solid ${C.sep}`, borderRadius: 8, padding: "10px 14px", color: C.t1, fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: "none", transition: "border-color .15s" }}
                  onFocus={e => { e.target.style.borderColor = C.t3; }}
                  onBlur={e => { e.target.style.borderColor = C.sep; }}
                />
              )}
            </div>
          ))}
        </div>

        <motion.button
          onClick={() => setSubmitted(true)}
          whileHover={{ opacity: 0.85 }} whileTap={{ scale: 0.98 }}
          style={{ marginTop: 32, width: "100%", padding: "13px", border: `1px solid ${C.t3}`, borderRadius: 10, background: "transparent", color: C.t1, fontSize: 13, fontFamily: "'DM Sans',sans-serif", fontWeight: 500, cursor: "pointer", letterSpacing: "-.01em" }}>
          Submit application →
        </motion.button>
      </div>
    </div>
  );
}
