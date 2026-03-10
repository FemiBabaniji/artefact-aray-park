"use client";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { ThemeCtx, type ThemeContextValue } from "./ThemeContext";
import { DARK, LIGHT, type ThemeTokens } from "@/lib/tokens";

function mkCSS(C: ThemeTokens): string {
  return `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&family=DM+Mono:wght@400;500&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html,body{height:100%}
    body{font-family:'DM Sans',-apple-system,sans-serif;font-size:13px;line-height:1.45;-webkit-font-smoothing:antialiased}
    button{cursor:pointer;font-family:inherit;border:none;background:none;outline:none;padding:0}
    ::-webkit-scrollbar{width:2px}
    ::-webkit-scrollbar-track{background:transparent}
    ::-webkit-scrollbar-thumb{background:${C.scrollThumb}}
    .editor{width:100%;outline:none;font-family:'DM Sans',-apple-system,sans-serif;font-size:13px;line-height:1.72;color:${C.editorText};caret-color:${C.t3}}
    .editor:empty:before{content:attr(data-ph);color:${C.editorPh};pointer-events:none}
    .editor h1{font-size:17px;font-weight:500;color:${C.editorH1};margin:12px 0 4px}
    .editor h2{font-size:13px;font-weight:500;color:${C.editorH2};margin:10px 0 3px}
    .editor p{margin:2px 0}
    .editor ul,.editor ol{margin:3px 0 3px 16px}
    .editor li{margin:2px 0;color:${C.editorLi}}
    .editor blockquote{border-left:1px solid ${C.sep};padding-left:10px;color:${C.editorQ};margin:6px 0}
    .editor hr{border:none;border-top:1px solid ${C.sep};margin:12px 0}
    .editor code{font-family:'DM Mono',monospace;font-size:10px;color:${C.editorCode};background:${C.editorCodeBg};padding:1px 4px;border-radius:2px}
    .mono{font-family:'DM Mono',monospace;letter-spacing:.04em}
    a{text-decoration:none;color:inherit}
  `;
}

type ThemeProviderProps = {
  children: React.ReactNode;
  accentColor?: string;
};

export function ThemeProvider({ children, accentColor }: ThemeProviderProps) {
  const [dark, setDark] = useState(false);
  const baseTheme = dark ? DARK : LIGHT;
  const theme = accentColor ? { ...baseTheme, green: accentColor } : baseTheme;
  const styleRef = useRef<HTMLStyleElement | null>(null);

  const toggle = useCallback(() => setDark(d => !d), []);

  const value: ThemeContextValue = useMemo(() => ({
    theme,
    dark,
    toggle,
  }), [theme, dark, toggle]);

  useEffect(() => {
    if (!styleRef.current) {
      styleRef.current = document.createElement("style");
      document.head.appendChild(styleRef.current);
    }
    styleRef.current.textContent = mkCSS(theme);
    document.body.style.background = theme.void;
    document.body.style.margin = "0";
  }, [dark, theme]);

  return (
    <ThemeCtx.Provider value={value}>
      {children}
    </ThemeCtx.Provider>
  );
}
