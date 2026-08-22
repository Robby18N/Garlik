import { createClient } from '@supabase/supabase-js';

// Single shared Supabase client for the whole app — every page/module that
// needs real data (instead of the MOCK_DATA arrays) imports `supabase` from
// here rather than creating its own client.
//
// The two values below come from Project Settings > Data API in the
// Supabase dashboard:
//   - VITE_SUPABASE_URL        → "Project URL"
//   - VITE_SUPABASE_ANON_KEY   → "Publishable key" (sb_publishable_...) or,
//                                  on older projects, the legacy `anon` key.
// Both are safe to ship in client-side code — they only grant whatever
// access the table's Row Level Security policies allow. Never put the
// `service_role` / "Secret key" here.
//
// Locally these are read from `.env` (gitignored). For the Vercel
// deployment, add the same two keys under Project Settings > Environment
// Variables in the Vercel dashboard, then redeploy.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Loud failure instead of a silent broken client — easier to diagnose
  // than downstream "fetch failed" errors on every query.
  console.error(
    'Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY ' +
      '(see .env.example) — locally in .env, and in Vercel under Project Settings > Environment Variables.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
