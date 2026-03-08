import { redirect } from "next/navigation";
import { getDemoAdminClient } from "@/lib/supabase/admin";
import { DemoConfigProvider } from "@/context/DemoConfigContext";
import { DemoThemeWrapper } from "@/components/demo/DemoThemeWrapper";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  params: Promise<{ token: string }>;
};

async function getDemoSession(token: string) {
  const supabase = getDemoAdminClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("demo_sessions")
    .select("*")
    .eq("token", token)
    .single();

  return data;
}

async function getCommunity(communityId: string) {
  const supabase = getDemoAdminClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("communities")
    .select("id, name, tagline, accent_color, logo_url")
    .eq("id", communityId)
    .single();

  return data;
}

async function getProgram(communityId: string) {
  const supabase = getDemoAdminClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("programs")
    .select("id, community_id, section_schema, stage_config")
    .eq("community_id", communityId)
    .single();

  return data;
}

export default async function DemoLayout({ children, params }: Props) {
  const { token } = await params;

  // Fetch demo session
  const session = await getDemoSession(token);

  if (!session) {
    redirect("/demo/expired");
  }

  // Check if expired
  const isExpired =
    new Date(session.expires_at) < new Date() && !session.claimed_at;
  if (isExpired) {
    redirect("/demo/expired");
  }

  // Check if claimed
  if (session.claimed_at) {
    redirect("/admin");
  }

  // Fetch community and program
  const community = await getCommunity(session.community_id);
  const program = await getProgram(session.community_id);

  if (!community || !program) {
    redirect("/demo/expired");
  }

  // Parse JSON fields
  const sectionSchema = Array.isArray(program.section_schema)
    ? program.section_schema
    : [];
  const stageConfig = Array.isArray(program.stage_config)
    ? program.stage_config
    : [];

  return (
    <DemoConfigProvider
      token={token}
      expiresAt={session.expires_at}
      initialConfig={{
        identity: {
          name: community.name,
          tagline: community.tagline || "",
          accentColor: community.accent_color,
          logoUrl: community.logo_url,
        },
        sections: sectionSchema as {
          id: string;
          label: string;
          cp: 1 | 2;
          order: number;
        }[],
        stages: stageConfig as { id: string; label: string }[],
      }}
    >
      <DemoThemeWrapper>{children}</DemoThemeWrapper>
    </DemoConfigProvider>
  );
}
