import type { Metadata } from "next";
import { ThemeProvider } from "@/context/ThemeProvider";
import { ResponsiveProvider, MOBILE_STYLES } from "@/components/mobile/ResponsiveLayout";
import { MobileNav } from "@/components/mobile/MobileNav";

export const metadata: Metadata = {
  title: "Artefact — Creative Incubator",
  description: "Membership operating system for the Creative Incubator program.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{ __html: MOBILE_STYLES }} />
      </head>
      <body>
        <ThemeProvider>
          <ResponsiveProvider>
            <div style={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}
                 className="mobile-padding">
              {children}
            </div>
            <MobileNav />
          </ResponsiveProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
