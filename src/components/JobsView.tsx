'use client';

import { useState } from 'react';
import { useMounted } from '@/lib/utils';
import { useStore } from '@/lib/store';
import { PREDEFINED_SERVICES } from '@/lib/types';
import type { CasingType, ServiceItem, CustomItem } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Search,
  Plus,
  MapPin,
  Phone,
  Calendar,
  Play,
  ChevronRight,
  ChevronLeft,
  IndianRupee,
  X,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  active: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
};

export default function JobsView() {
  const mounted = useMounted();
  const jobs = useStore((s) => s.jobs);
  const addJob = useStore((s) => s.addJob);
  const startJob = useStore((s) => s.startJob);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'active'>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [startConfirmId, setStartConfirmId] = useState<string | null>(null);

  const filteredJobs = jobs
    .filter((j) => j.status === 'scheduled' || j.status === 'active')
    .filter((j) => {
      if (statusFilter !== 'all' && j.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return j.customerName.toLowerCase().includes(q) || j.location.toLowerCase().includes(q) || j.mobile.includes(q);
      }
      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleStartJob = (id: string) => {
    startJob(id);
    setStartConfirmId(null);
    toast.success('Job started successfully!');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Active Jobs</h2>
          <p className="text-sm text-muted-foreground">{filteredJobs.length} jobs in progress</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Job
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, location, mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="active">Active</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Job Cards */}
      {filteredJobs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-4 mb-3">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No jobs found</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setCreateOpen(true)}>
              Create New Job
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredJobs.map((job) => (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{job.customerName}</p>
                    <p className="text-xs text-muted-foreground font-mono">{job.id}</p>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_COLORS[job.status]}`}>
                    {job.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{job.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3 w-3" />
                    <span>{job.mobile}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    <span>{mounted ? format(parseISO(job.scheduledDate), 'dd MMM yyyy') : job.scheduledDate}</span>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Drill Rate</p>
                    <p className="font-mono font-medium">₹{job.drillingRatePerFoot}/ft</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{job.casingType} Casing</p>
                    <p className="font-mono font-medium">₹{job.casingRatePerUnit}/unit</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Advance</p>
                    <p className="font-mono font-medium text-emerald-600">₹{job.advanceReceived.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Services</p>
                    <p className="font-medium">{job.services.length} items</p>
                  </div>
                </div>

                {job.status === 'scheduled' && (
                  <Button
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => setStartConfirmId(job.id)}
                  >
                    <Play className="h-3.5 w-3.5" />
                    Start Job
                  </Button>
                )}
                {job.status === 'active' && (
                  <Badge variant="outline" className="w-full justify-center py-1.5 bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
                    In Progress
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Start Job Confirmation */}
      <Dialog open={!!startConfirmId} onOpenChange={() => setStartConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Job</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to start this job? The status will change from Scheduled to Active.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStartConfirmId(null)}>Cancel</Button>
            <Button onClick={() => startConfirmId && handleStartJob(startConfirmId)}>Start Job</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Job Dialog */}
      <CreateJobDialog open={createOpen} onOpenChange={setCreateOpen} onSubmit={(data) => {
        addJob(data);
        setCreateOpen(false);
        toast.success('Job created successfully!');
      }} />
    </div>
  );
}

function CreateJobDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (data: Parameters<ReturnType<typeof useStore>['addJob']>[0]) => void;
}) {
  const [step, setStep] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [mobile, setMobile] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [drillingRatePerFoot, setDrillingRatePerFoot] = useState(350);
  const [casingType, setCasingType] = useState<CasingType>('GI');
  const [casingRatePerUnit, setCasingRatePerUnit] = useState(450);
  const [selectedServices, setSelectedServices] = useState<Record<string, boolean>>({});
  const [customItems, setCustomItems] = useState<CustomItem[]>([]);
  const [advanceReceived, setAdvanceReceived] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setStep(1);
    setCustomerName('');
    setMobile('');
    setLocation('');
    setDescription('');
    setScheduledDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setDrillingRatePerFoot(350);
    setCasingType('GI');
    setCasingRatePerUnit(450);
    setSelectedServices({});
    setCustomItems([]);
    setAdvanceReceived(0);
    setErrors({});
  };

  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!customerName.trim()) errs.customerName = 'Customer name is required';
    if (!mobile.trim()) errs.mobile = 'Mobile number is required';
    else if (!/^[6-9]\d{9}$/.test(mobile)) errs.mobile = 'Enter a valid 10-digit Indian mobile number';
    if (!location.trim()) errs.location = 'Location is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs: Record<string, string> = {};
    if (!scheduledDate) errs.scheduledDate = 'Schedule date is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleSubmit = () => {
    const services: ServiceItem[] = PREDEFINED_SERVICES
      .filter((s) => selectedServices[s.key])
      .map((s) => ({ key: s.key, name: s.name, rate: s.defaultRate, quantity: 1 }));

    onSubmit({
      customerName: customerName.trim(),
      mobile: mobile.trim(),
      location: location.trim(),
      description: description.trim() || undefined,
      scheduledDate,
      notes: notes.trim() || undefined,
      drillingRatePerFoot,
      casingType,
      casingRatePerUnit,
      services,
      customItems,
      advanceReceived,
    });
    resetForm();
  };

  const addCustomItem = () => {
    setCustomItems([...customItems, { id: `ci-${Date.now()}`, name: '', rate: 0, quantity: 1 }]);
  };

  const updateCustomItem = (id: string, field: keyof CustomItem, value: string | number) => {
    setCustomItems(customItems.map((ci) => (ci.id === id ? { ...ci, [field]: value } : ci)));
  };

  const removeCustomItem = (id: string) => {
    setCustomItems(customItems.filter((ci) => ci.id !== id));
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle>Create New Job</DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {s}
              </div>
              {s < 3 && <div className={`h-0.5 w-8 ${step > s ? 'bg-primary' : 'bg-muted'}`} />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name *</Label>
              <Input id="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Enter customer name" />
              {errors.customerName && <p className="text-xs text-destructive">{errors.customerName}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number *</Label>
              <Input id="mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="9876543210" maxLength={10} />
              {errors.mobile && <p className="text-xs text-destructive">{errors.mobile}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Sector, City, State" />
              {errors.location && <p className="text-xs text-destructive">{errors.location}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Job details..." rows={2} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="scheduledDate">Scheduled Date *</Label>
              <Input id="scheduledDate" type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
              {errors.scheduledDate && <p className="text-xs text-destructive">{errors.scheduledDate}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Special instructions, soil expectations..." rows={3} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Drilling Rate (₹/ft)</Label>
                <Input type="number" value={drillingRatePerFoot} onChange={(e) => setDrillingRatePerFoot(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Casing Type</Label>
                <Select value={casingType} onValueChange={(v) => { setCasingType(v as CasingType); setCasingRatePerUnit(v === 'GI' ? 450 : 350); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GI">GI Casing</SelectItem>
                    <SelectItem value="PVC">PVC Casing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Casing Rate (₹/unit)</Label>
              <Input type="number" value={casingRatePerUnit} onChange={(e) => setCasingRatePerUnit(Number(e.target.value))} />
            </div>

            <Separator />
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Services</Label>
              {PREDEFINED_SERVICES.map((svc) => (
                <div key={svc.key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={!!selectedServices[svc.key]}
                      onCheckedChange={(v) => setSelectedServices({ ...selectedServices, [svc.key]: v })}
                    />
                    <span className="text-sm">{svc.name}</span>
                  </div>
                  <span className="text-sm font-mono text-muted-foreground">₹{svc.defaultRate.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>

            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Custom Items</Label>
                <Button variant="outline" size="sm" onClick={addCustomItem} className="gap-1">
                  <Plus className="h-3 w-3" /> Add
                </Button>
              </div>
              {customItems.map((ci) => (
                <div key={ci.id} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Input placeholder="Item name" value={ci.name} onChange={(e) => updateCustomItem(ci.id, 'name', e.target.value)} />
                  </div>
                  <div className="w-24">
                    <Input type="number" placeholder="Rate" value={ci.rate || ''} onChange={(e) => updateCustomItem(ci.id, 'rate', Number(e.target.value))} />
                  </div>
                  <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => removeCustomItem(ci.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Separator />
            <div className="space-y-2">
              <Label>Advance Received (₹)</Label>
              <Input type="number" value={advanceReceived || ''} onChange={(e) => setAdvanceReceived(Number(e.target.value))} placeholder="0" />
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)} className="gap-1">
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
          )}
          {step < 3 ? (
            <Button onClick={handleNext} className="gap-1">
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit}>Create Job</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
