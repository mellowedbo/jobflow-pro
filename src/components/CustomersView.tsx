'use client';

import { useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Users,
  Search,
  Phone,
  MapPin,
  Briefcase,
  IndianRupee,
  Star,
  Calendar,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface CustomerData {
  name: string;
  mobile: string;
  jobs: number;
  totalRevenue: number;
  totalPaid: number;
  outstanding: number;
  locations: string[];
  jobIds: string[];
  ratings: number[];
}

export default function CustomersView() {
  const jobs = useStore((s) => s.jobs);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);

  // Aggregate by customer
  const customers = useMemo(() => {
    const map = new Map<string, CustomerData>();
    jobs.forEach((j) => {
      const key = j.customerName.toLowerCase().trim();
      const existing = map.get(key) || {
        name: j.customerName,
        mobile: j.mobile,
        jobs: 0,
        totalRevenue: 0,
        totalPaid: 0,
        outstanding: 0,
        locations: [],
        jobIds: [],
        ratings: [],
      };
      existing.jobs += 1;
      existing.totalRevenue += j.finalBillAmount || 0;
      existing.totalPaid += j.totalPaid;
      existing.outstanding += (j.finalBillAmount || 0) - j.totalPaid;
      if (!existing.locations.includes(j.location)) existing.locations.push(j.location);
      existing.jobIds.push(j.id);
      if (j.rating) existing.ratings.push(j.rating);
      map.set(key, existing);
    });
    return Array.from(map.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [jobs]);

  const filtered = customers.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.mobile.includes(q) || c.locations.some((l) => l.toLowerCase().includes(q));
  });

  const selectedData = selectedCustomer ? customers.find((c) => c.name === selectedCustomer) : null;
  const selectedJobs = selectedData ? jobs.filter((j) => selectedData.jobIds.includes(j.id)) : [];

  const totalCustomers = customers.length;
  const totalOutstanding = customers.reduce((s, c) => s + c.outstanding, 0);
  const avgRating = customers.reduce((s, c) => s + (c.ratings.length > 0 ? c.ratings.reduce((a, b) => a + b, 0) / c.ratings.length : 0), 0) / (customers.filter((c) => c.ratings.length > 0).length || 1);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3">
            <p className="text-[10px] text-muted-foreground uppercase">Total Customers</p>
            <p className="text-lg font-bold">{totalCustomers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-[10px] text-muted-foreground uppercase">Outstanding</p>
            <p className="text-lg font-bold font-mono text-red-600">₹{totalOutstanding.toLocaleString('en-IN')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-[10px] text-muted-foreground uppercase">Avg Rating</p>
            <p className="text-lg font-bold">{avgRating > 0 ? avgRating.toFixed(1) : '—'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Customer Cards */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No customers found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((customer) => (
            <Card
              key={customer.name}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedCustomer(customer.name)}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-sm">{customer.name}</p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                      <Phone className="h-3 w-3" />
                      <span>{customer.mobile}</span>
                    </div>
                  </div>
                  {customer.ratings.length > 0 && (
                    <div className="flex items-center gap-0.5">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-mono">{(customer.ratings.reduce((a, b) => a + b, 0) / customer.ratings.length).toFixed(1)}</span>
                    </div>
                  )}
                </div>

                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{customer.locations.join(', ')}</span>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Jobs</p>
                    <p className="font-medium flex items-center gap-1">
                      <Briefcase className="h-3 w-3" /> {customer.jobs}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Revenue</p>
                    <p className="font-mono font-medium text-emerald-600">₹{customer.totalRevenue.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Paid</p>
                    <p className="font-mono font-medium">₹{customer.totalPaid.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Due</p>
                    <p className={`font-mono font-medium ${customer.outstanding > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      ₹{customer.outstanding.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Customer Detail Dialog */}
      <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <DialogTitle>{selectedData?.name}</DialogTitle>
          </DialogHeader>
          {selectedData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedData.mobile}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedData.jobs} jobs</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Revenue</p>
                  <p className="font-mono font-bold text-sm text-emerald-600">₹{selectedData.totalRevenue.toLocaleString('en-IN')}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Paid</p>
                  <p className="font-mono font-bold text-sm">₹{selectedData.totalPaid.toLocaleString('en-IN')}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Outstanding</p>
                  <p className={`font-mono font-bold text-sm ${selectedData.outstanding > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    ₹{selectedData.outstanding.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-semibold mb-3">All Jobs</p>
                <div className="space-y-2">
                  {selectedJobs.map((job) => {
                    const statusColors: Record<string, string> = {
                      scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
                      active: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
                      completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
                      billed: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
                      closed: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
                    };
                    return (
                      <div key={job.id} className="rounded-lg border p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-muted-foreground">{job.id}</span>
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusColors[job.status] || ''}`}>
                              {job.status}
                            </span>
                          </div>
                          {job.finalBillAmount && (
                            <span className="font-mono text-sm font-bold">₹{job.finalBillAmount.toLocaleString('en-IN')}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>{job.location}</span>
                          <span className="mx-1">|</span>
                          <Calendar className="h-3 w-3" />
                          <span>{format(parseISO(job.scheduledDate), 'dd MMM yyyy')}</span>
                        </div>
                        {job.depthDrilled && (
                          <div className="flex gap-3 text-xs">
                            <span>Depth: <span className="font-mono">{job.depthDrilled}ft</span></span>
                            <span>Casing: <span className="font-mono">{job.casingType} ({job.casingUsedUnits})</span></span>
                            <span>Paid: <span className="font-mono text-emerald-600">₹{job.totalPaid.toLocaleString('en-IN')}</span></span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
