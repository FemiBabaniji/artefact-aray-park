"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useC } from "@/hooks/useC";
import { FADE, SP } from "@/lib/motion";
import { Lbl } from "@/components/primitives/Lbl";
import { Btn } from "@/components/primitives/Btn";
import { DrillRoomPanel } from "./DrillRoomPanel";
import type { Identity, Room } from "../../types";

type DrillOverlayProps = {
  drillKey: "identity" | "rooms" | "connect";
  identity: Identity;
  rooms: Room[];
  accent: string;
  onBack: () => void;
  onOpenRoom: (roomId: string) => void;
  drillActiveL: number;
  drillActiveR: number;
  setDrillActiveL: (i: number) => void;
  setDrillActiveR: (i: number) => void;
};

export function DrillOverlay({
  drillKey,
  identity,
  rooms,
  accent,
  onBack,
  onOpenRoom,
  drillActiveL,
  drillActiveR,
  setDrillActiveL,
  setDrillActiveR,
}: DrillOverlayProps) {
  const C = useC();
  const [aL, setAL] = useState(0);
  const [aR, setAR] = useState(0);

  // Identity drill quads
  if (drillKey === "identity") {
    const quads = [
      {
        tag: "profile",
        content: (
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: C.t1, marginBottom: 4, letterSpacing: "-.025em", lineHeight: 1.2 }}>
              {identity.name || "Your name"}
            </div>
            <div style={{ fontSize: 13, color: C.t2, marginBottom: 14, lineHeight: 1.4 }}>
              {identity.title || "Your title"}
            </div>
            <div style={{ height: 1, background: C.sep, marginBottom: 14 }} />
            <div style={{ fontSize: 13, color: C.t2, marginBottom: 7, lineHeight: 1.5 }}>{identity.location || "Location"}</div>
          </div>
        ),
      },
      {
        tag: "bio",
        content: (
          <div style={{ fontSize: 13, color: C.t2, lineHeight: 1.72 }}>
            {identity.bio || "Add a bio to tell people about yourself..."}
          </div>
        ),
      },
      {
        tag: "details",
        content: (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 12, color: C.t3, padding: "8px 0", borderBottom: `1px solid ${C.sep}` }}>Email</div>
            <div style={{ fontSize: 12, color: C.t3, padding: "8px 0", borderBottom: `1px solid ${C.sep}` }}>Phone</div>
            <div style={{ fontSize: 12, color: C.t3, padding: "8px 0" }}>Website</div>
          </div>
        ),
      },
      {
        tag: "status",
        content: (
          <div>
            <div style={{ fontSize: 13, color: C.t3, lineHeight: 1.65, marginBottom: 12 }}>
              Available for collaborations
            </div>
            <motion.div
              animate={{ background: accent }}
              style={{ width: 8, height: 8, borderRadius: "50%" }}
            />
          </div>
        ),
      },
    ];

    const L = [quads[0], quads[2]];
    const R = [quads[1], quads[3]];

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={FADE}
        style={{
          position: "absolute",
          inset: 0,
          background: C.void,
          border: `1px solid ${C.edge}`,
          borderRadius: 14,
          display: "flex",
          flexDirection: "column",
          zIndex: 10,
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px 10px", borderBottom: `1px solid ${C.sep}`, flexShrink: 0 }}>
          <Btn onClick={onBack}>{"\u2190"} back</Btn>
          <div style={{ width: 1, background: C.sep, alignSelf: "stretch" }} />
          <Lbl style={{ color: C.t2 }}>identity</Lbl>
        </div>
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", overflow: "hidden" }}>
          {[{ items: L, a: aL, setA: setAL }, { items: R, a: aR, setA: setAR }].map(({ items, a, setA }, ci) => (
            <div key={ci} style={{ display: "flex", flexDirection: "column", padding: "14px 18px", height: "100%", overflow: "hidden", borderRight: ci === 0 ? `1px solid ${C.sep}` : "none" }}>
              {items.map((q, i) => (
                <motion.div
                  key={i}
                  layout
                  transition={SP}
                  onClick={() => setA(i)}
                  style={{ flex: a === i ? 3 : 1, minHeight: 0, display: "flex", flexDirection: "column", cursor: "pointer" }}
                >
                  <div style={{ borderTop: `1px solid ${C.sep}`, paddingTop: 11, flex: 1, minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                    <Lbl style={{ marginBottom: 8, display: "block", flexShrink: 0 }}>{q.tag}</Lbl>
                    <AnimatePresence mode="wait">
                      {a === i ? (
                        <motion.div key="o" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.11 }} style={{ overflow: "auto", height: "100%" }}>
                          {q.content}
                        </motion.div>
                      ) : (
                        <motion.div key="c" initial={{ opacity: 0 }} animate={{ opacity: 0.2 }} exit={{ opacity: 0 }} style={{ fontSize: 10, color: C.t3 }}>
                          {q.tag}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  // Rooms drill - 2x2 room panels
  if (drillKey === "rooms") {
    const leftRooms = [rooms[0], rooms[2]].filter(Boolean);
    const rightRooms = [rooms[1], rooms[3]].filter(Boolean);

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={FADE}
        style={{
          position: "absolute",
          inset: 0,
          background: C.void,
          border: `1px solid ${C.edge}`,
          borderRadius: 14,
          display: "flex",
          flexDirection: "column",
          zIndex: 10,
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px 10px", borderBottom: `1px solid ${C.sep}`, flexShrink: 0 }}>
          <Btn onClick={onBack}>{"\u2190"} back</Btn>
          <div style={{ width: 1, background: C.sep, alignSelf: "stretch" }} />
          <Lbl style={{ color: C.t2 }}>rooms</Lbl>
        </div>
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", overflow: "hidden" }}>
          <div style={{ display: "flex", flexDirection: "column", padding: "14px 18px", height: "100%", overflow: "hidden", borderRight: `1px solid ${C.sep}` }}>
            {leftRooms.map((room, i) => (
              <DrillRoomPanel
                key={room.id}
                room={room}
                isActive={drillActiveL === i}
                onActivate={() => setDrillActiveL(i)}
                onOpen={() => onOpenRoom(room.id)}
                accent={accent}
              />
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", padding: "14px 18px", height: "100%", overflow: "hidden" }}>
            {rightRooms.map((room, i) => (
              <DrillRoomPanel
                key={room.id}
                room={room}
                isActive={drillActiveR === i}
                onActivate={() => setDrillActiveR(i)}
                onOpen={() => onOpenRoom(room.id)}
                accent={accent}
              />
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  // Connect drill - social links
  if (drillKey === "connect") {
    const quads = [
      {
        tag: "instagram",
        content: (
          <div>
            <div style={{ fontSize: 14, color: C.t2, marginBottom: 8 }}>@username</div>
            <div style={{ fontSize: 11, color: C.t4, lineHeight: 1.5 }}>Add your Instagram handle</div>
          </div>
        ),
      },
      {
        tag: "twitter",
        content: (
          <div>
            <div style={{ fontSize: 14, color: C.t2, marginBottom: 8 }}>@handle</div>
            <div style={{ fontSize: 11, color: C.t4, lineHeight: 1.5 }}>Add your Twitter/X handle</div>
          </div>
        ),
      },
      {
        tag: "linkedin",
        content: (
          <div>
            <div style={{ fontSize: 14, color: C.t2, marginBottom: 8 }}>linkedin.com/in/...</div>
            <div style={{ fontSize: 11, color: C.t4, lineHeight: 1.5 }}>Add your LinkedIn profile</div>
          </div>
        ),
      },
      {
        tag: "website",
        content: (
          <div>
            <div style={{ fontSize: 14, color: C.t2, marginBottom: 8 }}>yoursite.com</div>
            <div style={{ fontSize: 11, color: C.t4, lineHeight: 1.5 }}>Add your personal website</div>
          </div>
        ),
      },
    ];

    const L = [quads[0], quads[2]];
    const R = [quads[1], quads[3]];

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={FADE}
        style={{
          position: "absolute",
          inset: 0,
          background: C.void,
          border: `1px solid ${C.edge}`,
          borderRadius: 14,
          display: "flex",
          flexDirection: "column",
          zIndex: 10,
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px 10px", borderBottom: `1px solid ${C.sep}`, flexShrink: 0 }}>
          <Btn onClick={onBack}>{"\u2190"} back</Btn>
          <div style={{ width: 1, background: C.sep, alignSelf: "stretch" }} />
          <Lbl style={{ color: C.t2 }}>connect</Lbl>
        </div>
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", overflow: "hidden" }}>
          {[{ items: L, a: aL, setA: setAL }, { items: R, a: aR, setA: setAR }].map(({ items, a, setA }, ci) => (
            <div key={ci} style={{ display: "flex", flexDirection: "column", padding: "14px 18px", height: "100%", overflow: "hidden", borderRight: ci === 0 ? `1px solid ${C.sep}` : "none" }}>
              {items.map((q, i) => (
                <motion.div
                  key={i}
                  layout
                  transition={SP}
                  onClick={() => setA(i)}
                  style={{ flex: a === i ? 3 : 1, minHeight: 0, display: "flex", flexDirection: "column", cursor: "pointer" }}
                >
                  <div style={{ borderTop: `1px solid ${C.sep}`, paddingTop: 11, flex: 1, minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                    <Lbl style={{ marginBottom: 8, display: "block", flexShrink: 0 }}>{q.tag}</Lbl>
                    <AnimatePresence mode="wait">
                      {a === i ? (
                        <motion.div key="o" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.11 }} style={{ overflow: "auto", height: "100%" }}>
                          {q.content}
                        </motion.div>
                      ) : (
                        <motion.div key="c" initial={{ opacity: 0 }} animate={{ opacity: 0.2 }} exit={{ opacity: 0 }} style={{ fontSize: 10, color: C.t3 }}>
                          {q.tag}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  return null;
}
