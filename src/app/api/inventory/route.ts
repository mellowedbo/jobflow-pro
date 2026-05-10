import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  mapArrayToCamelCase,
  keysToSnakeCase,
  logActivity,
} from '@/lib/api-utils';
import type { InventoryItem } from '@/lib/types';

// GET /api/inventory — List all inventory items
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const items = mapArrayToCamelCase<InventoryItem>(data ?? []);
    return NextResponse.json(items);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/inventory — Add an inventory item
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const snakeBody = keysToSnakeCase(body);

    // Set defaults for new inventory items
    snakeBody.current_stock = body.openingStock ?? 0;
    snakeBody.total_purchased = 0;
    snakeBody.total_used = 0;
    snakeBody.total_destroyed = 0;

    // Remove id if present (let DB generate)
    delete snakeBody.id;

    const { data, error } = await supabase
      .from('inventory_items')
      .insert(snakeBody)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log activity
    await logActivity(
      'Inventory Added',
      `${body.name} added to inventory`,
      'inventory'
    );

    const result = mapArrayToCamelCase<InventoryItem>([data])[0];
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
