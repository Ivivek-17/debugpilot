import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  '';

// Log connection status on server startup (only visible in terminal, never exposed to client)
if (supabaseUrl && supabaseKey) {
  console.log(`[DebugPilot] Supabase connected: ${supabaseUrl.substring(0, 30)}...`);
} else {
  console.warn('[DebugPilot] Supabase credentials missing — history will use in-memory fallback.');
}

// Guard: createClient throws if key is empty — use a placeholder to avoid
// crashing the module import chain. RPCs will simply fail gracefully.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key'
);
