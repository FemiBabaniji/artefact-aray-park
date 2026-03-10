"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";
import { Btn } from "@/components/primitives/Btn";
import { Lbl } from "@/components/primitives/Lbl";
import type { BlockType } from "@/types/room";

type TypedBlockEditorProps = {
  blockType: BlockType;
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>) => void;
  onDelete: () => void;
  readOnly?: boolean;
};

// Input field component
function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline,
  type = "text",
  readOnly,
}: {
  label: string;
  value: string | number | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  type?: "text" | "date" | "url" | "number";
  readOnly?: boolean;
}) {
  const C = useC();

  const inputStyle = {
    width: "100%",
    background: "transparent",
    border: `1px solid ${C.sep}`,
    borderRadius: 6,
    padding: "8px 10px",
    fontSize: 12,
    color: C.t1,
    outline: "none",
    fontFamily: "inherit",
    resize: "vertical" as const,
  };

  return (
    <div style={{ marginBottom: 12 }}>
      <Lbl style={{ marginBottom: 4, display: "block", fontSize: 9 }}>{label}</Lbl>
      {multiline ? (
        <textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          style={inputStyle}
          readOnly={readOnly}
        />
      ) : (
        <input
          type={type}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={inputStyle}
          readOnly={readOnly}
        />
      )}
    </div>
  );
}

// Checkbox field
function CheckField({
  label,
  checked,
  onChange,
  readOnly,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  readOnly?: boolean;
}) {
  const C = useC();

  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, cursor: readOnly ? "default" : "pointer" }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={readOnly}
        style={{ accentColor: C.blue }}
      />
      <span style={{ fontSize: 12, color: C.t2 }}>{label}</span>
    </label>
  );
}

