import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  assembleJob,
  fetchJobRelations,
  logActivity,
} from '@/lib/api-utils';
import type { JobRow } from '@/lib/api-utils';

// POST /api/jobs/[id]/close — Close a job
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch job for customer name
    const { data: jobData } = await supabase
      .from('jobs')
      .select('customer_name')
      .eq('id', id)
      .single();

    const customerName = (jobData as Record<string, unknown> | null)
      ?.customer_name as string;

    const { error: updateError } = await supabase
      .from('jobs')
      .update({ status: 'closed' })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Log activity
    await logActivity(
      'Job Closed',
      `Job for ${customerName ?? id} closed`,
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
