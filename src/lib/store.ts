import { create } from 'zustand';
import type {
  Job,
  JobStatus,
  InventoryItem,
  InventoryTransaction,
  OverheadCost,
  ActivityLog,
  ViewPage,
  Payment,
  InternalCost,
  PaymentStatus,
} from './types';
import { createClient, isSupabaseConfigured } from '@/lib/supabase-browser';
import type { Session } from '@supabase/supabase-js';

// ─── Demo data for guest mode ─────────────────────────────
function createDemoData() {
  const now = new Date();
  const day = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();

  const demoJobs: Job[] = [
    {
      id: 'demo-1', customerName: 'Rajesh Kumar', mobile: '9876543210', location: 'Anna Nagar, Chennai',
      description: '6-inch borewell for residential building', scheduledDate: day(0), status: 'active',
      createdAt: day(5), drillingRatePerFoot: 120, casingType: 'PVC', casingRatePerUnit: 350,
      services: [
        { key: 'welding', name: 'Welding', rate: 500, quantity: 1 },
        { key: 'transportation', name: 'Transportation', rate: 5000, quantity: 1 },
        { key: 'flushing', name: 'Flushing', rate: 3000, quantity: 1 },
      ],
      customItems: [{ id: 'c1', name: 'Motor Installation', rate: 8000, quantity: 1 }],
      advanceReceived: 15000, depthDrilled: 120, casingUsedUnits: 25, dieselCost: 4500,
      soilType: 'Hard Rock', serviceQuantitiesUsed: { welding: 1, transportation: 1, flushing: 1 },
      customQuantitiesUsed: { c1: 1 }, billingGenerated: false, payments: [
        { id: 'p1', amount: 15000, date: day(4), method: 'upi', note: 'Advance' }
      ], totalPaid: 15000, paymentStatus: 'partial', internalCosts: [], rating: undefined,
    },
    {
      id: 'demo-2', customerName: 'Priya Industries', mobile: '9123456789', location: 'T Nagar, Chennai',
      description: '8-inch borewell for factory', scheduledDate: day(1), status: 'scheduled',
      createdAt: day(3), drillingRatePerFoot: 150, casingType: 'GI', casingRatePerUnit: 500,
      services: [
        { key: 'welding', name: 'Welding', rate: 500, quantity: 2 },
        { key: 'transportation', name: 'Transportation', rate: 8000, quantity: 1 },
      ],
      customItems: [], advanceReceived: 25000,
      payments: [{ id: 'p2', amount: 25000, date: day(2), method: 'bank_transfer' }],
      totalPaid: 25000, paymentStatus: 'partial', internalCosts: [],
    },
    {
      id: 'demo-3', customerName: 'Sathya Farms', mobile: '9988776655', location: 'Kanchipuram',
      description: 'Agricultural borewell 4-inch', scheduledDate: day(10), status: 'completed',
      createdAt: day(15), drillingRatePerFoot: 100, casingType: 'PVC', casingRatePerUnit: 300,
      services: [
        { key: 'flushing', name: 'Flushing', rate: 3000, quantity: 1 },
        { key: 'filterInstallation', name: 'Filter Installation', rate: 2000, quantity: 1 },
      ],
      customItems: [{ id: 'c2', name: 'Pump Set', rate: 12000, quantity: 1 }],
      advanceReceived: 20000, depthDrilled: 200, casingUsedUnits: 40, dieselCost: 6000,
      soilType: 'Clay & Sand', serviceQuantitiesUsed: { flushing: 1, filterInstallation: 1 },
      customQuantitiesUsed: { c2: 1 }, billingGenerated: true, finalBillAmount: 57000,
      completedAt: day(10), payments: [
        { id: 'p3', amount: 20000, date: day(14), method: 'cash' },
        { id: 'p4', amount: 37000, date: day(8), method: 'upi' },
      ], totalPaid: 57000, paymentStatus: 'paid', internalCosts: [
        { id: 'ic1', type: 'diesel', category: 'job', description: 'Diesel for drilling', amount: 6000, date: day(10) }
      ], rating: 5,
    },
    {
      id: 'demo-4', customerName: 'Metro Builders', mobile: '9012345678', location: 'Velachery, Chennai',
      description: 'Commercial site borewell', scheduledDate: day(7), status: 'billed',
      createdAt: day(12), drillingRatePerFoot: 180, casingType: 'GI', casingRatePerUnit: 550,
      services: [
        { key: 'welding', name: 'Welding', rate: 500, quantity: 3 },
        { key: 'transportation', name: 'Transportation', rate: 10000, quantity: 1 },
        { key: 'flushing', name: 'Flushing', rate: 3000, quantity: 2 },
      ],
      customItems: [{ id: 'c3', name: 'Compressor Service', rate: 15000, quantity: 1 }],
      advanceReceived: 50000, depthDrilled: 250, casingUsedUnits: 50, dieselCost: 12000,
      soilType: 'Mixed Rock', serviceQuantitiesUsed: { welding: 3, transportation: 1, flushing: 2 },
      customQuantitiesUsed: { c3: 1 }, billingGenerated: true, finalBillAmount: 128500,
      completedAt: day(7), payments: [
        { id: 'p5', amount: 50000, date: day(11), method: 'cheque' },
        { id: 'p6', amount: 40000, date: day(5), method: 'bank_transfer' },
      ], totalPaid: 90000, paymentStatus: 'partial', internalCosts: [
        { id: 'ic2', type: 'diesel', category: 'job', description: 'Diesel', amount: 12000, date: day(8) },
        { id: 'ic3', type: 'labour', category: 'job', description: 'Extra labour', amount: 5000, date: day(8) },
      ], rating: 4,
    },
  ];

  const demoInventory: InventoryItem[] = [
    { id: 'inv-1', name: 'PVC Casing 4"', unit: 'feet', openingStock: 1000, currentStock: 850, totalPurchased: 500, totalUsed: 600, totalDestroyed: 50, reorderLevel: 200, costPerUnit: 80 },
    { id: 'inv-2', name: 'GI Casing 6"', unit: 'feet', openingStock: 500, currentStock: 320, totalPurchased: 200, totalUsed: 350, totalDestroyed: 30, reorderLevel: 100, costPerUnit: 180 },
    { id: 'inv-3', name: 'Diesel', unit: 'litres', openingStock: 500, currentStock: 200, totalPurchased: 1000, totalUsed: 1200, totalDestroyed: 100, reorderLevel: 100, costPerUnit: 90 },
    { id: 'inv-4', name: 'Welding Rods', unit: 'kg', openingStock: 50, currentStock: 30, totalPurchased: 20, totalUsed: 35, totalDestroyed: 5, reorderLevel: 10, costPerUnit: 250 },
    { id: 'inv-5', name: 'Filter Pipes 4"', unit: 'pieces', openingStock: 100, currentStock: 80, totalPurchased: 50, totalUsed: 65, totalDestroyed: 5, reorderLevel: 20, costPerUnit: 350 },
  ];

  const demoTransactions: InventoryTransaction[] = [
    { id: 'tx-1', itemId: 'inv-3', type: 'used', quantity: 100, costPerUnit: 90, totalCost: 9000, date: day(1), jobId: 'demo-1', note: 'Active drilling' },
    { id: 'tx-2', itemId: 'inv-1', type: 'used', quantity: 120, costPerUnit: 80, totalCost: 9600, date: day(2), jobId: 'demo-1', note: 'Casing installation' },
    { id: 'tx-3', itemId: 'inv-3', type: 'purchase', quantity: 500, costPerUnit: 88, totalCost: 44000, date: day(3), supplier: 'Indian Oil', note: 'Bulk purchase' },
    { id: 'tx-4', itemId: 'inv-2', type: 'used', quantity: 50, costPerUnit: 180, totalCost: 9000, date: day(5), jobId: 'demo-4' },
  ];

  const demoOverheads: OverheadCost[] = [
    { id: 'oh-1', category: 'Rent', description: 'Yard rent - May 2026', amount: 25000, date: day(1), recurring: true },
    { id: 'oh-2', category: 'Maintenance', description: 'Drill machine service', amount: 12000, date: day(3) },
    { id: 'oh-3', category: 'Salary', description: 'Workers salary - May 2026', amount: 60000, date: day(0), recurring: true },
    { id: 'oh-4', category: 'Insurance', description: 'Vehicle insurance renewal', amount: 8500, date: day(7) },
  ];

  const demoActivity: ActivityLog[] = [
    { id: 'act-1', action: 'Job Started', details: 'Active drilling for Rajesh Kumar at Anna Nagar', timestamp: day(0), type: 'job' },
    { id: 'act-2', action: 'Payment Received', details: '₹15,000 advance from Rajesh Kumar', timestamp: day(1), type: 'billing' },
    { id: 'act-3', action: 'Inventory Purchase', details: '500L diesel purchased from Indian Oil', timestamp: day(3), type: 'inventory' },
    { id: 'act-4', action: 'Job Completed', details: 'Sathya Farms borewell - 200ft drilled', timestamp: day(7), type: 'job' },
    { id: 'act-5', action: 'Bill Generated', details: '₹57,000 bill for Sathya Farms', timestamp: day(7), type: 'billing' },
    { id: 'act-6', action: 'Inventory Alert', details: 'Diesel stock below reorder level (200L)', timestamp: day(4), type: 'inventory' },
  ];

  return { jobs: demoJobs, inventoryItems: demoInventory, inventoryTransactions: demoTransactions, overheadCosts: demoOverheads, activityLog: demoActivity };
}

