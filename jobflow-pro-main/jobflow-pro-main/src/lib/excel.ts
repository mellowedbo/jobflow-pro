import * as XLSX from 'xlsx';
import { Job, InventoryState, OverheadCost } from '@/types/job';

// ─── Export helpers ───

export function exportJobsToExcel(jobs: Job[]) {
  const data = jobs.map(j => ({
    'Job ID': j.id,
    'Customer': j.customerName,
    'Mobile': j.mobile,
    'Location': j.location,
    'Status': j.status,
    'Scheduled Date': j.scheduledDate,
    'Drilling Rate/ft': j.drillingRatePerFoot,
    'Casing Type': j.casingType,
    'Casing Rate/Unit': j.casingRatePerUnit,
    'Advance': j.advanceReceived,
    'Depth Drilled': j.depthDrilled || '',
    'Casing Used': j.casingUsedUnits || '',
    'Diesel Cost': j.dieselCost || '',
    'Soil Type': j.soilType || '',
    'Bill Amount': j.finalBillAmount || '',
    'Total Paid': j.totalPaid,
    'Payment Status': j.paymentStatus,
    'Rating': j.rating || '',
  }));
  downloadExcel(data, 'Jobs');
}

export function exportInventoryToExcel(inventory: InventoryState) {
  const items = inventory.items.map(i => ({
    'Item': i.name,
    'Unit': i.unit,
    'Opening Stock': i.openingStock,
    'Purchased': i.totalPurchased,
    'Used': i.totalUsed,
    'Destroyed': i.totalDestroyed,
    'Closing Stock': i.currentStock,
  }));
  const transactions = inventory.transactions.map(t => ({
    'Date': t.date,
    'Item ID': t.itemId,
    'Type': t.type,
    'Quantity': t.quantity,
    'Cost/Unit': t.costPerUnit,
    'Total Cost': t.totalCost,
    'Supplier': t.supplier || '',
    'Job': t.jobId || '',
    'Note': t.note || '',
  }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(items), 'Items');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(transactions), 'Transactions');
  XLSX.writeFile(wb, 'Inventory_Ledger.xlsx');
}

export function exportProfitLossToExcel(jobs: Job[], overheadCosts: OverheadCost[], inventory: InventoryState) {
  const jobsWithData = jobs.filter(j => ['completed', 'billed', 'closed'].includes(j.status));
  const totalRevenue = jobsWithData.reduce((s, j) => s + (j.finalBillAmount || 0), 0);
  const totalDiesel = jobsWithData.reduce((s, j) => s + (j.dieselCost || 0), 0);
  const totalJobCosts = jobsWithData.reduce((s, j) => s + j.internalCosts.reduce((ss, c) => ss + c.amount, 0), 0);
  const totalOverhead = overheadCosts.reduce((s, c) => s + c.amount, 0);
  const destroyedLoss = inventory.transactions.filter(t => t.type === 'destroyed').reduce((s, t) => s + t.totalCost, 0);

  const data = [
    { 'Category': 'Revenue', 'Amount': totalRevenue },
    { 'Category': 'Diesel Costs', 'Amount': -totalDiesel },
    { 'Category': 'Job Costs', 'Amount': -totalJobCosts },
    { 'Category': 'Overhead Costs', 'Amount': -totalOverhead },
    { 'Category': 'Destroyed Inventory', 'Amount': -destroyedLoss },
    { 'Category': 'NET PROFIT', 'Amount': totalRevenue - totalDiesel - totalJobCosts - totalOverhead - destroyedLoss },
  ];
  downloadExcel(data, 'Profit_Loss');
}

export function exportCustomerStatementsToExcel(jobs: Job[]) {
  const data = jobs.filter(j => j.billingGenerated).map(j => ({
    'Job ID': j.id,
    'Customer': j.customerName,
    'Mobile': j.mobile,
    'Location': j.location,
    'Bill Amount': j.finalBillAmount || 0,
    'Total Paid': j.totalPaid,
    'Outstanding': (j.finalBillAmount || 0) - j.totalPaid,
    'Payment Status': j.paymentStatus,
    'Payments': j.payments.map(p => `${p.date}: ₹${p.amount}${p.note ? ` (${p.note})` : ''}`).join('; '),
  }));
  downloadExcel(data, 'Customer_Statements');
}

function downloadExcel(data: any[], name: string) {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), name);
  XLSX.writeFile(wb, `${name}.xlsx`);
}

// ─── Import helpers ───

export function parseExcelFile(file: File): Promise<any[][]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const sheets = wb.SheetNames.map(name => XLSX.utils.sheet_to_json(wb.Sheets[name]));
        resolve(sheets);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
