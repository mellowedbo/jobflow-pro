import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';

export interface AuthResult {
  user: User;
  client: SupabaseClient;
}

/**
 * Get the authenticated user from the request's Authorization header.
 * Returns the user object and an authenticated Supabase client that
 * respects RLS policies.
 *
 * Returns null if no valid token is found or the user is not authenticated.
 */
export async function getUser(req: Request): Promise<AuthResult | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !supabaseUrl.startsWith('http')) {
    return null;
  }

  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) return null;

  // Create a fresh client for auth verification (not the singleton)
  const authClient = createClient(supabaseUrl, supabaseAnonKey);

  const {
    data: { user },
  } = await authClient.auth.getUser(token);
  if (!user) return null;

  // Create authenticated client with the token for RLS
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: `Bearer ${token}` },
    },
  });

  return { user, client };
}
