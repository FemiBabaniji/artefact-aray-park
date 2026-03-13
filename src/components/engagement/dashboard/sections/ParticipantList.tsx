"use client";

import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";
import type { Participant } from "@/types/participant";
import { getRoleLabel, isConsultant } from "@/types/participant";
import { ListRow, ListRowTitle, ListRowSubtitle } from "@/components/ds/ListRow";
import { Badge } from "@/components/ds/Badge";
import { Empty } from "@/components/ds/Empty";
import { Section } from "@/components/ds/Section";

type ParticipantListProps = {
  participants: Participant[];
  onInvite?: () => void;
  C: Record<string, string>;
};

function Avatar({
  name,
  isConsultantRole,
}: {
  name: string;
  isConsultantRole: boolean;
}) {
  const C = useC();
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const color = isConsultantRole ? C.blue : C.green;

  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        background: `${color}20`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 11,
        fontWeight: 600,
        color,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

function ParticipantRow({ participant }: { participant: Participant }) {
  const isConsultantRole = isConsultant(participant.role);

  return (
    <ListRow
      leading={<Avatar name={participant.name} isConsultantRole={isConsultantRole} />}
      trailing={
        !participant.joinedAt ? <Badge variant="muted">Pending</Badge> : undefined
      }
      padding="10px 16px"
    >
      <ListRowTitle>{participant.name}</ListRowTitle>
      <ListRowSubtitle>{getRoleLabel(participant.role)}</ListRowSubtitle>
    </ListRow>
  );
}

export function ParticipantList({ participants, onInvite }: ParticipantListProps) {
  const C = useC();
  const consultants = participants.filter((p) => isConsultant(p.role));
  const clients = participants.filter((p) => !isConsultant(p.role));

  if (participants.length === 0) {
    return (
      <div style={{ padding: "8px 0" }}>
        <Empty title="No participants yet" compact />
        {onInvite && (
          <motion.button
            whileHover={{ background: C.void }}
            onClick={onInvite}
            style={{
              width: "100%",
              padding: "10px 16px",
              background: "transparent",
              border: "none",
              borderTop: `1px solid ${C.sep}`,
              marginTop: 8,
              color: C.blue,
              fontSize: 12,
              cursor: "pointer",
              textAlign: "center",
            }}
          >
            + Invite participant
          </motion.button>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: "8px 0" }}>
      {consultants.length > 0 && (
        <div style={{ marginBottom: clients.length > 0 ? 12 : 0 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 500,
              color: C.t4,
              textTransform: "uppercase",
              letterSpacing: ".04em",
              padding: "0 16px 8px",
            }}
          >
            Consultants
          </div>
          {consultants.map((participant) => (
            <ParticipantRow key={participant.id} participant={participant} />
          ))}
        </div>
      )}

      {clients.length > 0 && (
        <div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 500,
              color: C.t4,
              textTransform: "uppercase",
              letterSpacing: ".04em",
              padding: "0 16px 8px",
            }}
          >
            Client Team
          </div>
          {clients.map((participant) => (
            <ParticipantRow key={participant.id} participant={participant} />
          ))}
        </div>
      )}

      {onInvite && (
        <motion.button
          whileHover={{ background: C.void }}
          onClick={onInvite}
          style={{
            width: "100%",
            padding: "10px 16px",
            background: "transparent",
            border: "none",
            borderTop: `1px solid ${C.sep}`,
            marginTop: 8,
            color: C.blue,
            fontSize: 12,
            cursor: "pointer",
            textAlign: "center",
          }}
        >
          + Invite participant
        </motion.button>
      )}
    </div>
  );
}