// Select field
function SelectField({
  label,
  value,
  options,
  onChange,
  readOnly,
}: {
  label: string;
  value: string | undefined;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  readOnly?: boolean;
}) {
  const C = useC();

  return (
    <div style={{ marginBottom: 12 }}>
      <Lbl style={{ marginBottom: 4, display: "block", fontSize: 9 }}>{label}</Lbl>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={readOnly}
        style={{
          width: "100%",
          background: C.void,
          border: `1px solid ${C.sep}`,
          borderRadius: 6,
          padding: "8px 10px",
          fontSize: 12,
          color: C.t1,
          outline: "none",
          cursor: readOnly ? "default" : "pointer",
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// Tags input for skills array
function TagsField({
  label,
  tags,
  onChange,
  placeholder,
  readOnly,
}: {
  label: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  readOnly?: boolean;
}) {
  const C = useC();
  const [input, setInput] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const tag = input.trim();
      if (tag && !tags.includes(tag)) {
        onChange([...tags, tag]);
      }
      setInput("");
    } else if (e.key === "Backspace" && !input && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const removeTag = (idx: number) => {
    onChange(tags.filter((_, i) => i !== idx));
  };

  return (
    <div style={{ marginBottom: 12 }}>
      <Lbl style={{ marginBottom: 4, display: "block", fontSize: 9 }}>{label}</Lbl>
      <div
        style={{
          border: `1px solid ${C.sep}`,
          borderRadius: 6,
          padding: "6px 8px",
          display: "flex",
          flexWrap: "wrap",
          gap: 4,
          minHeight: 36,
        }}
      >
        {tags.map((tag, i) => (
          <span
            key={i}
            style={{
              background: C.sep,
              padding: "3px 8px",
              borderRadius: 4,
              fontSize: 11,
              color: C.t1,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            {tag}
            {!readOnly && (
              <button
                onClick={() => removeTag(i)}
                style={{
                  background: "none",
                  border: "none",
                  color: C.t3,
                  cursor: "pointer",
                  padding: 0,
                  fontSize: 12,
                  lineHeight: 1,
                }}
              >
                x
              </button>
            )}
          </span>
        ))}
        {!readOnly && (
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={tags.length === 0 ? placeholder : ""}
            style={{
              flex: 1,
              minWidth: 80,
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: 12,
              color: C.t1,
              padding: "3px 0",
            }}
          />
        )}
      </div>
    </div>
  );
}

// Highlights list
function HighlightsField({
  label,
  highlights,
  onChange,
  readOnly,
}: {
  label: string;
  highlights: string[];
  onChange: (highlights: string[]) => void;
  readOnly?: boolean;
}) {
  const C = useC();

  const updateHighlight = (idx: number, value: string) => {
    const updated = [...highlights];
    updated[idx] = value;
    onChange(updated);
  };

  const addHighlight = () => {
    onChange([...highlights, ""]);
  };

  const removeHighlight = (idx: number) => {
    onChange(highlights.filter((_, i) => i !== idx));
  };

  return (
    <div style={{ marginBottom: 12 }}>
      <Lbl style={{ marginBottom: 4, display: "block", fontSize: 9 }}>{label}</Lbl>
      {highlights.map((h, i) => (
        <div key={i} style={{ display: "flex", gap: 6, marginBottom: 4 }}>
          <input
            type="text"
            value={h}
            onChange={(e) => updateHighlight(i, e.target.value)}
            placeholder={`Highlight ${i + 1}`}
            readOnly={readOnly}
            style={{
              flex: 1,
              background: "transparent",
              border: `1px solid ${C.sep}`,
              borderRadius: 6,
              padding: "6px 10px",
              fontSize: 12,
              color: C.t1,
              outline: "none",
            }}
          />
          {!readOnly && (
            <Btn onClick={() => removeHighlight(i)} style={{ color: "#ef4444", padding: "6px 8px" }}>
              x
            </Btn>
          )}
        </div>
      ))}
      {!readOnly && (
        <Btn onClick={addHighlight} style={{ fontSize: 10, color: C.t3 }}>
          + Add highlight
        </Btn>
      )}
    </div>
  );
}

// Project block editor
function ProjectEditor({ content, onChange, readOnly }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void; readOnly?: boolean }) {
  const update = (key: string, value: unknown) => onChange({ ...content, [key]: value });

  return (
    <>
      <Field label="Title" value={content.title as string} onChange={(v) => update("title", v)} placeholder="Project name" readOnly={readOnly} />
      <Field label="Description" value={content.description as string} onChange={(v) => update("description", v)} placeholder="Brief description" multiline readOnly={readOnly} />
      <Field label="Role" value={content.role as string} onChange={(v) => update("role", v)} placeholder="Your role" readOnly={readOnly} />
      <Field label="URL" value={content.url as string} onChange={(v) => update("url", v)} placeholder="https://" type="url" readOnly={readOnly} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Start Date" value={content.startDate as string} onChange={(v) => update("startDate", v)} type="date" readOnly={readOnly} />
        <Field label="End Date" value={content.endDate as string} onChange={(v) => update("endDate", v)} type="date" readOnly={readOnly} />
      </div>
      <SelectField
        label="Status"
        value={content.status as string}
        options={[
          { value: "in_progress", label: "In Progress" },
          { value: "completed", label: "Completed" },
          { value: "planned", label: "Planned" },
        ]}
        onChange={(v) => update("status", v)}
        readOnly={readOnly}
      />
      <TagsField label="Skills" tags={(content.skills as string[]) || []} onChange={(v) => update("skills", v)} placeholder="Add skills..." readOnly={readOnly} />
      <HighlightsField label="Highlights" highlights={(content.highlights as string[]) || []} onChange={(v) => update("highlights", v)} readOnly={readOnly} />
    </>
  );
}

// Skill block editor
function SkillEditor({ content, onChange, readOnly }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void; readOnly?: boolean }) {
  const update = (key: string, value: unknown) => onChange({ ...content, [key]: value });

  return (
    <>
      <Field label="Skill Name" value={content.name as string} onChange={(v) => update("name", v)} placeholder="e.g. TypeScript" readOnly={readOnly} />
      <SelectField
        label="Level"
        value={content.level as string}
        options={[
          { value: "beginner", label: "Beginner" },
          { value: "intermediate", label: "Intermediate" },
          { value: "advanced", label: "Advanced" },
          { value: "expert", label: "Expert" },
        ]}
        onChange={(v) => update("level", v)}
        readOnly={readOnly}
      />
      <Field label="Years of Experience" value={content.years as number} onChange={(v) => update("years", parseInt(v) || 0)} type="number" readOnly={readOnly} />
      <Field label="Category" value={content.category as string} onChange={(v) => update("category", v)} placeholder="e.g. Programming, Design" readOnly={readOnly} />
    </>
  );
}

// Experience block editor
function ExperienceEditor({ content, onChange, readOnly }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void; readOnly?: boolean }) {
  const update = (key: string, value: unknown) => onChange({ ...content, [key]: value });

  return (
    <>
      <Field label="Job Title" value={content.title as string} onChange={(v) => update("title", v)} placeholder="Software Engineer" readOnly={readOnly} />
      <Field label="Company/Organization" value={content.organization as string} onChange={(v) => update("organization", v)} placeholder="Company name" readOnly={readOnly} />
      <Field label="Location" value={content.location as string} onChange={(v) => update("location", v)} placeholder="City, Country" readOnly={readOnly} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Start Date" value={content.startDate as string} onChange={(v) => update("startDate", v)} type="date" readOnly={readOnly} />
        <Field label="End Date" value={content.endDate as string} onChange={(v) => update("endDate", v)} type="date" readOnly={readOnly} />
      </div>
      <CheckField label="I currently work here" checked={!!content.current} onChange={(v) => update("current", v)} readOnly={readOnly} />
      <Field label="Description" value={content.description as string} onChange={(v) => update("description", v)} placeholder="Brief description" multiline readOnly={readOnly} />
      <HighlightsField label="Key Achievements" highlights={(content.highlights as string[]) || []} onChange={(v) => update("highlights", v)} readOnly={readOnly} />
      <TagsField label="Skills Used" tags={(content.skills as string[]) || []} onChange={(v) => update("skills", v)} placeholder="Add skills..." readOnly={readOnly} />
    </>
  );
}

// Education block editor
function EducationEditor({ content, onChange, readOnly }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void; readOnly?: boolean }) {
  const update = (key: string, value: unknown) => onChange({ ...content, [key]: value });

  return (
    <>
      <Field label="Institution" value={content.institution as string} onChange={(v) => update("institution", v)} placeholder="University name" readOnly={readOnly} />
      <Field label="Degree" value={content.degree as string} onChange={(v) => update("degree", v)} placeholder="Bachelor's, Master's, etc." readOnly={readOnly} />
      <Field label="Field of Study" value={content.field as string} onChange={(v) => update("field", v)} placeholder="Computer Science" readOnly={readOnly} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Start Date" value={content.startDate as string} onChange={(v) => update("startDate", v)} type="date" readOnly={readOnly} />
        <Field label="End Date" value={content.endDate as string} onChange={(v) => update("endDate", v)} type="date" readOnly={readOnly} />
      </div>
      <Field label="GPA" value={content.gpa as string} onChange={(v) => update("gpa", v)} placeholder="3.8/4.0" readOnly={readOnly} />
      <HighlightsField label="Achievements" highlights={(content.highlights as string[]) || []} onChange={(v) => update("highlights", v)} readOnly={readOnly} />
    </>
  );
}

// Certification block editor
function CertificationEditor({ content, onChange, readOnly }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void; readOnly?: boolean }) {
  const update = (key: string, value: unknown) => onChange({ ...content, [key]: value });

  return (
    <>
      <Field label="Certification Name" value={content.name as string} onChange={(v) => update("name", v)} placeholder="AWS Solutions Architect" readOnly={readOnly} />
      <Field label="Issuing Organization" value={content.issuer as string} onChange={(v) => update("issuer", v)} placeholder="Amazon Web Services" readOnly={readOnly} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Issue Date" value={content.date as string} onChange={(v) => update("date", v)} type="date" readOnly={readOnly} />
        <Field label="Expiration Date" value={content.expires as string} onChange={(v) => update("expires", v)} type="date" readOnly={readOnly} />
      </div>
      <Field label="Credential ID" value={content.credentialId as string} onChange={(v) => update("credentialId", v)} placeholder="ABC123XYZ" readOnly={readOnly} />
      <Field label="Credential URL" value={content.url as string} onChange={(v) => update("url", v)} placeholder="https://verify..." type="url" readOnly={readOnly} />
    </>
  );
}

// Metric block editor
function MetricEditor({ content, onChange, readOnly }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void; readOnly?: boolean }) {
  const update = (key: string, value: unknown) => onChange({ ...content, [key]: value });

  return (
    <>
      <Field label="Label" value={content.label as string} onChange={(v) => update("label", v)} placeholder="Monthly Active Users" readOnly={readOnly} />
      <Field label="Value" value={content.value as string} onChange={(v) => update("value", v)} placeholder="10,000" readOnly={readOnly} />
      <Field label="Unit" value={content.unit as string} onChange={(v) => update("unit", v)} placeholder="users, $, %" readOnly={readOnly} />
      <Field label="Change (%)" value={content.change as number} onChange={(v) => update("change", parseFloat(v) || 0)} type="number" readOnly={readOnly} />
      <Field label="Period" value={content.period as string} onChange={(v) => update("period", v)} placeholder="This month" readOnly={readOnly} />
    </>
  );
}

