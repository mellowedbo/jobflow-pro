import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Plus, Minus, AlertTriangle } from 'lucide-react';

const InventoryPage: React.FC = () => {
  const { inventory, addInventoryItem, addInventoryTransaction } = useApp();
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [txDialog, setTxDialog] = useState<{ open: boolean; type: 'purchase' | 'destroyed' }>({ open: false, type: 'purchase' });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold">Inventory</h1>
          <p className="text-sm text-muted-foreground">Full inventory accounting system</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setTxDialog({ open: true, type: 'purchase' })}>
            <Plus className="mr-1 h-4 w-4" />Add Purchase
          </Button>
          <Button variant="outline" onClick={() => setTxDialog({ open: true, type: 'destroyed' })}>
            <AlertTriangle className="mr-1 h-4 w-4" />Log Damaged
          </Button>
          <Button onClick={() => setAddItemOpen(true)}>
            <Package className="mr-1 h-4 w-4" />New Item
          </Button>
        </div>
      </div>

      {/* Stock cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {inventory.items.map(item => {
          const isLow = item.currentStock < item.openingStock * 0.2;
          return (
            <div key={item.id} className={`stat-card ${isLow ? 'border-destructive/50' : ''}`}>
              <div className="flex items-center justify-between">
                <span className="data-label">{item.name}</span>
                <Package className={`h-5 w-5 ${isLow ? 'text-destructive' : 'text-primary'}`} />
              </div>
              <p className="data-value mt-2">{item.currentStock.toLocaleString()} {item.unit}</p>
              {isLow && <p className="text-xs text-destructive mt-1">⚠️ Low stock</p>}
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-muted-foreground">Opening</span><p className="font-mono">{item.openingStock}</p></div>
                <div><span className="text-muted-foreground">Purchased</span><p className="font-mono text-success">+{item.totalPurchased}</p></div>
                <div><span className="text-muted-foreground">Used</span><p className="font-mono text-warning">-{item.totalUsed}</p></div>
                <div><span className="text-muted-foreground">Destroyed</span><p className="font-mono text-destructive">-{item.totalDestroyed}</p></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Accounting summary */}
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold">Inventory Accounting</h2>
        <div className="overflow-hidden rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Item</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Opening</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">+ Purchased</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">- Used</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">- Destroyed</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">= Closing</th>
              </tr>
            </thead>
            <tbody>
              {inventory.items.map(item => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3 text-right font-mono">{item.openingStock}</td>
                  <td className="px-4 py-3 text-right font-mono text-success">+{item.totalPurchased}</td>
                  <td className="px-4 py-3 text-right font-mono text-warning">-{item.totalUsed}</td>
                  <td className="px-4 py-3 text-right font-mono text-destructive">-{item.totalDestroyed}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold">{item.currentStock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction history */}
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold">Transaction History</h2>
        <div className="overflow-hidden rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Item</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Qty</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Cost/Unit</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Total</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Details</th>
              </tr>
            </thead>
            <tbody>
              {inventory.transactions.slice().reverse().map(tx => {
                const item = inventory.items.find(i => i.id === tx.itemId);
                return (
                  <tr key={tx.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-mono text-xs">{tx.date}</td>
                    <td className="px-4 py-3">{item?.name || tx.itemId}</td>
                    <td className="px-4 py-3">
                      <span className={`status-badge ${tx.type === 'purchase' ? 'status-completed' : tx.type === 'destroyed' ? 'status-pending' : 'status-active'}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{tx.quantity}</td>
                    <td className="px-4 py-3 text-right font-mono">₹{tx.costPerUnit}</td>
                    <td className="px-4 py-3 text-right font-mono">₹{tx.totalCost.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {tx.supplier && `Supplier: ${tx.supplier}`}
                      {tx.jobId && `Job: ${tx.jobId}`}
                      {tx.note && tx.note}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Item Dialog */}
      {addItemOpen && <AddItemDialog onClose={() => setAddItemOpen(false)} />}
      {txDialog.open && <TransactionDialog type={txDialog.type} onClose={() => setTxDialog({ open: false, type: 'purchase' })} />}
    </div>
  );
};

function AddItemDialog({ onClose }: { onClose: () => void }) {
  const { addInventoryItem } = useApp();
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [openingStock, setOpeningStock] = useState(0);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Add Inventory Item</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Item Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. GI Casing" /></div>
          <div><Label>Unit</Label><Input value={unit} onChange={e => setUnit(e.target.value)} placeholder="feet, pieces, ₹" /></div>
          <div><Label>Opening Stock</Label><Input type="number" value={openingStock || ''} onChange={e => setOpeningStock(Number(e.target.value))} /></div>
        </div>
        <Button className="w-full mt-3" disabled={!name || !unit} onClick={() => { addInventoryItem({ name, unit, openingStock }); onClose(); }}>Add Item</Button>
      </DialogContent>
    </Dialog>
  );
}

function TransactionDialog({ type, onClose }: { type: 'purchase' | 'destroyed'; onClose: () => void }) {
  const { inventory, addInventoryTransaction } = useApp();
  const [itemId, setItemId] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [costPerUnit, setCostPerUnit] = useState(0);
  const [supplier, setSupplier] = useState('');
  const [note, setNote] = useState('');

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>{type === 'purchase' ? 'Add Purchase' : 'Log Damaged/Destroyed Stock'}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Item</Label>
            <Select value={itemId} onValueChange={setItemId}>
              <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
              <SelectContent>
                {inventory.items.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Quantity</Label><Input type="number" value={quantity || ''} onChange={e => setQuantity(Number(e.target.value))} /></div>
          <div><Label>Cost Per Unit (₹)</Label><Input type="number" value={costPerUnit || ''} onChange={e => setCostPerUnit(Number(e.target.value))} /></div>
          {type === 'purchase' && (
            <div><Label>Supplier</Label><Input value={supplier} onChange={e => setSupplier(e.target.value)} /></div>
          )}
          <div><Label>Note (optional)</Label><Input value={note} onChange={e => setNote(e.target.value)} /></div>
        </div>
        <Button className="w-full mt-3" disabled={!itemId || !quantity} onClick={() => {
          addInventoryTransaction({ itemId, type, quantity, costPerUnit, date: new Date().toISOString().split('T')[0], supplier: supplier || undefined, note: note || undefined });
          onClose();
        }}>{type === 'purchase' ? 'Record Purchase' : 'Record Loss'}</Button>
      </DialogContent>
    </Dialog>
  );
}

export default InventoryPage;
