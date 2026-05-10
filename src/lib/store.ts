import { create } from 'zustand';
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

  // Actions — Data Loading
  fetchAllData: () => Promise<void>;

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

// Local activity log for immediate UI feedback (server sync is async)
let localActivityQueue: { action: string; details: string; type: ActivityLog['type'] }[] = [];

export const useStore = create<AppState>()(
  (set, get) => ({
    // Navigation
    currentView: 'dashboard',
    setCurrentView: (view) => set({ currentView: view }),

    // Data — starts empty until fetched from Supabase
    jobs: [],
    jobCounter: 7,
    inventoryItems: [],
    inventoryTransactions: [],
    overheadCosts: [],
    activityLog: [],

    // Loading
    isLoading: false,
    isInitialized: false,

    // ─── Data Loading ─────────────────────────────────────
    fetchAllData: async () => {
      if (get().isLoading) return;
      set({ isLoading: true });

      try {
        const [jobsRes, invRes, txRes, overheadRes, activityRes, stateRes] = await Promise.all([
          fetch('/api/jobs'),
          fetch('/api/inventory'),
          fetch('/api/inventory/transactions'),
          fetch('/api/overheads'),
          fetch('/api/activity'),
          fetch('/api/state'),
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
        set({ isLoading: false, isInitialized: true });
      }
    },

    // ─── Jobs ────────────────────────────────────────────
    addJob: async (jobData) => {
      try {
        const res = await fetch('/api/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(jobData),
        });

        if (res.ok) {
          const newJob = await res.json();
          set((s) => ({
            jobs: [...s.jobs, newJob],
            jobCounter: s.jobCounter + 1,
          }));
          get().addActivity('Job Created', `New job for ${jobData.customerName} at ${jobData.location}`, 'job');
        } else {
          console.error('Failed to create job:', await res.text());
        }
      } catch (error) {
        console.error('Failed to create job:', error);
      }
    },

    updateJob: async (id, updates) => {
      try {
        const res = await fetch(`/api/jobs/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });

        if (res.ok) {
          const updated = await res.json();
          set((s) => ({
            jobs: s.jobs.map((j) => (j.id === id ? { ...j, ...updated } : j)),
          }));
        }
      } catch (error) {
        console.error('Failed to update job:', error);
      }
    },

    startJob: async (id) => {
      try {
        const res = await fetch(`/api/jobs/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'active' }),
        });

        if (res.ok) {
          set((s) => ({
            jobs: s.jobs.map((j) => (j.id === id ? { ...j, status: 'active' as JobStatus } : j)),
          }));
          const job = get().jobs.find((j) => j.id === id);
          get().addActivity('Job Started', `Job for ${job?.customerName} started`, 'job');
        }
      } catch (error) {
        console.error('Failed to start job:', error);
      }
    },

    completeJob: async (id, data) => {
      try {
        const res = await fetch(`/api/jobs/${id}/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (res.ok) {
          const result = await res.json();
          // Refresh all data since inventory also changes
          await get().fetchAllData();
          const job = get().jobs.find((j) => j.id === id);
          get().addActivity('Job Completed', `Job for ${job?.customerName} completed - ${data.depthDrilled}ft drilled`, 'job');
        }
      } catch (error) {
        console.error('Failed to complete job:', error);
      }
    },

    generateBill: async (id, finalBillAmount) => {
      try {
        const res = await fetch(`/api/jobs/${id}/bill`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ finalBillAmount }),
        });

        if (res.ok) {
          const result = await res.json();
          set((s) => ({
            jobs: s.jobs.map((j) =>
              j.id === id
                ? { ...j, billingGenerated: true, finalBillAmount, status: 'billed' as JobStatus }
                : j
            ),
          }));
          const job = get().jobs.find((j) => j.id === id);
          get().addActivity('Bill Generated', `Bill ₹${finalBillAmount.toLocaleString('en-IN')} generated for ${job?.customerName}`, 'billing');
        }
      } catch (error) {
        console.error('Failed to generate bill:', error);
      }
    },

    addPayment: async (jobId, payment) => {
      try {
        const res = await fetch(`/api/jobs/${jobId}/payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payment),
        });

        if (res.ok) {
          const result = await res.json();
          set((s) => ({
            jobs: s.jobs.map((j) => {
              if (j.id !== jobId) return j;
              const payments = [...j.payments, result.payment];
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
        }
      } catch (error) {
        console.error('Failed to add payment:', error);
      }
    },

    addJobCost: async (jobId, cost) => {
      try {
        const res = await fetch(`/api/jobs/${jobId}/cost`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cost),
        });

        if (res.ok) {
          const result = await res.json();
          set((s) => ({
            jobs: s.jobs.map((j) =>
              j.id === jobId ? { ...j, internalCosts: [...j.internalCosts, result.cost] } : j
            ),
          }));
          get().addActivity('Cost Added', `₹${cost.amount.toLocaleString('en-IN')} cost added to job ${jobId}`, 'cost');
        }
      } catch (error) {
        console.error('Failed to add cost:', error);
      }
    },

    rateJob: async (jobId, rating) => {
      try {
        const res = await fetch(`/api/jobs/${jobId}/rate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rating }),
        });

        if (res.ok) {
          set((s) => ({
            jobs: s.jobs.map((j) => (j.id === jobId ? { ...j, rating } : j)),
          }));
        }
      } catch (error) {
        console.error('Failed to rate job:', error);
      }
    },

    closeJob: async (id) => {
      try {
        const res = await fetch(`/api/jobs/${id}/close`, {
          method: 'POST',
        });

        if (res.ok) {
          set((s) => ({
            jobs: s.jobs.map((j) =>
              j.id === id ? { ...j, status: 'closed' as JobStatus } : j
            ),
          }));
          const job = get().jobs.find((j) => j.id === id);
          get().addActivity('Job Closed', `Job for ${job?.customerName} closed`, 'job');
        }
      } catch (error) {
        console.error('Failed to close job:', error);
      }
    },

    // ─── Inventory ───────────────────────────────────────
    addInventoryItem: async (item) => {
      try {
        const res = await fetch('/api/inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...item,
            currentStock: item.openingStock,
            totalPurchased: 0,
            totalUsed: 0,
            totalDestroyed: 0,
          }),
        });

        if (res.ok) {
          const newItem = await res.json();
          set((s) => ({ inventoryItems: [...s.inventoryItems, newItem] }));
          get().addActivity('Inventory Added', `${item.name} added to inventory`, 'inventory');
        }
      } catch (error) {
        console.error('Failed to add inventory item:', error);
      }
    },

    addPurchase: async (itemId, quantity, costPerUnit, supplier, note) => {
      try {
        const res = await fetch(`/api/inventory/${itemId}/purchase`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity, costPerUnit, supplier, note }),
        });

        if (res.ok) {
          const result = await res.json();
          // Refresh inventory data
          await get().fetchAllData();
          const item = get().inventoryItems.find((i) => i.id === itemId);
          get().addActivity('Inventory Purchase', `${quantity} ${item?.unit} of ${item?.name} purchased`, 'inventory');
        }
      } catch (error) {
        console.error('Failed to add purchase:', error);
      }
    },

    useInventoryItem: async (itemId, quantity, jobId, note) => {
      try {
        const item = get().inventoryItems.find((i) => i.id === itemId);
        if (!item || item.currentStock < quantity) return;

        const res = await fetch(`/api/inventory/${itemId}/use`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity, jobId, note }),
        });

        if (res.ok) {
          await get().fetchAllData();
          get().addActivity('Inventory Used', `${quantity} ${item.unit} of ${item.name} used`, 'inventory');
        }
      } catch (error) {
        console.error('Failed to use inventory:', error);
      }
    },

    destroyInventoryItem: async (itemId, quantity, note) => {
      try {
        const item = get().inventoryItems.find((i) => i.id === itemId);
        if (!item || item.currentStock < quantity) return;

        const res = await fetch(`/api/inventory/${itemId}/destroy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity, note }),
        });

        if (res.ok) {
          await get().fetchAllData();
          get().addActivity('Inventory Destroyed', `${quantity} ${item.unit} of ${item.name} destroyed/damaged`, 'inventory');
        }
      } catch (error) {
        console.error('Failed to destroy inventory:', error);
      }
    },

    // ─── Overhead Costs ──────────────────────────────────
    addOverheadCost: async (cost) => {
      try {
        const res = await fetch('/api/overheads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cost),
        });

        if (res.ok) {
          const newCost = await res.json();
          set((s) => ({ overheadCosts: [...s.overheadCosts, newCost] }));
          get().addActivity('Overhead Cost', `₹${cost.amount.toLocaleString('en-IN')} - ${cost.description}`, 'cost');
        }
      } catch (error) {
        console.error('Failed to add overhead cost:', error);
      }
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
      // Add to local state immediately for UI responsiveness
      set((s) => ({ activityLog: [entry, ...s.activityLog].slice(0, 100) }));

      // Fire-and-forget to server
      fetch('/api/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, details, type }),
      }).catch((err) => console.error('Failed to log activity:', err));
    },

    // ─── Helpers ─────────────────────────────────────────
    getJobById: (id) => get().jobs.find((j) => j.id === id),
    getInventoryItemByName: (pattern) =>
      get().inventoryItems.find((i) => i.name.toLowerCase().includes(pattern.toLowerCase())),
  })
);
