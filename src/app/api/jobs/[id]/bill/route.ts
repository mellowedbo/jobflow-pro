import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  assembleJob,
  fetchJobRelations,
  logActivity,
} from '@/lib/api-utils';
import type { JobRow } from '@/lib/api-utils';

// POST /api/jobs/[id]/bill — Generate bill
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch job with relations
    const { data: jobData, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single();

    if (jobError || !jobData) {
      return NextResponse.json(
        { error: jobError?.message ?? 'Job not found' },
        { status: 404 }
      );
    }

    const job = jobData as JobRow;
    const relations = await fetchJobRelations(id);

    // Calculate bill
    const drillingCost =
      (job.depth_drilled ?? 0) * job.drilling_rate_per_foot;
    const casingCost =
      (job.casing_used_units ?? 0) * job.casing_rate_per_unit;

    // Services cost
    let servicesCost = 0;
    for (const svc of relations.services) {
      const qty = svc.quantity_used ?? svc.quantity;
      servicesCost += svc.rate * qty;
    }

    // Custom items cost
    let customItemsCost = 0;
    for (const ci of relations.customItems) {
      const qty = ci.quantity_used ?? ci.quantity;
      customItemsCost += ci.rate * qty;
    }

    const dieselCost = job.diesel_cost ?? 0;

    const finalBillAmount =
      drillingCost + casingCost + servicesCost + customItemsCost + dieselCost;

    // Update job
    const { error: updateError } = await supabase
      .from('jobs')
      .update({
        billing_generated: true,
        final_bill_amount: finalBillAmount,
        status: 'billed',
      })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Recalculate payment status
    const totalPaid = job.total_paid;
    const paymentStatus =
      totalPaid >= finalBillAmount
        ? 'paid'
        : totalPaid > 0
          ? 'partial'
          : 'pending';

    await supabase
      .from('jobs')
      .update({ payment_status: paymentStatus })
      .eq('id', id);

    // Log activity
    await logActivity(
      'Bill Generated',
      `Bill ₹${finalBillAmount.toLocaleString('en-IN')} generated for ${job.customer_name}`,
      'billing'
    );

    // Return updated job
    const { data: updatedJob } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single();

    const freshRelations = await fetchJobRelations(id);
    const result = assembleJob(
      updatedJob as JobRow,
      freshRelations.services,
      freshRelations.customItems,
      freshRelations.payments,
      freshRelations.internalCosts
    );

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
