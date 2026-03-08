export type ThemeTokens = {
  void:         string;
  bg:           string;
  edge:         string;
  sep:          string;
  t1:           string;
  t2:           string;
  t3:           string;
  t4:           string;
  blue:         string;
  green:        string;
  amber:        string;
  editorText:   string;
  editorPh:     string;
  editorH1:     string;
  editorH2:     string;
  editorLi:     string;
  editorQ:      string;
  editorCode:   string;
  editorCodeBg: string;
  scrollThumb:  string;
};

export const DARK: ThemeTokens = {
  void: "#080808", bg: "#080808",
  edge: "#2a2a2a", sep: "#1c1c1c",
  t1: "#f0f0f0",
  t2: "rgba(255,255,255,0.70)",
  t3: "rgba(255,255,255,0.38)",
  t4: "rgba(255,255,255,0.20)",
  blue: "#60a5fa", green: "#4ade80", amber: "#fbbf24",
  editorText: "rgba(255,255,255,0.65)", editorPh: "#282828",
  editorH1: "rgba(255,255,255,0.88)", editorH2: "rgba(255,255,255,0.68)",
  editorLi: "rgba(255,255,255,0.55)", editorQ: "rgba(255,255,255,0.38)",
  editorCode: "rgba(255,255,255,0.5)", editorCodeBg: "#0e0e0e",
  scrollThumb: "#222",
};

export const LIGHT: ThemeTokens = {
  void: "#ffffff", bg: "#ffffff",
  edge: "#d4d4d4", sep: "#e8e8e8",
  t1: "#0a0a0a",
  t2: "rgba(0,0,0,0.72)",
  t3: "rgba(0,0,0,0.44)",
  t4: "rgba(0,0,0,0.26)",
  blue: "#1d4ed8", green: "#15803d", amber: "#b45309",
  editorText: "rgba(0,0,0,0.70)", editorPh: "#bbb",
  editorH1: "rgba(0,0,0,0.88)", editorH2: "rgba(0,0,0,0.65)",
  editorLi: "rgba(0,0,0,0.55)", editorQ: "rgba(0,0,0,0.38)",
  editorCode: "rgba(0,0,0,0.55)", editorCodeBg: "#f2f2f2",
  scrollThumb: "#bbb",
};
