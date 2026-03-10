"use client";

import { ThemeProvider } from "@/context/ThemeProvider";
import { GuestArtefactProvider } from "@/context/GuestArtefactContext";
import { CreatePortal } from "@/components/create/CreatePortal";
import { GuestBar } from "@/components/create/GuestBar";

export default function CreatePage() {
  return (
    <ThemeProvider>
      <GuestArtefactProvider>
        <div
          style={{
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <CreatePortal />
          <GuestBar />
        </div>
      </GuestArtefactProvider>
    </ThemeProvider>
  );
}
