'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useStore } from '@/lib/store';
import { createClient, isSupabaseConfigured } from '@/lib/supabase-browser';
import type { ViewPage, UserRole } from '@/lib/types';
import { ROLE_ACCESS } from '@/lib/types';
import type { User } from '@supabase/supabase-js';
import {
  LayoutDashboard,
  Briefcase,
  CheckCircle2,
  Receipt,
  Package,
  TrendingDown,
  Users,
  FileBarChart,
  Settings,
  Moon,
  Sun,
  Menu,
  Drill,
  LogOut,
  Loader2,
  Eye,
  BarChart3,
  Map,
  Shield,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import AuthPage from '@/components/AuthPage';
import AccountSettingsView from '@/components/AccountSettingsView';
import DashboardView from '@/components/DashboardView';
import JobsView from '@/components/JobsView';
import CompletedJobsView from '@/components/CompletedJobsView';
import BillingView from '@/components/BillingView';
import InventoryView from '@/components/InventoryView';
import CostsView from '@/components/CostsView';
import CustomersView from '@/components/CustomersView';
import ReportsView from '@/components/ReportsView';
import AnalyticsView from '@/components/AnalyticsView';
import DepthMapView from '@/components/DepthMapView';

interface NavItem {
  key: ViewPage;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

const allNavItems: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'jobs', label: 'Active Jobs', icon: Briefcase },
  { key: 'completed', label: 'Completed', icon: CheckCircle2 },
  { key: 'billing', label: 'Billing', icon: Receipt },
  { key: 'inventory', label: 'Inventory', icon: Package },
  { key: 'costs', label: 'Costs & P&L', icon: TrendingDown },
  { key: 'customers', label: 'Customers', icon: Users },
  { key: 'reports', label: 'Reports', icon: FileBarChart },
  { key: 'analytics', label: 'Analytics', icon: BarChart3, badge: 'Pro' },
  { key: 'depthmap', label: 'Depth Map', icon: Map, badge: 'Beta' },
  { key: 'settings', label: 'Settings', icon: Settings },
];

const ROLE_LABELS: Record<UserRole, string> = {
  owner: 'Owner',
  manager: 'Manager',
  accountant: 'Accountant',
  operator: 'Operator',
};

const ROLE_COLORS: Record<UserRole, string> = {
  owner: 'bg-purple-200 text-purple-800 dark:bg-purple-800 dark:text-purple-200',
  manager: 'bg-emerald-200 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-200',
  accountant: 'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200',
  operator: 'bg-orange-200 text-orange-800 dark:bg-orange-800 dark:text-orange-200',
};

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

