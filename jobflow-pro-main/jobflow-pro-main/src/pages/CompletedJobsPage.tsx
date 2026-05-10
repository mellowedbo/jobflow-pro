import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Star, FileText, DollarSign } from 'lucide-react';

const CompletedJobsPage: React.FC = () => {
  const { jobs, generateBill, addPayment, rateJob, closeJob, addInternalCost } = useApp();
  const completedJobs = jobs.filter(j => ['completed', 'billed', 'closed'].includes(j.status));
  const [billDialogJob, setBillDialogJob] = useState<string | null>(null);
  const [payDialog, setPayDialog] = useState<string | null>(null);
  const [costDialog, setCostDialog] = useState<string | null>(null);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold">Completed Jobs</h1>
          <p className="text-sm text-muted-foreground">{completedJobs.length} jobs completed</p>
        </div>
      </div>

      {completedJobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-card p-12">
          <p className="text-muted-foreground">No completed jobs yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {completedJobs.map(job => {
            const billAmount = job.finalBillAmount || calculateBill(job);
            const totalCosts = job.internalCosts.reduce((s, c) => s + c.amount, 0) + (job.dieselCost || 0);
            const profit = billAmount - totalCosts;
            const outstanding = (job.finalBillAmount || 0) - job.totalPaid;

            return (
              <div key={job.id} className="rounded-lg border bg-card p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{job.id}</span>
                      <span className={`status-badge ${
                        job.status === 'closed' ? 'status-paid' :
                        job.status === 'billed' ? 'status-pending' : 'status-completed'
                      }`}>{job.status}</span>
                    </div>
                    <h3 className="text-lg font-semibold">{job.customerName}</h3>
                    <p className="text-sm text-muted-foreground">{job.location}</p>
                  </div>
                  {job.rating ? (
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={`h-4 w-4 ${s <= job.rating! ? 'fill-accent text-accent' : 'text-muted'}`} />
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(s => (
                        <button key={s} onClick={() => rateJob(job.id, s)} className="p-0.5 hover:scale-110 transition-transform">
                          <Star className="h-4 w-4 text-muted hover:text-accent" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  <div><span className="data-label">Depth</span><p className="font-mono font-medium">{job.depthDrilled} ft</p></div>
                  <div><span className="data-label">Casing</span><p className="font-medium">{job.casingUsedUnits} units ({job.casingType})</p></div>
                  <div><span className="data-label">Diesel</span><p className="font-mono font-medium">₹{(job.dieselCost || 0).toLocaleString()}</p></div>
                  <div><span className="data-label">Soil</span><p className="font-medium">{job.soilType || '—'}</p></div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  <div><span className="data-label">Bill Amount</span><p className="font-mono font-medium">₹{billAmount.toLocaleString()}</p></div>
                  <div><span className="data-label">Total Paid</span><p className="font-mono font-medium text-success">₹{job.totalPaid.toLocaleString()}</p></div>
                  <div><span className="data-label">Outstanding</span><p className={`font-mono font-medium ${outstanding > 0 ? 'text-destructive' : ''}`}>₹{Math.max(0, outstanding).toLocaleString()}</p></div>
                  <div><span className="data-label">Profit</span><p className={`font-mono font-bold ${profit >= 0 ? 'text-success' : 'text-destructive'}`}>₹{profit.toLocaleString()}</p></div>
                </div>

                {/* Payment history */}
                {job.payments.length > 0 && (
                  <div className="mt-3 border-t pt-3">
                    <span className="data-label">Payment History</span>
                    {job.payments.map(p => (
                      <div key={p.id} className="flex justify-between text-sm mt-1">
                        <span>{p.date} {p.note && `— ${p.note}`}</span>
                        <span className="font-mono text-success">+₹{p.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}

                {job.internalCosts.length > 0 && (
                  <div className="mt-3 border-t pt-3">
                    <span className="data-label">Internal Costs</span>
                    {job.internalCosts.map(c => (
                      <div key={c.id} className="flex justify-between text-sm mt-1">
                        <span>{c.type}: {c.description}</span>
                        <span className="font-mono">₹{c.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {!job.billingGenerated && (
                    <Button size="sm" onClick={() => setBillDialogJob(job.id)}>
                      <FileText className="mr-1 h-3 w-3" />Generate Bill
                    </Button>
                  )}
                  {job.billingGenerated && job.paymentStatus !== 'paid' && (
                    <Button size="sm" variant="outline" onClick={() => setPayDialog(job.id)}>
                      <DollarSign className="mr-1 h-3 w-3" />Add Payment
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => setCostDialog(job.id)}>Add Cost</Button>
                  {job.paymentStatus === 'paid' && job.status !== 'closed' && (
                    <Button size="sm" variant="outline" onClick={() => closeJob(job.id)}>Close Job</Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {billDialogJob && <BillDialog jobId={billDialogJob} onClose={() => setBillDialogJob(null)} />}
      {payDialog && <PaymentDialog jobId={payDialog} onClose={() => setPayDialog(null)} />}
      {costDialog && <CostDialog jobId={costDialog} onClose={() => setCostDialog(null)} />}
    </div>
  );
};

function calculateBill(job: any): number {
  const drilling = (job.depthDrilled || 0) * job.drillingRatePerFoot;
  const casing = (job.casingUsedUnits || 0) * job.casingRatePerUnit;
  const services = job.services.reduce((s: number, svc: any) => {
    const qty = job.serviceQuantitiesUsed?.[svc.key] || 0;
    return s + svc.rate * qty;
  }, 0);
  const custom = job.customItems.reduce((s: number, ci: any) => {
    const qty = job.customQuantitiesUsed?.[ci.id] || 0;
    return s + ci.rate * qty;
  }, 0);
  return drilling + casing + services + custom;
}

function BillDialog({ jobId, onClose }: { jobId: string; onClose: () => void }) {
  const { jobs, generateBill } = useApp();
  const job = jobs.find(j => j.id === jobId)!;

  const drillingTotal = (job.depthDrilled || 0) * job.drillingRatePerFoot;
  const casingTotal = (job.casingUsedUnits || 0) * job.casingRatePerUnit;

  const [drillingRate, setDrillingRate] = useState(job.drillingRatePerFoot);
  const [casingRate, setCasingRate] = useState(job.casingRatePerUnit);
  const [serviceRates, setServiceRates] = useState<Record<string, number>>(
    Object.fromEntries(job.services.map(s => [s.key, s.rate]))
  );
  const [customRates, setCustomRates] = useState<Record<string, number>>(
    Object.fromEntries(job.customItems.map(c => [c.id, c.rate]))
  );

  const calcTotal = () => {
    let total = (job.depthDrilled || 0) * drillingRate + (job.casingUsedUnits || 0) * casingRate;
    job.services.forEach(svc => {
      const qty = job.serviceQuantitiesUsed?.[svc.key] || 0;
      total += (serviceRates[svc.key] || svc.rate) * qty;
    });
    job.customItems.forEach(ci => {
      const qty = job.customQuantitiesUsed?.[ci.id] || 0;
      total += (customRates[ci.id] || ci.rate) * qty;
    });
    return total;
  };

  const total = calcTotal();

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Generate Bill — {job.id}</DialogTitle></DialogHeader>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span>Drilling ({job.depthDrilled} ft × </span>
            <div className="flex items-center gap-1">
              <span>₹</span><Input type="number" className="w-20 h-7" value={drillingRate} onChange={e => setDrillingRate(Number(e.target.value))} />
              <span>)</span>
            </div>
            <span className="font-mono">₹{((job.depthDrilled || 0) * drillingRate).toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Casing ({job.casingUsedUnits} × </span>
            <div className="flex items-center gap-1">
              <span>₹</span><Input type="number" className="w-20 h-7" value={casingRate} onChange={e => setCasingRate(Number(e.target.value))} />
              <span>)</span>
            </div>
            <span className="font-mono">₹{((job.casingUsedUnits || 0) * casingRate).toLocaleString()}</span>
          </div>
          {job.services.map(svc => {
            const qty = job.serviceQuantitiesUsed?.[svc.key] || 0;
            if (qty === 0) return null;
            return (
              <div key={svc.key} className="flex items-center justify-between">
                <span>{svc.name} ({qty} × </span>
                <div className="flex items-center gap-1">
                  <span>₹</span><Input type="number" className="w-20 h-7" value={serviceRates[svc.key]} onChange={e => setServiceRates(p => ({ ...p, [svc.key]: Number(e.target.value) }))} />
                  <span>)</span>
                </div>
                <span className="font-mono">₹{(qty * (serviceRates[svc.key] || 0)).toLocaleString()}</span>
              </div>
            );
          })}
          {job.customItems.map(ci => {
            const qty = job.customQuantitiesUsed?.[ci.id] || 0;
            if (qty === 0) return null;
            return (
              <div key={ci.id} className="flex items-center justify-between">
                <span>{ci.name} ({qty} × </span>
                <div className="flex items-center gap-1">
                  <span>₹</span><Input type="number" className="w-20 h-7" value={customRates[ci.id]} onChange={e => setCustomRates(p => ({ ...p, [ci.id]: Number(e.target.value) }))} />
                  <span>)</span>
                </div>
                <span className="font-mono">₹{(qty * (customRates[ci.id] || 0)).toLocaleString()}</span>
              </div>
            );
          })}
          <div className="flex justify-between border-t pt-2 font-bold text-base">
            <span>Total</span>
            <span className="font-mono">₹{total.toLocaleString()}</span>
          </div>
          <p className="text-xs text-muted-foreground">Advance paid: ₹{job.totalPaid.toLocaleString()} → Outstanding: ₹{Math.max(0, total - job.totalPaid).toLocaleString()}</p>
        </div>
        <Button className="w-full mt-3" onClick={() => { generateBill(jobId, total); onClose(); }}>Confirm & Generate Bill</Button>
      </DialogContent>
    </Dialog>
  );
}

function PaymentDialog({ jobId, onClose }: { jobId: string; onClose: () => void }) {
  const { jobs, addPayment } = useApp();
  const job = jobs.find(j => j.id === jobId)!;
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState('');
  const outstanding = (job.finalBillAmount || 0) - job.totalPaid;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Add Payment — {job.id}</DialogTitle></DialogHeader>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span>Total Bill</span><span className="font-mono">₹{(job.finalBillAmount || 0).toLocaleString()}</span></div>
          <div className="flex justify-between"><span>Total Paid</span><span className="font-mono text-success">₹{job.totalPaid.toLocaleString()}</span></div>
          <div className="flex justify-between font-bold"><span>Remaining</span><span className="font-mono text-destructive">₹{outstanding.toLocaleString()}</span></div>
        </div>
        <div className="space-y-3 mt-3">
          <div><Label>Payment Amount (₹)</Label><Input type="number" value={amount || ''} onChange={e => setAmount(Number(e.target.value))} /></div>
          <div><Label>Note (optional)</Label><Input value={note} onChange={e => setNote(e.target.value)} placeholder="Partial payment, cash..." /></div>
        </div>
        <Button className="w-full mt-3" disabled={!amount || amount <= 0} onClick={() => { addPayment(jobId, amount, note || undefined); onClose(); }}>Record Payment</Button>
      </DialogContent>
    </Dialog>
  );
}

function CostDialog({ jobId, onClose }: { jobId: string; onClose: () => void }) {
  const { addInternalCost } = useApp();
  const [type, setType] = useState('');
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState(0);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Add Internal Cost</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Type</Label><Input value={type} onChange={e => setType(e.target.value)} placeholder="Labor, Transport, Parts" /></div>
          <div><Label>Description</Label><Input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Brief description" /></div>
          <div><Label>Amount (₹)</Label><Input type="number" value={amount || ''} onChange={e => setAmount(Number(e.target.value))} /></div>
        </div>
        <Button className="w-full mt-3" disabled={!type || !amount} onClick={() => {
          addInternalCost({ type, description: desc, amount, category: 'job', date: new Date().toISOString().split('T')[0], jobId });
          onClose();
        }}>Add Cost</Button>
      </DialogContent>
    </Dialog>
  );
}

export default CompletedJobsPage;
