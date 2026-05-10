import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { mapArrayToCamelCase, keysToSnakeCase } from '@/lib/api-utils';
import type { InventoryItem } from '@/lib/types';

// GET /api/inventory/[id] — Get a single inventory item
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const result = mapArrayToCamelCase<InventoryItem>([data])[0];
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH /api/inventory/[id] — Update an inventory item
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const snakeBody = keysToSnakeCase(body);

    // Remove fields that shouldn't be updated directly
    delete snakeBody.id;
    delete snakeBody.total_purchased;
    delete snakeBody.total_used;
    delete snakeBody.total_destroyed;

    const { data, error } = await supabase
      .from('inventory_items')
      .update(snakeBody)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const result = mapArrayToCamelCase<InventoryItem>([data])[0];
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
