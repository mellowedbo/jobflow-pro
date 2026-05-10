import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  assembleJob,
  fetchJobRelations,
} from '@/lib/api-utils';
import type { JobRow } from '@/lib/api-utils';

// POST /api/jobs/[id]/rate — Rate a job
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { rating } = body;

    if (rating == null || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from('jobs')
      .update({ rating })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

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
