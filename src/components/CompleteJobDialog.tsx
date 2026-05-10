'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import type { Job } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface CompleteJobDialogProps {
  job: Job | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function CompleteJobDialog({ job, open, onOpenChange }: CompleteJobDialogProps) {
  const completeJob = useStore((s) => s.completeJob);
  const [depthDrilled, setDepthDrilled] = useState(0);
  const [casingUsedUnits, setCasingUsedUnits] = useState(0);
  const [dieselCost, setDieselCost] = useState(0);
  const [soilType, setSoilType] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serviceQuantitiesUsed, setServiceQuantitiesUsed] = useState<Record<string, number>>({});
  const [customQuantitiesUsed, setCustomQuantitiesUsed] = useState<Record<string, number>>({});

  const resetForm = () => {
    setDepthDrilled(0);
    setCasingUsedUnits(0);
    setDieselCost(0);
    setSoilType('');
    setErrors({});
    setServiceQuantitiesUsed({});
    setCustomQuantitiesUsed({});
  };

  const handleSubmit = () => {
    if (!job) return;
    const errs: Record<string, string> = {};
    if (!depthDrilled || depthDrilled <= 0) errs.depthDrilled = 'Depth drilled is required';
    if (!casingUsedUnits || casingUsedUnits <= 0) errs.casingUsedUnits = 'Casing units is required';
    if (!soilType.trim()) errs.soilType = 'Soil type is required';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    completeJob(job.id, {
      depthDrilled,
      casingUsedUnits,
      dieselCost,
      soilType: soilType.trim(),
      serviceQuantitiesUsed,
      customQuantitiesUsed,
    });
    resetForm();
    onOpenChange(false);
    toast.success('Job completed successfully!');
  };

  if (!job) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle>Complete Job — {job.customerName}</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">{job.location} | {job.casingType} Casing | ₹{job.drillingRatePerFoot}/ft</p>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Depth Drilled (ft) *</Label>
              <Input
                type="number"
                value={depthDrilled || ''}
                onChange={(e) => setDepthDrilled(Number(e.target.value))}
                placeholder="0"
              />
              {errors.depthDrilled && <p className="text-xs text-destructive">{errors.depthDrilled}</p>}
            </div>
            <div className="space-y-2">
              <Label>Casing Used (units) *</Label>
              <Input
                type="number"
                value={casingUsedUnits || ''}
                onChange={(e) => setCasingUsedUnits(Number(e.target.value))}
                placeholder="0"
              />
              {errors.casingUsedUnits && <p className="text-xs text-destructive">{errors.casingUsedUnits}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Soil Type *</Label>
            <Select value={soilType} onValueChange={setSoilType}>
              <SelectTrigger>
                <SelectValue placeholder="Select soil type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Rocky">Rocky</SelectItem>
                <SelectItem value="Sandy">Sandy</SelectItem>
                <SelectItem value="Clay">Clay</SelectItem>
                <SelectItem value="Mixed (Clay + Rock)">Mixed (Clay + Rock)</SelectItem>
                <SelectItem value="Hard Rock">Hard Rock</SelectItem>
                <SelectItem value="Alluvial">Alluvial</SelectItem>
              </SelectContent>
            </Select>
            {errors.soilType && <p className="text-xs text-destructive">{errors.soilType}</p>}
          </div>

          <div className="space-y-2">
            <Label>Diesel Cost (₹)</Label>
            <Input
              type="number"
              value={dieselCost || ''}
              onChange={(e) => setDieselCost(Number(e.target.value))}
              placeholder="0"
            />
          </div>

          {/* Services quantities */}
          {job.services.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Services Used</Label>
              {job.services.map((svc) => (
                <div key={svc.key} className="flex items-center justify-between gap-3">
                  <span className="text-sm flex-1">{svc.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Qty:</span>
                    <Input
                      type="number"
                      className="w-20 h-8 text-sm"
                      min={0}
                      value={serviceQuantitiesUsed[svc.key] ?? svc.quantity}
                      onChange={(e) =>
                        setServiceQuantitiesUsed({
                          ...serviceQuantitiesUsed,
                          [svc.key]: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Custom items quantities */}
          {job.customItems.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Custom Items Used</Label>
              {job.customItems.map((ci) => (
                <div key={ci.id} className="flex items-center justify-between gap-3">
                  <span className="text-sm flex-1">{ci.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Qty:</span>
                    <Input
                      type="number"
                      className="w-20 h-8 text-sm"
                      min={0}
                      value={customQuantitiesUsed[ci.id] ?? ci.quantity}
                      onChange={(e) =>
                        setCustomQuantitiesUsed({
                          ...customQuantitiesUsed,
                          [ci.id]: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Estimated Bill */}
          <div className="rounded-lg border bg-muted/50 p-3 space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Estimated Bill</p>
            <div className="flex justify-between text-sm">
              <span>Drilling ({depthDrilled || 0} ft x ₹{job.drillingRatePerFoot})</span>
              <span className="font-mono">₹{((depthDrilled || 0) * job.drillingRatePerFoot).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Casing ({casingUsedUnits || 0} x ₹{job.casingRatePerUnit})</span>
              <span className="font-mono">₹{((casingUsedUnits || 0) * job.casingRatePerUnit).toLocaleString('en-IN')}</span>
            </div>
            {job.services.map((svc) => {
              const qty = serviceQuantitiesUsed[svc.key] ?? svc.quantity;
              return (
                <div key={svc.key} className="flex justify-between text-sm">
                  <span>{svc.name} (x{qty})</span>
                  <span className="font-mono">₹{(svc.rate * qty).toLocaleString('en-IN')}</span>
                </div>
              );
            })}
            {job.customItems.map((ci) => {
              const qty = customQuantitiesUsed[ci.id] ?? ci.quantity;
              return (
                <div key={ci.id} className="flex justify-between text-sm">
                  <span>{ci.name} (x{qty})</span>
                  <span className="font-mono">₹{(ci.rate * qty).toLocaleString('en-IN')}</span>
                </div>
              );
            })}
            <div className="border-t pt-1 mt-1 flex justify-between font-bold text-sm">
              <span>Estimated Total</span>
              <span className="font-mono">
                ₹{(
                  (depthDrilled || 0) * job.drillingRatePerFoot +
                  (casingUsedUnits || 0) * job.casingRatePerUnit +
                  job.services.reduce((s, svc) => s + svc.rate * (serviceQuantitiesUsed[svc.key] ?? svc.quantity), 0) +
                  job.customItems.reduce((s, ci) => s + ci.rate * (customQuantitiesUsed[ci.id] ?? ci.quantity), 0)
                ).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { resetForm(); onOpenChange(false); }}>Cancel</Button>
          <Button onClick={handleSubmit}>Complete Job</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
