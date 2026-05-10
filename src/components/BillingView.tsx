'use client';

import { useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  IndianRupee,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Receipt,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

export default function BillingView() {
  const jobs = useStore((s) => s.jobs);
  const addPayment = useStore((s) => s.addPayment);
  const [paymentJob, setPaymentJob] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState<'cash' | 'upi' | 'bank_transfer' | 'cheque'>('upi');
  const [payNote, setPayNote] = useState('');

  const billableJobs = jobs.filter((j) => ['completed', 'billed', 'closed'].includes(j.status));

  const stats = useMemo(() => {
    const totalBilled = billableJobs.reduce((s, j) => s + (j.finalBillAmount || 0), 0);
    const totalCollected = billableJobs.reduce((s, j) => s + j.totalPaid, 0);
    const outstanding = totalBilled - totalCollected;
    const collectionRate = totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0;
    return { totalBilled, totalCollected, outstanding, collectionRate };
  }, [billableJobs]);

  // Monthly payment collection trend
  const paymentTrend = useMemo(() => {
    const monthMap = new Map<string, { collected: number; billed: number }>();
    billableJobs.forEach((j) => {
      if (j.finalBillAmount && j.completedAt) {
        const month = format(parseISO(j.completedAt), 'MMM yyyy');
        const existing = monthMap.get(month) || { collected: 0, billed: 0 };
        existing.billed += j.finalBillAmount;
        monthMap.set(month, existing);
      }
      j.payments.forEach((p) => {
        const month = format(parseISO(p.date), 'MMM yyyy');
        const existing = monthMap.get(month) || { collected: 0, billed: 0 };
        existing.collected += p.amount;
        monthMap.set(month, existing);
      });
    });
    return Array.from(monthMap.entries())
      .map(([month, data]) => ({ month, ...data }))
      .slice(-6);
  }, [billableJobs]);

  // Outstanding by customer
  const outstandingByCustomer = useMemo(() => {
    const map = new Map<string, number>();
    billableJobs.forEach((j) => {
      if (j.finalBillAmount) {
        const due = j.finalBillAmount - j.totalPaid;
        if (due > 0) {
          map.set(j.customerName, (map.get(j.customerName) || 0) + due);
        }
      }
    });
    return Array.from(map.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [billableJobs]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Receipt className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Total Billed</p>
            </div>
            <p className="text-lg font-bold font-mono">₹{stats.totalBilled.toLocaleString('en-IN')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <p className="text-xs text-muted-foreground">Collected</p>
            </div>
            <p className="text-lg font-bold font-mono text-emerald-600">₹{stats.totalCollected.toLocaleString('en-IN')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <p className="text-xs text-muted-foreground">Outstanding</p>
            </div>
            <p className="text-lg font-bold font-mono text-red-600">₹{stats.outstanding.toLocaleString('en-IN')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-amber-500" />
              <p className="text-xs text-muted-foreground">Collection Rate</p>
            </div>
            <p className="text-lg font-bold font-mono">{stats.collectionRate.toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Payment Collection Trend */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Payment Collection Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {paymentTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={paymentTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, '']} />
                  <Bar dataKey="billed" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Billed" />
                  <Bar dataKey="collected" fill="#10b981" radius={[4, 4, 0, 0]} name="Collected" />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">No billing data</div>
            )}
          </CardContent>
        </Card>

        {/* Outstanding by Customer */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Outstanding by Customer</CardTitle>
          </CardHeader>
          <CardContent>
            {outstandingByCustomer.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={outstandingByCustomer} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Outstanding']} />
                  <Bar dataKey="amount" fill="#ef4444" radius={[0, 4, 4, 0]} name="Outstanding" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">No outstanding payments</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Billable Jobs Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Billable Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Customer</th>
                  <th className="pb-2 pr-4 font-medium hidden sm:table-cell">Location</th>
                  <th className="pb-2 pr-4 font-medium">Billed</th>
                  <th className="pb-2 pr-4 font-medium">Paid</th>
                  <th className="pb-2 pr-4 font-medium">Due</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {billableJobs.map((job) => {
                  const due = (job.finalBillAmount || 0) - job.totalPaid;
                  return (
                    <tr key={job.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-2.5 pr-4 font-medium">{job.customerName}</td>
                      <td className="py-2.5 pr-4 text-muted-foreground hidden sm:table-cell">{job.location}</td>
                      <td className="py-2.5 pr-4 font-mono">{job.finalBillAmount ? `₹${job.finalBillAmount.toLocaleString('en-IN')}` : '—'}</td>
                      <td className="py-2.5 pr-4 font-mono text-emerald-600">₹{job.totalPaid.toLocaleString('en-IN')}</td>
                      <td className={`py-2.5 pr-4 font-mono font-medium ${due > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        ₹{due.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 pr-4">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            job.paymentStatus === 'paid'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                              : job.paymentStatus === 'partial'
                                ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300'
                          }`}
                        >
                          {job.paymentStatus}
                        </Badge>
                      </td>
                      <td className="py-2.5">
                        {due > 0 && (
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setPaymentJob(job.id)}>
                            <IndianRupee className="h-3 w-3" /> Pay
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Payment Dialog */}
      <Dialog open={!!paymentJob} onOpenChange={() => setPaymentJob(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <Input type="number" value={payAmount || ''} onChange={(e) => setPayAmount(Number(e.target.value))} placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label>Method</Label>
              <Select value={payMethod} onValueChange={(v) => setPayMethod(v as typeof payMethod)}>
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
              <Input value={payNote} onChange={(e) => setPayNote(e.target.value)} placeholder="Reference..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentJob(null)}>Cancel</Button>
            <Button onClick={() => {
              if (!paymentJob || payAmount <= 0) { toast.error('Enter a valid amount'); return; }
              addPayment(paymentJob, { amount: payAmount, date: new Date().toISOString().split('T')[0], method: payMethod, note: payNote || undefined });
              setPaymentJob(null);
              setPayAmount(0);
              setPayNote('');
              toast.success('Payment recorded!');
            }}>Add Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
