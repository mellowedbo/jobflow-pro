import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth-utils';
import {
  assembleJob,
  fetchJobRelations,
  logActivity,
} from '@/lib/api-utils';
import type { JobRow } from '@/lib/api-utils';

// POST /api/jobs/[id]/cost — Add internal cost
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

    const { type, category, description, amount, date } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Cost amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Insert internal cost
    const { error: costError } = await auth.client
      .from('job_internal_costs')
      .insert({
        job_id: id,
        user_id: auth.user.id,
        type: type ?? 'misc',
        category: category ?? 'job',
        description: description ?? '',
        amount,
        date: date ?? new Date().toISOString().split('T')[0],
      });

    if (costError) {
      return NextResponse.json({ error: costError.message }, { status: 500 });
    }

    // Log activity
    await logActivity(
      auth.client,
      auth.user.id,
      'Cost Added',
      `₹${amount.toLocaleString('en-IN')} cost added to job ${id}`,
      'cost'
    );

    // Return updated job
    const { data: updatedJob } = await auth.client
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single();

    const relations = await fetchJobRelations(auth.client, id);
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
