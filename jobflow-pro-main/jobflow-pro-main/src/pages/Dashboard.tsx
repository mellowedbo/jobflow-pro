import React from 'react';
import { useApp } from '@/context/AppContext';
import { Briefcase, CheckCircle2, Clock, DollarSign, Package, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Dashboard: React.FC = () => {
  const { jobs, inventory, overheadCosts } = useApp();

  const activeJobs = jobs.filter(j => j.status === 'scheduled' || j.status === 'active');
  const completedJobs = jobs.filter(j => ['completed', 'billed', 'closed'].includes(j.status));
  const totalRevenue = jobs.reduce((s, j) => s + (j.finalBillAmount || 0), 0);
  const totalJobCosts = jobs.reduce((s, j) => s + j.internalCosts.reduce((ss, c) => ss + c.amount, 0) + (j.dieselCost || 0), 0);
  const totalOverheadCosts = overheadCosts.reduce((s, c) => s + c.amount, 0);

  // COGS from inventory
  const inventoryCOGS = inventory.transactions
    .filter(t => t.type === 'used')
    .reduce((s, t) => s + t.totalCost, 0);
  const destroyedLoss = inventory.transactions
    .filter(t => t.type === 'destroyed')
    .reduce((s, t) => s + t.totalCost, 0);

  const totalCosts = totalJobCosts + totalOverheadCosts;
  const realProfit = totalRevenue - totalJobCosts - totalOverheadCosts - destroyedLoss;
  const outstandingPayments = jobs.reduce((s, j) => s + Math.max(0, (j.finalBillAmount || 0) - j.totalPaid), 0);

  const inventoryValue = inventory.transactions
    .filter(t => t.type === 'purchase')
    .reduce((s, t) => s + t.totalCost, 0) - inventoryCOGS - destroyedLoss;

  const lowStockItems = inventory.items.filter(i => i.currentStock < i.openingStock * 0.2);

  const pendingPaymentJobs = jobs.filter(j => j.billingGenerated && j.paymentStatus !== 'paid');

  // Monthly data for charts
  const months = ['Jan', 'Feb'];
  const monthlyRevenue = months.map((m, i) => ({
    month: m,
    revenue: jobs.filter(j => j.completedAt && new Date(j.completedAt).getMonth() === i).reduce((s, j) => s + (j.finalBillAmount || 0), 0),
    expenses: jobs.filter(j => j.completedAt && new Date(j.completedAt).getMonth() === i).reduce((s, j) => s + (j.dieselCost || 0) + j.internalCosts.reduce((ss, c) => ss + c.amount, 0), 0),
  }));

  const stats = [
    { label: 'Active Jobs', value: activeJobs.length, icon: Briefcase, color: 'text-primary' },
    { label: 'Completed', value: completedJobs.length, icon: CheckCircle2, color: 'text-success' },
    { label: 'Revenue', value: `₹${(totalRevenue / 1000).toFixed(0)}K`, icon: DollarSign, color: 'text-success' },
    { label: 'Total Costs', value: `₹${(totalCosts / 1000).toFixed(0)}K`, icon: AlertTriangle, color: 'text-destructive' },
    { label: 'Profit / Loss', value: `₹${(realProfit / 1000).toFixed(0)}K`, icon: realProfit >= 0 ? TrendingUp : TrendingDown, color: realProfit >= 0 ? 'text-success' : 'text-destructive' },
    { label: 'Outstanding', value: `₹${(outstandingPayments / 1000).toFixed(0)}K`, icon: Clock, color: 'text-warning' },
    { label: 'Inventory Value', value: `₹${Math.max(0, inventoryValue / 1000).toFixed(0)}K`, icon: Package, color: 'text-primary' },
    { label: 'Low Stock Alerts', value: lowStockItems.length, icon: AlertTriangle, color: lowStockItems.length > 0 ? 'text-destructive' : 'text-success' },
  ];

  const COLORS = ['hsl(215, 60%, 50%)', 'hsl(38, 92%, 50%)', 'hsl(152, 60%, 38%)', 'hsl(0, 72%, 51%)'];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Real-time overview of your drilling operations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(stat => (
          <div key={stat.label} className="stat-card">
            <div className="flex items-center justify-between">
              <span className="data-label">{stat.label}</span>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <p className="data-value mt-2">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-5">
          <h3 className="mb-4 text-lg font-semibold">Monthly Revenue vs Expenses</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 87%)" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: number) => `₹${v.toLocaleString()}`} />
              <Bar dataKey="revenue" fill="hsl(152, 60%, 38%)" name="Revenue" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill="hsl(0, 72%, 51%)" name="Expenses" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border bg-card p-5">
          <h3 className="mb-4 text-lg font-semibold">Cost Breakdown</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Job Costs', value: totalJobCosts },
                  { name: 'Overheads', value: totalOverheadCosts },
                  { name: 'Inventory COGS', value: inventoryCOGS },
                  { name: 'Destroyed Stock', value: destroyedLoss },
                ].filter(d => d.value > 0)}
                cx="50%" cy="50%" outerRadius={80} dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {[0, 1, 2, 3].map(i => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => `₹${v.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Low stock alerts */}
      {lowStockItems.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold">🔴 Low Stock Alerts</h2>
          <div className="space-y-2">
            {lowStockItems.map(item => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                <span className="font-medium">{item.name}</span>
                <span className="font-mono text-destructive">{item.currentStock} {item.unit} remaining</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment reminders */}
      {pendingPaymentJobs.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold">⚠️ Payment Reminders</h2>
          <div className="space-y-2">
            {pendingPaymentJobs.map(job => (
              <div key={job.id} className="flex items-center justify-between rounded-lg border bg-card p-4">
                <div>
                  <span className="font-mono text-sm text-muted-foreground">{job.id}</span>
                  <p className="font-medium">{job.customerName}</p>
                  <p className="text-sm text-muted-foreground">{job.location}</p>
                </div>
                <div className="text-right">
                  <p className="data-label">Outstanding</p>
                  <p className="font-mono text-lg font-bold text-destructive">
                    ₹{((job.finalBillAmount || 0) - job.totalPaid).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Jobs */}
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold">Recent Jobs</h2>
        <div className="overflow-hidden rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Job ID</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Customer</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Location</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Rate/ft</th>
              </tr>
            </thead>
            <tbody>
              {jobs.slice(0, 5).map(job => (
                <tr key={job.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-mono text-sm">{job.id}</td>
                  <td className="px-4 py-3 font-medium">{job.customerName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{job.location}</td>
                  <td className="px-4 py-3">
                    <span className={`status-badge ${
                      job.status === 'scheduled' || job.status === 'active' ? 'status-active' :
                      job.status === 'completed' ? 'status-completed' :
                      job.status === 'billed' ? 'status-pending' : 'status-paid'
                    }`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">₹{job.drillingRatePerFoot}/ft</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
