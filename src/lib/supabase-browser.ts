import { createBrowserClient } from '@supabase/ssr';

// Normalize: read env vars, strip trailing slashes from URL
const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const SUPABASE_URL = rawUrl.replace(/\/+$/, ''); // remove trailing slashes
const SUPABASE_ANON_KEY = rawKey;

const isConfigured =
  SUPABASE_URL.startsWith('https://') &&
  SUPABASE_URL.includes('.supabase.co') &&
  SUPABASE_ANON_KEY.length > 20;

export function isSupabaseConfigured(): boolean {
  return isConfigured;
}

export function getSupabaseDebugInfo(): string {
  if (!rawUrl) return 'URL is empty';
  if (!rawUrl.startsWith('http')) return `URL does not start with http: "${rawUrl.substring(0, 30)}"`;
  if (!SUPABASE_URL.includes('.supabase.co')) return `URL doesn't look like a Supabase URL: "${SUPABASE_URL.substring(0, 40)}"`;
  if (!rawKey) return 'ANON_KEY is empty';
  if (rawKey.length <= 20) return `ANON_KEY too short (${rawKey.length} chars)`;
  return `OK - URL: ${SUPABASE_URL} Key: ...${SUPABASE_ANON_KEY.slice(-6)}`;
}

export function getSupabaseUrl(): string {
  return SUPABASE_URL;
}

// ─── Singleton browser client ──────────────────────────────
let clientSingleton: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (clientSingleton) return clientSingleton;

  if (!isConfigured) {
    console.error(
      '[DrillOps] Supabase not configured! URL:',
      SUPABASE_URL || '(empty)',
      'Key length:',
      SUPABASE_ANON_KEY.length
    );
    // Return a throwaway client — auth calls will fail with clear errors
    clientSingleton = createBrowserClient(
      'https://placeholder.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder'
    );
    return clientSingleton;
  }

  console.log('[DrillOps] Creating Supabase browser client for:', SUPABASE_URL);
  clientSingleton = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return clientSingleton;
}

// ─── Connection test (runs in browser) ─────────────────────
export async function testSupabaseConnection(): Promise<{
  ok: boolean;
  status: number | null;
  message: string;
  url: string;
}> {
  if (!isConfigured) {
    return {
      ok: false,
      status: null,
      message: `Not configured. ${getSupabaseDebugInfo()}`,
      url: SUPABASE_URL || '(empty)',
    };
  }

  try {
    // Test 1: Hit the Supabase REST API health endpoint
    const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'GET',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      signal: AbortSignal.timeout(10_000), // 10s timeout
    });

    // Any HTTP response (even 404/401) means DNS + network + Supabase is reachable
    return {
      ok: true,
      status: res.status,
      message: `Supabase is reachable (HTTP ${res.status}). ${res.status === 200 || res.status === 401 ? 'Connection OK!' : `Unexpected status ${res.status}, but server is reachable.`}`,
      url: SUPABASE_URL,
    };
  } catch (err: any) {
    const msg = err?.message || String(err);
    let diagnosis = msg;

    if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
      diagnosis =
        'Cannot reach Supabase server. Possible causes:\n' +
        '• Your Supabase project may be PAUSED (free tier pauses after 7 days of inactivity). Go to supabase.com dashboard and click "Restore".\n' +
        '• The URL may be incorrect. Expected format: https://your-project-ref.supabase.co\n' +
        '• DNS or network issue from the deployment server.';
    } else if (msg.includes('timeout') || msg.includes('Timeout')) {
      diagnosis = 'Connection timed out after 10 seconds. Supabase may be paused or the URL is wrong.';
    } else if (msg.includes('CORS') || msg.includes('cors')) {
      diagnosis = 'CORS error — the Supabase project may not allow requests from this domain.';
    }

    return {
      ok: false,
      status: null,
      message: diagnosis,
      url: SUPABASE_URL,
    };
  }
}
