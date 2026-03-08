"use client";
import { createContext, useContext } from "react";
import { DARK, type ThemeTokens } from "@/lib/tokens";

export type ThemeContextValue = {
  theme: ThemeTokens;
  dark: boolean;
  toggle: () => void;
};

export const ThemeCtx = createContext<ThemeContextValue>({
  theme: DARK,
  dark: true,
  toggle: () => {},
});
