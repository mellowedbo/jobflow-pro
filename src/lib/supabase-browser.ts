import { createBrowserClient } from '@supabase/ssr';

// ─── Runtime credentials (localStorage) take priority over env vars ─────
const STORAGE_KEY_URL = 'drillops_supabase_url';
const STORAGE_KEY_KEY = 'drillops_supabase_anon_key';

function getRuntimeUrl(): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(STORAGE_KEY_URL) || '';
  } catch {
    return '';
  }
}

function getRuntimeKey(): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(STORAGE_KEY_KEY) || '';
  } catch {
    return '';
  }
}

function getEnvUrl(): string {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/+$/, '');
}

function getEnvKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
}

// Resolve credentials: runtime (localStorage) > env vars
function resolveCredentials(): { url: string; key: string } {
  const runtimeUrl = getRuntimeUrl().replace(/\/+$/, '');
  const runtimeKey = getRuntimeKey();
  const envUrl = getEnvUrl();
  const envKey = getEnvKey();

  // Prefer runtime credentials if they look valid
  if (runtimeUrl.startsWith('https://') && runtimeUrl.includes('.supabase.co') && runtimeKey.length > 20) {
    return { url: runtimeUrl, key: runtimeKey };
  }

  // Fall back to env vars
  return { url: envUrl, key: envKey };
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = resolveCredentials();
  return url.startsWith('https://') && url.includes('.supabase.co') && key.length > 20;
}

export function getSupabaseDebugInfo(): string {
  const { url, key } = resolveCredentials();
  const runtimeUrl = getRuntimeUrl();
  const envUrl = getEnvUrl();
  const source = runtimeUrl ? 'localStorage' : 'env vars';

  if (!url) return `URL is empty (source: ${source})`;
  if (!url.startsWith('http')) return `URL does not start with http: "${url.substring(0, 30)}"`;
  if (!url.includes('.supabase.co')) return `URL doesn't look like a Supabase URL: "${url.substring(0, 40)}"`;
  if (!key) return `ANON_KEY is empty (source: ${source})`;
  if (key.length <= 20) return `ANON_KEY too short (${key.length} chars)`;
  return `OK - URL: ${url} (from: ${source}) Key: ...${key.slice(-6)}`;
}

export function getSupabaseUrl(): string {
  return resolveCredentials().url;
}

export function getCredentialsSource(): string {
  return getRuntimeUrl() ? 'localStorage' : 'env vars';
}

// ─── Save runtime credentials ────────────────────────────
export function saveSupabaseCredentials(url: string, key: string): void {
  if (typeof window === 'undefined') return;
  const cleanUrl = url.replace(/\/+$/, '');
  localStorage.setItem(STORAGE_KEY_URL, cleanUrl);
  localStorage.setItem(STORAGE_KEY_KEY, key.trim());
  // Reset singleton so next createClient() picks up new credentials
  clientSingleton = null;
}

// ─── Clear runtime credentials ───────────────────────────
export function clearSupabaseCredentials(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY_URL);
  localStorage.removeItem(STORAGE_KEY_KEY);
  clientSingleton = null;
}

// ─── Singleton browser client ────────────────────────────
let clientSingleton: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  // Always re-resolve credentials to pick up runtime changes
  const { url, key } = resolveCredentials();
  const isConfigured = url.startsWith('https://') && url.includes('.supabase.co') && key.length > 20;

  if (clientSingleton && isConfigured) return clientSingleton;

  if (!isConfigured) {
    console.warn('[DrillOps] Supabase not configured yet');
    // Return placeholder — auth calls will fail but won't crash
    return createBrowserClient(
      'https://placeholder.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder'
    );
  }

  clientSingleton = createBrowserClient(url, key);
  return clientSingleton;
}

// ─── Reset singleton (call after credential change) ──────
export function resetClient() {
  clientSingleton = null;
}

// ─── Connection test (runs in browser) ──────────────────
export async function testSupabaseConnection(testUrl?: string, testKey?: string): Promise<{
  ok: boolean;
  status: number | null;
  message: string;
  url: string;
}> {
  const url = (testUrl || resolveCredentials().url).replace(/\/+$/, '');
  const key = testKey || resolveCredentials().key;

  if (!url.startsWith('https://') || !url.includes('.supabase.co')) {
    return {
      ok: false,
      status: null,
      message: `Invalid URL format: "${url}". Must be like https://your-project.supabase.co`,
      url,
    };
  }

  if (!key || key.length <= 20) {
    return {
      ok: false,
      status: null,
      message: 'Anon key is missing or too short.',
      url,
    };
  }

  try {
    const res = await fetch(`${url}/rest/v1/`, {
      method: 'GET',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      signal: AbortSignal.timeout(10_000),
    });

    // Any HTTP response means DNS + network + Supabase is reachable
    if (res.status === 200 || res.status === 401 || res.status === 403 || res.status === 404) {
      return {
        ok: true,
        status: res.status,
        message: `Supabase is reachable! (HTTP ${res.status}). Connection OK.`,
        url,
      };
    }

    return {
      ok: false,
      status: res.status,
      message: `Unexpected HTTP ${res.status}. Server responded but something may be wrong.`,
      url,
    };
  } catch (err: any) {
    const msg = err?.message || String(err);
    let diagnosis = msg;

    if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
      diagnosis =
        'Cannot reach Supabase. Your project may be PAUSED (free tier pauses after 7 days). ' +
        'Go to supabase.com and click "Restore project". Or the URL may be wrong.';
    } else if (msg.includes('timeout') || msg.includes('Timeout')) {
      diagnosis = 'Connection timed out. Supabase may be paused or URL is wrong.';
    }

    return {
      ok: false,
      status: null,
      message: diagnosis,
      url,
    };
  }
}
