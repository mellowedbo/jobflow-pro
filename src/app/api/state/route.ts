import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth-utils';

// GET /api/state — Get app state
export async function GET(request: Request) {
  try {
    const auth = await getUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await auth.client
      .from('app_state')
      .select('*');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Convert array of {key, value} to object
    const state: Record<string, unknown> = {};
    for (const row of data ?? []) {
      const record = row as { key: string; value: unknown };
      state[record.key] = record.value;
    }

    return NextResponse.json(state);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT /api/state — Update app state
export async function PUT(request: Request) {
  try {
    const auth = await getUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // body is a flat object of key-value pairs to upsert
    const upserts = Object.entries(body).map(([key, value]) => ({
      key,
      value,
      user_id: auth.user.id,
    }));

    if (upserts.length === 0) {
      return NextResponse.json({ error: 'No data provided' }, { status: 400 });
    }

    const { error } = await auth.client
      .from('app_state')
      .upsert(upserts, { onConflict: 'key' });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return the updated state
    const { data, error: fetchError } = await auth.client
      .from('app_state')
      .select('*');

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const state: Record<string, unknown> = {};
    for (const row of data ?? []) {
      const record = row as { key: string; value: unknown };
      state[record.key] = record.value;
    }

    return NextResponse.json(state);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
