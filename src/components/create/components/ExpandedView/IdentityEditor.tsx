"use client";

import { useC } from "@/hooks/useC";
import { Lbl } from "@/components/primitives/Lbl";
import { Btn } from "@/components/primitives/Btn";
import type { Identity } from "../../types";

type IdentityEditorProps = {
  identity: Identity;
  updateIdentity: (updates: Partial<Identity>) => void;
  onBack: () => void;
  compact?: boolean;
};

export function IdentityEditor({ identity, updateIdentity, onBack, compact }: IdentityEditorProps) {
  const C = useC();

  const fields: {
    key: keyof Identity;
    label: string;
    placeholder: string;
    multiline?: boolean;
  }[] = [
    { key: "name", label: "Name", placeholder: "Your name" },
    { key: "title", label: "Title", placeholder: "What you do" },
    { key: "location", label: "Location", placeholder: "Where you're based" },
    { key: "bio", label: "Bio", placeholder: "Brief bio...", multiline: true },
  ];

  const padding = compact ? 12 : 24;
  const fontSize = compact ? 12 : 13;
  const inputPadding = compact ? "8px 10px" : "10px 12px";

  return (
    <>
      <div
        style={{
          padding: compact ? "10px 12px" : "14px 20px",
          borderBottom: `1px solid ${C.sep}`,
          display: "flex",
          alignItems: "center",
          gap: compact ? 8 : 12,
        }}
      >
        <Btn onClick={onBack} style={{ color: C.t3, fontSize: compact ? 10 : 12 }}>
          &larr;
        </Btn>
        <span style={{ fontSize: compact ? 12 : 14, fontWeight: 500, color: C.t1 }}>
          Identity
        </span>
      </div>
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding,
          display: "flex",
          flexDirection: "column",
          gap: compact ? 12 : 16,
        }}
      >
        {fields.map((f) => (
          <div key={f.key}>
            <Lbl style={{ marginBottom: compact ? 4 : 6, display: "block", fontSize: compact ? 8 : 9 }}>{f.label}</Lbl>
            {f.multiline ? (
              <textarea
                value={identity[f.key] || ""}
                onChange={(e) => updateIdentity({ [f.key]: e.target.value })}
                placeholder={f.placeholder}
                rows={compact ? 2 : 3}
                style={{
                  width: "100%",
                  background: "transparent",
                  border: `1px solid ${C.sep}`,
                  borderRadius: compact ? 4 : 6,
                  padding: inputPadding,
                  fontSize,
                  color: C.t1,
                  outline: "none",
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
              />
            ) : (
              <input
                type="text"
                value={identity[f.key] || ""}
                onChange={(e) => updateIdentity({ [f.key]: e.target.value })}
                placeholder={f.placeholder}
                style={{
                  width: "100%",
                  background: "transparent",
                  border: `1px solid ${C.sep}`,
                  borderRadius: compact ? 4 : 6,
                  padding: inputPadding,
                  fontSize,
                  color: C.t1,
                  outline: "none",
                }}
              />
            )}
          </div>
        ))}
      </div>
    </>
  );
}
