"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";
import { useGuestArtefactContext } from "@/context/GuestArtefactContext";
import { Btn } from "@/components/primitives/Btn";
import { Lbl } from "@/components/primitives/Lbl";
import type { StandaloneRoom } from "@/types/artefact";

type RoomListProps = {
  rooms: StandaloneRoom[];
  activeRoomId: string | null;
  onSelectRoom: (id: string) => void;
};

export function RoomList({ rooms, activeRoomId, onSelectRoom }: RoomListProps) {
  const C = useC();
  const { addRoom, removeRoom } = useGuestArtefactContext();
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [newRoomLabel, setNewRoomLabel] = useState("");

  const handleAddRoom = () => {
    if (newRoomLabel.trim()) {
      const newId = addRoom(newRoomLabel.trim());
      setNewRoomLabel("");
      setIsAddingRoom(false);
      onSelectRoom(newId);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddRoom();
    } else if (e.key === "Escape") {
      setIsAddingRoom(false);
      setNewRoomLabel("");
    }
  };

  return (
    <div style={{ flex: 1, overflow: "auto", padding: "12px 0" }}>
      {/* Rooms */}
      {rooms.map((room) => {
        const isActive = room.id === activeRoomId;
        const hasBlocks = room.blocks.length > 0;

        return (
          <motion.div
            key={room.id}
            onClick={() => onSelectRoom(room.id)}
            whileHover={{ background: C.bg }}
            animate={{
              background: isActive ? C.bg : "transparent",
            }}
            style={{
              padding: "10px 20px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              borderLeft: isActive ? `2px solid ${C.blue}` : "2px solid transparent",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: isActive ? 500 : 400,
                  color: isActive ? C.t1 : C.t2,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {room.label}
              </div>
              {room.prompt && !hasBlocks && (
                <div
                  style={{
                    fontSize: 10,
                    color: C.t4,
                    marginTop: 2,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {room.prompt}
                </div>
              )}
            </div>

            {/* Block count indicator */}
            {hasBlocks && (
              <div
                style={{
                  fontSize: 9,
                  color: C.t4,
                  background: C.sep,
                  padding: "2px 6px",
                  borderRadius: 4,
                }}
              >
                {room.blocks.length}
              </div>
            )}
          </motion.div>
        );
      })}

      {/* Add Room */}
      <div style={{ padding: "8px 20px" }}>
        {isAddingRoom ? (
          <div style={{ display: "flex", gap: 6 }}>
            <input
              type="text"
              value={newRoomLabel}
              onChange={(e) => setNewRoomLabel(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Room name"
              autoFocus
              style={{
                flex: 1,
                background: "transparent",
                border: `1px solid ${C.sep}`,
                borderRadius: 4,
                padding: "6px 10px",
                fontSize: 12,
                color: C.t1,
                outline: "none",
              }}
            />
            <Btn onClick={handleAddRoom} style={{ color: C.green }}>
              +
            </Btn>
          </div>
        ) : (
          <Btn
            onClick={() => setIsAddingRoom(true)}
            style={{ color: C.t3, fontSize: 10 }}
          >
            + add room
          </Btn>
        )}
      </div>
    </div>
  );
}
