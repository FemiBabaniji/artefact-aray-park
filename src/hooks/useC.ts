"use client";
import { useContext } from "react";
import { ThemeCtx } from "@/context/ThemeContext";

export const useC = () => {
  const ctx = useContext(ThemeCtx);
  return ctx.theme;
};

export const useTheme = () => useContext(ThemeCtx);
