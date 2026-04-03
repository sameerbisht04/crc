import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://yptcvppctvauhrucecmf.supabase.co";
const SUPABASE_PUBLIC_KEY = "sb_publishable_dSbWibYgNq6VEzvXNmQnZA_L7JAeRCE";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
