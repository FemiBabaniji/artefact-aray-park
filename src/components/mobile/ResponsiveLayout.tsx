"use client";
import { useEffect, useState, createContext, useContext } from "react";

type BreakpointKey = "mobile" | "tablet" | "desktop";

const BREAKPOINTS = {
  mobile: 640,
  tablet: 1024,
} as const;

type ResponsiveContextValue = {
  breakpoint: BreakpointKey;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
};

const ResponsiveContext = createContext<ResponsiveContextValue>({
  breakpoint: "desktop",
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  width: 1200,
});

export function useResponsive() {
  return useContext(ResponsiveContext);
}

export function ResponsiveProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ResponsiveContextValue>({
    breakpoint: "desktop",
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    width: typeof window !== "undefined" ? window.innerWidth : 1200,
  });

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      let breakpoint: BreakpointKey = "desktop";

      if (width < BREAKPOINTS.mobile) {
        breakpoint = "mobile";
      } else if (width < BREAKPOINTS.tablet) {
        breakpoint = "tablet";
      }

      setState({
        breakpoint,
        isMobile: breakpoint === "mobile",
        isTablet: breakpoint === "tablet",
        isDesktop: breakpoint === "desktop",
        width,
      });
    };

    updateBreakpoint();
    window.addEventListener("resize", updateBreakpoint);
    return () => window.removeEventListener("resize", updateBreakpoint);
  }, []);

  return (
    <ResponsiveContext.Provider value={state}>
      {children}
    </ResponsiveContext.Provider>
  );
}

// CSS to inject for mobile-specific styles
export const MOBILE_STYLES = `
  @media (max-width: ${BREAKPOINTS.mobile}px) {
    .mobile-nav {
      display: flex !important;
    }
    .desktop-only {
      display: none !important;
    }
    .mobile-padding {
      padding-bottom: 72px !important;
    }
  }

  @media (min-width: ${BREAKPOINTS.mobile + 1}px) {
    .mobile-only {
      display: none !important;
    }
  }

  @media (max-width: ${BREAKPOINTS.tablet}px) {
    .tablet-stack {
      flex-direction: column !important;
    }
    .tablet-full {
      width: 100% !important;
      max-width: none !important;
    }
  }
`;
