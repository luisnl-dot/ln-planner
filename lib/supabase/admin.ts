import "server-only";
import { createClient } from "@supabase/supabase-js";

// Service-role client for server-side use only (API routes, server actions).
// Bypasses RLS — never import this into client components.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
