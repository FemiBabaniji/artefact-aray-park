"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useC } from "@/hooks/useC";
import { useDemoConfig } from "@/context/DemoConfigContext";
import { Lbl } from "@/components/primitives/Lbl";
import { Btn } from "@/components/primitives/Btn";
import { Avatar } from "@/components/primitives/Avatar";
import { DEMO_COHORT } from "@/lib/data/demo-members";
import { SPF } from "@/lib/motion";

type Props = {
  token: string;
};

export function PreviewStep({ token }: Props) {
  const C = useC();
  const router = useRouter();
  const { config } = useDemoConfig();

  const [selectedMemberId, setSelectedMemberId] = useState(DEMO_COHORT[2].member.id);

  const handleClaim = () => {
    router.push(`/demo/${token}/claim`);
  };

  // Group members by stage
  const stageGroups = config.stages.reduce(
    (acc, stage) => {
      acc[stage.id] = DEMO_COHORT.filter((m) => m.member.stage === stage.id);
      return acc;
    },
    {} as Record<string, typeof DEMO_COHORT>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 500,
            color: C.t1,
            marginBottom: 6,
          }}
        >
          Your Program Preview
        </h2>
        <p style={{ fontSize: 13, color: C.t3, lineHeight: 1.5 }}>
          This is how your admin pipeline will look with members at different
          stages. Ready to launch?
        </p>
      </div>

      {/* Community header preview */}
      <div
        style={{
          padding: "16px 20px",
          background: C.bg,
          border: `1px solid ${C.edge}`,
          borderRadius: 10,
        }}
      >
        <div
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: C.t1,
            marginBottom: 4,
          }}
        >
          {config.identity.name || "Your Community"}
        </div>
        {config.identity.tagline && (
          <div style={{ fontSize: 12, color: C.t3 }}>
            {config.identity.tagline}
          </div>
        )}
      </div>

      {/* Pipeline preview */}
      <div>
        <Lbl style={{ marginBottom: 12 }}>Pipeline view</Lbl>
        <div
          style={{
            display: "flex",
            gap: 2,
            overflowX: "auto",
            paddingBottom: 8,
          }}
        >
          {config.stages.map((stage) => {
            const members = stageGroups[stage.id] || [];
            return (
              <div
                key={stage.id}
                style={{
                  flex: 1,
                  minWidth: 120,
                  padding: 12,
                  background: C.bg,
                  border: `1px solid ${C.edge}`,
                  borderRadius: 8,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <span
                    className="mono"
                    style={{
                      fontSize: 9,
                      color: C.t3,
                      textTransform: "uppercase",
                    }}
                  >
                    {stage.label}
                  </span>
                  <span className="mono" style={{ fontSize: 9, color: C.t4 }}>
                    {members.length}
                  </span>
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 6 }}
                >
                  {members.map((m) => (
                    <MemberPill
                      key={m.member.id}
                      member={m.member}
                      selected={selectedMemberId === m.member.id}
                      onClick={() => setSelectedMemberId(m.member.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section config summary */}
      <div>
        <Lbl style={{ marginBottom: 8 }}>Section schema</Lbl>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {config.sections.map((section) => (
            <div
              key={section.id}
              style={{
                padding: "6px 10px",
                background: C.edge + "30",
                borderRadius: 4,
                fontSize: 11,
                color: C.t2,
              }}
            >
              {section.label}
              <span
                className="mono"
                style={{
                  fontSize: 8,
                  color: section.cp === 1 ? C.green : C.blue,
                  marginLeft: 6,
                }}
              >
                CP{section.cp}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div
        style={{
          padding: "20px",
          background: C.green + "10",
          border: `1px solid ${C.green}30`,
          borderRadius: 10,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 15,
            fontWeight: 500,
            color: C.t1,
            marginBottom: 8,
          }}
        >
          This is your program.
        </div>
        <div
          style={{
            fontSize: 12,
            color: C.t3,
            marginBottom: 16,
            lineHeight: 1.5,
          }}
        >
          Claim it now and invite your first cohort. Your configuration is
          saved.
        </div>
        <Btn onClick={handleClaim} accent={C.green}>
          Claim your program
        </Btn>
      </div>
    </div>
  );
}

// Member pill component
type MemberPillProps = {
  member: (typeof DEMO_COHORT)[0]["member"];
  selected: boolean;
  onClick: () => void;
};

function MemberPill({ member, selected, onClick }: MemberPillProps) {
  const C = useC();

  return (
    <motion.button
      onClick={onClick}
      animate={{
        background: selected ? C.edge : "transparent",
        borderColor: selected ? C.t3 : C.edge,
      }}
      whileHover={{ background: C.edge }}
      transition={SPF}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 8px",
        border: `1px solid ${C.edge}`,
        borderRadius: 6,
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <Avatar size={20} color={member.color} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 11,
            color: C.t1,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {member.name}
        </div>
      </div>
    </motion.button>
  );
}
