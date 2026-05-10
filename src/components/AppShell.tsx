'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useStore } from '@/lib/store';
import type { ViewPage } from '@/lib/types';
import {
  LayoutDashboard,
  Briefcase,
  CheckCircle2,
  Receipt,
  Package,
  TrendingDown,
  Users,
  FileBarChart,
  Moon,
  Sun,
  Menu,
  Drill,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import DashboardView from '@/components/DashboardView';
import JobsView from '@/components/JobsView';
import CompletedJobsView from '@/components/CompletedJobsView';
import BillingView from '@/components/BillingView';
import InventoryView from '@/components/InventoryView';
import CostsView from '@/components/CostsView';
import CustomersView from '@/components/CustomersView';
import ReportsView from '@/components/ReportsView';

interface NavItem {
  key: ViewPage;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'jobs', label: 'Active Jobs', icon: Briefcase },
  { key: 'completed', label: 'Completed', icon: CheckCircle2 },
  { key: 'billing', label: 'Billing', icon: Receipt },
  { key: 'inventory', label: 'Inventory', icon: Package },
  { key: 'costs', label: 'Costs & P&L', icon: TrendingDown },
  { key: 'customers', label: 'Customers', icon: Users },
  { key: 'reports', label: 'Reports', icon: FileBarChart },
];

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const { currentView, setCurrentView } = useStore();
  const activeJobs = useStore((s) => s.jobs.filter((j) => j.status === 'active' || j.status === 'scheduled').length);

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
          <Drill className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        <div>
          <h1 className="text-base font-bold text-sidebar-foreground tracking-tight">DrillOps Pro</h1>
          <p className="text-[10px] text-sidebar-foreground/50 font-medium uppercase tracking-widest">Borewell ERP</p>
        </div>
      </div>

      <Separator className="bg-sidebar-border" />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = currentView === item.key;
            const Icon = item.icon;
            return (
              <TooltipProvider key={item.key} delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => {
                        setCurrentView(item.key);
                        onNavClick?.();
                      }}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md'
                          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                      {item.key === 'jobs' && activeJobs > 0 && (
                        <span className={`ml-auto flex h-5 min-w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                          isActive ? 'bg-sidebar-primary-foreground/20 text-sidebar-primary-foreground' : 'bg-sidebar-accent text-sidebar-foreground'
                        }`}>
                          {activeJobs}
                        </span>
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="hidden lg:block">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator className="bg-sidebar-border" />

      {/* Footer */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground text-xs font-bold">OP</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-sidebar-foreground truncate">Operator</p>
          <p className="text-[10px] text-sidebar-foreground/50 truncate">admin@drillops.pro</p>
        </div>
        <ThemeToggle />
      </div>
    </div>
  );
}

function ViewRenderer({ view }: { view: ViewPage }) {
  switch (view) {
    case 'dashboard':
      return <DashboardView />;
    case 'jobs':
      return <JobsView />;
    case 'completed':
      return <CompletedJobsView />;
    case 'billing':
      return <BillingView />;
    case 'inventory':
      return <InventoryView />;
    case 'costs':
      return <CostsView />;
    case 'customers':
      return <CustomersView />;
    case 'reports':
      return <ReportsView />;
    default:
      return <DashboardView />;
  }
}

export default function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentView = useStore((s) => s.currentView);
  const currentLabel = navItems.find((n) => n.key === currentView)?.label ?? 'Dashboard';

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-sidebar border-r border-sidebar-border">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0 bg-sidebar border-sidebar-border">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <SidebarContent onNavClick={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex h-14 items-center gap-3 border-b bg-card px-4 shrink-0">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
          </Sheet>
          <h2 className="text-base font-semibold">{currentLabel}</h2>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden sm:inline text-xs text-muted-foreground font-mono">
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="p-4 md:p-6"
            >
              <ViewRenderer view={currentView} />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
