import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function createSupabaseClient(): SupabaseClient {
  const isValidUrl = supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://');

  if (!isValidUrl) {
    // Return a mock client that won't crash but won't work
    // API routes will return 401 when no valid Supabase is configured
    return createClient('https://placeholder.supabase.co', 'placeholder-key');
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = createSupabaseClient();

export function isSupabaseConfigured(): boolean {
  return supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://');
}
