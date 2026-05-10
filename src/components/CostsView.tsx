'use client';

import { useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  IndianRupee,
  Fuel,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Plus,
  Calculator,
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
  LineChart,
  Line,
} from 'recharts';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

export default function CostsView() {
  const jobs = useStore((s) => s.jobs);
  const overheadCosts = useStore((s) => s.overheadCosts);
  const inventoryItems = useStore((s) => s.inventoryItems);
  const inventoryTransactions = useStore((s) => s.inventoryTransactions);
  const addOverheadCost = useStore((s) => s.addOverheadCost);

  const [addOverheadOpen, setAddOverheadOpen] = useState(false);

  // Calculate stats
  const stats = useMemo(() => {
    const revenue = jobs.filter((j) => j.finalBillAmount).reduce((s, j) => s + (j.finalBillAmount || 0), 0);
    const diesel = jobs.reduce((s, j) => s + (j.dieselCost || 0), 0);
    const jobCosts = jobs.reduce((s, j) => s + j.internalCosts.reduce((cs, c) => cs + c.amount, 0), 0);
    const overheads = overheadCosts.reduce((s, c) => s + c.amount, 0);
    const destroyedLoss = inventoryTransactions
      .filter((tx) => tx.type === 'destroyed')
      .reduce((s, tx) => s + tx.totalCost, 0);
    const netProfit = revenue - diesel - jobCosts - overheads - destroyedLoss;

    return { revenue, diesel, jobCosts, overheads, destroyedLoss, netProfit };
  }, [jobs, overheadCosts, inventoryTransactions]);

  // Monthly P&L
  const monthlyPL = useMemo(() => {
    const monthMap = new Map<string, { revenue: number; costs: number; profit: number }>();

    // Revenue
    jobs.filter((j) => j.finalBillAmount && j.completedAt).forEach((j) => {
      const month = format(parseISO(j.completedAt!), 'MMM yyyy');
      const existing = monthMap.get(month) || { revenue: 0, costs: 0, profit: 0 };
      existing.revenue += j.finalBillAmount || 0;
      monthMap.set(month, existing);
    });

    // Job costs
    jobs.forEach((j) => {
      if (j.completedAt) {
        const month = format(parseISO(j.completedAt), 'MMM yyyy');
        const existing = monthMap.get(month) || { revenue: 0, costs: 0, profit: 0 };
        const costs = j.internalCosts.reduce((s, c) => s + c.amount, 0) + (j.dieselCost || 0);
        existing.costs += costs;
        monthMap.set(month, existing);
      }
    });

    // Overheads
    overheadCosts.forEach((c) => {
      const month = format(parseISO(c.date), 'MMM yyyy');
      const existing = monthMap.get(month) || { revenue: 0, costs: 0, profit: 0 };
      existing.costs += c.amount;
      monthMap.set(month, existing);
    });

    return Array.from(monthMap.entries())
      .map(([month, data]) => ({ month, ...data, profit: data.revenue - data.costs }))
      .slice(-6);
  }, [jobs, overheadCosts]);

  // Per-job breakdown
  const jobBreakdown = useMemo(() => {
    return jobs
      .filter((j) => j.finalBillAmount)
      .map((j) => {
        const revenue = j.finalBillAmount || 0;
        const diesel = j.dieselCost || 0;
        const otherCosts = j.internalCosts.reduce((s, c) => s + c.amount, 0);
        const totalCost = diesel + otherCosts;
        const profit = revenue - totalCost;
        const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
        return { id: j.id, customer: j.customerName, revenue, diesel, otherCosts, totalCost, profit, margin };
      })
      .sort((a, b) => b.profit - a.profit);
  }, [jobs]);

  // Overhead categories grouped
  const overheadCategories = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    overheadCosts.forEach((c) => {
      const existing = map.get(c.category) || { total: 0, count: 0 };
      existing.total += c.amount;
      existing.count += 1;
      map.set(c.category, { total: existing.total, count: existing.count });
    });
    return Array.from(map.entries()).map(([category, data]) => ({ category, ...data }));
  }, [overheadCosts]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card>
          <CardContent className="p-3">
            <p className="text-[10px] text-muted-foreground uppercase">Revenue</p>
            <p className="text-sm font-bold font-mono text-emerald-600">₹{(stats.revenue / 100000).toFixed(1)}L</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-[10px] text-muted-foreground uppercase">Diesel</p>
            <p className="text-sm font-bold font-mono text-amber-600">₹{(stats.diesel / 100000).toFixed(1)}L</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-[10px] text-muted-foreground uppercase">Job Costs</p>
            <p className="text-sm font-bold font-mono text-orange-600">₹{(stats.jobCosts / 100000).toFixed(1)}L</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-[10px] text-muted-foreground uppercase">Overheads</p>
            <p className="text-sm font-bold font-mono text-red-600">₹{(stats.overheads / 100000).toFixed(1)}L</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-[10px] text-muted-foreground uppercase">Destroyed Loss</p>
            <p className="text-sm font-bold font-mono text-red-600">₹{(stats.destroyedLoss / 100000).toFixed(1)}L</p>
          </CardContent>
        </Card>
        <Card className={stats.netProfit >= 0 ? 'border-emerald-200 dark:border-emerald-800' : 'border-red-200 dark:border-red-800'}>
          <CardContent className="p-3">
            <p className="text-[10px] text-muted-foreground uppercase">Net Profit</p>
            <p className={`text-sm font-bold font-mono ${stats.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              ₹{(stats.netProfit / 100000).toFixed(1)}L
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Profit Formula */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm flex-wrap">
            <Calculator className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-semibold">Formula:</span>
            <span className="font-mono text-emerald-600">Revenue</span>
            <span className="text-muted-foreground">—</span>
            <span className="font-mono text-amber-600">Diesel</span>
            <span className="text-muted-foreground">—</span>
            <span className="font-mono text-orange-600">Job Costs</span>
            <span className="text-muted-foreground">—</span>
            <span className="font-mono text-red-600">Overheads</span>
            <span className="text-muted-foreground">—</span>
            <span className="font-mono text-red-600">Destroyed Loss</span>
            <span className="text-muted-foreground">=</span>
            <span className={`font-mono font-bold ${stats.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              ₹{stats.netProfit.toLocaleString('en-IN')}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Monthly P&L Chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Monthly P&L Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyPL.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyPL}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, '']} />
                <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} name="Revenue" />
                <Bar dataKey="costs" fill="#ef4444" radius={[4, 4, 0, 0]} name="Costs" />
                <Bar dataKey="profit" fill="#6366f1" radius={[4, 4, 0, 0]} name="Profit" />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">No data</div>
          )}
        </CardContent>
      </Card>

      {/* Per-Job Breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Per-Job Profit Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Diesel</TableHead>
                  <TableHead className="text-right">Other Costs</TableHead>
                  <TableHead className="text-right">Total Cost</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead className="text-right">Margin %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobBreakdown.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.customer}</TableCell>
                    <TableCell className="text-right font-mono">₹{row.revenue.toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-right font-mono text-amber-600">₹{row.diesel.toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-right font-mono text-orange-600">₹{row.otherCosts.toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-right font-mono text-red-600">₹{row.totalCost.toLocaleString('en-IN')}</TableCell>
                    <TableCell className={`text-right font-mono font-bold ${row.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      ₹{row.profit.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className={`text-[10px] ${row.margin >= 20 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : row.margin >= 0 ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300' : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'}`}>
                        {row.margin.toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Overhead Costs */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Overhead Costs</CardTitle>
            <Button size="sm" variant="outline" className="gap-1" onClick={() => setAddOverheadOpen(true)}>
              <Plus className="h-3 w-3" /> Add Cost
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Category Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {overheadCategories.map((cat) => (
              <div key={cat.category} className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">{cat.category}</p>
                <p className="font-mono font-bold text-sm">₹{cat.total.toLocaleString('en-IN')}</p>
                <p className="text-[10px] text-muted-foreground">{cat.count} entries</p>
              </div>
            ))}
          </div>

          {/* Detailed table */}
          <div className="overflow-x-auto max-h-64 overflow-y-auto custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Recurring</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overheadCosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((cost) => (
                  <TableRow key={cost.id}>
                    <TableCell className="font-mono text-xs">{format(parseISO(cost.date), 'dd MMM yyyy')}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{cost.category}</Badge></TableCell>
                    <TableCell className="text-sm">{cost.description}</TableCell>
                    <TableCell className="text-right font-mono">₹{cost.amount.toLocaleString('en-IN')}</TableCell>
                    <TableCell>{cost.recurring ? <Badge variant="outline" className="text-[9px] bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">Recurring</Badge> : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Overhead Dialog */}
      <AddOverheadDialog open={addOverheadOpen} onOpenChange={setAddOverheadOpen} />
    </div>
  );
}

function AddOverheadDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const addOverheadCost = useStore((s) => s.addOverheadCost);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [recurring, setRecurring] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Overhead Cost</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Rent">Rent</SelectItem>
                <SelectItem value="Salary">Salary</SelectItem>
                <SelectItem value="Maintenance">Maintenance</SelectItem>
                <SelectItem value="Insurance">Insurance</SelectItem>
                <SelectItem value="Utilities">Utilities</SelectItem>
                <SelectItem value="Transport">Transport</SelectItem>
                <SelectItem value="Misc">Miscellaneous</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Cost description" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <Input type="number" value={amount || ''} onChange={(e) => setAmount(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="recurring" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} className="rounded" />
            <Label htmlFor="recurring" className="text-sm">Recurring cost</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => {
            if (!category || !description || amount <= 0) { toast.error('Fill all fields'); return; }
            addOverheadCost({ category, description, amount, date, recurring });
            onOpenChange(false);
            toast.success('Overhead cost added!');
          }}>Add Cost</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
