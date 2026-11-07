import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import {
  getSupabaseConfig,
  getSupabaseServiceRoleKey,
} from "@/lib/supabase/config";

export function createAdminClient() {
  const { url } = getSupabaseConfig();

  return createSupabaseClient(url, getSupabaseServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
