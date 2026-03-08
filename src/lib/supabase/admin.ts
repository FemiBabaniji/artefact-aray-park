import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Service role client — bypasses RLS.
// Use for server-side data fetching where no user session exists.
// NEVER expose to browser or client components.

let _adminClient: SupabaseClient<Database> | null = null;

export function getAdminClient(): SupabaseClient<Database> | null {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  if (!_adminClient) {
    _adminClient = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  return _adminClient;
}

// Untyped admin client for demo operations
// Using 'any' to bypass strict type checks for tables with pending migrations
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _demoClient: SupabaseClient<any> | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getDemoAdminClient(): SupabaseClient<any> | null {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  if (!_demoClient) {
    _demoClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  return _demoClient;
}

// Legacy export for backwards compatibility
export const adminClient = getAdminClient();
