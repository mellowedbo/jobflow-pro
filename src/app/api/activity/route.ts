import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth-utils';
import { mapArrayToCamelCase, keysToSnakeCase } from '@/lib/api-utils';
import type { ActivityLog } from '@/lib/types';

// GET /api/activity — List activity log (newest first, limit 100)
export async function GET(request: Request) {
  try {
    const auth = await getUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await auth.client
      .from('activity_log')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const logs = mapArrayToCamelCase<ActivityLog>(data ?? []);
    return NextResponse.json(logs);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/activity — Add activity log entry
export async function POST(request: Request) {
  try {
    const auth = await getUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const snakeBody = keysToSnakeCase(body);
    delete snakeBody.id;
    snakeBody.user_id = auth.user.id;

    // Set timestamp if not provided
    if (!snakeBody.timestamp) {
      snakeBody.timestamp = new Date().toISOString();
    }

    const { data, error } = await auth.client
      .from('activity_log')
      .insert(snakeBody)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const result = mapArrayToCamelCase<ActivityLog>([data])[0];
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
