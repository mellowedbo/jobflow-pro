import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CasingType } from '@/types/job';

interface Props {
  jobId: string;
  open: boolean;
  onClose: () => void;
}

const CompleteJobDialog: React.FC<Props> = ({ jobId, open, onClose }) => {
  const { jobs, completeJob } = useApp();
  const job = jobs.find(j => j.id === jobId);

  const [completedAt, setCompletedAt] = useState(new Date().toISOString().split('T')[0]);
  const [depthDrilled, setDepthDrilled] = useState(0);
  const [casingUsedUnits, setCasingUsedUnits] = useState(0);
  const [casingType, setCasingType] = useState<CasingType>(job?.casingType || 'PVC');
  const [dieselCost, setDieselCost] = useState(0);
  const [soilType, setSoilType] = useState('');
  const [serviceQtys, setServiceQtys] = useState<Record<string, number>>({});
  const [customQtys, setCustomQtys] = useState<Record<string, number>>({});

  if (!job) return null;

  const canSubmit = depthDrilled > 0 && casingUsedUnits > 0 && dieselCost > 0;

  // Auto-calculate bill preview
  const drillingTotal = depthDrilled * job.drillingRatePerFoot;
  const casingTotal = casingUsedUnits * job.casingRatePerUnit;
  const servicesTotal = job.services.reduce((s, svc) => s + svc.rate * (serviceQtys[svc.key] || 0), 0);
  const customTotal = job.customItems.reduce((s, ci) => s + ci.rate * (customQtys[ci.id] || 0), 0);
  const estimatedBill = drillingTotal + casingTotal + servicesTotal + customTotal;

  const handleSubmit = () => {
    completeJob(jobId, {
      completedAt,
      depthDrilled,
      casingUsedUnits,
      casingType,
      dieselCost,
      soilType: soilType || undefined,
      serviceQuantitiesUsed: serviceQtys,
      customQuantitiesUsed: customQtys,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete Job {job.id}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{job.customerName} — {job.location}</p>
        <div className="space-y-3 mt-2">
          <div><Label>Completion Date *</Label><Input type="date" value={completedAt} onChange={e => setCompletedAt(e.target.value)} /></div>
          <div><Label>Depth Drilled (feet) *</Label><Input type="number" value={depthDrilled || ''} onChange={e => setDepthDrilled(Number(e.target.value))} placeholder="280" /></div>
          <div><Label>Casing Used (units) *</Label><Input type="number" value={casingUsedUnits || ''} onChange={e => setCasingUsedUnits(Number(e.target.value))} placeholder="250" /></div>
          <div>
            <Label>Casing Type *</Label>
            <Select value={casingType} onValueChange={v => setCasingType(v as CasingType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="GI">GI</SelectItem>
                <SelectItem value="PVC">PVC</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Diesel Cost (₹) *</Label><Input type="number" value={dieselCost || ''} onChange={e => setDieselCost(Number(e.target.value))} placeholder="25000" /></div>
          <div><Label>Soil Type (optional)</Label><Input value={soilType} onChange={e => setSoilType(e.target.value)} placeholder="Clay, Rock, Sand..." /></div>

          {job.services.length > 0 && (
            <div className="border-t pt-3">
              <Label className="text-sm font-semibold">Service Quantities Used</Label>
              {job.services.map(svc => (
                <div key={svc.key} className="flex items-center justify-between mt-2">
                  <span className="text-sm">{svc.name} (₹{svc.rate}/unit)</span>
                  <Input type="number" className="w-24 h-8" value={serviceQtys[svc.key] || ''} onChange={e => setServiceQtys(prev => ({ ...prev, [svc.key]: Number(e.target.value) }))} placeholder="0" />
                </div>
              ))}
            </div>
          )}

          {job.customItems.length > 0 && (
            <div className="border-t pt-3">
              <Label className="text-sm font-semibold">Custom Item Quantities</Label>
              {job.customItems.map(ci => (
                <div key={ci.id} className="flex items-center justify-between mt-2">
                  <span className="text-sm">{ci.name} (₹{ci.rate}/unit)</span>
                  <Input type="number" className="w-24 h-8" value={customQtys[ci.id] || ''} onChange={e => setCustomQtys(prev => ({ ...prev, [ci.id]: Number(e.target.value) }))} placeholder="0" />
                </div>
              ))}
            </div>
          )}

          {depthDrilled > 0 && (
            <div className="border-t pt-3 space-y-1 text-sm">
              <p className="font-semibold">Estimated Bill Preview</p>
              <div className="flex justify-between"><span>Drilling ({depthDrilled}ft × ₹{job.drillingRatePerFoot})</span><span className="font-mono">₹{drillingTotal.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Casing ({casingUsedUnits} × ₹{job.casingRatePerUnit})</span><span className="font-mono">₹{casingTotal.toLocaleString()}</span></div>
              {servicesTotal > 0 && <div className="flex justify-between"><span>Services</span><span className="font-mono">₹{servicesTotal.toLocaleString()}</span></div>}
              {customTotal > 0 && <div className="flex justify-between"><span>Custom Items</span><span className="font-mono">₹{customTotal.toLocaleString()}</span></div>}
              <div className="flex justify-between font-bold border-t pt-1"><span>Total</span><span className="font-mono">₹{estimatedBill.toLocaleString()}</span></div>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2">Casing & diesel will be auto-deducted from inventory.</p>
        <Button className="w-full mt-3" disabled={!canSubmit} onClick={handleSubmit}>Mark as Completed</Button>
      </DialogContent>
    </Dialog>
  );
};

export default CompleteJobDialog;
