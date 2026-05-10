'use client';

import { useMemo } from 'react';
import { useStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileDown,
  FileUp,
  FileSpreadsheet,
  Receipt,
  TrendingDown,
  Users,
  Package,
  Briefcase,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ReportsView() {
  const jobs = useStore((s) => s.jobs);
  const inventoryItems = useStore((s) => s.inventoryItems);
  const inventoryTransactions = useStore((s) => s.inventoryTransactions);
  const overheadCosts = useStore((s) => s.overheadCosts);

  const reportCards = useMemo(() => {
    const completedJobs = jobs.filter((j) => ['completed', 'billed', 'closed'].includes(j.status));
    const billableJobs = completedJobs.filter((j) => j.finalBillAmount);
    return [
      {
        id: 'jobs',
        title: 'Jobs Report',
        description: 'Complete listing of all jobs with customer details, rates, completion data, and billing information.',
        icon: Briefcase,
        records: jobs.length,
        color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400',
      },
      {
        id: 'inventory',
        title: 'Inventory Ledger',
        description: 'Full inventory accounting with opening balances, purchases, usage, damage, and closing stock valuations.',
        icon: Package,
        records: inventoryItems.length,
        color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400',
      },
      {
        id: 'pnl',
        title: 'P&L Statement',
        description: 'Profit and Loss statement with revenue, cost breakdown, overheads, and net profit analysis.',
        icon: TrendingDown,
        records: billableJobs.length,
        color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400',
      },
      {
        id: 'customers',
        title: 'Customer Statements',
        description: 'Per-customer summaries with job history, payment records, and outstanding balances.',
        icon: Users,
        records: new Set(jobs.map((j) => j.customerName)).size,
        color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-400',
      },
    ];
  }, [jobs, inventoryItems]);

  const handleExport = (reportId: string) => {
    let csvContent = '';
    let filename = '';

    switch (reportId) {
      case 'jobs': {
        const headers = ['ID', 'Customer', 'Mobile', 'Location', 'Status', 'Scheduled Date', 'Drilling Rate', 'Casing Type', 'Casing Rate', 'Advance', 'Depth Drilled', 'Casing Used', 'Diesel Cost', 'Soil Type', 'Bill Amount', 'Total Paid', 'Payment Status', 'Rating'];
        const rows = jobs.map((j) => [
          j.id, j.customerName, j.mobile, j.location, j.status, j.scheduledDate,
          j.drillingRatePerFoot, j.casingType, j.casingRatePerUnit, j.advanceReceived,
          j.depthDrilled || '', j.casingUsedUnits || '', j.dieselCost || '', j.soilType || '',
          j.finalBillAmount || '', j.totalPaid, j.paymentStatus, j.rating || ''
        ]);
        csvContent = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
        filename = 'jobs_report.csv';
        break;
      }
      case 'inventory': {
        const headers = ['Item', 'Unit', 'Opening', 'Purchased', 'Used', 'Destroyed', 'Closing', 'Cost/Unit', 'Value'];
        const rows = inventoryItems.map((i) => [
          i.name, i.unit, i.openingStock, i.totalPurchased, i.totalUsed, i.totalDestroyed,
          i.currentStock, i.costPerUnit, i.currentStock * i.costPerUnit
        ]);
        csvContent = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
        filename = 'inventory_ledger.csv';
        break;
      }
      case 'pnl': {
        const headers = ['Job ID', 'Customer', 'Revenue', 'Diesel', 'Job Costs', 'Total Cost', 'Profit', 'Margin %'];
        const rows = jobs.filter((j) => j.finalBillAmount).map((j) => {
          const diesel = j.dieselCost || 0;
          const otherCosts = j.internalCosts.reduce((s, c) => s + c.amount, 0);
          const totalCost = diesel + otherCosts;
          const profit = (j.finalBillAmount || 0) - totalCost;
          const margin = (j.finalBillAmount || 0) > 0 ? ((profit / (j.finalBillAmount || 1)) * 100).toFixed(1) : '0';
          return [j.id, j.customerName, j.finalBillAmount, diesel, otherCosts, totalCost, profit, margin];
        });
        csvContent = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
        filename = 'pnl_statement.csv';
        break;
      }
      case 'customers': {
        const customerMap = new Map<string, { jobs: number; revenue: number; paid: number; mobile: string }>();
        jobs.forEach((j) => {
          const existing = customerMap.get(j.customerName) || { jobs: 0, revenue: 0, paid: 0, mobile: j.mobile };
          existing.jobs += 1;
          existing.revenue += j.finalBillAmount || 0;
          existing.paid += j.totalPaid;
          customerMap.set(j.customerName, existing);
        });
        const headers = ['Customer', 'Mobile', 'Total Jobs', 'Total Revenue', 'Total Paid', 'Outstanding'];
        const rows = Array.from(customerMap.entries()).map(([name, data]) => [
          name, data.mobile, data.jobs, data.revenue, data.paid, data.revenue - data.paid
        ]);
        csvContent = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
        filename = 'customer_statements.csv';
        break;
      }
    }

    if (csvContent) {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(`${reportId === 'jobs' ? 'Jobs Report' : reportId === 'inventory' ? 'Inventory Ledger' : reportId === 'pnl' ? 'P&L Statement' : 'Customer Statements'} exported!`);
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        toast.info(`Import from "${file.name}" is a preview feature. Data would be validated and imported.`);
      }
    };
    input.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold">Reports & Export</h2>
        <p className="text-sm text-muted-foreground">Generate and export reports as CSV files</p>
      </div>

      {/* Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportCards.map((report) => {
          const Icon = report.icon;
          return (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className={`rounded-lg p-2.5 ${report.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{report.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{report.description}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px]">
                    {report.records} record{report.records !== 1 ? 's' : ''}
                  </Badge>
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => handleExport(report.id)}>
                    <FileDown className="h-3.5 w-3.5" />
                    Export CSV
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Import Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <FileUp className="h-4 w-4" />
            Import Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border-2 border-dashed p-6 text-center">
            <FileSpreadsheet className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-3">
              Upload a CSV file to import data into the system
            </p>
            <Button variant="outline" size="sm" onClick={handleImport} className="gap-1.5">
              <FileUp className="h-3.5 w-3.5" />
              Choose File
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Data Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Total Jobs</p>
              <p className="font-mono font-bold text-lg">{jobs.length}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Inventory Items</p>
              <p className="font-mono font-bold text-lg">{inventoryItems.length}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Transactions</p>
              <p className="font-mono font-bold text-lg">{inventoryTransactions.length}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Overhead Entries</p>
              <p className="font-mono font-bold text-lg">{overheadCosts.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
