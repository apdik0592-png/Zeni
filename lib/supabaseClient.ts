import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!url || !anonKey) {
  // Loud in dev, silent no-op safe fallback in build so the app still renders
  // without crashing before env vars are configured on Netlify.
  // eslint-disable-next-line no-console
  console.warn(
    "[Zeni] Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
    "Set them in Netlify env vars or .env.local — see README.md."
  );
}

export const supabase = createClient(url || "https://placeholder.supabase.co", anonKey || "placeholder");
