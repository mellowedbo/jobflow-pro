import { createClient } from '@supabase/supabase-js';

// ─── Simple, reliable Supabase browser client ─────────────
// Uses @supabase/supabase-js directly (not @supabase/ssr).
// No middleware needed. No cookie handling. Just works.

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/+$/, '');
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const isConfigured =
  SUPABASE_URL.startsWith('https://') &&
  SUPABASE_URL.includes('.supabase.co') &&
  SUPABASE_ANON_KEY.length > 20;

export function isSupabaseConfigured(): boolean {
  return isConfigured;
}

export function getSupabaseUrl(): string {
  return SUPABASE_URL;
}

export function getSupabaseDebugInfo(): string {
  if (!SUPABASE_URL) return 'NEXT_PUBLIC_SUPABASE_URL is not set';
  if (!SUPABASE_URL.startsWith('https://')) return `URL invalid: "${SUPABASE_URL.substring(0, 30)}"`;
  if (!SUPABASE_URL.includes('.supabase.co')) return `Not a Supabase URL: "${SUPABASE_URL.substring(0, 40)}"`;
  if (!SUPABASE_ANON_KEY) return 'NEXT_PUBLIC_SUPABASE_ANON_KEY is not set';
  if (SUPABASE_ANON_KEY.length <= 20) return `Key too short (${SUPABASE_ANON_KEY.length} chars)`;
  return `OK — ${SUPABASE_URL} key:...${SUPABASE_ANON_KEY.slice(-6)}`;
}

// Singleton
let _client: ReturnType<typeof createClient> | null = null;

export function createClient() {
  if (_client) return _client;

  if (!isConfigured) {
    // Return a throwaway client — auth calls will fail with clear errors
    console.warn('[DrillOps] Supabase not configured. Auth will not work. Use Guest mode instead.');
    _client = createClient('https://placeholder.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder');
    return _client;
  }

  console.log('[DrillOps] Creating Supabase client for:', SUPABASE_URL);
  _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return _client;
}
