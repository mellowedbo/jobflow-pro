import { createBrowserClient } from '@supabase/ssr';

let client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Return a mock client if env vars aren't configured yet
  if (!url || !key || !url.startsWith('http')) {
    if (!client) {
      // Create with placeholder — won't actually work but won't crash
      client = createBrowserClient(
        'https://placeholder.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder'
      );
    }
    return client;
  }

  // Singleton pattern — avoid creating multiple clients
  if (!client) {
    client = createBrowserClient(url, key);
  }
  return client;
}
