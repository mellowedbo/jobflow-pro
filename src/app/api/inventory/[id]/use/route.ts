import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth-utils';
import { mapArrayToCamelCase, logActivity } from '@/lib/api-utils';
import type { InventoryItem, InventoryTransaction } from '@/lib/types';

// POST /api/inventory/[id]/use — Use inventory, check stock
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const { quantity, jobId, note } = body;

    if (!quantity || quantity <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be greater than 0' },
        { status: 400 }
      );
    }

    // Fetch current item
    const { data: currentItem, error: fetchError } = await auth.client
      .from('inventory_items')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !currentItem) {
      return NextResponse.json(
        { error: fetchError?.message ?? 'Item not found' },
        { status: 404 }
      );
    }

    const item = currentItem as Record<string, unknown>;
    const currentStock = (item.current_stock as number) ?? 0;
    const totalUsed = (item.total_used as number) ?? 0;
    const costPerUnit = (item.cost_per_unit as number) ?? 0;

    // Check stock
    if (currentStock < quantity) {
      return NextResponse.json(
        { error: `Insufficient stock. Available: ${currentStock}, Requested: ${quantity}` },
        { status: 400 }
      );
    }

    // Update inventory item
    const { error: updateError } = await auth.client
      .from('inventory_items')
      .update({
        current_stock: currentStock - quantity,
        total_used: totalUsed + quantity,
      })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Create transaction
    const { data: txnData, error: txnError } = await auth.client
      .from('inventory_transactions')
      .insert({
        item_id: id,
        user_id: auth.user.id,
        type: 'used',
        quantity,
        cost_per_unit: costPerUnit,
        total_cost: quantity * costPerUnit,
        date: new Date().toISOString().split('T')[0],
        job_id: jobId ?? null,
        note: note ?? null,
      })
      .select()
      .single();

    if (txnError) {
      return NextResponse.json({ error: txnError.message }, { status: 500 });
    }

    // Log activity
    const itemName = (item.name as string) ?? id;
    const itemUnit = (item.unit as string) ?? 'units';
    await logActivity(
      auth.client,
      auth.user.id,
      'Inventory Used',
      `${quantity} ${itemUnit} of ${itemName} used`,
      'inventory'
    );

    // Return updated item and transaction
    const { data: updatedItem } = await auth.client
      .from('inventory_items')
      .select('*')
      .eq('id', id)
      .single();

    const resultItem = mapArrayToCamelCase<InventoryItem>(
      updatedItem ? [updatedItem] : []
    )[0];
    const resultTxn = mapArrayToCamelCase<InventoryTransaction>(
      txnData ? [txnData] : []
    )[0];

    return NextResponse.json({ item: resultItem, transaction: resultTxn });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
