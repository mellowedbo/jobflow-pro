import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';

const CostsPage: React.FC = () => {
  const { jobs, inventory, overheadCosts, addOverheadCost } = useApp();
  const [addOpen, setAddOpen] = useState(false);

  const jobsWithData = jobs.filter(j => ['completed', 'billed', 'closed'].includes(j.status));

  const totalRevenue = jobsWithData.reduce((s, j) => s + (j.finalBillAmount || 0), 0);
  const totalDiesel = jobsWithData.reduce((s, j) => s + (j.dieselCost || 0), 0);
  const totalJobCosts = jobsWithData.reduce((s, j) => s + j.internalCosts.reduce((ss, c) => ss + c.amount, 0), 0);
  const totalOverhead = overheadCosts.reduce((s, c) => s + c.amount, 0);

  const inventoryCOGS = inventory.transactions.filter(t => t.type === 'used').reduce((s, t) => s + t.totalCost, 0);
  const destroyedLoss = inventory.transactions.filter(t => t.type === 'destroyed').reduce((s, t) => s + t.totalCost, 0);

  const totalCosts = totalDiesel + totalJobCosts + totalOverhead;
  const realProfit = totalRevenue - totalDiesel - totalJobCosts - totalOverhead - destroyedLoss;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold">Costs & Profit Analysis</h1>
          <p className="text-sm text-muted-foreground">Full profit/loss with inventory accounting</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />Add Overhead Cost
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6 mb-8">
        <div className="stat-card"><span className="data-label">Revenue</span><p className="data-value mt-2">₹{totalRevenue.toLocaleString()}</p></div>
        <div className="stat-card"><span className="data-label">Diesel</span><p className="data-value mt-2">₹{totalDiesel.toLocaleString()}</p></div>
        <div className="stat-card"><span className="data-label">Job Costs</span><p className="data-value mt-2">₹{totalJobCosts.toLocaleString()}</p></div>
        <div className="stat-card"><span className="data-label">Overheads</span><p className="data-value mt-2">₹{totalOverhead.toLocaleString()}</p></div>
        <div className="stat-card"><span className="data-label">Destroyed Loss</span><p className="data-value mt-2 text-destructive">₹{destroyedLoss.toLocaleString()}</p></div>
        <div className="stat-card">
          <span className="data-label">Real Profit</span>
          <p className={`data-value mt-2 ${realProfit >= 0 ? 'text-success' : 'text-destructive'}`}>₹{realProfit.toLocaleString()}</p>
        </div>
      </div>

      {/* Profit formula */}
      <div className="rounded-lg border bg-card p-4 mb-8 text-sm">
        <p className="font-semibold mb-2">Profit Formula:</p>
        <p className="font-mono text-muted-foreground">
          Real Profit = Revenue (₹{totalRevenue.toLocaleString()}) − Diesel (₹{totalDiesel.toLocaleString()}) − Job Costs (₹{totalJobCosts.toLocaleString()}) − Overheads (₹{totalOverhead.toLocaleString()}) − Destroyed Loss (₹{destroyedLoss.toLocaleString()}) = <span className={realProfit >= 0 ? 'text-success' : 'text-destructive'}>₹{realProfit.toLocaleString()}</span>
        </p>
      </div>

      {/* Per-Job Breakdown */}
      <h2 className="mb-4 text-lg font-semibold">Per-Job Breakdown</h2>
      <div className="overflow-hidden rounded-lg border bg-card mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Job</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Customer</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Revenue</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Diesel</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Other Costs</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Profit</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Rating</th>
            </tr>
          </thead>
          <tbody>
            {jobsWithData.map(job => {
              const rev = job.finalBillAmount || 0;
              const costs = (job.dieselCost || 0) + job.internalCosts.reduce((s, c) => s + c.amount, 0);
              const profit = rev - costs;
              return (
                <tr key={job.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-mono">{job.id}</td>
                  <td className="px-4 py-3 font-medium">{job.customerName}</td>
                  <td className="px-4 py-3 text-right font-mono">₹{rev.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-mono">₹{(job.dieselCost || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-mono">₹{job.internalCosts.reduce((s, c) => s + c.amount, 0).toLocaleString()}</td>
                  <td className={`px-4 py-3 text-right font-mono font-bold ${profit >= 0 ? 'text-success' : 'text-destructive'}`}>₹{profit.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">{job.rating ? `${job.rating}★` : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Overhead costs */}
      <h2 className="mb-4 text-lg font-semibold">Overhead Costs</h2>
      <div className="overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Description</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Amount</th>
            </tr>
          </thead>
          <tbody>
            {overheadCosts.map(c => (
              <tr key={c.id} className="border-b last:border-0">
                <td className="px-4 py-3 font-mono text-xs">{c.date}</td>
                <td className="px-4 py-3">{c.category}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.description}</td>
                <td className="px-4 py-3 text-right font-mono">₹{c.amount.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {addOpen && <AddOverheadDialog onClose={() => setAddOpen(false)} />}
    </div>
  );
};

function AddOverheadDialog({ onClose }: { onClose: () => void }) {
  const { addOverheadCost } = useApp();
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Add Overhead Cost</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Category</Label><Input value={category} onChange={e => setCategory(e.target.value)} placeholder="Salary, Fuel, Maintenance..." /></div>
          <div><Label>Description</Label><Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description" /></div>
          <div><Label>Amount (₹)</Label><Input type="number" value={amount || ''} onChange={e => setAmount(Number(e.target.value))} /></div>
        </div>
        <Button className="w-full mt-3" disabled={!category || !amount} onClick={() => {
          addOverheadCost({ category, description, amount, date: new Date().toISOString().split('T')[0] });
          onClose();
        }}>Add Overhead</Button>
      </DialogContent>
    </Dialog>
  );
}

export default CostsPage;
