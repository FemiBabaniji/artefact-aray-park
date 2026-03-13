"use client";

import { useRouter } from "next/navigation";
import { useC } from "@/hooks/useC";
import type { EngagementRoom } from "@/types/engagement";
import { ListRow, ListRowTitle, ListRowSubtitle } from "@/components/ds/ListRow";
import { Badge } from "@/components/ds/Badge";
import { Indicator } from "@/components/ds/Indicator";
import { Empty } from "@/components/ds/Empty";

type RoomListProps = {
  rooms: EngagementRoom[];
  engagementId: string;
  C: Record<string, string>;
};

function ChevronRight({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color, flexShrink: 0 }}>
      <path
        d="M9 18L15 12L9 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function RoomList({ rooms, engagementId }: RoomListProps) {
  const router = useRouter();
  const C = useC();

  const sortedRooms = [...rooms].sort((a, b) => a.orderIndex - b.orderIndex);

  const handleRoomClick = (room: EngagementRoom) => {
    router.push(`/practice/engagements/${engagementId}/rooms/${room.key}`);
  };

  if (rooms.length === 0) {
    return <Empty title="No rooms configured" compact />;
  }

  return (
    <div>
      {sortedRooms.map((room, index) => {
        const blockCount = room.blocks?.length ?? 0;
        const hasContent = blockCount > 0;
        const isClientVisible = room.visibility !== "consultant_only";

        return (
          <ListRow
            key={room.id}
            onClick={() => handleRoomClick(room)}
            divider={index < sortedRooms.length - 1}
            padding="14px 16px"
            leading={<Indicator status={hasContent ? "success" : "inactive"} />}
            trailing={
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Badge variant={isClientVisible ? "default" : "muted"}>
                  {room.visibility === "consultant_only"
                    ? "Internal"
                    : room.visibility === "client_view"
                    ? "Client view"
                    : "Client edit"}
                </Badge>
                <span style={{ fontSize: 11, color: C.t4, minWidth: 50, textAlign: "right" }}>
                  {blockCount} {blockCount === 1 ? "block" : "blocks"}
                </span>
                <ChevronRight color={C.t4} />
              </div>
            }
          >
            <ListRowTitle>{room.label}</ListRowTitle>
            {room.prompt && <ListRowSubtitle>{room.prompt}</ListRowSubtitle>}
          </ListRow>
        );
      })}
    </div>
  );
}
