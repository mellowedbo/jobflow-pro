import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth-utils';
import { mapArrayToCamelCase } from '@/lib/api-utils';
import type { InventoryTransaction } from '@/lib/types';

// GET /api/inventory/transactions — List all transactions
export async function GET(request: Request) {
  try {
    const auth = await getUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await auth.client
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
