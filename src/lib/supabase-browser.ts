import { createBrowserClient } from '@supabase/ssr';

let client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Return a mock client if env vars aren't configured yet
  if (!url || !key || !url.startsWith('http')) {
    if (!client) {
      client = createBrowserClient(
        'https://placeholder.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder'
      );
    }
    return client;
  }

  // Always create a real client when env vars are valid
  // (don't cache, in case env vars change during dev)
  return createBrowserClient(url, key);
}
