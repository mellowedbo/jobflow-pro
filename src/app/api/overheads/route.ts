import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { mapArrayToCamelCase, keysToSnakeCase, logActivity } from '@/lib/api-utils';
import type { OverheadCost } from '@/lib/types';

// GET /api/overheads — List all overhead costs
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('overhead_costs')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const costs = mapArrayToCamelCase<OverheadCost>(data ?? []);
    return NextResponse.json(costs);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/overheads — Add overhead cost
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const snakeBody = keysToSnakeCase(body);
    delete snakeBody.id;

    const { data, error } = await supabase
      .from('overhead_costs')
      .insert(snakeBody)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log activity
    await logActivity(
      'Overhead Cost',
      `₹${(body.amount ?? 0).toLocaleString('en-IN')} - ${body.description ?? ''}`,
      'cost'
    );

    const result = mapArrayToCamelCase<OverheadCost>([data])[0];
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
