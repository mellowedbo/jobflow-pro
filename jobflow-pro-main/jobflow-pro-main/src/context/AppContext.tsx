import React, { createContext, useContext, useState, useCallback } from 'react';
import { Job, InventoryState, InventoryItem, InventoryTransaction, InternalCost, OverheadCost, JobStatus, ServiceItem, CustomItem, Payment, PREDEFINED_SERVICES } from '@/types/job';

interface AppState {
  jobs: Job[];
  inventory: InventoryState;
  overheadCosts: OverheadCost[];
  addJob: (job: Omit<Job, 'id' | 'createdAt' | 'status' | 'totalPaid' | 'paymentStatus' | 'internalCosts' | 'payments'>) => void;
  updateJob: (id: string, updates: Partial<Job>) => void;
  completeJob: (id: string, data: {
    completedAt: string;
    depthDrilled: number;
    casingUsedUnits: number;
    casingType: 'GI' | 'PVC';
    dieselCost: number;
    soilType?: string;
    serviceQuantitiesUsed: Record<string, number>;
    customQuantitiesUsed: Record<string, number>;
  }) => void;
  generateBill: (id: string, finalAmount: number) => void;
  addPayment: (jobId: string, amount: number, note?: string) => void;
  addInternalCost: (cost: Omit<InternalCost, 'id'>) => void;
  addOverheadCost: (cost: Omit<OverheadCost, 'id'>) => void;
  rateJob: (id: string, rating: number) => void;
  closeJob: (id: string) => void;
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'currentStock' | 'totalPurchased' | 'totalUsed' | 'totalDestroyed'>) => void;
  addInventoryTransaction: (tx: Omit<InventoryTransaction, 'id' | 'totalCost'>) => void;
}

const AppContext = createContext<AppState | null>(null);

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};

// Demo data
const DEMO_INVENTORY_ITEMS: InventoryItem[] = [
  { id: 'inv-gi', name: 'GI Casing', unit: 'feet', openingStock: 1500, currentStock: 1200, totalPurchased: 200, totalUsed: 450, totalDestroyed: 50 },
  { id: 'inv-pvc', name: 'PVC Casing', unit: 'feet', openingStock: 1000, currentStock: 800, totalPurchased: 100, totalUsed: 250, totalDestroyed: 50 },
  { id: 'inv-diesel', name: 'Diesel', unit: '₹ (budget)', openingStock: 200000, currentStock: 150000, totalPurchased: 50000, totalUsed: 90000, totalDestroyed: 10000 },
];

const DEMO_TRANSACTIONS: InventoryTransaction[] = [
  { id: 'tx-1', itemId: 'inv-gi', type: 'purchase', quantity: 200, costPerUnit: 120, totalCost: 24000, date: '2026-02-10', supplier: 'Steel Works Ltd' },
  { id: 'tx-2', itemId: 'inv-gi', type: 'used', quantity: 250, costPerUnit: 120, totalCost: 30000, date: '2026-02-20', jobId: 'JOB-002' },
  { id: 'tx-3', itemId: 'inv-diesel', type: 'used', quantity: 25000, costPerUnit: 1, totalCost: 25000, date: '2026-02-20', jobId: 'JOB-002' },
];

