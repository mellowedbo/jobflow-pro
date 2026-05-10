import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { mapArrayToCamelCase } from '@/lib/api-utils';
import type { InventoryTransaction } from '@/lib/types';

// GET /api/inventory/transactions — List all transactions
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('inventory_transactions')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const transactions = mapArrayToCamelCase<InventoryTransaction>(data ?? []);
    return NextResponse.json(transactions);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
