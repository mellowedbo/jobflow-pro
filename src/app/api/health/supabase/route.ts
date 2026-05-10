import { NextResponse } from 'next/server';

/**
 * Server-side Supabase connection test.
 * This runs on the Vercel server (not in the browser),
 * so it bypasses CORS and client-side network issues.
 */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.json({
      ok: false,
      error: 'Missing env vars',
      details: {
        NEXT_PUBLIC_SUPABASE_URL: url ? `set (${url.length} chars)` : 'NOT SET',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: key ? `set (${key.length} chars)` : 'NOT SET',
      },
    }, { status: 500 });
  }

  // Normalize URL
  const normalizedUrl = url.replace(/\/+$/, '');

  if (!normalizedUrl.startsWith('https://') || !normalizedUrl.includes('.supabase.co')) {
    return NextResponse.json({
      ok: false,
      error: 'Invalid URL format',
      url: normalizedUrl.substring(0, 50),
      hint: 'Expected format: https://your-project-ref.supabase.co',
    }, { status: 500 });
  }

  try {
    // Test REST API reachability
    const res = await fetch(`${normalizedUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      signal: AbortSignal.timeout(15_000),
    });

    // Also check auth endpoint
    let authStatus = 'unknown';
    try {
      const authRes = await fetch(`${normalizedUrl}/auth/v1/health`, {
        signal: AbortSignal.timeout(10_000),
      });
      authStatus = `HTTP ${authRes.status}`;
    } catch {
      authStatus = 'unreachable';
    }

    return NextResponse.json({
      ok: true,
      restApi: { status: res.status, reachable: true },
      authApi: { status: authStatus },
      url: normalizedUrl,
      keyLength: key.length,
      message: res.status <= 404
        ? 'Supabase is reachable from the server'
        : `Unexpected status ${res.status}, but server responded`,
    });
  } catch (err: any) {
    const msg = err?.message || String(err);
    return NextResponse.json({
      ok: false,
      error: 'Cannot reach Supabase from server',
      details: msg,
      url: normalizedUrl,
      hint: msg.includes('fetch') || msg.includes('ENOTFOUND')
        ? 'DNS resolution failed — the Supabase URL may be wrong, or the project may be paused.'
        : undefined,
    }, { status: 502 });
  }
}
