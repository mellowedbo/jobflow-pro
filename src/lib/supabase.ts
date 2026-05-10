import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a real client only when valid URLs are provided
// Otherwise create a dummy client that won't crash the build
function createSupabaseClient(): SupabaseClient {
  const isValidUrl = supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://');

  if (!isValidUrl) {
    // During build or when env vars are not set, use a placeholder URL
    // This prevents crashes during static generation
    return createClient('https://placeholder.supabase.co', 'placeholder-key');
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = createSupabaseClient();

// Check if Supabase is properly configured
export function isSupabaseConfigured(): boolean {
  return supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://');
}
