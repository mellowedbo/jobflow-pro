import { supabase } from '@/lib/supabase';
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
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser(token);
  if (!user) return null;

  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    }
  );

  return { user, client };
}