function RoleSwitcher() {
  const currentRole = useStore((s) => s.currentRole);
  const setCurrentRole = useStore((s) => s.setCurrentRole);

  return (
    <div className="flex items-center gap-2">
      <Shield className="h-3.5 w-3.5 text-sidebar-foreground/60 shrink-0" />
      <Select value={currentRole} onValueChange={(v) => setCurrentRole(v as UserRole)}>
        <SelectTrigger className="h-7 flex-1 border-sidebar-border bg-sidebar-accent/50 text-sidebar-foreground text-[11px] font-medium px-2 py-0 gap-1">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(ROLE_LABELS) as UserRole[]).map((role) => (
            <SelectItem key={role} value={role} className="text-xs">
              <div className="flex items-center gap-2">
                <span className={`inline-block h-2 w-2 rounded-full ${ROLE_COLORS[role].split(' ')[0]}`} />
                {ROLE_LABELS[role]}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function SidebarContent({ onNavClick, user, isGuest, onExitGuest, onSignOut }: {
  onNavClick?: () => void;
  user: User | null;
  isGuest: boolean;
  onExitGuest: () => void;
  onSignOut: () => void;
}) {
  const { currentView, setCurrentView, currentRole } = useStore();
  const activeJobs = useStore((s) => s.jobs.filter((j) => j.status === 'active' || j.status === 'scheduled').length);

  const visibleNavItems = useMemo(() => {
    const access = ROLE_ACCESS[currentRole];
    return allNavItems.filter((item) => access[item.key]);
  }, [currentRole]);

  const userName = isGuest
    ? 'Guest User'
    : user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Operator';
  const initials = userName.substring(0, 2).toUpperCase();

  // If current view is not accessible with current role, redirect to dashboard
  useEffect(() => {
    const access = ROLE_ACCESS[currentRole];
    if (!access[currentView]) {
      setCurrentView('dashboard');
    }
  }, [currentRole, currentView, setCurrentView]);

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
          {visibleNavItems.map((item) => {
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
                      {item.badge && (
                        <Badge
                          variant="secondary"
                          className={`ml-auto text-[9px] px-1.5 py-0 h-4 font-bold ${
                            item.badge === 'Pro'
                              ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400'
                              : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {item.badge}
                        </Badge>
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

      {/* Role Switcher */}
      <div className="px-4 py-2">
        <RoleSwitcher />
      </div>

      <Separator className="bg-sidebar-border" />

      {/* Footer with user info & sign out */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className={`text-xs font-bold ${
            isGuest
              ? 'bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200'
              : 'bg-sidebar-accent text-sidebar-foreground'
          }`}>{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-sidebar-foreground truncate">{userName}</p>
          <p className="text-[10px] text-sidebar-foreground/50 truncate">
            {isGuest ? 'Demo Mode' : user?.email}
          </p>
        </div>
        <ThemeToggle />
        <Button
          variant="ghost"
          size="icon"
          onClick={isGuest ? onExitGuest : onSignOut}
          className="h-8 w-8 text-sidebar-foreground hover:bg-red-500/20 hover:text-red-400"
          title={isGuest ? 'Exit demo' : 'Sign out'}
        >
          <LogOut className="h-4 w-4" />
        </Button>
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
    case 'analytics':
      return <AnalyticsView />;
    case 'depthmap':
      return <DepthMapView />;
    case 'settings':
      return <AccountSettingsView />;
    default:
      return <DashboardView />;
  }
}

export default function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const isSupabaseReady = !isSupabaseConfigured();
  const [authLoading, setAuthLoading] = useState(isSupabaseReady ? false : true);
  const isGuest = useStore((s) => s.isGuest);
  const enterGuestMode = useStore((s) => s.enterGuestMode);
  const exitGuestMode = useStore((s) => s.exitGuestMode);
  const currentView = useStore((s) => s.currentView);
  const currentRole = useStore((s) => s.currentRole);
  const isInitialized = useStore((s) => s.isInitialized);
  const fetchAllData = useStore((s) => s.fetchAllData);
  const currentLabel = allNavItems.find((n) => n.key === currentView)?.label ?? 'Dashboard';

  // Listen for auth state changes
  useEffect(() => {
    // If Supabase not configured, skip auth check
    if (!isSupabaseConfigured()) {
      return;
    }

    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('[DrillOps] getSession error:', error.message);
      }
      setUser(session?.user ?? null);
      setAuthLoading(false);
    }).catch((err) => {
      console.error('[DrillOps] getSession failed:', err?.message || err);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch data when user is logged in (not guest)
  useEffect(() => {
    if (user && !isInitialized && !isGuest) {
      fetchAllData();
    }
  }, [user, isInitialized, isGuest, fetchAllData]);

  const handleGuestMode = () => {
    enterGuestMode();
  };

  const handleExitGuest = () => {
    exitGuestMode();
  };

  const handleSignOut = async () => {
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    setUser(null);
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-600 shadow-lg shadow-emerald-600/25 animate-pulse">
            <Drill className="h-8 w-8 text-white" />
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading DrillOps Pro...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show auth page if not logged in and not guest
  if (!user && !isGuest) {
    return <AuthPage onGuestMode={handleGuestMode} />;
  }

  // Show loading while fetching data (not guest)
  if (!isGuest && user && !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-600 shadow-lg shadow-emerald-600/25">
            <Drill className="h-8 w-8 text-white" />
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading your data...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Guest mode banner */}
      {isGuest && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-amber-950 px-4 py-1.5 text-center text-xs font-medium flex items-center justify-center gap-2">
          <Eye className="h-3.5 w-3.5" />
          <span>Demo Mode — data is sample only and won&apos;t be saved</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[10px] ml-2 bg-amber-600 hover:bg-amber-700 text-white px-2"
            onClick={handleExitGuest}
          >
            Exit Demo
          </Button>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex w-64 shrink-0 flex-col bg-sidebar border-r border-sidebar-border ${isGuest ? 'mt-8' : ''}`}>
        <SidebarContent
          user={user}
          isGuest={isGuest}
          onExitGuest={handleExitGuest}
          onSignOut={handleSignOut}
        />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0 bg-sidebar border-sidebar-border">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <SidebarContent
            onNavClick={() => setMobileOpen(false)}
            user={user}
            isGuest={isGuest}
            onExitGuest={() => { handleExitGuest(); setMobileOpen(false); }}
            onSignOut={handleSignOut}
          />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className={`flex flex-1 flex-col overflow-hidden ${isGuest ? 'mt-8' : ''}`}>
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
            <Badge variant="outline" className="text-[10px] font-medium px-2 py-0.5 gap-1">
              <Shield className="h-3 w-3" />
              {ROLE_LABELS[currentRole]}
            </Badge>
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
