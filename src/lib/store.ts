import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Job,
  JobStatus,
  InventoryItem,
  InventoryTransaction,
  OverheadCost,
  ActivityLog,
  ViewPage,
  ServiceItem,
  CustomItem,
  Payment,
  InternalCost,
  CasingType,
  PaymentStatus,
} from './types';

interface AppState {
  // Navigation
  currentView: ViewPage;
  setCurrentView: (view: ViewPage) => void;

  // Jobs
  jobs: Job[];
  jobCounter: number;
  addJob: (job: Omit<Job, 'id' | 'createdAt' | 'status' | 'completedAt' | 'depthDrilled' | 'casingUsedUnits' | 'dieselCost' | 'soilType' | 'serviceQuantitiesUsed' | 'customQuantitiesUsed' | 'billingGenerated' | 'finalBillAmount' | 'payments' | 'totalPaid' | 'paymentStatus' | 'internalCosts' | 'rating'>) => void;
  updateJob: (id: string, updates: Partial<Job>) => void;
  startJob: (id: string) => void;
  completeJob: (id: string, data: {
    depthDrilled: number;
    casingUsedUnits: number;
    dieselCost: number;
    soilType: string;
    serviceQuantitiesUsed: Record<string, number>;
    customQuantitiesUsed: Record<string, number>;
  }) => void;
  generateBill: (id: string, finalBillAmount: number) => void;
  addPayment: (jobId: string, payment: Omit<Payment, 'id'>) => void;
  addJobCost: (jobId: string, cost: Omit<InternalCost, 'id'>) => void;
  rateJob: (jobId: string, rating: number) => void;
  closeJob: (id: string) => void;

  // Inventory
  inventoryItems: InventoryItem[];
  inventoryTransactions: InventoryTransaction[];
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'currentStock' | 'totalPurchased' | 'totalUsed' | 'totalDestroyed'>) => void;
  addPurchase: (itemId: string, quantity: number, costPerUnit: number, supplier?: string, note?: string) => void;
  useInventoryItem: (itemId: string, quantity: number, jobId?: string, note?: string) => void;
  destroyInventoryItem: (itemId: string, quantity: number, note?: string) => void;

  // Overhead Costs
  overheadCosts: OverheadCost[];
  addOverheadCost: (cost: Omit<OverheadCost, 'id'>) => void;

  // Activity Log
  activityLog: ActivityLog[];
  addActivity: (action: string, details: string, type: ActivityLog['type']) => void;

  // Helpers
  getJobById: (id: string) => Job | undefined;
  getInventoryItemByName: (pattern: string) => InventoryItem | undefined;
}

const generateId = () => Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
const today = new Date().toISOString().split('T')[0];

// Demo data
const demoInventoryItems: InventoryItem[] = [
  {
    id: 'inv-gi',
    name: 'GI Casing',
    unit: 'feet',
    openingStock: 500,
    currentStock: 320,
    totalPurchased: 200,
    totalUsed: 350,
    totalDestroyed: 30,
    reorderLevel: 100,
    costPerUnit: 180,
  },
  {
    id: 'inv-pvc',
    name: 'PVC Casing',
    unit: 'feet',
    openingStock: 400,
    currentStock: 280,
    totalPurchased: 100,
    totalUsed: 200,
    totalDestroyed: 20,
    reorderLevel: 80,
    costPerUnit: 120,
  },
  {
    id: 'inv-diesel',
    name: 'Diesel',
    unit: 'litres',
    openingStock: 2000,
    currentStock: 1200,
    totalPurchased: 1500,
    totalUsed: 2100,
    totalDestroyed: 200,
    reorderLevel: 500,
    costPerUnit: 89,
  },
];

