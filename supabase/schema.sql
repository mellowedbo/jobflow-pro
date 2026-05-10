-- =============================================
-- DrillOps Pro — Supabase Database Schema
-- WITH USER AUTHENTICATION
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- PROFILES (extends Supabase Auth users)
-- =============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  company_name TEXT,
  role TEXT NOT NULL DEFAULT 'operator' CHECK (role IN ('admin', 'operator', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- JOBS
-- =============================================
CREATE TABLE jobs (
  id TEXT PRIMARY KEY DEFAULT ('job-' || uuid_generate_v4()::text),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT,
  scheduled_date DATE NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'billed', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  drilling_rate_per_foot NUMERIC NOT NULL DEFAULT 0,
  casing_type TEXT NOT NULL DEFAULT 'GI' CHECK (casing_type IN ('GI', 'PVC')),
  casing_rate_per_unit NUMERIC NOT NULL DEFAULT 0,
  advance_received NUMERIC NOT NULL DEFAULT 0,
  completed_at DATE,
  depth_drilled NUMERIC,
  casing_used_units NUMERIC,
  diesel_cost NUMERIC,
  soil_type TEXT,
  billing_generated BOOLEAN DEFAULT FALSE,
  final_bill_amount NUMERIC,
  total_paid NUMERIC NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid')),
  rating INTEGER CHECK (rating >= 0 AND rating <= 5)
);

-- Job Services
CREATE TABLE job_services (
  id TEXT PRIMARY KEY DEFAULT ('svc-' || uuid_generate_v4()::text),
  job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  name TEXT NOT NULL,
  rate NUMERIC NOT NULL DEFAULT 0,
  quantity NUMERIC NOT NULL DEFAULT 1,
  quantity_used NUMERIC DEFAULT 0
);

-- Job Custom Items
CREATE TABLE job_custom_items (
  id TEXT PRIMARY KEY DEFAULT ('ci-' || uuid_generate_v4()::text),
  job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rate NUMERIC NOT NULL DEFAULT 0,
  quantity NUMERIC NOT NULL DEFAULT 1,
  quantity_used NUMERIC DEFAULT 0
);

-- Job Payments
CREATE TABLE job_payments (
  id TEXT PRIMARY KEY DEFAULT ('pay-' || uuid_generate_v4()::text),
  job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  method TEXT CHECK (method IN ('cash', 'upi', 'bank_transfer', 'cheque')),
  note TEXT
);

-- Job Internal Costs
CREATE TABLE job_internal_costs (
  id TEXT PRIMARY KEY DEFAULT ('ic-' || uuid_generate_v4()::text),
  job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'job' CHECK (category IN ('job', 'overhead', 'misc')),
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- =============================================
-- INVENTORY
-- =============================================
CREATE TABLE inventory_items (
  id TEXT PRIMARY KEY DEFAULT ('inv-' || uuid_generate_v4()::text),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  opening_stock NUMERIC NOT NULL DEFAULT 0,
  current_stock NUMERIC NOT NULL DEFAULT 0,
  total_purchased NUMERIC NOT NULL DEFAULT 0,
  total_used NUMERIC NOT NULL DEFAULT 0,
  total_destroyed NUMERIC NOT NULL DEFAULT 0,
  reorder_level NUMERIC NOT NULL DEFAULT 0,
  cost_per_unit NUMERIC NOT NULL DEFAULT 0
);

CREATE TABLE inventory_transactions (
  id TEXT PRIMARY KEY DEFAULT ('tx-' || uuid_generate_v4()::text),
  item_id TEXT NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'used', 'destroyed')),
  quantity NUMERIC NOT NULL,
  cost_per_unit NUMERIC NOT NULL,
  total_cost NUMERIC NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  supplier TEXT,
  job_id TEXT REFERENCES jobs(id),
  note TEXT
);

-- =============================================
-- OVERHEAD COSTS
-- =============================================
CREATE TABLE overhead_costs (
  id TEXT PRIMARY KEY DEFAULT ('oh-' || uuid_generate_v4()::text),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  recurring BOOLEAN DEFAULT FALSE
);

-- =============================================
-- ACTIVITY LOG
-- =============================================
CREATE TABLE activity_log (
  id TEXT PRIMARY KEY DEFAULT ('al-' || uuid_generate_v4()::text),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  type TEXT NOT NULL CHECK (type IN ('job', 'billing', 'inventory', 'cost', 'system'))
);

-- =============================================
-- APP STATE
-- =============================================
CREATE TABLE app_state (
  key TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  value JSONB NOT NULL DEFAULT '{}'
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_jobs_user ON jobs(user_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_customer ON jobs(customer_name);
CREATE INDEX idx_job_services_job ON job_services(job_id);
CREATE INDEX idx_job_custom_items_job ON job_custom_items(job_id);
CREATE INDEX idx_job_payments_job ON job_payments(job_id);
CREATE INDEX idx_job_internal_costs_job ON job_internal_costs(job_id);
CREATE INDEX idx_inventory_items_user ON inventory_items(user_id);
CREATE INDEX idx_inventory_tx_item ON inventory_transactions(item_id);
CREATE INDEX idx_inventory_tx_date ON inventory_transactions(date);
CREATE INDEX idx_overhead_costs_user ON overhead_costs(user_id);
CREATE INDEX idx_overhead_costs_date ON overhead_costs(date);
CREATE INDEX idx_activity_log_user ON activity_log(user_id);
CREATE INDEX idx_activity_log_timestamp ON activity_log(timestamp DESC);
CREATE INDEX idx_app_state_user ON app_state(user_id);

-- =============================================
-- ROW LEVEL SECURITY — USER-SCOPED!
-- Each user can only see/edit THEIR OWN data
-- =============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_custom_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_internal_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE overhead_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_state ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read their own, admins can read all
CREATE POLICY "Users read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Jobs: users see only their own
CREATE POLICY "Users read own jobs" ON jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own jobs" ON jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own jobs" ON jobs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own jobs" ON jobs FOR DELETE USING (auth.uid() = user_id);

-- Job relations: accessible if user owns the parent job
CREATE POLICY "Users read own job services" ON job_services FOR SELECT USING (
  EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_services.job_id AND jobs.user_id = auth.uid())
);
CREATE POLICY "Users insert own job services" ON job_services FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_services.job_id AND jobs.user_id = auth.uid())
);
CREATE POLICY "Users update own job services" ON job_services FOR UPDATE USING (
  EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_services.job_id AND jobs.user_id = auth.uid())
);
CREATE POLICY "Users delete own job services" ON job_services FOR DELETE USING (
  EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_services.job_id AND jobs.user_id = auth.uid())
);

