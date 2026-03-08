// Database types — auto-generate with `npx supabase gen types typescript`
// Manual definition for now; replace after schema is deployed.

export type Stage =
  | "pending"
  | "entry"
  | "foundation"
  | "development"
  | "showcase"
  | "graduate";

export type SectionStatus =
  | "empty"
  | "in_progress"
  | "submitted"
  | "reviewed"
  | "accepted";

export type CommunityTier = "standard" | "pro" | "custom" | "demo";

export type MemberRole = "member" | "mentor" | "admin";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      communities: {
        Row: {
          id: string;
          slug: string;
          name: string;
          tagline: string | null;
          accent_color: string;
          logo_url: string | null;
          custom_domain: string | null;
          tier: CommunityTier;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          tagline?: string | null;
          accent_color?: string;
          logo_url?: string | null;
          custom_domain?: string | null;
          tier?: CommunityTier;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          tagline?: string | null;
          accent_color?: string;
          logo_url?: string | null;
          custom_domain?: string | null;
          tier?: CommunityTier;
          created_at?: string;
        };
      };
      community_branding: {
        Row: {
          id: string;
          community_id: string;
          accent_color: string | null;
          dark_bg: string | null;
          light_bg: string | null;
          logo_url: string | null;
          font_heading: string | null;
          font_body: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          community_id: string;
          accent_color?: string | null;
          dark_bg?: string | null;
          light_bg?: string | null;
          logo_url?: string | null;
          font_heading?: string | null;
          font_body?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          community_id?: string;
          accent_color?: string | null;
          dark_bg?: string | null;
          light_bg?: string | null;
          logo_url?: string | null;
          font_heading?: string | null;
          font_body?: string | null;
          updated_at?: string;
        };
      };
      programs: {
        Row: {
          id: string;
          community_id: string;
          name: string;
          subtitle: string | null;
          week: number;
          total_weeks: number;
          live: boolean;
          stage_config: Json;
          section_schema: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          community_id: string;
          name: string;
          subtitle?: string | null;
          week?: number;
          total_weeks?: number;
          live?: boolean;
          stage_config?: Json;
          section_schema?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          community_id?: string;
          name?: string;
          subtitle?: string | null;
          week?: number;
          total_weeks?: number;
          live?: boolean;
          stage_config?: Json;
          section_schema?: Json;
          created_at?: string;
        };
      };
      cohorts: {
        Row: {
          id: string;
          program_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          program_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          program_id?: string;
          name?: string;
          created_at?: string;
        };
      };
      members: {
        Row: {
          id: string;
          community_id: string;
          cohort_id: string | null;
          user_id: string | null;
          name: string;
          initials: string | null;
          title: string | null;
          email: string;
          phone: string | null;
          location: string | null;
          availability: string | null;
          color: string;
          avatar_url: string | null;
          stage: Stage;
          created_at: string;
        };
        Insert: {
          id?: string;
          community_id: string;
          cohort_id?: string | null;
          user_id?: string | null;
          name: string;
          initials?: string | null;
          title?: string | null;
          email: string;
          phone?: string | null;
          location?: string | null;
          availability?: string | null;
          color?: string;
          avatar_url?: string | null;
          stage?: Stage;
          created_at?: string;
        };
        Update: {
          id?: string;
          community_id?: string;
          cohort_id?: string | null;
          user_id?: string | null;
          name?: string;
          initials?: string | null;
          title?: string | null;
          email?: string;
          phone?: string | null;
          location?: string | null;
          availability?: string | null;
          color?: string;
          avatar_url?: string | null;
          stage?: Stage;
          created_at?: string;
        };
      };
      member_profiles: {
        Row: {
          id: string;
          member_id: string;
          practice: string | null;
          focus: string | null;
          goals: string[];
          influences: string[];
          skills: Json;
          projects: Json;
          updated_at: string;
        };
        Insert: {
          id?: string;
          member_id: string;
          practice?: string | null;
          focus?: string | null;
          goals?: string[];
          influences?: string[];
          skills?: Json;
          projects?: Json;
          updated_at?: string;
        };
        Update: {
          id?: string;
          member_id?: string;
          practice?: string | null;
          focus?: string | null;
          goals?: string[];
          influences?: string[];
          skills?: Json;
          projects?: Json;
          updated_at?: string;
        };
      };
      artefacts: {
        Row: {
          id: string;
          member_id: string;
          ws_content: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          member_id: string;
          ws_content?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          member_id?: string;
          ws_content?: string;
          updated_at?: string;
        };
      };
      sections: {
        Row: {
          id: string;
          artefact_id: string;
          key: string;
          label: string;
          status: SectionStatus;
          evidence: string;
          cp: number;
          feedback: string | null;
          feedback_at: string | null;
          feedback_by: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          artefact_id: string;
          key: string;
          label: string;
          status?: SectionStatus;
          evidence?: string;
          cp: number;
          feedback?: string | null;
          feedback_at?: string | null;
          feedback_by?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          artefact_id?: string;
          key?: string;
          label?: string;
          status?: SectionStatus;
          evidence?: string;
          cp?: number;
          feedback?: string | null;
          feedback_at?: string | null;
          feedback_by?: string | null;
          updated_at?: string;
        };
      };
      stage_transitions: {
        Row: {
          id: string;
          member_id: string;
          from_stage: Stage | null;
          to_stage: Stage;
          transitioned_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          member_id: string;
          from_stage?: Stage | null;
          to_stage: Stage;
          transitioned_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          member_id?: string;
          from_stage?: Stage | null;
          to_stage?: Stage;
          transitioned_by?: string | null;
          created_at?: string;
        };
      };
      community_roles: {
        Row: {
          id: string;
          community_id: string;
          user_id: string;
          role: MemberRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          community_id: string;
          user_id: string;
          role?: MemberRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          community_id?: string;
          user_id?: string;
          role?: MemberRole;
          created_at?: string;
        };
      };
      application_decisions: {
        Row: {
          id: string;
          member_id: string;
          decision: string;
          decided_by: string | null;
          note: string | null;
          decided_at: string;
        };
        Insert: {
          id?: string;
          member_id: string;
          decision: string;
          decided_by?: string | null;
          note?: string | null;
          decided_at?: string;
        };
        Update: {
          id?: string;
          member_id?: string;
          decision?: string;
          decided_by?: string | null;
          note?: string | null;
          decided_at?: string;
        };
      };
      demo_sessions: {
        Row: {
          id: string;
          token: string;
          community_id: string;
          expires_at: string;
          claimed_at: string | null;
          claimed_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          token: string;
          community_id: string;
          expires_at?: string;
          claimed_at?: string | null;
          claimed_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          token?: string;
          community_id?: string;
          expires_at?: string;
          claimed_at?: string | null;
          claimed_by?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      at_risk_members: {
        Row: {
          id: string;
          community_id: string;
          name: string;
          email: string;
          stage: Stage;
          accepted_count: number;
          last_activity: string;
          at_risk: boolean;
        };
      };
      member_progress: {
        Row: {
          member_id: string;
          total_sections: number;
          accepted_sections: number;
          pct: number;
        };
      };
    };
    Functions: {
      current_community_role: {
        Args: { cid: string };
        Returns: string;
      };
      current_member_id: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: {
      stage_enum: Stage;
      section_status_enum: SectionStatus;
      community_tier_enum: CommunityTier;
      member_role_enum: MemberRole;
    };
  };
}

// Helper types for common queries
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export type Views<T extends keyof Database["public"]["Views"]> =
  Database["public"]["Views"][T]["Row"];
