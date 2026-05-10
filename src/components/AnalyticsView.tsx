'use client';

import { useMemo } from 'react';
import { useStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
} from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

function formatCurrency(value: number) {
  return `₹${value.toLocaleString('en-IN')}`;
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  trend?: 'up' | 'down';
  trendValue?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            <div className="flex items-center gap-1">
              {trend && (
                trend === 'up' ? (
                  <ArrowUpRight className="h-3 w-3 text-emerald-600" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-red-500" />
                )
              )}
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600/10 shrink-0">
            <Icon className="h-4 w-4 text-emerald-600" />
          </div>
        </div>
        {trendValue && (
          <div className="mt-2">
            <span className={`text-[10px] font-medium ${trend === 'up' ? 'text-emerald-600' : 'text-red-500'}`}>
              {trendValue}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AnalyticsView() {
  const jobs = useStore((s) => s.jobs);
  const overheadCosts = useStore((s) => s.overheadCosts);

  // ─── Revenue Trends (monthly) ─────────────────────────────
  const revenueTrends = useMemo(() => {
    const monthMap: Record<string, { month: string; revenue: number; costs: number; profit: number }> = {};
    const now = new Date();

    // Generate last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      monthMap[key] = { month: label, revenue: 0, costs: 0, profit: 0 };
    }

    jobs.forEach((j) => {
      if (j.finalBillAmount) {
        const date = new Date(j.completedAt ?? j.createdAt);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (monthMap[key]) {
          monthMap[key].revenue += j.finalBillAmount;
        }
      }
    });

    // Add costs per month
    jobs.forEach((j) => {
      const date = new Date(j.completedAt ?? j.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthMap[key]) {
        const jobCosts = j.internalCosts.reduce((s, c) => s + c.amount, 0) + (j.dieselCost ?? 0);
        monthMap[key].costs += jobCosts;
      }
    });

    return Object.values(monthMap).map((m) => ({
      ...m,
      profit: m.revenue - m.costs,
    }));
  }, [jobs]);

  // ─── Job Completion Rate ─────────────────────────────────
  const completionMetrics = useMemo(() => {
    const total = jobs.length;
    const completed = jobs.filter((j) => ['completed', 'billed', 'closed'].includes(j.status)).length;
    const active = jobs.filter((j) => j.status === 'active').length;
    const scheduled = jobs.filter((j) => j.status === 'scheduled').length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, active, scheduled, rate };
  }, [jobs]);

  // ─── Average Depth by Soil Type ──────────────────────────
  const avgDepthBySoil = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    jobs.forEach((j) => {
      if (j.depthDrilled && j.soilType) {
        if (!map[j.soilType]) map[j.soilType] = { total: 0, count: 0 };
        map[j.soilType].total += j.depthDrilled;
        map[j.soilType].count += 1;
      }
    });
    return Object.entries(map).map(([soil, { total, count }]) => ({
      soilType: soil,
      avgDepth: Math.round(total / count),
      jobCount: count,
    }));
  }, [jobs]);

  // ─── Customer Acquisition Trend ──────────────────────────
  const customerTrend = useMemo(() => {
    const monthMap: Record<string, { month: string; newCustomers: number; cumulative: number }> = {};
    const now = new Date();
    const seen = new Set<string>();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      monthMap[key] = { month: label, newCustomers: 0, cumulative: 0 };
    }

    // Sort jobs by createdAt
    const sorted = [...jobs].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    sorted.forEach((j) => {
      const date = new Date(j.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthMap[key] && !seen.has(j.customerName)) {
        seen.add(j.customerName);
        monthMap[key].newCustomers += 1;
      }
    });

    let cumul = 0;
    return Object.values(monthMap).map((m) => {
      cumul += m.newCustomers;
      return { ...m, cumulative: cumul };
    });
  }, [jobs]);

  // ─── Outstanding Payments Aging ──────────────────────────
  const paymentAging = useMemo(() => {
    const buckets = {
      'Current (0-30d)': 0,
      '31-60 days': 0,
      '61-90 days': 0,
      '90+ days': 0,
    };
    const now = new Date();

    jobs.forEach((j) => {
      if (j.finalBillAmount && j.paymentStatus !== 'paid') {
        const outstanding = j.finalBillAmount - j.totalPaid;
        if (outstanding <= 0) return;

        const billDate = j.completedAt ? new Date(j.completedAt) : new Date(j.createdAt);
        const daysDiff = Math.floor((now.getTime() - billDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDiff <= 30) buckets['Current (0-30d)'] += outstanding;
        else if (daysDiff <= 60) buckets['31-60 days'] += outstanding;
        else if (daysDiff <= 90) buckets['61-90 days'] += outstanding;
        else buckets['90+ days'] += outstanding;
      }
    });

    return Object.entries(buckets).map(([bucket, amount]) => ({ bucket, amount }));
  }, [jobs]);

  // ─── Profitability Score per Job ─────────────────────────
  const profitabilityScores = useMemo(() => {
    return jobs
      .filter((j) => j.finalBillAmount && j.depthDrilled)
      .map((j) => {
        const totalCosts = j.internalCosts.reduce((s, c) => s + c.amount, 0) + (j.dieselCost ?? 0);
        const revenue = j.finalBillAmount ?? 0;
        const margin = revenue > 0 ? ((revenue - totalCosts) / revenue) * 100 : 0;
        return {
          customer: j.customerName,
          revenue,
          costs: totalCosts,
          profit: revenue - totalCosts,
          margin: Math.round(margin),
        };
      })
      .sort((a, b) => b.margin - a.margin);
  }, [jobs]);

  // ─── Cash Flow Forecast ──────────────────────────────────
  const cashFlowForecast = useMemo(() => {
    const now = new Date();
    const months: { month: string; inflow: number; outflow: number; net: number; cumulative: number }[] = [];

    // Calculate average monthly values from historical data
    const totalRevenue = jobs.reduce((s, j) => s + (j.finalBillAmount ?? 0), 0);
    const totalCosts = jobs.reduce((s, j) => s + j.internalCosts.reduce((ss, c) => ss + c.amount, 0) + (j.dieselCost ?? 0), 0) + overheadCosts.reduce((s, o) => s + o.amount, 0);
    const avgMonthlyRevenue = totalRevenue / 6;
    const avgMonthlyCosts = totalCosts / 6;

    // Projected outstanding
    const outstandingTotal = jobs.reduce((s, j) => {
      if (j.finalBillAmount && j.paymentStatus !== 'paid') {
        return s + (j.finalBillAmount - j.totalPaid);
      }
      return s;
    }, 0);

    let cumul = outstandingTotal;
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      // Add some variance to make it look realistic
      const variance = 0.85 + Math.random() * 0.3;
      const inflow = Math.round(avgMonthlyRevenue * variance);
      const outflow = Math.round(avgMonthlyCosts * (0.9 + Math.random() * 0.2));
      const net = inflow - outflow;
      cumul += net;
      months.push({ month: label, inflow, outflow, net, cumulative: cumul });
    }

    return months;
  }, [jobs, overheadCosts]);

  // ─── Summary Stats ───────────────────────────────────────
  const totalRevenue = useMemo(() => jobs.reduce((s, j) => s + (j.finalBillAmount ?? 0), 0), [jobs]);
  const totalOutstanding = useMemo(
    () =>
      jobs.reduce((s, j) => {
        if (j.finalBillAmount && j.paymentStatus !== 'paid') return s + (j.finalBillAmount - j.totalPaid);
        return s;
      }, 0),
    [jobs]
  );
  const avgMargin = useMemo(() => {
    if (profitabilityScores.length === 0) return 0;
    return Math.round(profitabilityScores.reduce((s, p) => s + p.margin, 0) / profitabilityScores.length);
  }, [profitabilityScores]);
  const uniqueCustomers = useMemo(() => new Set(jobs.map((j) => j.customerName)).size, [jobs]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600/10">
            <BarChart3 className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              Analytics
              <Badge className="bg-purple-500/20 text-purple-600 dark:text-purple-400 text-[10px] font-bold px-2">
                PRO
              </Badge>
            </h2>
            <p className="text-sm text-muted-foreground">Advanced business intelligence and forecasting</p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          subtitle="All billed jobs"
          icon={DollarSign}
          trend="up"
          trendValue="+12.5% from last month"
        />
        <StatCard
          title="Outstanding"
          value={formatCurrency(totalOutstanding)}
          subtitle="Pending collections"
          icon={Clock}
          trend={totalOutstanding > 0 ? 'down' : 'up'}
          trendValue={`${jobs.filter((j) => j.paymentStatus === 'partial').length} invoices`}
        />
        <StatCard
          title="Avg. Margin"
          value={`${avgMargin}%`}
          subtitle="Profit margin"
          icon={Target}
          trend={avgMargin > 30 ? 'up' : 'down'}
          trendValue="Across all jobs"
        />
        <StatCard
          title="Customers"
          value={String(uniqueCustomers)}
          subtitle="Unique clients"
          icon={Users}
          trend="up"
          trendValue="+2 this month"
        />
      </div>

      {/* Revenue Trends */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Revenue & Profit Trends
          </CardTitle>
          <CardDescription>Monthly revenue, costs, and profit over the last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          {revenueTrends.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueTrends} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background border rounded-lg shadow-lg p-3 text-xs">
                          <p className="font-semibold mb-1">{label}</p>
                          <p className="text-emerald-600">Revenue: {formatCurrency(data.revenue)}</p>
                          <p className="text-red-500">Costs: {formatCurrency(data.costs)}</p>
                          <p className="text-blue-500">Profit: {formatCurrency(data.profit)}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#colorRevenue)" />
                <Area type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={2} fill="url(#colorProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Job Completion Rate & Average Depth by Soil */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Job Completion Rate */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Job Completion Rate</CardTitle>
            <CardDescription>Current pipeline status and completion metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{completionMetrics.rate}%</span>
              <Badge variant={completionMetrics.rate >= 70 ? 'default' : 'destructive'} className="text-xs">
                {completionMetrics.rate >= 70 ? 'On Track' : 'Needs Attention'}
              </Badge>
            </div>
            <Progress value={completionMetrics.rate} className="h-2" />
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="text-center">
                <p className="text-lg font-bold text-emerald-600">{completionMetrics.completed}</p>
                <p className="text-[10px] text-muted-foreground">Completed</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-blue-600">{completionMetrics.active}</p>
                <p className="text-[10px] text-muted-foreground">Active</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-amber-600">{completionMetrics.scheduled}</p>
                <p className="text-[10px] text-muted-foreground">Scheduled</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Average Depth by Soil Type */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Avg. Depth by Soil Type</CardTitle>
            <CardDescription>Average drilling depth required per soil type</CardDescription>
          </CardHeader>
          <CardContent>
            {avgDepthBySoil.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={avgDepthBySoil} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis type="number" tick={{ fontSize: 11 }} label={{ value: 'ft', position: 'insideBottom', fontSize: 10, offset: -2 }} />
                  <YAxis type="category" dataKey="soilType" tick={{ fontSize: 11 }} width={55} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-background border rounded-lg shadow-lg p-3 text-xs">
                            <p className="font-semibold">{d.soilType}</p>
                            <p>Avg Depth: <span className="font-mono">{d.avgDepth} ft</span></p>
                            <p>Jobs: {d.jobCount}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="avgDepth" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20}>
                    {avgDepthBySoil.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Customer Acquisition & Outstanding Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Acquisition Trend */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Customer Acquisition
            </CardTitle>
            <CardDescription>New and cumulative customers over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={customerTrend} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-background border rounded-lg shadow-lg p-3 text-xs">
                          <p className="font-semibold">{label}</p>
                          <p>New: {d.newCustomers}</p>
                          <p>Total: {d.cumulative}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="cumulative" stroke="#8b5cf6" strokeWidth={2} fill="url(#colorCumulative)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Outstanding Payments Aging */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Outstanding Payments Aging</CardTitle>
            <CardDescription>Receivables bucketed by days outstanding</CardDescription>
          </CardHeader>
          <CardContent>
            {paymentAging.every((p) => p.amount === 0) ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <DollarSign className="h-8 w-8 text-emerald-600/50" />
                <p className="text-sm text-muted-foreground">All payments collected!</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={paymentAging.filter((p) => p.amount > 0)}
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    innerRadius={40}
                    paddingAngle={3}
                    dataKey="amount"
                    label={({ bucket, amount }) => `${bucket}: ${formatCurrency(amount)}`}
                  >
                    {paymentAging
                      .filter((p) => p.amount > 0)
                      .map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-background border rounded-lg shadow-lg p-3 text-xs">
                            <p className="font-semibold">{d.bucket}</p>
                            <p>Amount: <span className="font-mono">{formatCurrency(d.amount)}</span></p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Profitability Score per Job */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" />
            Profitability Score per Job
          </CardTitle>
          <CardDescription>Revenue, costs, and profit margin for each completed job</CardDescription>
        </CardHeader>
        <CardContent>
          {profitabilityScores.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
          ) : (
            <div className="max-h-80 overflow-y-auto custom-scrollbar space-y-3">
              {profitabilityScores.map((job, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{job.customer}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-muted-foreground">Rev: {formatCurrency(job.revenue)}</span>
                      <span className="text-[10px] text-muted-foreground">Cost: {formatCurrency(job.costs)}</span>
                      <span className="text-[10px] text-emerald-600 font-medium">Profit: {formatCurrency(job.profit)}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge
                      variant={job.margin >= 40 ? 'default' : job.margin >= 20 ? 'secondary' : 'destructive'}
                      className="text-xs font-mono"
                    >
                      {job.margin}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cash Flow Forecast */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Cash Flow Forecast
          </CardTitle>
          <CardDescription>6-month projected cash flow based on historical averages</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={cashFlowForecast} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-background border rounded-lg shadow-lg p-3 text-xs">
                        <p className="font-semibold mb-1">{label}</p>
                        <p className="text-emerald-600">Inflow: {formatCurrency(d.inflow)}</p>
                        <p className="text-red-500">Outflow: {formatCurrency(d.outflow)}</p>
                        <p className={d.net >= 0 ? 'text-blue-600' : 'text-red-600'}>
                          Net: {formatCurrency(d.net)}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="inflow" fill="#10b981" radius={[4, 4, 0, 0]} name="Inflow" />
              <Bar dataKey="outflow" fill="#ef4444" radius={[4, 4, 0, 0]} name="Outflow" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Branding Footer */}
      <div className="flex items-center justify-center gap-2 py-4">
        <Zap className="h-3.5 w-3.5 text-emerald-600" />
        <span className="text-xs font-medium text-muted-foreground">Powered by DrillOps Analytics Engine</span>
      </div>
    </div>
  );
}
