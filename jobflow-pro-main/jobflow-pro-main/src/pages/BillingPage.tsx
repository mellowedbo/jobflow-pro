import React from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const BillingPage: React.FC = () => {
  const { jobs } = useApp();
  const navigate = useNavigate();
  const billableJobs = jobs.filter(j => ['completed', 'billed', 'closed'].includes(j.status));

  const totalBilled = billableJobs.reduce((s, j) => s + (j.finalBillAmount || 0), 0);
  const totalCollected = billableJobs.reduce((s, j) => s + j.totalPaid, 0);
  const totalOutstanding = totalBilled - totalCollected;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold">Billing</h1>
          <p className="text-sm text-muted-foreground">Track invoices and payments</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <div className="stat-card">
          <span className="data-label">Total Billed</span>
          <p className="data-value mt-2">₹{totalBilled.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <span className="data-label">Collected</span>
          <p className="data-value mt-2 text-success">₹{totalCollected.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <span className="data-label">Outstanding</span>
          <p className="data-value mt-2 text-destructive">₹{totalOutstanding.toLocaleString()}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Job ID</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Customer</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Bill Status</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Bill Amount</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Paid</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Outstanding</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Payment</th>
            </tr>
          </thead>
          <tbody>
            {billableJobs.map(job => {
              const bill = job.finalBillAmount || 0;
              const outstanding = bill - job.totalPaid;
              return (
                <tr key={job.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-mono">{job.id}</td>
                  <td className="px-4 py-3 font-medium">{job.customerName}</td>
                  <td className="px-4 py-3">
                    <span className={`status-badge ${job.billingGenerated ? (job.paymentStatus === 'paid' ? 'status-paid' : 'status-pending') : 'status-active'}`}>
                      {!job.billingGenerated ? 'Not billed' : job.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{bill ? `₹${bill.toLocaleString()}` : '—'}</td>
                  <td className="px-4 py-3 text-right font-mono text-success">₹{job.totalPaid.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-mono text-destructive">{outstanding > 0 ? `₹${outstanding.toLocaleString()}` : '—'}</td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="ghost" onClick={() => navigate('/completed')}>
                      Manage →
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BillingPage;
