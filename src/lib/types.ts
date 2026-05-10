export type JobStatus = 'scheduled' | 'active' | 'completed' | 'billed' | 'closed';
export type CasingType = 'GI' | 'PVC';
export type PaymentStatus = 'pending' | 'partial' | 'paid';

export const PREDEFINED_SERVICES = [
  { key: 'welding', name: 'Welding', defaultRate: 500 },
  { key: 'transportation', name: 'Transportation', defaultRate: 5000 },
  { key: 'flushing', name: 'Flushing', defaultRate: 3000 },
  { key: 'filterInstallation', name: 'Filter Installation', defaultRate: 2000 },
] as const;

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
  method?: 'cash' | 'upi' | 'bank_transfer' | 'cheque';
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
  drillingRatePerFoot: number;
  casingType: CasingType;
  casingRatePerUnit: number;
  services: ServiceItem[];
  customItems: CustomItem[];
  advanceReceived: number;
  completedAt?: string;
  depthDrilled?: number;
  casingUsedUnits?: number;
  dieselCost?: number;
  soilType?: string;
  serviceQuantitiesUsed?: Record<string, number>;
  customQuantitiesUsed?: Record<string, number>;
  billingGenerated?: boolean;
  finalBillAmount?: number;
  payments: Payment[];
  totalPaid: number;
  paymentStatus: PaymentStatus;
  internalCosts: InternalCost[];
  rating?: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  openingStock: number;
  currentStock: number;
  totalPurchased: number;
  totalUsed: number;
  totalDestroyed: number;
  reorderLevel: number;
  costPerUnit: number;
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

export interface OverheadCost {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  recurring?: boolean;
}

export interface ActivityLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  type: 'job' | 'billing' | 'inventory' | 'cost' | 'system';
}

export type ViewPage = 'dashboard' | 'jobs' | 'completed' | 'billing' | 'inventory' | 'costs' | 'customers' | 'reports' | 'settings';