interface AppState {
  // Navigation
  currentView: ViewPage;
  setCurrentView: (view: ViewPage) => void;

  // Data
  jobs: Job[];
  jobCounter: number;
  inventoryItems: InventoryItem[];
  inventoryTransactions: InventoryTransaction[];
  overheadCosts: OverheadCost[];
  activityLog: ActivityLog[];

  // Loading state
  isLoading: boolean;
  isInitialized: boolean;

  // Guest mode
  isGuest: boolean;
  enterGuestMode: () => void;
  exitGuestMode: () => void;

  // Session for auth
  session: Session | null;
  setSession: (session: Session | null) => void;

  // Actions — Data Loading
  fetchAllData: () => Promise<void>;
  loadDemoData: () => void;

  // Jobs
  addJob: (job: Omit<Job, 'id' | 'createdAt' | 'status' | 'completedAt' | 'depthDrilled' | 'casingUsedUnits' | 'dieselCost' | 'soilType' | 'serviceQuantitiesUsed' | 'customQuantitiesUsed' | 'billingGenerated' | 'finalBillAmount' | 'payments' | 'totalPaid' | 'paymentStatus' | 'internalCosts' | 'rating'>) => Promise<void>;
  updateJob: (id: string, updates: Partial<Job>) => Promise<void>;
  startJob: (id: string) => Promise<void>;
  completeJob: (id: string, data: {
    depthDrilled: number;
    casingUsedUnits: number;
    dieselCost: number;
    soilType: string;
    serviceQuantitiesUsed: Record<string, number>;
    customQuantitiesUsed: Record<string, number>;
  }) => Promise<void>;
  generateBill: (id: string, finalBillAmount: number) => Promise<void>;
  addPayment: (jobId: string, payment: Omit<Payment, 'id'>) => Promise<void>;
  addJobCost: (jobId: string, cost: Omit<InternalCost, 'id'>) => Promise<void>;
  rateJob: (jobId: string, rating: number) => Promise<void>;
  closeJob: (id: string) => Promise<void>;