// Milestone block editor
function MilestoneEditor({ content, onChange, readOnly }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void; readOnly?: boolean }) {
  const update = (key: string, value: unknown) => onChange({ ...content, [key]: value });

  return (
    <>
      <Field label="Title" value={content.title as string} onChange={(v) => update("title", v)} placeholder="Launched v2.0" readOnly={readOnly} />
      <Field label="Date" value={content.date as string} onChange={(v) => update("date", v)} type="date" readOnly={readOnly} />
      <Field label="Description" value={content.description as string} onChange={(v) => update("description", v)} placeholder="Details..." multiline readOnly={readOnly} />
      <SelectField
        label="Type"
        value={content.type as string}
        options={[
          { value: "achievement", label: "Achievement" },
          { value: "release", label: "Release" },
          { value: "event", label: "Event" },
          { value: "award", label: "Award" },
        ]}
        onChange={(v) => update("type", v)}
        readOnly={readOnly}
      />
    </>
  );
}

// Relationship block editor
function RelationshipEditor({ content, onChange, readOnly }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void; readOnly?: boolean }) {
  const update = (key: string, value: unknown) => onChange({ ...content, [key]: value });

  return (
    <>
      <Field label="Person Name" value={content.personName as string} onChange={(v) => update("personName", v)} placeholder="Jane Doe" readOnly={readOnly} />
      <Field label="Title" value={content.personTitle as string} onChange={(v) => update("personTitle", v)} placeholder="CEO" readOnly={readOnly} />
      <Field label="Organization" value={content.personOrg as string} onChange={(v) => update("personOrg", v)} placeholder="Company name" readOnly={readOnly} />
      <Field label="Relationship" value={content.relationship as string} onChange={(v) => update("relationship", v)} placeholder="Mentor, Colleague, etc." readOnly={readOnly} />
      <Field label="Context" value={content.context as string} onChange={(v) => update("context", v)} placeholder="How you know them" multiline readOnly={readOnly} />
      <Field label="Profile URL" value={content.url as string} onChange={(v) => update("url", v)} placeholder="https://linkedin.com/..." type="url" readOnly={readOnly} />
    </>
  );
}

