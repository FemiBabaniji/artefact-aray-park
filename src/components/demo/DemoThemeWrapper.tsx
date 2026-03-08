"use client";

import { ThemeProvider } from "@/context/ThemeProvider";
import { useDemoConfig } from "@/context/DemoConfigContext";
import type { ReactNode } from "react";

type DemoThemeWrapperProps = {
  children: ReactNode;
};

export function DemoThemeWrapper({ children }: DemoThemeWrapperProps) {
  const { config } = useDemoConfig();

  return (
    <ThemeProvider accentColor={config.identity.accentColor}>
      {children}
    </ThemeProvider>
  );
}
