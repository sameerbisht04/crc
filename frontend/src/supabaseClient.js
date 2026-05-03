import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://yptcvppctvauhrucecmf.supabase.co";
const SUPABASE_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_dSbWibYgNq6VEzvXNmQnZA_L7JAeRCE";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY, {
  auth: {
    // Avoid repeated refresh retries when network/DNS to Supabase is unavailable.
    autoRefreshToken: false,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
