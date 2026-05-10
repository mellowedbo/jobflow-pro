import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Job,
  ServiceItem,
  CustomItem,
  Payment,
  InternalCost,
  InventoryItem,
  InventoryTransaction,
  OverheadCost,
  ActivityLog,
} from '@/lib/types';

// ─── snake_case ↔ camelCase Conversion ───

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

export function keysToCamelCase<T extends Record<string, unknown>>(
  obj: Record<string, unknown>
): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[toCamelCase(key)] = value;
  }
  return result as T;
}

export function keysToSnakeCase<T extends Record<string, unknown>>(
  obj: Record<string, unknown>
): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[toSnakeCase(key)] = value;
  }
  return result as T;
}

export function mapArrayToCamelCase<T extends Record<string, unknown>>(
  arr: Record<string, unknown>[]
): T[] {
  return arr.map((item) => keysToCamelCase<T>(item));
}

// ─── Job Assembly Helpers ───

interface JobRow {
  id: string;
  customer_name: string;
  mobile: string;
  location: string;
  description: string | null;
  scheduled_date: string;
  notes: string | null;
  status: string;
  created_at: string;
  drilling_rate_per_foot: number;
  casing_type: string;
  casing_rate_per_unit: number;
  advance_received: number;
  completed_at: string | null;
  depth_drilled: number | null;
  casing_used_units: number | null;
  diesel_cost: number | null;
  soil_type: string | null;
  billing_generated: boolean | null;
  final_bill_amount: number | null;
  total_paid: number;
  payment_status: string;
  rating: number | null;
}

interface ServiceRow {
  id: string;
  job_id: string;
  key: string;
  name: string;
  rate: number;
  quantity: number;
  quantity_used: number | null;
}

interface CustomItemRow {
  id: string;
  job_id: string;
  name: string;
  rate: number;
  quantity: number;
  quantity_used: number | null;
}

interface PaymentRow {
  id: string;
  job_id: string;
  amount: number;
  date: string;
  method: string | null;
  note: string | null;
}

interface InternalCostRow {
  id: string;
  job_id: string;
  type: string;
  category: string;
  description: string;
  amount: number;
  date: string;
}

export type { JobRow, ServiceRow, CustomItemRow, PaymentRow, InternalCostRow };

export function assembleJob(
  jobRow: JobRow,
  services: ServiceRow[],
  customItems: CustomItemRow[],
  payments: PaymentRow[],
  internalCosts: InternalCostRow[]
): Job {
  const serviceItems: ServiceItem[] = services.map((s) => ({
    key: s.key,
    name: s.name,
    rate: s.rate,
    quantity: s.quantity,
  }));

  const serviceQuantitiesUsed: Record<string, number> = {};
  for (const s of services) {
    if (s.quantity_used != null) {
      serviceQuantitiesUsed[s.key] = s.quantity_used;
    }
  }

  const customItemResults: CustomItem[] = customItems.map((c) => ({
    id: c.id,
    name: c.name,
    rate: c.rate,
    quantity: c.quantity,
  }));

  const customQuantitiesUsed: Record<string, number> = {};
  for (const c of customItems) {
    if (c.quantity_used != null) {
      customQuantitiesUsed[c.id] = c.quantity_used;
    }
  }

  const paymentItems: Payment[] = payments.map((p) => ({
    id: p.id,
    amount: p.amount,
    date: p.date,
    method: (p.method as Payment['method']) ?? undefined,
    note: p.note ?? undefined,
  }));

  const costItems: InternalCost[] = internalCosts.map((ic) => ({
    id: ic.id,
    type: ic.type,
    category: ic.category as InternalCost['category'],
    description: ic.description,
    amount: ic.amount,
    date: ic.date,
    jobId: ic.job_id,
  }));

  return {
    id: jobRow.id,
    customerName: jobRow.customer_name,
    mobile: jobRow.mobile,
    location: jobRow.location,
    description: jobRow.description ?? undefined,
    scheduledDate: jobRow.scheduled_date,
    notes: jobRow.notes ?? undefined,
    status: jobRow.status as Job['status'],
    createdAt: jobRow.created_at,
    drillingRatePerFoot: jobRow.drilling_rate_per_foot,
    casingType: jobRow.casing_type as Job['casingType'],
    casingRatePerUnit: jobRow.casing_rate_per_unit,
    services: serviceItems,
    customItems: customItemResults,
    advanceReceived: jobRow.advance_received,
    completedAt: jobRow.completed_at ?? undefined,
    depthDrilled: jobRow.depth_drilled ?? undefined,
    casingUsedUnits: jobRow.casing_used_units ?? undefined,
    dieselCost: jobRow.diesel_cost ?? undefined,
    soilType: jobRow.soil_type ?? undefined,
    serviceQuantitiesUsed:
      Object.keys(serviceQuantitiesUsed).length > 0
        ? serviceQuantitiesUsed
        : undefined,
    customQuantitiesUsed:
      Object.keys(customQuantitiesUsed).length > 0
        ? customQuantitiesUsed
        : undefined,
    billingGenerated: jobRow.billing_generated ?? undefined,
    finalBillAmount: jobRow.final_bill_amount ?? undefined,
    payments: paymentItems,
    totalPaid: jobRow.total_paid,
    paymentStatus: jobRow.payment_status as Job['paymentStatus'],
    internalCosts: costItems,
    rating: jobRow.rating ?? undefined,
  };
}

