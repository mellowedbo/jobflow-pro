'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import type { InventoryItem } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Package,
  Plus,
  AlertTriangle,
  ShoppingCart,
  Trash2,
  ArrowDown,
  Search,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

export default function InventoryView() {
  const inventoryItems = useStore((s) => s.inventoryItems);
  const inventoryTransactions = useStore((s) => s.inventoryTransactions);
  const addInventoryItem = useStore((s) => s.addInventoryItem);
  const addPurchase = useStore((s) => s.addPurchase);
  const destroyInventoryItem = useStore((s) => s.destroyInventoryItem);

  const [addItemOpen, setAddItemOpen] = useState(false);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [damageOpen, setDamageOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [txFilter, setTxFilter] = useState<'all' | 'purchase' | 'used' | 'destroyed'>('all');

  const totalValue = useMemo(() =>
    inventoryItems.reduce((s, i) => s + i.currentStock * i.costPerUnit, 0),
    [inventoryItems]
  );

  const lowStockItems = inventoryItems.filter((i) => i.currentStock <= i.reorderLevel);
  const filteredTx = inventoryTransactions
    .filter((tx) => txFilter === 'all' || tx.type === txFilter)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Inventory Management</h2>
          <p className="text-sm text-muted-foreground">Total Value: <span className="font-mono font-bold">₹{totalValue.toLocaleString('en-IN')}</span></p>
        </div>
        <Button onClick={() => setAddItemOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Add Item
        </Button>
      </div>

      {/* Stock Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {inventoryItems.map((item) => {
          const stockPct = item.openingStock > 0 ? (item.currentStock / item.openingStock) * 100 : 0;
          const isLow = item.currentStock <= item.reorderLevel;
          return (
            <Card key={item.id} className={`hover:shadow-md transition-shadow ${isLow ? 'border-red-200 dark:border-red-800' : ''}`}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">per {item.unit}</p>
                  </div>
                  {isLow && (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px] dark:bg-red-950 dark:text-red-300">
                      <AlertTriangle className="h-3 w-3 mr-1" /> Low
                    </Badge>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Stock Level</span>
                    <span className="font-mono font-medium">{item.currentStock} / {item.openingStock} {item.unit}</span>
                  </div>
                  <Progress value={Math.min(stockPct, 100)} className={`h-2 ${isLow ? '[&>div]:bg-red-500' : '[&>div]:bg-emerald-500'}`} />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Cost/Unit</p>
                    <p className="font-mono font-medium">₹{item.costPerUnit}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Value</p>
                    <p className="font-mono font-medium">₹{(item.currentStock * item.costPerUnit).toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Purchased</p>
                    <p className="font-mono text-emerald-600">+{item.totalPurchased}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Used</p>
                    <p className="font-mono text-amber-600">-{item.totalUsed}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs h-8" onClick={() => { setSelectedItem(item.id); setPurchaseOpen(true); }}>
                    <ShoppingCart className="h-3 w-3" /> Purchase
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs h-8" onClick={() => { setSelectedItem(item.id); setDamageOpen(true); }}>
                    <Trash2 className="h-3 w-3" /> Damage
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Low Stock Alerts ({lowStockItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {lowStockItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-red-50 dark:bg-red-950/20">
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Current: {item.currentStock} {item.unit} | Reorder at: {item.reorderLevel} {item.unit}
                  </p>
                </div>
                <Button size="sm" variant="outline" className="gap-1" onClick={() => { setSelectedItem(item.id); setPurchaseOpen(true); }}>
                  <ShoppingCart className="h-3 w-3" /> Restock
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Inventory Accounting Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Inventory Accounting</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Opening</TableHead>
                  <TableHead className="text-right text-emerald-600">+ Purchased</TableHead>
                  <TableHead className="text-right text-amber-600">- Used</TableHead>
                  <TableHead className="text-right text-red-600">- Destroyed</TableHead>
                  <TableHead className="text-right font-bold">= Closing</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name} ({item.unit})</TableCell>
                    <TableCell className="text-right font-mono">{item.openingStock}</TableCell>
                    <TableCell className="text-right font-mono text-emerald-600">+{item.totalPurchased}</TableCell>
                    <TableCell className="text-right font-mono text-amber-600">-{item.totalUsed}</TableCell>
                    <TableCell className="text-right font-mono text-red-600">-{item.totalDestroyed}</TableCell>
                    <TableCell className="text-right font-mono font-bold">{item.currentStock}</TableCell>
                    <TableCell className="text-right font-mono">₹{(item.currentStock * item.costPerUnit).toLocaleString('en-IN')}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold border-t-2">
                  <TableCell>Total</TableCell>
                  <TableCell colSpan={5} />
                  <TableCell className="text-right font-mono">₹{totalValue.toLocaleString('en-IN')}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Transaction History</CardTitle>
            <Select value={txFilter} onValueChange={(v) => setTxFilter(v as typeof txFilter)}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="purchase">Purchase</SelectItem>
                <SelectItem value="used">Used</SelectItem>
                <SelectItem value="destroyed">Destroyed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto max-h-72 overflow-y-auto custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="hidden sm:table-cell">Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTx.map((tx) => {
                  const item = inventoryItems.find((i) => i.id === tx.itemId);
                  return (
                    <TableRow key={tx.id}>
                      <TableCell className="font-mono text-xs">{format(parseISO(tx.date), 'dd MMM yyyy')}</TableCell>
                      <TableCell className="font-medium">{item?.name || '—'}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            tx.type === 'purchase' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                            tx.type === 'used' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                            'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
                          }`}
                        >
                          {tx.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">{tx.quantity}</TableCell>
                      <TableCell className="text-right font-mono">₹{tx.totalCost.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">{tx.note || tx.supplier || '—'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Item Dialog */}
      <AddItemDialog open={addItemOpen} onOpenChange={setAddItemOpen} />

      {/* Purchase Dialog */}
      <PurchaseDialog
        itemId={selectedItem}
        open={purchaseOpen}
        onOpenChange={setPurchaseOpen}
      />

      {/* Damage Dialog */}
      <DamageDialog
        itemId={selectedItem}
        open={damageOpen}
        onOpenChange={setDamageOpen}
      />
    </div>
  );
}

function AddItemDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const addInventoryItem = useStore((s) => s.addInventoryItem);
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [openingStock, setOpeningStock] = useState(0);
  const [reorderLevel, setReorderLevel] = useState(0);
  const [costPerUnit, setCostPerUnit] = useState(0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Inventory Item</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., GI Casing" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Unit</Label>
              <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="e.g., feet" />
            </div>
            <div className="space-y-2">
              <Label>Opening Stock</Label>
              <Input type="number" value={openingStock || ''} onChange={(e) => setOpeningStock(Number(e.target.value))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Reorder Level</Label>
              <Input type="number" value={reorderLevel || ''} onChange={(e) => setReorderLevel(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Cost/Unit (₹)</Label>
              <Input type="number" value={costPerUnit || ''} onChange={(e) => setCostPerUnit(Number(e.target.value))} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => {
            if (!name || !unit || openingStock <= 0) { toast.error('Fill all required fields'); return; }
            addInventoryItem({ name, unit, openingStock, reorderLevel, costPerUnit });
            onOpenChange(false);
            toast.success('Item added!');
          }}>Add Item</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PurchaseDialog({ itemId, open, onOpenChange }: { itemId: string; open: boolean; onOpenChange: (v: boolean) => void }) {
  const addPurchase = useStore((s) => s.addPurchase);
  const inventoryItems = useStore((s) => s.inventoryItems);
  const item = inventoryItems.find((i) => i.id === itemId);
  const [quantity, setQuantity] = useState(0);
  const [costPerUnit, setCostPerUnit] = useState(item?.costPerUnit || 0);
  const [supplier, setSupplier] = useState('');
  const [note, setNote] = useState('');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Purchase — {item?.name || 'Item'}</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">Current stock: {item?.currentStock} {item?.unit}</p>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input type="number" value={quantity || ''} onChange={(e) => setQuantity(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Cost/Unit (₹)</Label>
              <Input type="number" value={costPerUnit || ''} onChange={(e) => setCostPerUnit(Number(e.target.value))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Supplier</Label>
            <Input value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Supplier name" />
          </div>
          <div className="space-y-2">
            <Label>Note</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note" />
          </div>
          {quantity > 0 && costPerUnit > 0 && (
            <div className="rounded-lg border bg-muted/50 p-3 text-sm">
              <div className="flex justify-between">
                <span>Total Cost</span>
                <span className="font-mono font-bold">₹{(quantity * costPerUnit).toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => {
            if (!itemId || quantity <= 0) { toast.error('Enter a valid quantity'); return; }
            addPurchase(itemId, quantity, costPerUnit, supplier || undefined, note || undefined);
            onOpenChange(false);
            toast.success('Purchase recorded!');
          }}>Add Purchase</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DamageDialog({ itemId, open, onOpenChange }: { itemId: string; open: boolean; onOpenChange: (v: boolean) => void }) {
  const destroyInventoryItem = useStore((s) => s.destroyInventoryItem);
  const inventoryItems = useStore((s) => s.inventoryItems);
  const item = inventoryItems.find((i) => i.id === itemId);
  const [quantity, setQuantity] = useState(0);
  const [note, setNote] = useState('');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Log Damage — {item?.name || 'Item'}</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">Current stock: {item?.currentStock} {item?.unit}</p>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Quantity Damaged</Label>
            <Input type="number" value={quantity || ''} onChange={(e) => setQuantity(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Describe the damage..." rows={2} />
          </div>
          {quantity > 0 && (
            <div className="rounded-lg border bg-red-50 dark:bg-red-950/20 p-3 text-sm">
              <div className="flex justify-between">
                <span>Loss Value</span>
                <span className="font-mono font-bold text-red-600">₹{(quantity * (item?.costPerUnit || 0)).toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" onClick={() => {
            if (!itemId || quantity <= 0) { toast.error('Enter a valid quantity'); return; }
            if (item && quantity > item.currentStock) { toast.error('Cannot destroy more than available stock'); return; }
            destroyInventoryItem(itemId, quantity, note || undefined);
            onOpenChange(false);
            toast.success('Damage logged!');
          }}>Log Damage</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
