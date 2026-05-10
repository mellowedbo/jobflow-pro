import { createBrowserClient } from '@supabase/ssr';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const isConfigured = SUPABASE_URL.startsWith('http') && SUPABASE_ANON_KEY.length > 20;

export function isSupabaseConfigured(): boolean {
  return isConfigured;
}

export function getSupabaseDebugInfo(): string {
  if (!SUPABASE_URL) return 'URL is empty';
  if (!SUPABASE_URL.startsWith('http')) return `URL does not start with http: "${SUPABASE_URL.substring(0, 20)}"`;
  if (!SUPABASE_ANON_KEY) return 'ANON_KEY is empty';
  if (SUPABASE_ANON_KEY.length <= 20) return `ANON_KEY too short (${SUPABASE_ANON_KEY.length} chars)`;
  return `OK - URL: ${SUPABASE_URL.substring(0, 30)}... Key: ${SUPABASE_ANON_KEY.substring(0, 10)}...`;
}

export function createClient() {
  if (!isConfigured) {
    // Not configured — this will fail if used, but won't crash at import time
    console.error(
      '[DrillOps] Supabase not configured! URL:',
      SUPABASE_URL || '(empty)',
      'Key length:',
      SUPABASE_ANON_KEY.length
    );
    // Create a dummy that won't throw at construction but will fail on auth calls
    return createBrowserClient(
      'https://placeholder.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder'
    );
  }

  // Create a NEW client every time — no singleton caching.
  // Caching caused a bug where the placeholder client was cached
  // and returned even when real env vars were available.
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