const DEMO_JOBS: Job[] = [
  {
    id: 'JOB-001',
    customerName: 'Rajesh Kumar',
    mobile: '9876543210',
    location: 'Sector 14, Gurgaon',
    description: 'Borewell for residential complex',
    scheduledDate: '2026-02-25',
    notes: 'Access from back gate only',
    status: 'scheduled',
    createdAt: '2026-02-20',
    drillingRatePerFoot: 100,
    casingType: 'PVC',
    casingRatePerUnit: 130,
    services: [
      { key: 'welding', name: 'Welding', rate: 500, quantity: 0 },
      { key: 'flushing', name: 'Flushing', rate: 3000, quantity: 0 },
    ],
    customItems: [{ id: 'q1', name: 'Motor Installation', rate: 15000, quantity: 1 }],
    advanceReceived: 40000,
    payments: [{ id: 'pay-1', amount: 40000, date: '2026-02-20', note: 'Advance' }],
    totalPaid: 40000,
    paymentStatus: 'partial',
    internalCosts: [],
  },
  {
    id: 'JOB-002',
    customerName: 'Amit Sharma',
    mobile: '9123456789',
    location: 'Village Kheri, Sonipat',
    description: 'Agricultural borewell',
    scheduledDate: '2026-02-18',
    status: 'completed',
    createdAt: '2026-02-15',
    drillingRatePerFoot: 95,
    casingType: 'GI',
    casingRatePerUnit: 220,
    services: [
      { key: 'welding', name: 'Welding', rate: 500, quantity: 15 },
      { key: 'flushing', name: 'Flushing', rate: 3000, quantity: 1 },
    ],
    customItems: [{ id: 'q2', name: 'Pump Setup', rate: 8000, quantity: 1 }],
    advanceReceived: 60000,
    completedAt: '2026-02-20',
    depthDrilled: 280,
    casingUsedUnits: 250,
    dieselCost: 25000,
    soilType: 'Clay + Rock',
    serviceQuantitiesUsed: { welding: 15, flushing: 1 },
    customQuantitiesUsed: { q2: 1 },
    billingGenerated: true,
    finalBillAmount: 91100,
    payments: [
      { id: 'pay-2', amount: 60000, date: '2026-02-15', note: 'Advance' },
      { id: 'pay-3', amount: 20000, date: '2026-02-21', note: 'Partial payment' },
    ],
    totalPaid: 80000,
    paymentStatus: 'partial',
    internalCosts: [
      { id: 'c1', type: 'Labor', category: 'job', description: '3 workers × 2 days', amount: 9000, date: '2026-02-20', jobId: 'JOB-002' },
      { id: 'c2', type: 'Transport', category: 'job', description: 'Rig transport to site', amount: 12000, date: '2026-02-18', jobId: 'JOB-002' },
    ],
    rating: 4,
  },
  {
    id: 'JOB-003',
    customerName: 'Priya Patel',
    mobile: '9988776655',
    location: 'DLF Phase 3, Gurgaon',
    description: 'Commercial borewell for factory',
    scheduledDate: '2026-02-22',
    status: 'active',
    createdAt: '2026-02-19',
    drillingRatePerFoot: 110,
    casingType: 'GI',
    casingRatePerUnit: 250,
    services: [
      { key: 'welding', name: 'Welding', rate: 500, quantity: 0 },
      { key: 'transportation', name: 'Transportation', rate: 5000, quantity: 1 },
    ],
    customItems: [],
    advanceReceived: 80000,
    payments: [{ id: 'pay-4', amount: 80000, date: '2026-02-19', note: 'Advance' }],
    totalPaid: 80000,
    paymentStatus: 'partial',
    internalCosts: [],
  },
];

const DEMO_OVERHEAD: OverheadCost[] = [
  { id: 'oh-1', category: 'Salary', description: 'Monthly driver salary', amount: 25000, date: '2026-02-01' },
  { id: 'oh-2', category: 'Maintenance', description: 'Rig servicing', amount: 15000, date: '2026-02-10' },
];

