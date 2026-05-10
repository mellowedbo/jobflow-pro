'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import type { Job, Payment } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Search,
  Star,
  Receipt,
  IndianRupee,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Phone,
  MapPin,
  Calendar,
  Ruler,
  Fuel,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import CompleteJobDialog from './CompleteJobDialog';

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  billed: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  closed: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

export default function CompletedJobsView() {
  const jobs = useStore((s) => s.jobs);
  const generateBill = useStore((s) => s.generateBill);
  const addPayment = useStore((s) => s.addPayment);
  const addJobCost = useStore((s) => s.addJobCost);
  const rateJob = useStore((s) => s.rateJob);
  const closeJob = useStore((s) => s.closeJob);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'billed' | 'closed'>('all');
  const [billJob, setBillJob] = useState<Job | null>(null);
  const [paymentJob, setPaymentJob] = useState<Job | null>(null);
  const [costJob, setCostJob] = useState<Job | null>(null);
  const [closeConfirmId, setCloseConfirmId] = useState<string | null>(null);
  const [completeJob, setCompleteJob] = useState<Job | null>(null);

  const completedJobs = jobs
    .filter((j) => ['completed', 'billed', 'closed'].includes(j.status))
    .filter((j) => {
      if (statusFilter !== 'all' && j.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return j.customerName.toLowerCase().includes(q) || j.location.toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime());

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Completed Jobs</h2>
          <p className="text-sm text-muted-foreground">{completedJobs.length} jobs completed</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search jobs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="billed">Billed</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Active jobs that can be completed */}
      {jobs.filter((j) => j.status === 'active').length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
          <CardContent className="p-4">
            <p className="text-sm font-medium mb-3 flex items-center gap-2">
              <Fuel className="h-4 w-4 text-amber-600" />
              Active Jobs Ready for Completion
            </p>
            <div className="flex flex-wrap gap-2">
              {jobs.filter((j) => j.status === 'active').map((job) => (
                <Button key={job.id} variant="outline" size="sm" onClick={() => setCompleteJob(job)} className="gap-1">
                  {job.customerName} — {job.location}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Job Cards */}
      {completedJobs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No completed jobs yet</p>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-3">
          {completedJobs.map((job) => (
            <AccordionItem key={job.id} value={job.id} className="border rounded-lg px-0">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex flex-1 items-center justify-between gap-3 text-left">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{job.customerName}</p>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_COLORS[job.status]}`}>
                        {job.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{job.location} | {job.completedAt ? format(parseISO(job.completedAt), 'dd MMM yyyy') : '—'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono text-sm font-bold">
                      {job.finalBillAmount ? `₹${job.finalBillAmount.toLocaleString('en-IN')}` : 'Not Billed'}
                    </p>
                    <StarRating rating={job.rating || 0} onRate={(r) => rateJob(job.id, r)} />
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4">
                  {/* Job details grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Ruler className="h-3 w-3 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Depth</p>
                        <p className="font-mono font-medium">{job.depthDrilled} ft</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Layers className="h-3 w-3 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Casing ({job.casingType})</p>
                        <p className="font-mono font-medium">{job.casingUsedUnits} units</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Fuel className="h-3 w-3 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Diesel</p>
                        <p className="font-mono font-medium">₹{(job.dieselCost || 0).toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Soil</p>
                      <p className="font-medium">{job.soilType || '—'}</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Payment History */}
                  <div>
                    <p className="text-xs font-semibold mb-2">Payment History</p>
                    {job.payments.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No payments recorded</p>
                    ) : (
                      <div className="space-y-1.5">
                        {job.payments.map((p) => (
                          <div key={p.id} className="flex items-center justify-between text-xs rounded border p-2">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              <span className="font-mono">{format(parseISO(p.date), 'dd MMM yyyy')}</span>
                              {p.method && <Badge variant="outline" className="text-[9px]">{p.method}</Badge>}
                              {p.note && <span className="text-muted-foreground">— {p.note}</span>}
                            </div>
                            <span className="font-mono font-medium text-emerald-600">₹{p.amount.toLocaleString('en-IN')}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-between text-xs mt-2 pt-2 border-t">
                      <span className="text-muted-foreground">Total Paid</span>
                      <span className="font-mono font-bold text-emerald-600">₹{job.totalPaid.toLocaleString('en-IN')}</span>
                    </div>
                    {job.finalBillAmount && (
                      <div className="flex justify-between text-xs mt-1">
                        <span className="text-muted-foreground">Outstanding</span>
                        <span className={`font-mono font-bold ${(job.finalBillAmount - job.totalPaid) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          ₹{(job.finalBillAmount - job.totalPaid).toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Internal Costs */}
                  {job.internalCosts.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold mb-2">Internal Costs</p>
                      <div className="space-y-1">
                        {job.internalCosts.map((c) => (
                          <div key={c.id} className="flex justify-between text-xs">
                            <span className="text-muted-foreground">{c.description}</span>
                            <span className="font-mono">₹{c.amount.toLocaleString('en-IN')}</span>
                          </div>
                        ))}
                        <div className="flex justify-between text-xs font-medium border-t pt-1">
                          <span>Total Costs</span>
                          <span className="font-mono">₹{job.internalCosts.reduce((s, c) => s + c.amount, 0).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {job.status === 'completed' && !job.billingGenerated && (
                      <Button size="sm" className="gap-1" onClick={() => setBillJob(job)}>
                        <Receipt className="h-3.5 w-3.5" /> Generate Bill
                      </Button>
                    )}
                    {(job.status === 'completed' || job.status === 'billed') && (
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => setPaymentJob(job)}>
                        <IndianRupee className="h-3.5 w-3.5" /> Add Payment
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => setCostJob(job)}>
                      Add Cost
                    </Button>
                    {job.status === 'billed' && job.paymentStatus === 'paid' && (
                      <Button size="sm" variant="default" className="gap-1" onClick={() => setCloseConfirmId(job.id)}>
                        <CheckCircle2 className="h-3.5 w-3.5" /> Close Job
                      </Button>
                    )}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {/* Complete Job Dialog */}
      <CompleteJobDialog
        job={completeJob}
        open={!!completeJob}
        onOpenChange={(v) => setCompleteJob(v ? completeJob : null)}
      />

      {/* Generate Bill Dialog */}
      {billJob && <GenerateBillDialog job={billJob} open={!!billJob} onOpenChange={(v) => setBillJob(v ? billJob : null)} />}

      {/* Add Payment Dialog */}
      {paymentJob && <AddPaymentDialog job={paymentJob} open={!!paymentJob} onOpenChange={(v) => setPaymentJob(v ? paymentJob : null)} />}

      {/* Add Cost Dialog */}
      {costJob && <AddCostDialog job={costJob} open={!!costJob} onOpenChange={(v) => setCostJob(v ? costJob : null)} />}

      {/* Close Job Confirmation */}
      <Dialog open={!!closeConfirmId} onOpenChange={() => setCloseConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Job</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to close this job? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseConfirmId(null)}>Cancel</Button>
            <Button onClick={() => {
              if (closeConfirmId) {
                closeJob(closeConfirmId);
                setCloseConfirmId(null);
                toast.success('Job closed successfully!');
              }
            }}>Close Job</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StarRating({ rating, onRate }: { rating: number; onRate: (r: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={(e) => { e.stopPropagation(); onRate(star); }}
          className="p-0 hover:scale-110 transition-transform"
        >
          <Star
            className={`h-3 w-3 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`}
          />
        </button>
      ))}
    </div>
  );
}

function GenerateBillDialog({ job, open, onOpenChange }: { job: Job; open: boolean; onOpenChange: (v: boolean) => void }) {
  const generateBill = useStore((s) => s.generateBill);
  const [drillingRate, setDrillingRate] = useState(job.drillingRatePerFoot);
  const [casingRate, setCasingRate] = useState(job.casingRatePerUnit);

  const drillingTotal = (job.depthDrilled || 0) * drillingRate;
  const casingTotal = (job.casingUsedUnits || 0) * casingRate;
  const servicesTotal = job.services.reduce((s, svc) => {
    const qty = job.serviceQuantitiesUsed?.[svc.key] ?? svc.quantity;
    return s + svc.rate * qty;
  }, 0);
  const customTotal = job.customItems.reduce((s, ci) => {
    const qty = job.customQuantitiesUsed?.[ci.id] ?? ci.quantity;
    return s + ci.rate * qty;
  }, 0);
  const total = drillingTotal + casingTotal + servicesTotal + customTotal;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Bill — {job.customerName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Drilling Rate (₹/ft)</Label>
              <Input type="number" value={drillingRate} onChange={(e) => setDrillingRate(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Casing Rate (₹/unit)</Label>
              <Input type="number" value={casingRate} onChange={(e) => setCasingRate(Number(e.target.value))} />
            </div>
          </div>

          <div className="rounded-lg border bg-muted/50 p-3 space-y-1 text-sm">
            <div className="flex justify-between"><span>Drilling ({job.depthDrilled} ft × ₹{drillingRate})</span><span className="font-mono">₹{drillingTotal.toLocaleString('en-IN')}</span></div>
            <div className="flex justify-between"><span>Casing ({job.casingUsedUnits} × ₹{casingRate})</span><span className="font-mono">₹{casingTotal.toLocaleString('en-IN')}</span></div>
            <div className="flex justify-between"><span>Services</span><span className="font-mono">₹{servicesTotal.toLocaleString('en-IN')}</span></div>
            {customTotal > 0 && <div className="flex justify-between"><span>Custom Items</span><span className="font-mono">₹{customTotal.toLocaleString('en-IN')}</span></div>}
            <div className="flex justify-between"><span>Advance</span><span className="font-mono text-red-600">- ₹{job.advanceReceived.toLocaleString('en-IN')}</span></div>
            <Separator />
            <div className="flex justify-between font-bold"><span>Total Bill</span><span className="font-mono">₹{total.toLocaleString('en-IN')}</span></div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => { generateBill(job.id, total); onOpenChange(false); toast.success('Bill generated!'); }}>
            Generate Bill
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddPaymentDialog({ job, open, onOpenChange }: { job: Job; open: boolean; onOpenChange: (v: boolean) => void }) {
  const addPayment = useStore((s) => s.addPayment);
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<'cash' | 'upi' | 'bank_transfer' | 'cheque'>('cash');
  const [note, setNote] = useState('');

  const outstanding = (job.finalBillAmount || 0) - job.totalPaid;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Payment — {job.customerName}</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">Outstanding: ₹{outstanding.toLocaleString('en-IN')}</p>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Amount (₹)</Label>
            <Input type="number" value={amount || ''} onChange={(e) => setAmount(Number(e.target.value))} placeholder="0" />
          </div>
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select value={method} onValueChange={(v) => setMethod(v as typeof method)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Note</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Payment reference..." />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => {
            if (amount <= 0) { toast.error('Enter a valid amount'); return; }
            addPayment(job.id, { amount, date: new Date().toISOString().split('T')[0], method, note: note || undefined });
            onOpenChange(false);
            toast.success('Payment recorded!');
          }}>Add Payment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddCostDialog({ job, open, onOpenChange }: { job: Job; open: boolean; onOpenChange: (v: boolean) => void }) {
  const addJobCost = useStore((s) => s.addJobCost);
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Cost — {job.customerName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Cost Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="labour">Labour</SelectItem>
                <SelectItem value="diesel">Diesel</SelectItem>
                <SelectItem value="material">Material</SelectItem>
                <SelectItem value="transport">Transport</SelectItem>
                <SelectItem value="misc">Miscellaneous</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Cost description" />
          </div>
          <div className="space-y-2">
            <Label>Amount (₹)</Label>
            <Input type="number" value={amount || ''} onChange={(e) => setAmount(Number(e.target.value))} placeholder="0" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => {
            if (!type || !description || amount <= 0) { toast.error('Fill all fields'); return; }
            addJobCost(job.id, { type, category: 'job', description, amount, date: new Date().toISOString().split('T')[0] });
            onOpenChange(false);
            toast.success('Cost added!');
          }}>Add Cost</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
