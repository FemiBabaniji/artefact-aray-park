"use client";
import { useRef } from "react";
import type { CSSProperties } from "react";

type AvatarProps = {
  size?:        number;
  imgSrc?:      string | null;
  onImgChange?: (src: string) => void;
  color?:       string;
  dimmed?:      boolean;
  style?:       CSSProperties;
  onClick?:     () => void;
};

export function Avatar({ size = 40, imgSrc, onImgChange, color, dimmed, style, onClick }: AvatarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onImgChange) return;
    const reader = new FileReader();
    reader.onload = ev => { if (ev.target?.result) onImgChange(ev.target.result as string); };
    reader.readAsDataURL(file);
  };

  return (
    <div
      onClick={onImgChange ? () => inputRef.current?.click() : onClick}
      style={{
        width: size, height: size, borderRadius: Math.round(size * 0.22),
        background: color || "#3b4f42",
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden", flexShrink: 0,
        cursor: onImgChange ? "pointer" : onClick ? "pointer" : "default",
        opacity: dimmed ? 0.4 : 1,
        transition: "opacity .2s",
        ...style,
      }}
    >
      {imgSrc
        ? <img src={imgSrc} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : <GeometricMark size={size} color={color} />
      }
      {onImgChange && (
        <input ref={inputRef} type="file" accept="image/*" onChange={handleChange}
          style={{ display: "none" }} />
      )}
    </div>
  );
}

function GeometricMark({ size, color }: { size: number; color?: string }) {
  const s = size * 0.52;
  const isDark = !color || color.startsWith("#0") || color.startsWith("rgb(0");
  const stroke = isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.45)";
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={stroke}
      strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12,3 21,8 21,16 12,21 3,16 3,8" />
      <line x1="12" y1="3" x2="12" y2="21" />
      <line x1="3" y1="8" x2="21" y2="8" />
      <line x1="3" y1="16" x2="21" y2="16" />
    </svg>
  );
}
