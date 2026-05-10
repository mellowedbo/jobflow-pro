import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth-utils';
import {
  assembleJob,
  fetchAllJobRelations,
  groupByJobId,
  logActivity,
} from '@/lib/api-utils';
import type { JobRow, ServiceRow, CustomItemRow, PaymentRow, InternalCostRow } from '@/lib/api-utils';

// GET /api/jobs — List all jobs with services/custom items/payments/costs
export async function GET(request: Request) {
  try {
    const auth = await getUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: jobs, error: jobsError } = await auth.client
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });

    if (jobsError) {
      return NextResponse.json({ error: jobsError.message }, { status: 500 });
    }

    const jobRows = (jobs ?? []) as JobRow[];
    if (jobRows.length === 0) {
      return NextResponse.json([]);
    }

    const relations = await fetchAllJobRelations(auth.client);

    const servicesByJob = groupByJobId<ServiceRow>(relations.services);
    const customItemsByJob = groupByJobId<CustomItemRow>(relations.customItems);
    const paymentsByJob = groupByJobId<PaymentRow>(relations.payments);
    const costsByJob = groupByJobId<InternalCostRow>(relations.internalCosts);

    const result: ReturnType<typeof assembleJob>[] = jobRows.map((job) =>
      assembleJob(
        job,
        servicesByJob[job.id] ?? [],
        customItemsByJob[job.id] ?? [],
        paymentsByJob[job.id] ?? [],
        costsByJob[job.id] ?? []
      )
    );

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/jobs — Create a job with services and custom items
export async function POST(request: Request) {
  try {
    const auth = await getUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const {
      services: serviceItems,
      customItems: customItemInputs,
      advanceReceived,
      ...jobFields
    } = body;

    // Determine initial payment status
    const advance = advanceReceived ?? 0;
    const paymentStatus = advance > 0 ? 'partial' : 'pending';

    // Build job row (snake_case)
    const jobRow: Record<string, unknown> = {
      user_id: auth.user.id,
      customer_name: jobFields.customerName,
      mobile: jobFields.mobile,
      location: jobFields.location,
      description: jobFields.description ?? null,
      scheduled_date: jobFields.scheduledDate,
      notes: jobFields.notes ?? null,
      status: 'scheduled',
      drilling_rate_per_foot: jobFields.drillingRatePerFoot,
      casing_type: jobFields.casingType,
      casing_rate_per_unit: jobFields.casingRatePerUnit,
      advance_received: advance,
      total_paid: advance,
      payment_status: paymentStatus,
      rating: null,
    };

    const { data: jobData, error: jobError } = await auth.client
      .from('jobs')
      .insert(jobRow)
      .select()
      .single();

    if (jobError) {
      return NextResponse.json({ error: jobError.message }, { status: 500 });
    }

    const jobId = (jobData as JobRow).id;

    // Insert services
    if (serviceItems && serviceItems.length > 0) {
      const serviceRows = serviceItems.map(
        (s: { key: string; name: string; rate: number; quantity: number }) => ({
          job_id: jobId,
          user_id: auth.user.id,
          key: s.key,
          name: s.name,
          rate: s.rate,
          quantity: s.quantity,
          quantity_used: null,
        })
      );
      const { error: svcError } = await auth.client
        .from('job_services')
        .insert(serviceRows);
      if (svcError) {
        return NextResponse.json({ error: svcError.message }, { status: 500 });
      }
    }

    // Insert custom items
    if (customItemInputs && customItemInputs.length > 0) {
      const customRows = customItemInputs.map(
        (c: { name: string; rate: number; quantity: number }) => ({
          job_id: jobId,
          user_id: auth.user.id,
          name: c.name,
          rate: c.rate,
          quantity: c.quantity,
          quantity_used: null,
        })
      );
      const { error: ciError } = await auth.client
        .from('job_custom_items')
        .insert(customRows);
      if (ciError) {
        return NextResponse.json({ error: ciError.message }, { status: 500 });
      }
    }

    // If advance received, create a payment record
    if (advance > 0) {
      const { error: payError } = await auth.client.from('job_payments').insert({
        job_id: jobId,
        user_id: auth.user.id,
        amount: advance,
        date: new Date().toISOString().split('T')[0],
        method: 'cash',
        note: 'Advance payment',
      });
      if (payError) {
        return NextResponse.json({ error: payError.message }, { status: 500 });
      }
    }

    // Log activity
    await logActivity(
      auth.client,
      auth.user.id,
      'Job Created',
      `New job for ${jobFields.customerName} at ${jobFields.location}`,
      'job'
    );

    // Fetch the complete job with relations
    const { data: fullJob, error: fetchError } = await auth.client
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const { fetchJobRelations } = await import('@/lib/api-utils');
    const relations = await fetchJobRelations(auth.client, jobId);
    const result = assembleJob(
      fullJob as JobRow,
      relations.services,
      relations.customItems,
      relations.payments,
      relations.internalCosts
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
