import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  assembleJob,
  fetchJobRelations,
  logActivity,
} from '@/lib/api-utils';
import type { JobRow } from '@/lib/api-utils';

// POST /api/jobs/[id]/complete — Complete a job: update status, deduct inventory
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      depthDrilled,
      casingUsedUnits,
      dieselCost,
      soilType,
      serviceQuantitiesUsed,
      customQuantitiesUsed,
    } = body;

    // Fetch current job
    const { data: currentJob, error: fetchError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !currentJob) {
      return NextResponse.json(
        { error: fetchError?.message ?? 'Job not found' },
        { status: 404 }
      );
    }

    const job = currentJob as JobRow;

    // Update job status
    const { error: updateError } = await supabase
      .from('jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString().split('T')[0],
        depth_drilled: depthDrilled,
        casing_used_units: casingUsedUnits,
        diesel_cost: dieselCost,
        soil_type: soilType,
      })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Update service quantities_used
    if (serviceQuantitiesUsed) {
      for (const [key, qtyUsed] of Object.entries(serviceQuantitiesUsed)) {
        await supabase
          .from('job_services')
          .update({ quantity_used: qtyUsed as number })
          .eq('job_id', id)
          .eq('key', key);
      }
    }

    // Update custom item quantities_used
    if (customQuantitiesUsed) {
      for (const [itemId, qtyUsed] of Object.entries(customQuantitiesUsed)) {
        await supabase
          .from('job_custom_items')
          .update({ quantity_used: qtyUsed as number })
          .eq('job_id', id)
          .eq('id', itemId);
      }
    }

    // Deduct inventory: find casing item by type
    const casingSearchName = job.casing_type === 'GI' ? 'GI Casing' : 'PVC Casing';
    const { data: casingItems } = await supabase
      .from('inventory_items')
      .select('*')
      .ilike('name', `%${casingSearchName}%`)
      .limit(1);

    if (casingItems && casingItems.length > 0 && casingUsedUnits > 0) {
      const casingItem = casingItems[0] as Record<string, unknown>;
      const currentStock = (casingItem.current_stock as number) ?? 0;
      const costPerUnit = (casingItem.cost_per_unit as number) ?? 0;
      const actualQty = Math.min(casingUsedUnits, currentStock);

      if (actualQty > 0) {
        // Update inventory stock
        await supabase
          .from('inventory_items')
          .update({
            current_stock: currentStock - actualQty,
            total_used: ((casingItem.total_used as number) ?? 0) + actualQty,
          })
          .eq('id', casingItem.id);

        // Create inventory transaction
        await supabase.from('inventory_transactions').insert({
          item_id: casingItem.id,
          type: 'used',
          quantity: actualQty,
          cost_per_unit: costPerUnit,
          total_cost: actualQty * costPerUnit,
          date: new Date().toISOString().split('T')[0],
          job_id: id,
          note: `Casing used for ${job.customer_name}`,
        });
      }
    }

    // Deduct inventory: find diesel item
    const { data: dieselItems } = await supabase
      .from('inventory_items')
      .select('*')
      .ilike('name', '%Diesel%')
      .limit(1);

    if (dieselItems && dieselItems.length > 0 && dieselCost > 0) {
      const dieselItem = dieselItems[0] as Record<string, unknown>;
      const currentStock = (dieselItem.current_stock as number) ?? 0;
      const costPerUnit = (dieselItem.cost_per_unit as number) ?? 0;
      const litresUsed = costPerUnit > 0 ? Math.round(dieselCost / costPerUnit) : 0;
      const actualQty = Math.min(litresUsed, currentStock);

      if (actualQty > 0) {
        // Update inventory stock
        await supabase
          .from('inventory_items')
          .update({
            current_stock: currentStock - actualQty,
            total_used: ((dieselItem.total_used as number) ?? 0) + actualQty,
          })
          .eq('id', dieselItem.id);

        // Create inventory transaction
        await supabase.from('inventory_transactions').insert({
          item_id: dieselItem.id,
          type: 'used',
          quantity: actualQty,
          cost_per_unit: costPerUnit,
          total_cost: actualQty * costPerUnit,
          date: new Date().toISOString().split('T')[0],
          job_id: id,
          note: `Diesel for ${job.customer_name}`,
        });
      }
    }

    // Log activity
    await logActivity(
      'Job Completed',
      `Job for ${job.customer_name} completed - ${depthDrilled}ft drilled`,
      'job'
    );

    // Return updated job
    const { data: updatedJob } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single();

    const relations = await fetchJobRelations(id);
    const result = assembleJob(
      updatedJob as JobRow,
      relations.services,
      relations.customItems,
      relations.payments,
      relations.internalCosts
    );

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