// Block type icons and labels
const BLOCK_TYPE_CONFIG: Record<BlockType, { icon: string; label: string; color: string }> = {
  text: { icon: "T", label: "Text", color: "#94a3b8" },
  image: { icon: "\u25A3", label: "Image", color: "#60a5fa" },
  link: { icon: "\u2197", label: "Link", color: "#34d399" },
  embed: { icon: "\u25B6", label: "Embed", color: "#fb7185" },
  document: { icon: "\u25A4", label: "Document", color: "#f43f5e" },
  metric: { icon: "#", label: "Metric", color: "#fbbf24" },
  milestone: { icon: "\u2605", label: "Milestone", color: "#a78bfa" },
  project: { icon: "\u25A6", label: "Project", color: "#22c55e" },
  skill: { icon: "\u2713", label: "Skill", color: "#14b8a6" },
  experience: { icon: "\u2261", label: "Experience", color: "#f97316" },
  education: { icon: "\u2302", label: "Education", color: "#8b5cf6" },
  certification: { icon: "\u2714", label: "Certification", color: "#06b6d4" },
  relationship: { icon: "\u2194", label: "Connection", color: "#ec4899" },
};

export function TypedBlockEditor({ blockType, content, onChange, onDelete, readOnly }: TypedBlockEditorProps) {
  const C = useC();
  const config = BLOCK_TYPE_CONFIG[blockType];

  const renderEditor = () => {
    switch (blockType) {
      case "project":
        return <ProjectEditor content={content} onChange={onChange} readOnly={readOnly} />;
      case "skill":
        return <SkillEditor content={content} onChange={onChange} readOnly={readOnly} />;
      case "experience":
        return <ExperienceEditor content={content} onChange={onChange} readOnly={readOnly} />;
      case "education":
        return <EducationEditor content={content} onChange={onChange} readOnly={readOnly} />;
      case "certification":
        return <CertificationEditor content={content} onChange={onChange} readOnly={readOnly} />;
      case "metric":
        return <MetricEditor content={content} onChange={onChange} readOnly={readOnly} />;
      case "milestone":
        return <MilestoneEditor content={content} onChange={onChange} readOnly={readOnly} />;
      case "relationship":
        return <RelationshipEditor content={content} onChange={onChange} readOnly={readOnly} />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: C.bg,
        border: `1px solid ${C.sep}`,
        borderRadius: 10,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          borderBottom: `1px solid ${C.sep}`,
          background: C.void,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 22,
              height: 22,
              borderRadius: 5,
              background: config.color + "22",
              color: config.color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {config.icon}
          </span>
          <span style={{ fontSize: 12, fontWeight: 500, color: C.t1 }}>{config.label}</span>
        </div>
        {!readOnly && (
          <Btn onClick={onDelete} style={{ color: "#ef4444", fontSize: 10 }}>
            Delete
          </Btn>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: 14 }}>{renderEditor()}</div>
    </motion.div>
  );
}

export { BLOCK_TYPE_CONFIG };
