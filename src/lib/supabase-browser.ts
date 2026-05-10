import { createBrowserClient } from '@supabase/ssr';

let client: ReturnType<typeof createBrowserClient> | null = null;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const isConfigured = SUPABASE_URL.startsWith('http') && SUPABASE_ANON_KEY.length > 20;

export function isSupabaseConfigured(): boolean {
  return isConfigured;
}

export function getSupabaseUrl(): string {
  // Only show first 30 chars for debugging (don't expose full URL)
  return SUPABASE_URL ? SUPABASE_URL.substring(0, 35) + '...' : '(not set)';
}

export function createClient() {
  if (!isConfigured) {
    // Not configured — return a dummy client that won't crash
    // Auth operations will fail with clear errors
    if (!client) {
      client = createBrowserClient(
        'https://placeholder.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder'
      );
    }
    return client;
  }

  // Create real client — singleton to avoid multiple instances
  if (!client) {
    client = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return client;
}
