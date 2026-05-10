import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Play, CheckCircle2 } from 'lucide-react';
import { CasingType, ServiceItem, CustomItem, PREDEFINED_SERVICES } from '@/types/job';
import CompleteJobDialog from '@/components/CompleteJobDialog';

const JobsPage: React.FC = () => {
  const { jobs, addJob, updateJob } = useApp();
  const [createOpen, setCreateOpen] = useState(false);
  const [completeJobId, setCompleteJobId] = useState<string | null>(null);

  const activeJobs = jobs.filter(j => j.status === 'scheduled' || j.status === 'active');

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold">Jobs</h1>
          <p className="text-sm text-muted-foreground">{activeJobs.length} active jobs</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />New Job</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Job</DialogTitle>
            </DialogHeader>
            <CreateJobForm onSubmit={(data) => { addJob(data); setCreateOpen(false); }} />
          </DialogContent>
        </Dialog>
      </div>

      {activeJobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-card p-12">
          <p className="text-muted-foreground">No active jobs. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {activeJobs.map(job => (
            <div key={job.id} className="rounded-lg border bg-card p-5 transition-all hover:shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs text-muted-foreground">{job.id}</span>
                  <h3 className="text-lg font-semibold">{job.customerName}</h3>
                  <p className="text-sm text-muted-foreground">{job.location}</p>
                  {job.description && <p className="mt-1 text-sm">{job.description}</p>}
                </div>
                <span className={`status-badge ${job.status === 'active' ? 'status-active' : 'status-pending'}`}>
                  {job.status}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="data-label">Scheduled</span>
                  <p className="font-medium">{job.scheduledDate}</p>
                </div>
                <div>
                  <span className="data-label">Casing</span>
                  <p className="font-medium">{job.casingType}</p>
                </div>
                <div>
                  <span className="data-label">Advance</span>
                  <p className="font-mono font-medium">₹{job.advanceReceived.toLocaleString()}</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="data-label">Drilling Rate</span>
                  <p className="font-mono font-medium">₹{job.drillingRatePerFoot}/ft</p>
                </div>
                <div>
                  <span className="data-label">Casing Rate</span>
                  <p className="font-mono font-medium">₹{job.casingRatePerUnit}/unit</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                {job.status === 'scheduled' && (
                  <Button size="sm" variant="outline" onClick={() => updateJob(job.id, { status: 'active' })}>
                    <Play className="mr-1 h-3 w-3" />Start
                  </Button>
                )}
                <Button size="sm" onClick={() => setCompleteJobId(job.id)}>
                  <CheckCircle2 className="mr-1 h-3 w-3" />Complete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {completeJobId && (
        <CompleteJobDialog jobId={completeJobId} open={!!completeJobId} onClose={() => setCompleteJobId(null)} />
      )}
    </div>
  );
};

function CreateJobForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    customerName: '', mobile: '', location: '', description: '',
    scheduledDate: '', notes: '',
    drillingRatePerFoot: 0, casingType: 'PVC' as CasingType, casingRatePerUnit: 0,
    services: PREDEFINED_SERVICES.map(s => ({ key: s.key, name: s.name, rate: s.defaultRate, quantity: 0 })) as ServiceItem[],
    customItems: [] as CustomItem[],
    advanceReceived: 0,
  });
  const [customName, setCustomName] = useState('');
  const [customRate, setCustomRate] = useState(0);

  const set = (key: string, val: any) => setForm(prev => ({ ...prev, [key]: val }));

  const addCustomItem = () => {
    if (!customName || !customRate) return;
    set('customItems', [...form.customItems, { id: `ci-${Date.now()}`, name: customName, rate: customRate, quantity: 1 }]);
    setCustomName('');
    setCustomRate(0);
  };

  const updateServiceRate = (key: string, rate: number) => {
    set('services', form.services.map(s => s.key === key ? { ...s, rate } : s));
  };

  const toggleService = (key: string) => {
    set('services', form.services.map(s => s.key === key ? { ...s, quantity: s.quantity > 0 ? 0 : 1 } : s));
  };

  const canProceed1 = form.customerName && form.mobile && form.location;
  const canProceed2 = form.scheduledDate;
  const canSubmit = form.drillingRatePerFoot > 0 && form.casingRatePerUnit > 0;

  return (
    <div className="space-y-4">
      {step === 1 && (
        <>
          <p className="text-sm text-muted-foreground">Step 1/3 — Customer Details</p>
          <div className="space-y-3">
            <div><Label>Customer Name *</Label><Input value={form.customerName} onChange={e => set('customerName', e.target.value)} placeholder="e.g. Rajesh Kumar" /></div>
            <div><Label>Mobile *</Label><Input value={form.mobile} onChange={e => set('mobile', e.target.value)} placeholder="9876543210" /></div>
            <div><Label>Location *</Label><Input value={form.location} onChange={e => set('location', e.target.value)} placeholder="Sector 14, Gurgaon" /></div>
            <div><Label>Description (optional)</Label><Textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Brief job description" /></div>
          </div>
          <Button className="w-full" disabled={!canProceed1} onClick={() => setStep(2)}>Next</Button>
        </>
      )}
      {step === 2 && (
        <>
          <p className="text-sm text-muted-foreground">Step 2/3 — Schedule & Notes</p>
          <div className="space-y-3">
            <div><Label>Scheduled Date *</Label><Input type="date" value={form.scheduledDate} onChange={e => set('scheduledDate', e.target.value)} /></div>
            <div><Label>Notes (optional)</Label><Textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Access details, special instructions" /></div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
            <Button className="flex-1" disabled={!canProceed2} onClick={() => setStep(3)}>Next</Button>
          </div>
        </>
      )}
      {step === 3 && (
        <>
          <p className="text-sm text-muted-foreground">Step 3/3 — Rates, Services & Advance</p>
          <div className="space-y-3">
            <div><Label>Drilling Rate Per Foot (₹) *</Label><Input type="number" value={form.drillingRatePerFoot || ''} onChange={e => set('drillingRatePerFoot', Number(e.target.value))} placeholder="100" /></div>
            <div>
              <Label>Casing Type *</Label>
              <Select value={form.casingType} onValueChange={v => set('casingType', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="GI">GI (Galvanized Iron)</SelectItem>
                  <SelectItem value="PVC">PVC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Casing Rate Per Unit (₹) *</Label><Input type="number" value={form.casingRatePerUnit || ''} onChange={e => set('casingRatePerUnit', Number(e.target.value))} placeholder="130" /></div>
            <div><Label>Advance Received (₹)</Label><Input type="number" value={form.advanceReceived || ''} onChange={e => set('advanceReceived', Number(e.target.value))} /></div>

            {/* Predefined services */}
            <div className="border-t pt-3">
              <Label className="text-sm font-semibold">Predefined Services</Label>
              <p className="text-xs text-muted-foreground mb-2">Toggle on and set rate. Quantity will be entered at completion.</p>
              {form.services.map(svc => (
                <div key={svc.key} className="flex items-center gap-2 mt-2">
                  <input type="checkbox" checked={svc.quantity > 0} onChange={() => toggleService(svc.key)} className="h-4 w-4 rounded border" />
                  <span className="text-sm flex-1">{svc.name}</span>
                  <Input type="number" className="w-24 h-8" value={svc.rate} onChange={e => updateServiceRate(svc.key, Number(e.target.value))} />
                  <span className="text-xs text-muted-foreground">/unit</span>
                </div>
              ))}
            </div>

            {/* Custom items */}
            <div className="border-t pt-3">
              <Label className="text-sm font-semibold">Custom Items</Label>
              <div className="mt-2 flex gap-2">
                <Input placeholder="Item name" value={customName} onChange={e => setCustomName(e.target.value)} className="flex-1" />
                <Input placeholder="Rate ₹" type="number" value={customRate || ''} onChange={e => setCustomRate(Number(e.target.value))} className="w-24" />
                <Button type="button" variant="outline" size="sm" onClick={addCustomItem}>Add</Button>
              </div>
              {form.customItems.map(item => (
                <div key={item.id} className="mt-1 flex justify-between text-sm">
                  <span>{item.name}</span>
                  <span className="font-mono">₹{item.rate}/unit</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>Back</Button>
            <Button className="flex-1" disabled={!canSubmit} onClick={() => onSubmit(form)}>Create Job</Button>
          </div>
        </>
      )}
    </div>
  );
}

export default JobsPage;
