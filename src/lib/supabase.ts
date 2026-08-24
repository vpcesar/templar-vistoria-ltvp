import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase do projeto externo da TEMPLAR ENGENHARIA.
 * A URL e a anon key são publicáveis (protegidas por RLS no painel do Supabase).
 */
export const SUPABASE_URL = "https://rewsaixcoatfkqbpfdos.supabase.co";

export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJld3NhaXhjb2F0ZmtxYnBmZG9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczMDg4MjQsImV4cCI6MjEwMjg4NDgyNH0.MC_XdhjbWYKxa1nkMNnw1aaK_yLX8sgSuehzvhH-K0k";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: typeof window !== "undefined",
    autoRefreshToken: typeof window !== "undefined",
    detectSessionInUrl: typeof window !== "undefined",
  },
});
