import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, Upload } from 'lucide-react';
import {
  exportJobsToExcel,
  exportInventoryToExcel,
  exportProfitLossToExcel,
  exportCustomerStatementsToExcel,
  parseExcelFile,
} from '@/lib/excel';

const ExcelPage: React.FC = () => {
  const { jobs, inventory, overheadCosts } = useApp();
  const [importResult, setImportResult] = useState<string | null>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const sheets = await parseExcelFile(file);
      setImportResult(`Parsed ${sheets.length} sheet(s) with ${sheets.reduce((s, sh) => s + sh.length, 0)} total rows. Import logic can be customized per data type.`);
    } catch {
      setImportResult('Failed to parse file. Please ensure it is a valid .xlsx file.');
    }
    e.target.value = '';
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold">Excel Import / Export</h1>
          <p className="text-sm text-muted-foreground">Download reports or import data</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <div className="stat-card cursor-pointer hover:border-primary" onClick={() => exportJobsToExcel(jobs)}>
          <div className="flex items-center gap-3">
            <Download className="h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold">Export All Jobs</p>
              <p className="text-xs text-muted-foreground">{jobs.length} jobs</p>
            </div>
          </div>
        </div>
        <div className="stat-card cursor-pointer hover:border-primary" onClick={() => exportInventoryToExcel(inventory)}>
          <div className="flex items-center gap-3">
            <Download className="h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold">Export Inventory Ledger</p>
              <p className="text-xs text-muted-foreground">Items + transactions</p>
            </div>
          </div>
        </div>
        <div className="stat-card cursor-pointer hover:border-primary" onClick={() => exportProfitLossToExcel(jobs, overheadCosts, inventory)}>
          <div className="flex items-center gap-3">
            <Download className="h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold">Export Profit & Loss</p>
              <p className="text-xs text-muted-foreground">Full P&L breakdown</p>
            </div>
          </div>
        </div>
        <div className="stat-card cursor-pointer hover:border-primary" onClick={() => exportCustomerStatementsToExcel(jobs)}>
          <div className="flex items-center gap-3">
            <Download className="h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold">Export Customer Statements</p>
              <p className="text-xs text-muted-foreground">Bills + payment history</p>
            </div>
          </div>
        </div>
      </div>

      {/* Import */}
      <h2 className="mb-4 text-lg font-semibold">Import Data</h2>
      <div className="rounded-lg border bg-card p-6">
        <p className="text-sm text-muted-foreground mb-4">Upload an Excel file (.xlsx) to import jobs, inventory, costs, or payments.</p>
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <Upload className="h-4 w-4" />
          <span className="text-sm font-medium">Choose File</span>
          <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
        </label>
        {importResult && (
          <div className="mt-4 rounded-lg border bg-muted/50 p-4 text-sm">
            {importResult}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExcelPage;
