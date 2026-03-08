"use client";

import { useState, useCallback } from "react";
import { useC } from "@/hooks/useC";
import { useDemoConfig } from "@/context/DemoConfigContext";
import { Lbl } from "@/components/primitives/Lbl";

// Preset accent colors
const PRESET_COLORS = [
  "#4ade80", // green (default)
  "#60a5fa", // blue
  "#f472b6", // pink
  "#fbbf24", // amber
  "#a78bfa", // purple
  "#fb7185", // red
  "#2dd4bf", // teal
  "#fb923c", // orange
];

export function IdentityStep() {
  const C = useC();
  const { config, updateIdentity } = useDemoConfig();

  const [customColor, setCustomColor] = useState(
    PRESET_COLORS.includes(config.identity.accentColor)
      ? ""
      : config.identity.accentColor
  );

  const handleColorPreset = useCallback(
    (color: string) => {
      setCustomColor("");
      updateIdentity({ accentColor: color });
    },
    [updateIdentity]
  );

  const handleCustomColor = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const color = e.target.value;
      setCustomColor(color);
      // Only update if valid hex
      if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
        updateIdentity({ accentColor: color });
      }
    },
    [updateIdentity]
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 500,
            color: C.t1,
            marginBottom: 6,
          }}
        >
          Community Identity
        </h2>
        <p style={{ fontSize: 13, color: C.t3, lineHeight: 1.5 }}>
          Set your community name and brand colors. This will appear throughout
          your program and on member artefacts.
        </p>
      </div>

      {/* Community Name */}
      <div>
        <Lbl style={{ marginBottom: 8 }}>Community name</Lbl>
        <input
          type="text"
          value={config.identity.name}
          onChange={(e) => updateIdentity({ name: e.target.value })}
          placeholder="HXOUSE"
          style={{
            width: "100%",
            padding: "12px 14px",
            fontSize: 15,
            fontWeight: 500,
            color: C.t1,
            background: C.bg,
            border: `1px solid ${C.edge}`,
            borderRadius: 8,
            outline: "none",
          }}
        />
      </div>

      {/* Tagline */}
      <div>
        <Lbl style={{ marginBottom: 8 }}>Tagline</Lbl>
        <input
          type="text"
          value={config.identity.tagline}
          onChange={(e) => updateIdentity({ tagline: e.target.value })}
          placeholder="Spring Cohort 2025"
          style={{
            width: "100%",
            padding: "12px 14px",
            fontSize: 14,
            color: C.t1,
            background: C.bg,
            border: `1px solid ${C.edge}`,
            borderRadius: 8,
            outline: "none",
          }}
        />
      </div>

      {/* Accent Color */}
      <div>
        <Lbl style={{ marginBottom: 12 }}>Accent color</Lbl>

        {/* Preset swatches */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 12,
            flexWrap: "wrap",
          }}
        >
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => handleColorPreset(color)}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: color,
                border:
                  config.identity.accentColor === color
                    ? `2px solid ${C.t1}`
                    : `2px solid transparent`,
                cursor: "pointer",
                transition: "transform 0.1s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            />
          ))}
        </div>

        {/* Custom hex input */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="mono" style={{ fontSize: 11, color: C.t3 }}>
            or
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              background: C.bg,
              border: `1px solid ${C.edge}`,
              borderRadius: 6,
            }}
          >
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: 4,
                background: customColor || config.identity.accentColor,
                border: `1px solid ${C.edge}`,
              }}
            />
            <input
              type="text"
              value={customColor}
              onChange={handleCustomColor}
              placeholder="#2C5F2E"
              className="mono"
              style={{
                width: 80,
                fontSize: 12,
                color: C.t1,
                background: "transparent",
                border: "none",
                outline: "none",
              }}
            />
          </div>
        </div>
      </div>

      {/* Preview note */}
      <div
        style={{
          padding: "14px 16px",
          background: C.edge + "30",
          borderRadius: 8,
          marginTop: 8,
        }}
      >
        <p
          className="mono"
          style={{ fontSize: 10, color: C.t3, lineHeight: 1.6 }}
        >
          Changes update the preview in real-time. Your accent color will appear
          on section indicators, progress bars, and call-to-action buttons
          throughout the program.
        </p>
      </div>
    </div>
  );
}
