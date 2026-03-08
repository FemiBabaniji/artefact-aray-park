// Re-export client factories
export { createClient as createServerClient } from "./server";
export { createClient as createBrowserClient } from "./client";

// Re-export types
export type {
  Database,
  Tables,
  InsertTables,
  UpdateTables,
  Views,
  Stage,
  SectionStatus,
  MemberRole,
  CommunityTier,
  Json,
} from "./types";
