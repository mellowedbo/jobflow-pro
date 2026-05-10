import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth-utils';
import {
  assembleJob,
  fetchJobRelations,
  keysToSnakeCase,
  logActivity,
} from '@/lib/api-utils';
import type { JobRow } from '@/lib/api-utils';

// GET /api/jobs/[id] — Single job with all relations
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const { data: job, error } = await auth.client
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const relations = await fetchJobRelations(auth.client, id);
    const result = assembleJob(
      job as JobRow,
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

// PATCH /api/jobs/[id] — Update job
export async function PATCH(
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

    // Convert camelCase body to snake_case for DB
    const snakeBody = keysToSnakeCase(body);

    // Remove fields that shouldn't be updated directly
    delete snakeBody.id;
    delete snakeBody.created_at;
    delete snakeBody.user_id;

    const { data, error } = await auth.client
      .from('jobs')
      .update(snakeBody)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Handle services and custom items update if provided
    if (body.services !== undefined) {
      // Delete existing services and re-insert
      await auth.client.from('job_services').delete().eq('job_id', id);
      if (body.services && body.services.length > 0) {
        const serviceRows = body.services.map(
          (s: { key: string; name: string; rate: number; quantity: number }) => ({
            job_id: id,
            user_id: auth.user.id,
            key: s.key,
            name: s.name,
            rate: s.rate,
            quantity: s.quantity,
            quantity_used: null,
          })
        );
        await auth.client.from('job_services').insert(serviceRows);
      }
    }

    if (body.customItems !== undefined) {
      // Delete existing custom items and re-insert
      await auth.client.from('job_custom_items').delete().eq('job_id', id);
      if (body.customItems && body.customItems.length > 0) {
        const customRows = body.customItems.map(
          (c: { name: string; rate: number; quantity: number }) => ({
            job_id: id,
            user_id: auth.user.id,
            name: c.name,
            rate: c.rate,
            quantity: c.quantity,
            quantity_used: null,
          })
        );
        await auth.client.from('job_custom_items').insert(customRows);
      }
    }

    // Return the updated job with relations
    const relations = await fetchJobRelations(auth.client, id);
    const result = assembleJob(
      data as JobRow,
      relations.services,
      relations.customItems,
      relations.payments,
      relations.internalCosts
    );

    await logActivity(auth.client, auth.user.id, 'Job Updated', `Job ${id} updated`, 'job');

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/jobs/[id] — Delete job
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Delete related records first
    await Promise.all([
      auth.client.from('job_services').delete().eq('job_id', id),
      auth.client.from('job_custom_items').delete().eq('job_id', id),
      auth.client.from('job_payments').delete().eq('job_id', id),
      auth.client.from('job_internal_costs').delete().eq('job_id', id),
    ]);

    const { error } = await auth.client.from('jobs').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logActivity(auth.client, auth.user.id, 'Job Deleted', `Job ${id} deleted`, 'job');

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
