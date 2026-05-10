import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { mapArrayToCamelCase, logActivity } from '@/lib/api-utils';
import type { InventoryItem, InventoryTransaction } from '@/lib/types';

// POST /api/inventory/[id]/purchase — Add purchase, update stock
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { quantity, costPerUnit, supplier, note } = body;

    if (!quantity || quantity <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be greater than 0' },
        { status: 400 }
      );
    }

    if (!costPerUnit || costPerUnit <= 0) {
      return NextResponse.json(
        { error: 'Cost per unit must be greater than 0' },
        { status: 400 }
      );
    }

    // Fetch current item
    const { data: currentItem, error: fetchError } = await supabase
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
    const totalPurchased = (item.total_purchased as number) ?? 0;
    const currentCostPerUnit = (item.cost_per_unit as number) ?? 0;

    // Calculate new weighted average cost
    const newCostPerUnit =
      (currentCostPerUnit * currentStock + costPerUnit * quantity) /
      (currentStock + quantity);

    // Update inventory item
    const { error: updateError } = await supabase
      .from('inventory_items')
      .update({
        current_stock: currentStock + quantity,
        total_purchased: totalPurchased + quantity,
        cost_per_unit: newCostPerUnit,
      })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Create transaction
    const { data: txnData, error: txnError } = await supabase
      .from('inventory_transactions')
      .insert({
        item_id: id,
        type: 'purchase',
        quantity,
        cost_per_unit: costPerUnit,
        total_cost: quantity * costPerUnit,
        date: new Date().toISOString().split('T')[0],
        supplier: supplier ?? null,
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
      'Inventory Purchase',
      `${quantity} ${itemUnit} of ${itemName} purchased`,
      'inventory'
    );

    // Return updated item and transaction
    const { data: updatedItem } = await supabase
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