const demoInventoryTransactions: InventoryTransaction[] = [
  { id: 'tx-1', itemId: 'inv-gi', type: 'purchase', quantity: 200, costPerUnit: 180, totalCost: 36000, date: '2025-01-15', supplier: 'Steel India Corp' },
  { id: 'tx-2', itemId: 'inv-gi', type: 'used', quantity: 350, costPerUnit: 180, totalCost: 63000, date: '2025-02-10', jobId: 'job-1' },
  { id: 'tx-3', itemId: 'inv-gi', type: 'destroyed', quantity: 30, costPerUnit: 180, totalCost: 5400, date: '2025-02-12', note: 'Damaged during transport' },
  { id: 'tx-4', itemId: 'inv-pvc', type: 'purchase', quantity: 100, costPerUnit: 120, totalCost: 12000, date: '2025-01-20', supplier: 'PlastiTubes Ltd' },
  { id: 'tx-5', itemId: 'inv-pvc', type: 'used', quantity: 200, costPerUnit: 120, totalCost: 24000, date: '2025-02-15', jobId: 'job-2' },
  { id: 'tx-6', itemId: 'inv-pvc', type: 'destroyed', quantity: 20, costPerUnit: 120, totalCost: 2400, date: '2025-03-01', note: 'Cracked casing' },
  { id: 'tx-7', itemId: 'inv-diesel', type: 'purchase', quantity: 1500, costPerUnit: 89, totalCost: 133500, date: '2025-01-10', supplier: 'Indian Oil Depot' },
  { id: 'tx-8', itemId: 'inv-diesel', type: 'used', quantity: 2100, costPerUnit: 89, totalCost: 186900, date: '2025-02-20' },
  { id: 'tx-9', itemId: 'inv-diesel', type: 'destroyed', quantity: 200, costPerUnit: 89, totalCost: 17800, date: '2025-03-05', note: 'Contaminated fuel' },
];

const demoServices: ServiceItem[] = [
  { key: 'welding', name: 'Welding', rate: 500, quantity: 1 },
  { key: 'transportation', name: 'Transportation', rate: 5000, quantity: 1 },
  { key: 'flushing', name: 'Flushing', rate: 3000, quantity: 1 },
];