CREATE POLICY "Users read own job custom items" ON job_custom_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_custom_items.job_id AND jobs.user_id = auth.uid())
);
CREATE POLICY "Users insert own job custom items" ON job_custom_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_custom_items.job_id AND jobs.user_id = auth.uid())
);
CREATE POLICY "Users update own job custom items" ON job_custom_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_custom_items.job_id AND jobs.user_id = auth.uid())
);
CREATE POLICY "Users delete own job custom items" ON job_custom_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_custom_items.job_id AND jobs.user_id = auth.uid())
);

CREATE POLICY "Users read own job payments" ON job_payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_payments.job_id AND jobs.user_id = auth.uid())
);
CREATE POLICY "Users insert own job payments" ON job_payments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_payments.job_id AND jobs.user_id = auth.uid())
);
CREATE POLICY "Users update own job payments" ON job_payments FOR UPDATE USING (
  EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_payments.job_id AND jobs.user_id = auth.uid())
);
CREATE POLICY "Users delete own job payments" ON job_payments FOR DELETE USING (
  EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_payments.job_id AND jobs.user_id = auth.uid())
);

CREATE POLICY "Users read own job costs" ON job_internal_costs FOR SELECT USING (
  EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_internal_costs.job_id AND jobs.user_id = auth.uid())
);
CREATE POLICY "Users insert own job costs" ON job_internal_costs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_internal_costs.job_id AND jobs.user_id = auth.uid())
);
CREATE POLICY "Users update own job costs" ON job_internal_costs FOR UPDATE USING (
  EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_internal_costs.job_id AND jobs.user_id = auth.uid())
);
CREATE POLICY "Users delete own job costs" ON job_internal_costs FOR DELETE USING (
  EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_internal_costs.job_id AND jobs.user_id = auth.uid())
);

-- Inventory: users see only their own
CREATE POLICY "Users read own inventory" ON inventory_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own inventory" ON inventory_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own inventory" ON inventory_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own inventory" ON inventory_items FOR DELETE USING (auth.uid() = user_id);

-- Inventory transactions: accessible if user owns the parent item
CREATE POLICY "Users read own inv transactions" ON inventory_transactions FOR SELECT USING (
  EXISTS (SELECT 1 FROM inventory_items WHERE inventory_items.id = inventory_transactions.item_id AND inventory_items.user_id = auth.uid())
);
CREATE POLICY "Users insert own inv transactions" ON inventory_transactions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM inventory_items WHERE inventory_items.id = inventory_transactions.item_id AND inventory_items.user_id = auth.uid())
);
CREATE POLICY "Users update own inv transactions" ON inventory_transactions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM inventory_items WHERE inventory_items.id = inventory_transactions.item_id AND inventory_items.user_id = auth.uid())
);
CREATE POLICY "Users delete own inv transactions" ON inventory_transactions FOR DELETE USING (
  EXISTS (SELECT 1 FROM inventory_items WHERE inventory_items.id = inventory_transactions.item_id AND inventory_items.user_id = auth.uid())
);

-- Overheads: users see only their own
CREATE POLICY "Users read own overheads" ON overhead_costs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own overheads" ON overhead_costs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own overheads" ON overhead_costs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own overheads" ON overhead_costs FOR DELETE USING (auth.uid() = user_id);

-- Activity log: users see only their own
CREATE POLICY "Users read own activity" ON activity_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own activity" ON activity_log FOR INSERT WITH CHECK (auth.uid() = user_id);

-- App state: users see only their own
CREATE POLICY "Users read own state" ON app_state FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own state" ON app_state FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own state" ON app_state FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own state" ON app_state FOR DELETE USING (auth.uid() = user_id);
