export type JobStatus = 'scheduled' | 'active' | 'completed' | 'billed' | 'closed';
export type CasingType = 'GI' | 'PVC';
export type PaymentStatus = 'pending' | 'partial' | 'paid';

// Predefined service types
export const PREDEFINED_SERVICES = [
  { key: 'welding', name: 'Welding', defaultRate: 500 },
  { key: 'transportation', name: 'Transportation', defaultRate: 5000 },
  { key: 'flushing', name: 'Flushing', defaultRate: 3000 },
  { key: 'filterInstallation', name: 'Filter Installation', defaultRate: 2000 },
] as const;

export type PredefinedServiceKey = typeof PREDEFINED_SERVICES[number]['key'];

export interface ServiceItem {
  key: string;
  name: string;
  rate: number;
  quantity: number;
}

export interface CustomItem {
  id: string;
  name: string;
  rate: number;
  quantity: number;
}

export interface Payment {
  id: string;
  amount: number;
  date: string;
  note?: string;
}

export interface Job {
  id: string;
  customerName: string;
  mobile: string;
  location: string;
  description?: string;
  scheduledDate: string;
  notes?: string;
  status: JobStatus;
  createdAt: string;

  // Quotation — rates per unit
  drillingRatePerFoot: number;
  casingType: CasingType;
  casingRatePerUnit: number;
  services: ServiceItem[];
  customItems: CustomItem[];

  // Advance
  advanceReceived: number;

  // Completion details
  completedAt?: string;
  depthDrilled?: number;
  casingUsedUnits?: number;
  dieselCost?: number;
  soilType?: string;

  // Service quantities used (filled at completion/billing)
  serviceQuantitiesUsed?: Record<string, number>;
  customQuantitiesUsed?: Record<string, number>;

  // Billing
  billingGenerated?: boolean;
  finalBillAmount?: number;
  payments: Payment[];
  totalPaid: number;
  paymentStatus: PaymentStatus;

  // Costs & Profit
  internalCosts: InternalCost[];

  // Rating
  rating?: number;
}

export interface InternalCost {
  id: string;
  type: string;
  category: 'job' | 'overhead' | 'misc';
  description: string;
  amount: number;
  date: string;
  jobId?: string;
}

// Inventory accounting
export interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  openingStock: number;
  currentStock: number;
  totalPurchased: number;
  totalUsed: number;
  totalDestroyed: number;
}

export interface InventoryTransaction {
  id: string;
  itemId: string;
  type: 'purchase' | 'used' | 'destroyed';
  quantity: number;
  costPerUnit: number;
  totalCost: number;
  date: string;
  supplier?: string;
  jobId?: string;
  note?: string;
}

export interface InventoryState {
  items: InventoryItem[];
  transactions: InventoryTransaction[];
}

// Overhead costs (not linked to a job)
export interface OverheadCost {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
}