const demoJobs: Job[] = [
  {
    id: 'job-1',
    customerName: 'Rajesh Kumar',
    mobile: '9876543210',
    location: 'Sector 23, Gurugram, Haryana',
    description: 'Borewell for residential building - 6 inch bore',
    scheduledDate: '2025-02-01',
    notes: 'Customer needs deep bore, hard rock expected at 80ft',
    status: 'closed',
    createdAt: '2025-01-28T10:00:00Z',
    drillingRatePerFoot: 350,
    casingType: 'GI',
    casingRatePerUnit: 450,
    services: demoServices,
    customItems: [{ id: 'ci-1', name: 'Motor Installation', rate: 15000, quantity: 1 }],
    advanceReceived: 50000,
    completedAt: '2025-02-05',
    depthDrilled: 180,
    casingUsedUnits: 180,
    dieselCost: 18000,
    soilType: 'Rocky',
    serviceQuantitiesUsed: { welding: 8, transportation: 1, flushing: 2 },
    customQuantitiesUsed: { 'ci-1': 1 },
    billingGenerated: true,
    finalBillAmount: 155400,
    payments: [
      { id: 'pay-1', amount: 50000, date: '2025-01-30', method: 'upi', note: 'Advance' },
      { id: 'pay-2', amount: 60000, date: '2025-02-06', method: 'bank_transfer', note: 'After completion' },
      { id: 'pay-3', amount: 45400, date: '2025-02-20', method: 'cash', note: 'Final settlement' },
    ],
    totalPaid: 155400,
    paymentStatus: 'paid',
    internalCosts: [
      { id: 'ic-1', type: 'diesel', category: 'job', description: 'Diesel for drilling', amount: 18000, date: '2025-02-05', jobId: 'job-1' },
      { id: 'ic-2', type: 'labour', category: 'job', description: 'Labour charges', amount: 12000, date: '2025-02-05', jobId: 'job-1' },
    ],
    rating: 5,
  },
  {
    id: 'job-2',
    customerName: 'Sunita Sharma',
    mobile: '9123456780',
    location: 'DLF Phase 3, Gurugram, Haryana',
    description: 'Agricultural borewell - 8 inch bore for irrigation',
    scheduledDate: '2025-02-15',
    notes: 'Agricultural land, need high yield',
    status: 'billed',
    createdAt: '2025-02-10T09:00:00Z',
    drillingRatePerFoot: 400,
    casingType: 'PVC',
    casingRatePerUnit: 350,
    services: [...demoServices, { key: 'filterInstallation', name: 'Filter Installation', rate: 2000, quantity: 1 }],
    customItems: [],
    advanceReceived: 30000,
    completedAt: '2025-02-20',
    depthDrilled: 220,
    casingUsedUnits: 200,
    dieselCost: 22000,
    soilType: 'Mixed (Clay + Rock)',
    serviceQuantitiesUsed: { welding: 6, transportation: 1, flushing: 3, filterInstallation: 2 },
    customQuantitiesUsed: {},
    billingGenerated: true,
    finalBillAmount: 172000,
    payments: [
      { id: 'pay-4', amount: 30000, date: '2025-02-12', method: 'upi', note: 'Advance' },
      { id: 'pay-5', amount: 70000, date: '2025-02-22', method: 'bank_transfer', note: 'Partial payment' },
    ],
    totalPaid: 100000,
    paymentStatus: 'partial',
    internalCosts: [
      { id: 'ic-3', type: 'diesel', category: 'job', description: 'Diesel for drilling', amount: 22000, date: '2025-02-20', jobId: 'job-2' },
      { id: 'ic-4', type: 'labour', category: 'job', description: 'Labour charges', amount: 15000, date: '2025-02-20', jobId: 'job-2' },
    ],
    rating: 4,
  },
  {
    id: 'job-3',
    customerName: 'Mohammed Irfan',
    mobile: '9988776655',
    location: 'Rohini Sector 7, Delhi',
    description: 'Residential borewell replacement',
    scheduledDate: '2025-03-01',
    notes: 'Old bore collapsed, need replacement',
    status: 'completed',
    createdAt: '2025-02-25T11:00:00Z',
    drillingRatePerFoot: 380,
    casingType: 'GI',
    casingRatePerUnit: 450,
    services: demoServices,
    customItems: [{ id: 'ci-2', name: 'Old Bore Sealing', rate: 8000, quantity: 1 }],
    advanceReceived: 40000,
    completedAt: '2025-03-04',
    depthDrilled: 150,
    casingUsedUnits: 150,
    dieselCost: 15000,
    soilType: 'Sandy',
    serviceQuantitiesUsed: { welding: 5, transportation: 1, flushing: 1 },
    customQuantitiesUsed: { 'ci-2': 1 },
    billingGenerated: false,
    payments: [
      { id: 'pay-6', amount: 40000, date: '2025-02-28', method: 'cash', note: 'Advance' },
    ],
    totalPaid: 40000,
    paymentStatus: 'pending',
    internalCosts: [
      { id: 'ic-5', type: 'diesel', category: 'job', description: 'Diesel cost', amount: 15000, date: '2025-03-04', jobId: 'job-3' },
    ],
    rating: 0,
  },
  {
    id: 'job-4',
    customerName: 'Priya Verma',
    mobile: '9871234560',
    location: 'Sohna Road, Haryana',
    description: 'New borewell for farmhouse',
    scheduledDate: '2025-03-10',
    notes: 'Farmhouse construction, need water supply urgently',
    status: 'active',
    createdAt: '2025-03-05T08:00:00Z',
    drillingRatePerFoot: 350,
    casingType: 'GI',
    casingRatePerUnit: 450,
    services: demoServices,
    customItems: [],
    advanceReceived: 25000,
    payments: [
      { id: 'pay-7', amount: 25000, date: '2025-03-06', method: 'upi', note: 'Advance' },
    ],
    totalPaid: 25000,
    paymentStatus: 'pending',
    internalCosts: [],
  },
  {
    id: 'job-5',
    customerName: 'Anand Patel',
    mobile: '9765432100',
    location: 'Manesar, Haryana',
    description: 'Industrial borewell for factory',
    scheduledDate: '2025-03-15',
    notes: 'Large factory complex, need high capacity bore',
    status: 'scheduled',
    createdAt: '2025-03-08T14:00:00Z',
    drillingRatePerFoot: 450,
    casingType: 'GI',
    casingRatePerUnit: 500,
    services: [...demoServices, { key: 'filterInstallation', name: 'Filter Installation', rate: 2000, quantity: 1 }],
    customItems: [{ id: 'ci-3', name: 'Pump Installation', rate: 25000, quantity: 1 }],
    advanceReceived: 60000,
    payments: [
      { id: 'pay-8', amount: 60000, date: '2025-03-09', method: 'bank_transfer', note: 'Advance' },
    ],
    totalPaid: 60000,
    paymentStatus: 'pending',
    internalCosts: [],
  },
  {
    id: 'job-6',
    customerName: 'Kavita Rani',
    mobile: '9654321098',
    location: 'Faridabad, Haryana',
    description: 'Residential borewell - 5 inch bore',
    scheduledDate: '2025-03-18',
    notes: 'Small residential plot, budget constraint',
    status: 'scheduled',
    createdAt: '2025-03-12T10:00:00Z',
    drillingRatePerFoot: 300,
    casingType: 'PVC',
    casingRatePerUnit: 300,
    services: [{ key: 'welding', name: 'Welding', rate: 500, quantity: 1 }, { key: 'transportation', name: 'Transportation', rate: 5000, quantity: 1 }],
    customItems: [],
    advanceReceived: 20000,
    payments: [
      { id: 'pay-9', amount: 20000, date: '2025-03-13', method: 'cash', note: 'Advance' },
    ],
    totalPaid: 20000,
    paymentStatus: 'pending',
    internalCosts: [],
  },
];

