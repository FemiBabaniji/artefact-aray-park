import type { Block } from "@/types/room";

export type CardTheme = {
  isDark: boolean;
  colors: Array<{ id: string; accent: string; card: string }>;
  outerText: string;
  innerTextPrimary: string;
  innerTextSecondary: string;
  cardShadow: (accent: string) => string;
};

export type Identity = {
  name: string;
  title: string;
  bio: string;
  location: string;
};

export type Room = {
  id: string;
  label: string;
  prompt?: string;
  blocks: Block[];
};
