import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth-utils';
import {
  assembleJob,
  fetchJobRelations,
  logActivity,
  calculatePaymentStatus,
} from '@/lib/api-utils';
import type { JobRow, PaymentRow } from '@/lib/api-utils';

// POST /api/jobs/[id]/payment — Add payment, update total_paid and payment_status
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

    const { amount, date, method, note } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Payment amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Insert payment record
    const { error: paymentError } = await auth.client
      .from('job_payments')
      .insert({
        job_id: id,
        user_id: auth.user.id,
        amount,
        date: date ?? new Date().toISOString().split('T')[0],
        method: method ?? null,
        note: note ?? null,
      });

    if (paymentError) {
      return NextResponse.json({ error: paymentError.message }, { status: 500 });
    }

    // Recalculate total_paid from all payments
    const { data: allPayments } = await auth.client
      .from('job_payments')
      .select('amount')
      .eq('job_id', id);

    const totalPaid = (allPayments as PaymentRow[] ?? []).reduce(
      (sum, p) => sum + p.amount,
      0
    );

    // Fetch current job for final_bill_amount
    const { data: jobData } = await auth.client
      .from('jobs')
      .select('final_bill_amount, customer_name')
      .eq('id', id)
      .single();

    const finalBillAmount = (jobData as Record<string, unknown> | null)
      ?.final_bill_amount as number | null;
    const customerName = (jobData as Record<string, unknown> | null)
      ?.customer_name as string;

    const paymentStatus = calculatePaymentStatus(totalPaid, finalBillAmount);

    // Update job with new total_paid and payment_status
    const { error: updateError } = await auth.client
      .from('jobs')
      .update({
        total_paid: totalPaid,
        payment_status: paymentStatus,
      })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Log activity
    await logActivity(
      auth.client,
      auth.user.id,
      'Payment Received',
      `₹${amount.toLocaleString('en-IN')} received from ${customerName ?? id}`,
      'billing'
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