const demoOverheadCosts: OverheadCost[] = [
  { id: 'oh-1', category: 'Rent', description: 'Office/yard rent for February', amount: 25000, date: '2025-02-01', recurring: true },
  { id: 'oh-2', category: 'Rent', description: 'Office/yard rent for March', amount: 25000, date: '2025-03-01', recurring: true },
  { id: 'oh-3', category: 'Maintenance', description: 'Drilling rig maintenance', amount: 18000, date: '2025-02-15', recurring: false },
  { id: 'oh-4', category: 'Insurance', description: 'Equipment insurance premium', amount: 12000, date: '2025-01-15', recurring: true },
  { id: 'oh-5', category: 'Utilities', description: 'Electricity and water bills', amount: 8000, date: '2025-02-28', recurring: true },
  { id: 'oh-6', category: 'Transport', description: 'Vehicle maintenance and fuel', amount: 15000, date: '2025-03-05', recurring: false },
  { id: 'oh-7', category: 'Salary', description: 'Staff salaries - February', amount: 60000, date: '2025-02-28', recurring: true },
  { id: 'oh-8', category: 'Salary', description: 'Staff salaries - March', amount: 60000, date: '2025-03-28', recurring: true },
];

const demoActivityLog: ActivityLog[] = [
  { id: 'al-1', action: 'Job Created', details: 'New job for Kavita Rani at Faridabad', timestamp: '2025-03-12T10:00:00Z', type: 'job' },
  { id: 'al-2', action: 'Job Started', details: 'Job #4 for Priya Verma started at Sohna Road', timestamp: '2025-03-10T08:00:00Z', type: 'job' },
  { id: 'al-3', action: 'Payment Received', details: '₹25,000 advance from Priya Verma via UPI', timestamp: '2025-03-06T09:00:00Z', type: 'billing' },
  { id: 'al-4', action: 'Job Completed', details: 'Job #3 for Mohammed Irfan completed - 150ft drilled', timestamp: '2025-03-04T17:00:00Z', type: 'job' },
  { id: 'al-5', action: 'Inventory Purchase', details: '200ft GI Casing purchased from Steel India Corp', timestamp: '2025-01-15T11:00:00Z', type: 'inventory' },
  { id: 'al-6', action: 'Bill Generated', details: 'Bill ₹1,72,000 generated for Sunita Sharma', timestamp: '2025-02-21T10:00:00Z', type: 'billing' },
  { id: 'al-7', action: 'Overhead Cost', details: '₹18,000 rig maintenance recorded', timestamp: '2025-02-15T14:00:00Z', type: 'cost' },
];

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Navigation
      currentView: 'dashboard',
      setCurrentView: (view) => set({ currentView: view }),

      // Jobs
      jobs: demoJobs,
      jobCounter: 7,

      addJob: (jobData) => {
        const state = get();
        const newJob: Job = {
          ...jobData,
          id: `job-${state.jobCounter}`,
          createdAt: new Date().toISOString(),
          status: 'scheduled' as JobStatus,
          payments: [],
          totalPaid: jobData.advanceReceived || 0,
          paymentStatus: (jobData.advanceReceived || 0) > 0 ? 'partial' as PaymentStatus : 'pending' as PaymentStatus,
          internalCosts: [],
        };
        if (newJob.advanceReceived > 0) {
          newJob.payments = [{
            id: generateId(),
            amount: newJob.advanceReceived,
            date: today,
            method: 'cash',
            note: 'Advance payment',
          }];
        }
        set((s) => ({
          jobs: [...s.jobs, newJob],
          jobCounter: s.jobCounter + 1,
        }));
        get().addActivity('Job Created', `New job for ${jobData.customerName} at ${jobData.location}`, 'job');
      },

      updateJob: (id, updates) => {
        set((s) => ({
          jobs: s.jobs.map((j) => (j.id === id ? { ...j, ...updates } : j)),
        }));
      },

      startJob: (id) => {
        set((s) => ({
          jobs: s.jobs.map((j) => (j.id === id ? { ...j, status: 'active' as JobStatus } : j)),
        }));
        const job = get().jobs.find((j) => j.id === id);
        get().addActivity('Job Started', `Job for ${job?.customerName} started`, 'job');
      },

      completeJob: (id, data) => {
        const state = get();
        const job = state.jobs.find((j) => j.id === id);
        if (!job) return;

        // Deduct inventory items based on casing type and depth
        const casingItem = state.getInventoryItemByName(
          job.casingType === 'GI' ? 'GI Casing' : 'PVC Casing'
        );
        const dieselItem = state.getInventoryItemByName('Diesel');

        const updatedJobs = state.jobs.map((j) => {
          if (j.id !== id) return j;
          return {
            ...j,
            status: 'completed' as JobStatus,
            completedAt: today,
            ...data,
          };
        });

        // Process inventory deductions
        const updatedItems = [...state.inventoryItems];
        const newTransactions: InventoryTransaction[] = [];

        if (casingItem && data.casingUsedUnits > 0) {
          const actualQty = Math.min(data.casingUsedUnits, casingItem.currentStock);
          if (actualQty > 0) {
            const idx = updatedItems.findIndex((i) => i.id === casingItem.id);
            if (idx !== -1) {
              updatedItems[idx] = {
                ...updatedItems[idx],
                currentStock: updatedItems[idx].currentStock - actualQty,
                totalUsed: updatedItems[idx].totalUsed + actualQty,
              };
              newTransactions.push({
                id: generateId(),
                itemId: casingItem.id,
                type: 'used',
                quantity: actualQty,
                costPerUnit: casingItem.costPerUnit,
                totalCost: actualQty * casingItem.costPerUnit,
                date: today,
                jobId: id,
                note: `Casing used for ${job.customerName}`,
              });
            }
          }
        }

        if (dieselItem && data.dieselCost > 0) {
          const litresUsed = Math.round(data.dieselCost / dieselItem.costPerUnit);
          const actualQty = Math.min(litresUsed, dieselItem.currentStock);
          if (actualQty > 0) {
            const idx = updatedItems.findIndex((i) => i.id === dieselItem.id);
            if (idx !== -1) {
              updatedItems[idx] = {
                ...updatedItems[idx],
                currentStock: updatedItems[idx].currentStock - actualQty,
                totalUsed: updatedItems[idx].totalUsed + actualQty,
              };
              newTransactions.push({
                id: generateId(),
                itemId: dieselItem.id,
                type: 'used',
                quantity: actualQty,
                costPerUnit: dieselItem.costPerUnit,
                totalCost: actualQty * dieselItem.costPerUnit,
                date: today,
                jobId: id,
                note: `Diesel for ${job.customerName}`,
              });
            }
          }
        }

        set({
          jobs: updatedJobs,
          inventoryItems: updatedItems,
          inventoryTransactions: [...state.inventoryTransactions, ...newTransactions],
        });
        get().addActivity('Job Completed', `Job for ${job.customerName} completed - ${data.depthDrilled}ft drilled`, 'job');
      },

      generateBill: (id, finalBillAmount) => {
        set((s) => ({
          jobs: s.jobs.map((j) =>
            j.id === id
              ? {
                  ...j,
                  billingGenerated: true,
                  finalBillAmount,
                  status: 'billed' as JobStatus,
                }
              : j
          ),
        }));
        const job = get().jobs.find((j) => j.id === id);
        get().addActivity('Bill Generated', `Bill ₹${finalBillAmount.toLocaleString('en-IN')} generated for ${job?.customerName}`, 'billing');
      },

      addPayment: (jobId, payment) => {
        const newPayment: Payment = { ...payment, id: generateId() };
        set((s) => ({
          jobs: s.jobs.map((j) => {
            if (j.id !== jobId) return j;
            const payments = [...j.payments, newPayment];
            const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
            const paymentStatus: PaymentStatus =
              j.finalBillAmount && totalPaid >= j.finalBillAmount
                ? 'paid'
                : totalPaid > 0
                  ? 'partial'
                  : 'pending';
            return { ...j, payments, totalPaid, paymentStatus };
          }),
        }));
        const job = get().jobs.find((j) => j.id === jobId);
        get().addActivity('Payment Received', `₹${payment.amount.toLocaleString('en-IN')} received from ${job?.customerName}`, 'billing');
      },

      addJobCost: (jobId, cost) => {
        const newCost: InternalCost = { ...cost, id: generateId(), jobId };
        set((s) => ({
          jobs: s.jobs.map((j) =>
            j.id === jobId ? { ...j, internalCosts: [...j.internalCosts, newCost] } : j
          ),
        }));
        get().addActivity('Cost Added', `₹${cost.amount.toLocaleString('en-IN')} cost added to job ${jobId}`, 'cost');
      },

      rateJob: (jobId, rating) => {
        set((s) => ({
          jobs: s.jobs.map((j) => (j.id === jobId ? { ...j, rating } : j)),
        }));
      },

      closeJob: (id) => {
        set((s) => ({
          jobs: s.jobs.map((j) =>
            j.id === id ? { ...j, status: 'closed' as JobStatus } : j
          ),
        }));
        const job = get().jobs.find((j) => j.id === id);
        get().addActivity('Job Closed', `Job for ${job?.customerName} closed`, 'job');
      },

      // Inventory
      inventoryItems: demoInventoryItems,
      inventoryTransactions: demoInventoryTransactions,

      addInventoryItem: (item) => {
        const newItem: InventoryItem = {
          ...item,
          id: `inv-${generateId()}`,
          currentStock: item.openingStock,
          totalPurchased: 0,
          totalUsed: 0,
          totalDestroyed: 0,
        };
        set((s) => ({ inventoryItems: [...s.inventoryItems, newItem] }));
        get().addActivity('Inventory Added', `${item.name} added to inventory`, 'inventory');
      },

      addPurchase: (itemId, quantity, costPerUnit, supplier, note) => {
        const state = get();
        const item = state.inventoryItems.find((i) => i.id === itemId);
        if (!item) return;

        const transaction: InventoryTransaction = {
          id: generateId(),
          itemId,
          type: 'purchase',
          quantity,
          costPerUnit,
          totalCost: quantity * costPerUnit,
          date: today,
          supplier,
          note,
        };

        set((s) => ({
          inventoryItems: s.inventoryItems.map((i) =>
            i.id === itemId
              ? {
                  ...i,
                  currentStock: i.currentStock + quantity,
                  totalPurchased: i.totalPurchased + quantity,
                  costPerUnit: (i.costPerUnit * i.currentStock + costPerUnit * quantity) / (i.currentStock + quantity),
                }
              : i
          ),
          inventoryTransactions: [...s.inventoryTransactions, transaction],
        }));
        get().addActivity('Inventory Purchase', `${quantity} ${item.unit} of ${item.name} purchased`, 'inventory');
      },

      useInventoryItem: (itemId, quantity, jobId, note) => {
        const state = get();
        const item = state.inventoryItems.find((i) => i.id === itemId);
        if (!item) return;

        if (item.currentStock < quantity) {
          return; // Cannot go negative
        }

        const transaction: InventoryTransaction = {
          id: generateId(),
          itemId,
          type: 'used',
          quantity,
          costPerUnit: item.costPerUnit,
          totalCost: quantity * item.costPerUnit,
          date: today,
          jobId,
          note,
        };

        set((s) => ({
          inventoryItems: s.inventoryItems.map((i) =>
            i.id === itemId
              ? { ...i, currentStock: i.currentStock - quantity, totalUsed: i.totalUsed + quantity }
              : i
          ),
          inventoryTransactions: [...s.inventoryTransactions, transaction],
        }));
        get().addActivity('Inventory Used', `${quantity} ${item.unit} of ${item.name} used`, 'inventory');
      },

      destroyInventoryItem: (itemId, quantity, note) => {
        const state = get();
        const item = state.inventoryItems.find((i) => i.id === itemId);
        if (!item) return;

        if (item.currentStock < quantity) {
          return; // Cannot go negative
        }

        const transaction: InventoryTransaction = {
          id: generateId(),
          itemId,
          type: 'destroyed',
          quantity,
          costPerUnit: item.costPerUnit,
          totalCost: quantity * item.costPerUnit,
          date: today,
          note,
        };

        set((s) => ({
          inventoryItems: s.inventoryItems.map((i) =>
            i.id === itemId
              ? { ...i, currentStock: i.currentStock - quantity, totalDestroyed: i.totalDestroyed + quantity }
              : i
          ),
          inventoryTransactions: [...s.inventoryTransactions, transaction],
        }));
        get().addActivity('Inventory Destroyed', `${quantity} ${item.unit} of ${item.name} destroyed/damaged`, 'inventory');
      },

      // Overhead Costs
      overheadCosts: demoOverheadCosts,
      addOverheadCost: (cost) => {
        const newCost: OverheadCost = { ...cost, id: `oh-${generateId()}` };
        set((s) => ({ overheadCosts: [...s.overheadCosts, newCost] }));
        get().addActivity('Overhead Cost', `₹${cost.amount.toLocaleString('en-IN')} - ${cost.description}`, 'cost');
      },

      // Activity Log
      activityLog: demoActivityLog,
      addActivity: (action, details, type) => {
        const entry: ActivityLog = {
          id: generateId(),
          action,
          details,
          timestamp: new Date().toISOString(),
          type,
        };
        set((s) => ({ activityLog: [entry, ...s.activityLog].slice(0, 100) }));
      },

      // Helpers
      getJobById: (id) => get().jobs.find((j) => j.id === id),
      getInventoryItemByName: (pattern) =>
        get().inventoryItems.find((i) => i.name.toLowerCase().includes(pattern.toLowerCase())),
    }),
    {
      name: 'drillops-data',
    }
  )
);
