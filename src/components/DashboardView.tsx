'use client';

import { useMemo } from 'react';
import { useStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Briefcase,
  CheckCircle2,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Package,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';

const CHART_COLORS = ['#10b981', '#f59e0b', '#6366f1', '#ef4444', '#8b5cf6', '#06b6d4'];

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  variant = 'default',
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  trend?: number;
  trendLabel?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}) {
  const iconColorClass = {
    default: 'text-primary bg-primary/10',
    success: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400',
    warning: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400',
    danger: 'text-red-600 bg-red-50 dark:bg-red-950/40 dark:text-red-400',
  }[variant];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
            <p className="text-xl font-bold font-mono">{value}</p>
          </div>
          <div className={`rounded-lg p-2 ${iconColorClass}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        {trend !== undefined && (
          <div className="mt-2 flex items-center gap-1 text-xs">
            {trend >= 0 ? (
              <ArrowUpRight className="h-3 w-3 text-emerald-500" />
            ) : (
              <ArrowDownRight className="h-3 w-3 text-red-500" />
            )}
            <span className={trend >= 0 ? 'text-emerald-600' : 'text-red-600'}>
              {Math.abs(trend)}%
            </span>
            {trendLabel && <span className="text-muted-foreground ml-1">{trendLabel}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardView() {
  const jobs = useStore((s) => s.jobs);
  const inventoryItems = useStore((s) => s.inventoryItems);
  const overheadCosts = useStore((s) => s.overheadCosts);
  const activityLog = useStore((s) => s.activityLog);

  const stats = useMemo(() => {
    const activeJobs = jobs.filter((j) => j.status === 'active' || j.status === 'scheduled').length;
    const completedJobs = jobs.filter((j) => j.status === 'completed' || j.status === 'billed' || j.status === 'closed').length;
    const totalRevenue = jobs.filter((j) => j.finalBillAmount).reduce((sum, j) => sum + (j.finalBillAmount || 0), 0);
    const totalCollected = jobs.reduce((sum, j) => sum + j.totalPaid, 0);

    const totalJobCosts = jobs.reduce((sum, j) => {
      const diesel = j.dieselCost || 0;
      const otherCosts = j.internalCosts.reduce((cs, c) => cs + c.amount, 0);
      return sum + diesel + otherCosts;
    }, 0);
    const totalOverheads = overheadCosts.reduce((sum, c) => sum + c.amount, 0);
    const totalCosts = totalJobCosts + totalOverheads;
    const netProfit = totalCollected - totalCosts;
    const outstanding = totalRevenue - totalCollected;
    const inventoryValue = inventoryItems.reduce((sum, i) => sum + i.currentStock * i.costPerUnit, 0);
    const lowStockItems = inventoryItems.filter((i) => i.currentStock <= i.reorderLevel).length;

    return { activeJobs, completedJobs, totalRevenue, totalCosts, netProfit, outstanding, inventoryValue, lowStockItems, totalCollected };
  }, [jobs, inventoryItems, overheadCosts]);

  // Monthly revenue vs expenses
  const monthlyData = useMemo(() => {
    const monthMap = new Map<string, { revenue: number; expenses: number }>();

    // Revenue from billed/closed jobs
    jobs.filter((j) => j.finalBillAmount && j.completedAt).forEach((j) => {
      const month = format(parseISO(j.completedAt!), 'MMM yyyy');
      const existing = monthMap.get(month) || { revenue: 0, expenses: 0 };
      existing.revenue += j.finalBillAmount || 0;
      monthMap.set(month, existing);
    });

    // Job costs
    jobs.forEach((j) => {
      if (j.internalCosts.length > 0 && j.completedAt) {
        const month = format(parseISO(j.completedAt), 'MMM yyyy');
        const existing = monthMap.get(month) || { revenue: 0, expenses: 0 };
        const costs = j.internalCosts.reduce((s, c) => s + c.amount, 0) + (j.dieselCost || 0);
        existing.expenses += costs;
        monthMap.set(month, existing);
      }
    });

    // Overhead costs
    overheadCosts.forEach((c) => {
      const month = format(parseISO(c.date), 'MMM yyyy');
      const existing = monthMap.get(month) || { revenue: 0, expenses: 0 };
      existing.expenses += c.amount;
      monthMap.set(month, existing);
    });

    return Array.from(monthMap.entries())
      .map(([month, data]) => ({ month, ...data }))
      .slice(0, 6);
  }, [jobs, overheadCosts]);

  // Cost breakdown for pie chart
  const costBreakdown = useMemo(() => {
    const dieselTotal = jobs.reduce((s, j) => s + (j.dieselCost || 0), 0);
    const labourTotal = jobs.reduce((s, j) => s + j.internalCosts.filter((c) => c.type === 'labour').reduce((cs, c) => cs + c.amount, 0), 0);
    const otherJobCosts = jobs.reduce((s, j) => s + j.internalCosts.filter((c) => c.type !== 'labour' && c.type !== 'diesel').reduce((cs, c) => cs + c.amount, 0), 0);
    const overheadTotal = overheadCosts.reduce((s, c) => s + c.amount, 0);

    return [
      { name: 'Diesel', value: dieselTotal },
      { name: 'Labour', value: labourTotal },
      { name: 'Other Job Costs', value: otherJobCosts },
      { name: 'Overheads', value: overheadTotal },
    ].filter((d) => d.value > 0);
  }, [jobs, overheadCosts]);

  // Job status distribution
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    jobs.forEach((j) => { counts[j.status] = (counts[j.status] || 0) + 1; });
    const colors: Record<string, string> = {
      scheduled: '#3b82f6',
      active: '#f59e0b',
      completed: '#10b981',
      billed: '#8b5cf6',
      closed: '#6b7280',
    };
    return Object.entries(counts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      color: colors[status] || '#6b7280',
    }));
  }, [jobs]);

  // Revenue trend (last 6 months)
  const revenueTrend = useMemo(() => {
    const monthMap = new Map<string, number>();
    jobs.filter((j) => j.totalPaid > 0).forEach((j) => {
      const month = format(parseISO(j.createdAt), 'MMM yyyy');
      monthMap.set(month, (monthMap.get(month) || 0) + j.totalPaid);
    });
    return Array.from(monthMap.entries())
      .map(([month, amount]) => ({ month, amount }))
      .slice(-6);
  }, [jobs]);

  const lowStockItems = inventoryItems.filter((i) => i.currentStock <= i.reorderLevel);
  const recentActivities = activityLog.slice(0, 5);
  const recentJobs = [...jobs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  const outstandingJobs = jobs.filter((j) => j.finalBillAmount && j.totalPaid < j.finalBillAmount);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard title="Active Jobs" value={String(stats.activeJobs)} icon={Briefcase} variant="warning" />
        <StatCard title="Completed" value={String(stats.completedJobs)} icon={CheckCircle2} variant="success" />
        <StatCard title="Revenue" value={`₹${(stats.totalRevenue / 100000).toFixed(1)}L`} icon={IndianRupee} variant="success" />
        <StatCard title="Total Costs" value={`₹${(stats.totalCosts / 100000).toFixed(1)}L`} icon={TrendingDown} variant="danger" />
        <StatCard
          title="Net Profit"
          value={`₹${(stats.netProfit / 100000).toFixed(1)}L`}
          icon={TrendingUp}
          variant={stats.netProfit >= 0 ? 'success' : 'danger'}
        />
        <StatCard title="Outstanding" value={`₹${(stats.outstanding / 100000).toFixed(1)}L`} icon={IndianRupee} variant="warning" />
        <StatCard title="Inventory Value" value={`₹${(stats.inventoryValue / 100000).toFixed(1)}L`} icon={Package} />
        <StatCard
          title="Low Stock Alerts"
          value={String(stats.lowStockItems)}
          icon={AlertTriangle}
          variant={stats.lowStockItems > 0 ? 'danger' : 'success'}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue vs Expenses */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Revenue vs Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, '']} />
                  <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} name="Revenue" />
                  <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expenses" />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">No data available</div>
            )}
          </CardContent>
        </Card>

        {/* Cost Breakdown Pie */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {costBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={costBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {costBreakdown.map((_entry, idx) => (
                      <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, '']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">No cost data</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Second Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Job Status Donut */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Job Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Trend */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={revenueTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']} />
                  <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} dot={{ r: 4, fill: '#10b981' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">No data</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Low Stock Alerts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {lowStockItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">All items above reorder levels</p>
            ) : (
              lowStockItems.map((item) => (
                <div key={item.id} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{item.name}</span>
                    <span className="font-mono text-muted-foreground">{item.currentStock} / {item.reorderLevel} {item.unit}</span>
                  </div>
                  <Progress
                    value={Math.min((item.currentStock / item.reorderLevel) * 100, 100)}
                    className="h-2"
                  />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Payment Reminders */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-red-500" />
              Payment Reminders
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-52 overflow-y-auto custom-scrollbar">
            {outstandingJobs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No outstanding payments</p>
            ) : (
              outstandingJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between rounded-lg border p-2.5">
                  <div>
                    <p className="text-sm font-medium">{job.customerName}</p>
                    <p className="text-xs text-muted-foreground">{job.location}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-bold text-red-600">
                      ₹{((job.finalBillAmount || 0) - job.totalPaid).toLocaleString('en-IN')}
                    </p>
                    <Badge variant="outline" className="text-[10px]">{job.paymentStatus}</Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-52 overflow-y-auto custom-scrollbar">
            {recentActivities.map((log) => (
              <div key={log.id} className="flex gap-3 py-1.5 border-b last:border-0">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium">{log.action}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{log.details}</p>
                  <p className="text-[10px] text-muted-foreground/60 font-mono">
                    {format(parseISO(log.timestamp), 'dd MMM yyyy HH:mm')}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Jobs Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Recent Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">ID</th>
                  <th className="pb-2 pr-4 font-medium">Customer</th>
                  <th className="pb-2 pr-4 font-medium hidden sm:table-cell">Location</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentJobs.map((job) => (
                  <tr key={job.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-2.5 pr-4 font-mono text-xs">{job.id}</td>
                    <td className="py-2.5 pr-4 font-medium">{job.customerName}</td>
                    <td className="py-2.5 pr-4 text-muted-foreground hidden sm:table-cell">{job.location}</td>
                    <td className="py-2.5 pr-4">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="py-2.5 text-right font-mono">
                      {job.finalBillAmount ? `₹${job.finalBillAmount.toLocaleString('en-IN')}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    scheduled: 'secondary',
    active: 'outline',
    completed: 'secondary',
    billed: 'outline',
    closed: 'secondary',
  };
  const colors: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    active: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    billed: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
    closed: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${colors[status] || ''}`}>
      {status}
    </span>
  );
}