  // Inventory
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'currentStock' | 'totalPurchased' | 'totalUsed' | 'totalDestroyed'>) => Promise<void>;
  addPurchase: (itemId: string, quantity: number, costPerUnit: number, supplier?: string, note?: string) => Promise<void>;
  useInventoryItem: (itemId: string, quantity: number, jobId?: string, note?: string) => Promise<void>;
  destroyInventoryItem: (itemId: string, quantity: number, note?: string) => Promise<void>;

  // Overhead Costs
  addOverheadCost: (cost: Omit<OverheadCost, 'id'>) => Promise<void>;

  // Activity Log
  addActivity: (action: string, details: string, type: ActivityLog['type']) => void;

  // Helpers
  getJobById: (id: string) => Job | undefined;
  getInventoryItemByName: (pattern: string) => InventoryItem | undefined;
}

// Helper: make authenticated fetch requests (only for real auth, not guest)
async function authFetch(url: string, options?: RequestInit): Promise<Response> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(url, { ...options, headers });
}

export const useStore = create<AppState>()(
  (set, get) => ({
    // Navigation
    currentView: 'dashboard',
    setCurrentView: (view) => set({ currentView: view }),

    // Data — starts empty until fetched
    jobs: [],
    jobCounter: 7,
    inventoryItems: [],
    inventoryTransactions: [],
    overheadCosts: [],
    activityLog: [],

    // Loading
    isLoading: false,
    isInitialized: false,

    // Guest mode
    isGuest: false,
    enterGuestMode: () => {
      get().loadDemoData();
      set({ isGuest: true });
    },
    exitGuestMode: () => {
      set({ isGuest: false, isInitialized: false, jobs: [], inventoryItems: [], inventoryTransactions: [], overheadCosts: [], activityLog: [] });
    },

    // Session
    session: null,
    setSession: (session) => set({ session }),

    // ─── Load Demo Data ──────────────────────────────────
    loadDemoData: () => {
      const demo = createDemoData();
      set({
        ...demo,
        jobCounter: 5,
        isInitialized: true,
        isLoading: false,
      });
    },

    // ─── Data Loading ─────────────────────────────────────
    fetchAllData: async () => {
      if (get().isLoading) return;
      // Guest mode uses demo data — no API calls
      if (get().isGuest) {
        get().loadDemoData();
        return;
      }
      // If Supabase not configured, load demo data instead
      if (!isSupabaseConfigured()) {
        console.warn('[DrillOps] Supabase not configured, loading demo data');
        get().loadDemoData();
        set({ isGuest: true });
        return;
      }

      set({ isLoading: true });

      try {
        const [jobsRes, invRes, txRes, overheadRes, activityRes, stateRes] = await Promise.all([
          authFetch('/api/jobs'),
          authFetch('/api/inventory'),
          authFetch('/api/inventory/transactions'),
          authFetch('/api/overheads'),
          authFetch('/api/activity'),
          authFetch('/api/state'),
        ]);

        const jobsData = jobsRes.ok ? await jobsRes.json() : [];
        const invData = invRes.ok ? await invRes.json() : [];
        const txData = txRes.ok ? await txRes.json() : [];
        const overheadData = overheadRes.ok ? await overheadRes.json() : [];
        const activityData = activityRes.ok ? await activityRes.json() : [];
        const stateData = stateRes.ok ? await stateRes.json() : {};

        set({
          jobs: Array.isArray(jobsData) ? jobsData : [],
          inventoryItems: Array.isArray(invData) ? invData : [],
          inventoryTransactions: Array.isArray(txData) ? txData : [],
          overheadCosts: Array.isArray(overheadData) ? overheadData : [],
          activityLog: Array.isArray(activityData) ? activityData : [],
          jobCounter: stateData?.jobCounter ?? 7,
          isLoading: false,
          isInitialized: true,
        });
      } catch (error) {
        console.error('Failed to fetch data from Supabase:', error);
        // On error, fall back to demo data so the app is still usable
        get().loadDemoData();
        set({ isGuest: true, isLoading: false });
      }
    },

    // ─── Jobs ────────────────────────────────────────────
    addJob: async (jobData) => {
      const isGuest = get().isGuest;
      try {
        if (isGuest) {
          // Guest: just add to local state
          const newJob: Job = {
            ...jobData,
            id: `demo-${Date.now()}`,
            createdAt: new Date().toISOString(),
            status: 'scheduled',
            payments: [],
            totalPaid: jobData.advanceReceived || 0,
            paymentStatus: (jobData.advanceReceived || 0) > 0 ? 'partial' as PaymentStatus : 'pending' as PaymentStatus,
            internalCosts: [],
          };
          set((s) => ({ jobs: [...s.jobs, newJob], jobCounter: s.jobCounter + 1 }));
          get().addActivity('Job Created', `New job for ${jobData.customerName} at ${jobData.location}`, 'job');
          return;
        }

        const res = await authFetch('/api/jobs', {
          method: 'POST',
          body: JSON.stringify(jobData),
        });

        if (res.ok) {
          const newJob = await res.json();
          set((s) => ({
            jobs: [...s.jobs, newJob],
            jobCounter: s.jobCounter + 1,
          }));
          get().addActivity('Job Created', `New job for ${jobData.customerName} at ${jobData.location}`, 'job');
        }
      } catch (error) {
        console.error('Failed to create job:', error);
      }
    },

    updateJob: async (id, updates) => {
      if (get().isGuest) {
        set((s) => ({ jobs: s.jobs.map((j) => (j.id === id ? { ...j, ...updates } : j)) }));
        return;
      }
      try {
        const res = await authFetch(`/api/jobs/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(updates),
        });
        if (res.ok) {
          const updated = await res.json();
          set((s) => ({ jobs: s.jobs.map((j) => (j.id === id ? { ...j, ...updated } : j)) }));
        }
      } catch (error) {
        console.error('Failed to update job:', error);
      }
    },

    startJob: async (id) => {
      if (get().isGuest) {
        set((s) => ({ jobs: s.jobs.map((j) => (j.id === id ? { ...j, status: 'active' as JobStatus } : j)) }));
        const job = get().jobs.find((j) => j.id === id);
        get().addActivity('Job Started', `Job for ${job?.customerName} started`, 'job');
        return;
      }
      try {
        const res = await authFetch(`/api/jobs/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'active' }) });
        if (res.ok) {
          set((s) => ({ jobs: s.jobs.map((j) => (j.id === id ? { ...j, status: 'active' as JobStatus } : j)) }));
          const job = get().jobs.find((j) => j.id === id);
          get().addActivity('Job Started', `Job for ${job?.customerName} started`, 'job');
        }
      } catch (error) { console.error('Failed to start job:', error); }
    },

    completeJob: async (id, data) => {
      if (get().isGuest) {
        set((s) => ({
          jobs: s.jobs.map((j) => j.id === id ? {
            ...j, status: 'completed' as JobStatus, completedAt: new Date().toISOString(), ...data,
          } : j),
        }));
        const job = get().jobs.find((j) => j.id === id);
        get().addActivity('Job Completed', `Job for ${job?.customerName} completed - ${data.depthDrilled}ft drilled`, 'job');
        return;
      }
      try {
        const res = await authFetch(`/api/jobs/${id}/complete`, { method: 'POST', body: JSON.stringify(data) });
        if (res.ok) {
          await get().fetchAllData();
          const job = get().jobs.find((j) => j.id === id);
          get().addActivity('Job Completed', `Job for ${job?.customerName} completed - ${data.depthDrilled}ft drilled`, 'job');
        }
      } catch (error) { console.error('Failed to complete job:', error); }
    },

    generateBill: async (id, finalBillAmount) => {
      if (get().isGuest) {
        set((s) => ({
          jobs: s.jobs.map((j) => j.id === id ? { ...j, billingGenerated: true, finalBillAmount, status: 'billed' as JobStatus } : j),
        }));
        const job = get().jobs.find((j) => j.id === id);
        get().addActivity('Bill Generated', `Bill ₹${finalBillAmount.toLocaleString('en-IN')} generated for ${job?.customerName}`, 'billing');
        return;
      }
      try {
        const res = await authFetch(`/api/jobs/${id}/bill`, { method: 'POST', body: JSON.stringify({ finalBillAmount }) });
        if (res.ok) {
          set((s) => ({
            jobs: s.jobs.map((j) => j.id === id ? { ...j, billingGenerated: true, finalBillAmount, status: 'billed' as JobStatus } : j),
          }));
          const job = get().jobs.find((j) => j.id === id);
          get().addActivity('Bill Generated', `Bill ₹${finalBillAmount.toLocaleString('en-IN')} generated for ${job?.customerName}`, 'billing');
        }
      } catch (error) { console.error('Failed to generate bill:', error); }
    },

    addPayment: async (jobId, payment) => {
      if (get().isGuest) {
        const newPayment = { ...payment, id: `p-${Date.now()}` };
        set((s) => ({
          jobs: s.jobs.map((j) => {
            if (j.id !== jobId) return j;
            const payments = [...j.payments, newPayment];
            const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
            const paymentStatus: PaymentStatus = j.finalBillAmount && totalPaid >= j.finalBillAmount ? 'paid' : totalPaid > 0 ? 'partial' : 'pending';
            return { ...j, payments, totalPaid, paymentStatus };
          }),
        }));
        const job = get().jobs.find((j) => j.id === jobId);
        get().addActivity('Payment Received', `₹${payment.amount.toLocaleString('en-IN')} received from ${job?.customerName}`, 'billing');
        return;
      }
      try {
        const res = await authFetch(`/api/jobs/${jobId}/payment`, { method: 'POST', body: JSON.stringify(payment) });
        if (res.ok) {
          const result = await res.json();
          set((s) => ({
            jobs: s.jobs.map((j) => {
              if (j.id !== jobId) return j;
              const payments = [...j.payments, result.payment];
              const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
              const paymentStatus: PaymentStatus = j.finalBillAmount && totalPaid >= j.finalBillAmount ? 'paid' : totalPaid > 0 ? 'partial' : 'pending';
              return { ...j, payments, totalPaid, paymentStatus };
            }),
          }));
          const job = get().jobs.find((j) => j.id === jobId);
          get().addActivity('Payment Received', `₹${payment.amount.toLocaleString('en-IN')} received from ${job?.customerName}`, 'billing');
        }
      } catch (error) { console.error('Failed to add payment:', error); }
    },

    addJobCost: async (jobId, cost) => {
      if (get().isGuest) {
        const newCost = { ...cost, id: `ic-${Date.now()}` };
        set((s) => ({ jobs: s.jobs.map((j) => j.id === jobId ? { ...j, internalCosts: [...j.internalCosts, newCost] } : j) }));
        get().addActivity('Cost Added', `₹${cost.amount.toLocaleString('en-IN')} cost added`, 'cost');
        return;
      }
      try {
        const res = await authFetch(`/api/jobs/${jobId}/cost`, { method: 'POST', body: JSON.stringify(cost) });
        if (res.ok) {
          const result = await res.json();
          set((s) => ({ jobs: s.jobs.map((j) => j.id === jobId ? { ...j, internalCosts: [...j.internalCosts, result.cost] } : j) }));
          get().addActivity('Cost Added', `₹${cost.amount.toLocaleString('en-IN')} cost added`, 'cost');
        }
      } catch (error) { console.error('Failed to add cost:', error); }
    },

    rateJob: async (jobId, rating) => {
      if (get().isGuest) {
        set((s) => ({ jobs: s.jobs.map((j) => (j.id === jobId ? { ...j, rating } : j)) }));
        return;
      }
      try {
        const res = await authFetch(`/api/jobs/${jobId}/rate`, { method: 'POST', body: JSON.stringify({ rating }) });
        if (res.ok) {
          set((s) => ({ jobs: s.jobs.map((j) => (j.id === jobId ? { ...j, rating } : j)) }));
        }
      } catch (error) { console.error('Failed to rate job:', error); }
    },

    closeJob: async (id) => {
      if (get().isGuest) {
        set((s) => ({ jobs: s.jobs.map((j) => (j.id === id ? { ...j, status: 'closed' as JobStatus } : j)) }));
        const job = get().jobs.find((j) => j.id === id);
        get().addActivity('Job Closed', `Job for ${job?.customerName} closed`, 'job');
        return;
      }
      try {
        const res = await authFetch(`/api/jobs/${id}/close`, { method: 'POST' });
        if (res.ok) {
          set((s) => ({ jobs: s.jobs.map((j) => (j.id === id ? { ...j, status: 'closed' as JobStatus } : j)) }));
          const job = get().jobs.find((j) => j.id === id);
          get().addActivity('Job Closed', `Job for ${job?.customerName} closed`, 'job');
        }
      } catch (error) { console.error('Failed to close job:', error); }
    },

    // ─── Inventory ───────────────────────────────────────
    addInventoryItem: async (item) => {
      if (get().isGuest) {
        const newItem: InventoryItem = { ...item, id: `inv-${Date.now()}`, currentStock: item.openingStock, totalPurchased: 0, totalUsed: 0, totalDestroyed: 0 };
        set((s) => ({ inventoryItems: [...s.inventoryItems, newItem] }));
        get().addActivity('Inventory Added', `${item.name} added to inventory`, 'inventory');
        return;
      }
      try {
        const res = await authFetch('/api/inventory', { method: 'POST', body: JSON.stringify({ ...item, currentStock: item.openingStock, totalPurchased: 0, totalUsed: 0, totalDestroyed: 0 }) });
        if (res.ok) {
          const newItem = await res.json();
          set((s) => ({ inventoryItems: [...s.inventoryItems, newItem] }));
          get().addActivity('Inventory Added', `${item.name} added to inventory`, 'inventory');
        }
      } catch (error) { console.error('Failed to add inventory item:', error); }
    },

    addPurchase: async (itemId, quantity, costPerUnit, supplier, note) => {
      if (get().isGuest) {
        set((s) => ({
          inventoryItems: s.inventoryItems.map((i) => i.id === itemId ? { ...i, currentStock: i.currentStock + quantity, totalPurchased: i.totalPurchased + quantity } : i),
          inventoryTransactions: [...s.inventoryTransactions, { id: `tx-${Date.now()}`, itemId, type: 'purchase' as const, quantity, costPerUnit, totalCost: quantity * costPerUnit, date: new Date().toISOString(), supplier, note }],
        }));
        const item = get().inventoryItems.find((i) => i.id === itemId);
        get().addActivity('Inventory Purchase', `${quantity} ${item?.unit} of ${item?.name} purchased`, 'inventory');
        return;
      }
      try {
        const res = await authFetch(`/api/inventory/${itemId}/purchase`, { method: 'POST', body: JSON.stringify({ quantity, costPerUnit, supplier, note }) });
        if (res.ok) {
          await get().fetchAllData();
          const item = get().inventoryItems.find((i) => i.id === itemId);
          get().addActivity('Inventory Purchase', `${quantity} ${item?.unit} of ${item?.name} purchased`, 'inventory');
        }
      } catch (error) { console.error('Failed to add purchase:', error); }
    },

    useInventoryItem: async (itemId, quantity, jobId, note) => {
      const item = get().inventoryItems.find((i) => i.id === itemId);
      if (!item || item.currentStock < quantity) return;

      if (get().isGuest) {
        set((s) => ({
          inventoryItems: s.inventoryItems.map((i) => i.id === itemId ? { ...i, currentStock: i.currentStock - quantity, totalUsed: i.totalUsed + quantity } : i),
          inventoryTransactions: [...s.inventoryTransactions, { id: `tx-${Date.now()}`, itemId, type: 'used' as const, quantity, costPerUnit: item.costPerUnit, totalCost: quantity * item.costPerUnit, date: new Date().toISOString(), jobId, note }],
        }));
        get().addActivity('Inventory Used', `${quantity} ${item.unit} of ${item.name} used`, 'inventory');
        return;
      }
      try {
        const res = await authFetch(`/api/inventory/${itemId}/use`, { method: 'POST', body: JSON.stringify({ quantity, jobId, note }) });
        if (res.ok) {
          await get().fetchAllData();
          get().addActivity('Inventory Used', `${quantity} ${item.unit} of ${item.name} used`, 'inventory');
        }
      } catch (error) { console.error('Failed to use inventory:', error); }
    },

    destroyInventoryItem: async (itemId, quantity, note) => {
      const item = get().inventoryItems.find((i) => i.id === itemId);
      if (!item || item.currentStock < quantity) return;

      if (get().isGuest) {
        set((s) => ({
          inventoryItems: s.inventoryItems.map((i) => i.id === itemId ? { ...i, currentStock: i.currentStock - quantity, totalDestroyed: i.totalDestroyed + quantity } : i),
          inventoryTransactions: [...s.inventoryTransactions, { id: `tx-${Date.now()}`, itemId, type: 'destroyed' as const, quantity, costPerUnit: item.costPerUnit, totalCost: quantity * item.costPerUnit, date: new Date().toISOString(), note }],
        }));
        get().addActivity('Inventory Destroyed', `${quantity} ${item.unit} of ${item.name} destroyed/damaged`, 'inventory');
        return;
      }
      try {
        const res = await authFetch(`/api/inventory/${itemId}/destroy`, { method: 'POST', body: JSON.stringify({ quantity, note }) });
        if (res.ok) {
          await get().fetchAllData();
          get().addActivity('Inventory Destroyed', `${quantity} ${item.unit} of ${item.name} destroyed/damaged`, 'inventory');
        }
      } catch (error) { console.error('Failed to destroy inventory:', error); }
    },

    // ─── Overhead Costs ──────────────────────────────────
    addOverheadCost: async (cost) => {
      if (get().isGuest) {
        const newCost: OverheadCost = { ...cost, id: `oh-${Date.now()}` };
        set((s) => ({ overheadCosts: [...s.overheadCosts, newCost] }));
        get().addActivity('Overhead Cost', `₹${cost.amount.toLocaleString('en-IN')} - ${cost.description}`, 'cost');
        return;
      }
      try {
        const res = await authFetch('/api/overheads', { method: 'POST', body: JSON.stringify(cost) });
        if (res.ok) {
          const newCost = await res.json();
          set((s) => ({ overheadCosts: [...s.overheadCosts, newCost] }));
          get().addActivity('Overhead Cost', `₹${cost.amount.toLocaleString('en-IN')} - ${cost.description}`, 'cost');
        }
      } catch (error) { console.error('Failed to add overhead cost:', error); }
    },

    // ─── Activity Log ────────────────────────────────────
    addActivity: (action, details, type) => {
      const entry: ActivityLog = {
        id: `local-${Date.now()}`,
        action,
        details,
        timestamp: new Date().toISOString(),
        type,
      };
      set((s) => ({ activityLog: [entry, ...s.activityLog].slice(0, 100) }));

      // Fire-and-forget to server (only if not guest)
      if (!get().isGuest) {
        authFetch('/api/activity', {
          method: 'POST',
          body: JSON.stringify({ action, details, type }),
        }).catch(() => {});
      }
    },

    // ─── Helpers ─────────────────────────────────────────
    getJobById: (id) => get().jobs.find((j) => j.id === id),
    getInventoryItemByName: (pattern) =>
      get().inventoryItems.find((i) => i.name.toLowerCase().includes(pattern.toLowerCase())),
  })
);