let jobCounter = 4;

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [jobs, setJobs] = useState<Job[]>(DEMO_JOBS);
  const [inventory, setInventory] = useState<InventoryState>({
    items: DEMO_INVENTORY_ITEMS,
    transactions: DEMO_TRANSACTIONS,
  });
  const [overheadCosts, setOverheadCosts] = useState<OverheadCost[]>(DEMO_OVERHEAD);

  const addJob = useCallback((jobData: Omit<Job, 'id' | 'createdAt' | 'status' | 'totalPaid' | 'paymentStatus' | 'internalCosts' | 'payments'>) => {
    const advancePayments: Payment[] = jobData.advanceReceived > 0
      ? [{ id: `pay-${Date.now()}`, amount: jobData.advanceReceived, date: new Date().toISOString().split('T')[0], note: 'Advance' }]
      : [];
    const newJob: Job = {
      ...jobData,
      id: `JOB-${String(jobCounter++).padStart(3, '0')}`,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'scheduled',
      payments: advancePayments,
      totalPaid: jobData.advanceReceived || 0,
      paymentStatus: jobData.advanceReceived > 0 ? 'partial' : 'pending',
      internalCosts: [],
    };
    setJobs(prev => [newJob, ...prev]);
  }, []);

  const updateJob = useCallback((id: string, updates: Partial<Job>) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, ...updates } : j));
  }, []);

  const completeJob = useCallback((id: string, data: {
    completedAt: string; depthDrilled: number; casingUsedUnits: number;
    casingType: 'GI' | 'PVC'; dieselCost: number; soilType?: string;
    serviceQuantitiesUsed: Record<string, number>; customQuantitiesUsed: Record<string, number>;
  }) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, ...data, status: 'completed' as JobStatus } : j));
    // Deduct inventory
    const casingItemId = data.casingType === 'GI' ? 'inv-gi' : 'inv-pvc';
    setInventory(prev => {
      const newItems = prev.items.map(item => {
        if (item.id === casingItemId) {
          return { ...item, currentStock: item.currentStock - data.casingUsedUnits, totalUsed: item.totalUsed + data.casingUsedUnits };
        }
        if (item.id === 'inv-diesel') {
          return { ...item, currentStock: item.currentStock - data.dieselCost, totalUsed: item.totalUsed + data.dieselCost };
        }
        return item;
      });
      const newTxs: InventoryTransaction[] = [
        { id: `tx-${Date.now()}-1`, itemId: casingItemId, type: 'used', quantity: data.casingUsedUnits, costPerUnit: 0, totalCost: 0, date: data.completedAt, jobId: id },
        { id: `tx-${Date.now()}-2`, itemId: 'inv-diesel', type: 'used', quantity: data.dieselCost, costPerUnit: 1, totalCost: data.dieselCost, date: data.completedAt, jobId: id },
      ];
      return { items: newItems, transactions: [...prev.transactions, ...newTxs] };
    });
  }, []);

  const generateBill = useCallback((id: string, finalAmount: number) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, billingGenerated: true, finalBillAmount: finalAmount, status: 'billed' as JobStatus } : j));
  }, []);

  const addPayment = useCallback((jobId: string, amount: number, note?: string) => {
    setJobs(prev => prev.map(j => {
      if (j.id !== jobId) return j;
      const newPayment: Payment = { id: `pay-${Date.now()}`, amount, date: new Date().toISOString().split('T')[0], note };
      const newPaid = j.totalPaid + amount;
      const bill = j.finalBillAmount || 0;
      return { ...j, payments: [...j.payments, newPayment], totalPaid: newPaid, paymentStatus: newPaid >= bill ? 'paid' : 'partial' };
    }));
  }, []);

  const addInternalCost = useCallback((cost: Omit<InternalCost, 'id'>) => {
    const newCost: InternalCost = { ...cost, id: `cost-${Date.now()}` };
    if (cost.jobId) {
      setJobs(prev => prev.map(j => j.id === cost.jobId ? { ...j, internalCosts: [...j.internalCosts, newCost] } : j));
    }
  }, []);

  const addOverheadCost = useCallback((cost: Omit<OverheadCost, 'id'>) => {
    setOverheadCosts(prev => [...prev, { ...cost, id: `oh-${Date.now()}` }]);
  }, []);

  const rateJob = useCallback((id: string, rating: number) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, rating } : j));
  }, []);

  const closeJob = useCallback((id: string) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, status: 'closed' as JobStatus } : j));
  }, []);

  const addInventoryItem = useCallback((item: Omit<InventoryItem, 'id' | 'currentStock' | 'totalPurchased' | 'totalUsed' | 'totalDestroyed'>) => {
    const newItem: InventoryItem = {
      ...item,
      id: `inv-${Date.now()}`,
      currentStock: item.openingStock,
      totalPurchased: 0,
      totalUsed: 0,
      totalDestroyed: 0,
    };
    setInventory(prev => ({ ...prev, items: [...prev.items, newItem] }));
  }, []);

  const addInventoryTransaction = useCallback((tx: Omit<InventoryTransaction, 'id' | 'totalCost'>) => {
    const totalCost = tx.quantity * tx.costPerUnit;
    const newTx: InventoryTransaction = { ...tx, id: `tx-${Date.now()}`, totalCost };
    setInventory(prev => {
      const newItems = prev.items.map(item => {
        if (item.id !== tx.itemId) return item;
        if (tx.type === 'purchase') {
          return { ...item, currentStock: item.currentStock + tx.quantity, totalPurchased: item.totalPurchased + tx.quantity };
        }
        if (tx.type === 'used') {
          return { ...item, currentStock: item.currentStock - tx.quantity, totalUsed: item.totalUsed + tx.quantity };
        }
        if (tx.type === 'destroyed') {
          return { ...item, currentStock: item.currentStock - tx.quantity, totalDestroyed: item.totalDestroyed + tx.quantity };
        }
        return item;
      });
      return { items: newItems, transactions: [...prev.transactions, newTx] };
    });
  }, []);

  return (
    <AppContext.Provider value={{
      jobs, inventory, overheadCosts,
      addJob, updateJob, completeJob, generateBill, addPayment,
      addInternalCost, addOverheadCost, rateJob, closeJob,
      addInventoryItem, addInventoryTransaction,
    }}>
      {children}
    </AppContext.Provider>
  );
};