export async function fetchJobRelations(
  client: SupabaseClient,
  jobId: string
): Promise<{
  services: ServiceRow[];
  customItems: CustomItemRow[];
  payments: PaymentRow[];
  internalCosts: InternalCostRow[];
}> {
  const [servicesRes, customItemsRes, paymentsRes, costsRes] = await Promise.all(
    [
      client.from('job_services').select('*').eq('job_id', jobId),
      client.from('job_custom_items').select('*').eq('job_id', jobId),
      client.from('job_payments').select('*').eq('job_id', jobId),
      client.from('job_internal_costs').select('*').eq('job_id', jobId),
    ]
  );

  return {
    services: (servicesRes.data ?? []) as ServiceRow[],
    customItems: (customItemsRes.data ?? []) as CustomItemRow[],
    payments: (paymentsRes.data ?? []) as PaymentRow[],
    internalCosts: (costsRes.data ?? []) as InternalCostRow[],
  };
}

export async function fetchAllJobRelations(
  client: SupabaseClient
): Promise<{
  services: ServiceRow[];
  customItems: CustomItemRow[];
  payments: PaymentRow[];
  internalCosts: InternalCostRow[];
}> {
  const [servicesRes, customItemsRes, paymentsRes, costsRes] = await Promise.all(
    [
      client.from('job_services').select('*'),
      client.from('job_custom_items').select('*'),
      client.from('job_payments').select('*'),
      client.from('job_internal_costs').select('*'),
    ]
  );

  return {
    services: (servicesRes.data ?? []) as ServiceRow[],
    customItems: (customItemsRes.data ?? []) as CustomItemRow[],
    payments: (paymentsRes.data ?? []) as PaymentRow[],
    internalCosts: (costsRes.data ?? []) as InternalCostRow[],
  };
}

export function groupByJobId<T extends { job_id: string }>(
  items: T[]
): Record<string, T[]> {
  const map: Record<string, T[]> = {};
  for (const item of items) {
    if (!map[item.job_id]) map[item.job_id] = [];
    map[item.job_id].push(item);
  }
  return map;
}

export function assembleInventoryItem(row: Record<string, unknown>): InventoryItem {
  return keysToCamelCase<InventoryItem>(row);
}

export function assembleTransaction(row: Record<string, unknown>): InventoryTransaction {
  return keysToCamelCase<InventoryTransaction>(row);
}

export function assembleOverheadCost(row: Record<string, unknown>): OverheadCost {
  return keysToCamelCase<OverheadCost>(row);
}

export function assembleActivityLog(row: Record<string, unknown>): ActivityLog {
  return keysToCamelCase<ActivityLog>(row);
}

// ─── Activity Log Helper ───

export async function logActivity(
  client: SupabaseClient,
  userId: string,
  action: string,
  details: string,
  type: ActivityLog['type']
): Promise<void> {
  await client.from('activity_log').insert({
    user_id: userId,
    action,
    details,
    type,
    timestamp: new Date().toISOString(),
  });
}

// ─── Payment Status Helper ───

export function calculatePaymentStatus(
  totalPaid: number,
  finalBillAmount?: number | null
): 'pending' | 'partial' | 'paid' {
  if (finalBillAmount && totalPaid >= finalBillAmount) return 'paid';
  if (totalPaid > 0) return 'partial';
  return 'pending';
}
