-- =============================================
-- DrillOps Pro — Supabase Database Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- JOBS
-- =============================================
CREATE TABLE jobs (
  id TEXT PRIMARY KEY DEFAULT ('job-' || uuid_generate_v4()::text),
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

-- Job Services (many-to-many)
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
  action TEXT NOT NULL,
  details TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  type TEXT NOT NULL CHECK (type IN ('job', 'billing', 'inventory', 'cost', 'system'))
);

-- =============================================
-- APP STATE (job counter, settings, etc.)
-- =============================================
CREATE TABLE app_state (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'
);

-- =============================================
-- INDEXES for performance
-- =============================================
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_customer ON jobs(customer_name);
CREATE INDEX idx_job_services_job ON job_services(job_id);
CREATE INDEX idx_job_custom_items_job ON job_custom_items(job_id);
CREATE INDEX idx_job_payments_job ON job_payments(job_id);
CREATE INDEX idx_job_internal_costs_job ON job_internal_costs(job_id);
CREATE INDEX idx_inventory_tx_item ON inventory_transactions(item_id);
CREATE INDEX idx_inventory_tx_date ON inventory_transactions(date);
CREATE INDEX idx_overhead_costs_date ON overhead_costs(date);
CREATE INDEX idx_activity_log_timestamp ON activity_log(timestamp DESC);

-- =============================================
-- ROW LEVEL SECURITY (public access for demo)
-- In production, replace with authenticated policies
-- =============================================
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

-- Public read/write policies (for demo without auth)
CREATE POLICY "Public read jobs" ON jobs FOR SELECT USING (true);
CREATE POLICY "Public insert jobs" ON jobs FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update jobs" ON jobs FOR UPDATE USING (true);
CREATE POLICY "Public delete jobs" ON jobs FOR DELETE USING (true);

CREATE POLICY "Public read job_services" ON job_services FOR SELECT USING (true);
CREATE POLICY "Public insert job_services" ON job_services FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update job_services" ON job_services FOR UPDATE USING (true);
CREATE POLICY "Public delete job_services" ON job_services FOR DELETE USING (true);

CREATE POLICY "Public read job_custom_items" ON job_custom_items FOR SELECT USING (true);
CREATE POLICY "Public insert job_custom_items" ON job_custom_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update job_custom_items" ON job_custom_items FOR UPDATE USING (true);
CREATE POLICY "Public delete job_custom_items" ON job_custom_items FOR DELETE USING (true);

CREATE POLICY "Public read job_payments" ON job_payments FOR SELECT USING (true);
CREATE POLICY "Public insert job_payments" ON job_payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update job_payments" ON job_payments FOR UPDATE USING (true);
CREATE POLICY "Public delete job_payments" ON job_payments FOR DELETE USING (true);

CREATE POLICY "Public read job_internal_costs" ON job_internal_costs FOR SELECT USING (true);
CREATE POLICY "Public insert job_internal_costs" ON job_internal_costs FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update job_internal_costs" ON job_internal_costs FOR UPDATE USING (true);
CREATE POLICY "Public delete job_internal_costs" ON job_internal_costs FOR DELETE USING (true);

CREATE POLICY "Public read inventory_items" ON inventory_items FOR SELECT USING (true);
CREATE POLICY "Public insert inventory_items" ON inventory_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update inventory_items" ON inventory_items FOR UPDATE USING (true);
CREATE POLICY "Public delete inventory_items" ON inventory_items FOR DELETE USING (true);

CREATE POLICY "Public read inventory_transactions" ON inventory_transactions FOR SELECT USING (true);
CREATE POLICY "Public insert inventory_transactions" ON inventory_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update inventory_transactions" ON inventory_transactions FOR UPDATE USING (true);
CREATE POLICY "Public delete inventory_transactions" ON inventory_transactions FOR DELETE USING (true);

CREATE POLICY "Public read overhead_costs" ON overhead_costs FOR SELECT USING (true);
CREATE POLICY "Public insert overhead_costs" ON overhead_costs FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update overhead_costs" ON overhead_costs FOR UPDATE USING (true);
CREATE POLICY "Public delete overhead_costs" ON overhead_costs FOR DELETE USING (true);

CREATE POLICY "Public read activity_log" ON activity_log FOR SELECT USING (true);
CREATE POLICY "Public insert activity_log" ON activity_log FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update activity_log" ON activity_log FOR UPDATE USING (true);
CREATE POLICY "Public delete activity_log" ON activity_log FOR DELETE USING (true);

CREATE POLICY "Public read app_state" ON app_state FOR SELECT USING (true);
CREATE POLICY "Public insert app_state" ON app_state FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update app_state" ON app_state FOR UPDATE USING (true);
CREATE POLICY "Public delete app_state" ON app_state FOR DELETE USING (true);

-- =============================================
-- SEED DATA
-- =============================================
INSERT INTO inventory_items (id, name, unit, opening_stock, current_stock, total_purchased, total_used, total_destroyed, reorder_level, cost_per_unit) VALUES
  ('inv-gi', 'GI Casing', 'feet', 500, 320, 200, 350, 30, 100, 180),
  ('inv-pvc', 'PVC Casing', 'feet', 400, 280, 100, 200, 20, 80, 120),
  ('inv-diesel', 'Diesel', 'litres', 2000, 1200, 1500, 2100, 200, 500, 89);

INSERT INTO inventory_transactions (id, item_id, type, quantity, cost_per_unit, total_cost, date, supplier, job_id, note) VALUES
  ('tx-1', 'inv-gi', 'purchase', 200, 180, 36000, '2025-01-15', 'Steel India Corp', NULL, NULL),
  ('tx-2', 'inv-gi', 'used', 350, 180, 63000, '2025-02-10', NULL, 'job-1', NULL),
  ('tx-3', 'inv-gi', 'destroyed', 30, 180, 5400, '2025-02-12', NULL, NULL, 'Damaged during transport'),
  ('tx-4', 'inv-pvc', 'purchase', 100, 120, 12000, '2025-01-20', 'PlastiTubes Ltd', NULL, NULL),
  ('tx-5', 'inv-pvc', 'used', 200, 120, 24000, '2025-02-15', NULL, 'job-2', NULL),
  ('tx-6', 'inv-pvc', 'destroyed', 20, 120, 2400, '2025-03-01', NULL, NULL, 'Cracked casing'),
  ('tx-7', 'inv-diesel', 'purchase', 1500, 89, 133500, '2025-01-10', 'Indian Oil Depot', NULL, NULL),
  ('tx-8', 'inv-diesel', 'used', 2100, 89, 186900, '2025-02-20', NULL, NULL, NULL),
  ('tx-9', 'inv-diesel', 'destroyed', 200, 89, 17800, '2025-03-05', NULL, NULL, 'Contaminated fuel');

INSERT INTO jobs (id, customer_name, mobile, location, description, scheduled_date, notes, status, created_at, drilling_rate_per_foot, casing_type, casing_rate_per_unit, advance_received, completed_at, depth_drilled, casing_used_units, diesel_cost, soil_type, billing_generated, final_bill_amount, total_paid, payment_status, rating) VALUES
  ('job-1', 'Rajesh Kumar', '9876543210', 'Sector 23, Gurugram, Haryana', 'Borewell for residential building - 6 inch bore', '2025-02-01', 'Customer needs deep bore, hard rock expected at 80ft', 'closed', '2025-01-28T10:00:00Z', 350, 'GI', 450, 50000, '2025-02-05', 180, 180, 18000, 'Rocky', TRUE, 155400, 155400, 'paid', 5),
  ('job-2', 'Sunita Sharma', '9123456780', 'DLF Phase 3, Gurugram, Haryana', 'Agricultural borewell - 8 inch bore for irrigation', '2025-02-15', 'Agricultural land, need high yield', 'billed', '2025-02-10T09:00:00Z', 400, 'PVC', 350, 30000, '2025-02-20', 220, 200, 22000, 'Mixed (Clay + Rock)', TRUE, 172000, 100000, 'partial', 4),
  ('job-3', 'Mohammed Irfan', '9988776655', 'Rohini Sector 7, Delhi', 'Residential borewell replacement', '2025-03-01', 'Old bore collapsed, need replacement', 'completed', '2025-02-25T11:00:00Z', 380, 'GI', 450, 40000, '2025-03-04', 150, 150, 15000, 'Sandy', FALSE, NULL, 40000, 'pending', 0),
  ('job-4', 'Priya Verma', '9871234560', 'Sohna Road, Haryana', 'New borewell for farmhouse', '2025-03-10', 'Farmhouse construction, need water supply urgently', 'active', '2025-03-05T08:00:00Z', 350, 'GI', 450, 25000, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, 25000, 'pending', 0),
  ('job-5', 'Anand Patel', '9765432100', 'Manesar, Haryana', 'Industrial borewell for factory', '2025-03-15', 'Large factory complex, need high capacity bore', 'scheduled', '2025-03-08T14:00:00Z', 450, 'GI', 500, 60000, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, 60000, 'pending', 0),
  ('job-6', 'Kavita Rani', '9654321098', 'Faridabad, Haryana', 'Residential borewell - 5 inch bore', '2025-03-18', 'Small residential plot, budget constraint', 'scheduled', '2025-03-12T10:00:00Z', 300, 'PVC', 300, 20000, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, 20000, 'pending', 0);

-- Job Services
INSERT INTO job_services (id, job_id, key, name, rate, quantity, quantity_used) VALUES
  ('svc-1-1', 'job-1', 'welding', 'Welding', 500, 1, 8),
  ('svc-1-2', 'job-1', 'transportation', 'Transportation', 5000, 1, 1),
  ('svc-1-3', 'job-1', 'flushing', 'Flushing', 3000, 1, 2),
  ('svc-2-1', 'job-2', 'welding', 'Welding', 500, 1, 6),
  ('svc-2-2', 'job-2', 'transportation', 'Transportation', 5000, 1, 1),
  ('svc-2-3', 'job-2', 'flushing', 'Flushing', 3000, 1, 3),
  ('svc-2-4', 'job-2', 'filterInstallation', 'Filter Installation', 2000, 1, 2),
  ('svc-3-1', 'job-3', 'welding', 'Welding', 500, 1, 5),
  ('svc-3-2', 'job-3', 'transportation', 'Transportation', 5000, 1, 1),
  ('svc-3-3', 'job-3', 'flushing', 'Flushing', 3000, 1, 1),
  ('svc-4-1', 'job-4', 'welding', 'Welding', 500, 1, 0),
  ('svc-4-2', 'job-4', 'transportation', 'Transportation', 5000, 1, 0),
  ('svc-4-3', 'job-4', 'flushing', 'Flushing', 3000, 1, 0),
  ('svc-5-1', 'job-5', 'welding', 'Welding', 500, 1, 0),
  ('svc-5-2', 'job-5', 'transportation', 'Transportation', 5000, 1, 0),
  ('svc-5-3', 'job-5', 'flushing', 'Flushing', 3000, 1, 0),
  ('svc-5-4', 'job-5', 'filterInstallation', 'Filter Installation', 2000, 1, 0),
  ('svc-6-1', 'job-6', 'welding', 'Welding', 500, 1, 0),
  ('svc-6-2', 'job-6', 'transportation', 'Transportation', 5000, 1, 0);

-- Job Custom Items
INSERT INTO job_custom_items (id, job_id, name, rate, quantity, quantity_used) VALUES
  ('ci-1', 'job-1', 'Motor Installation', 15000, 1, 1),
  ('ci-2', 'job-3', 'Old Bore Sealing', 8000, 1, 1),
  ('ci-3', 'job-5', 'Pump Installation', 25000, 1, 0);

-- Job Payments
INSERT INTO job_payments (id, job_id, amount, date, method, note) VALUES
  ('pay-1', 'job-1', 50000, '2025-01-30', 'upi', 'Advance'),
  ('pay-2', 'job-1', 60000, '2025-02-06', 'bank_transfer', 'After completion'),
  ('pay-3', 'job-1', 45400, '2025-02-20', 'cash', 'Final settlement'),
  ('pay-4', 'job-2', 30000, '2025-02-12', 'upi', 'Advance'),
  ('pay-5', 'job-2', 70000, '2025-02-22', 'bank_transfer', 'Partial payment'),
  ('pay-6', 'job-3', 40000, '2025-02-28', 'cash', 'Advance'),
  ('pay-7', 'job-4', 25000, '2025-03-06', 'upi', 'Advance'),
  ('pay-8', 'job-5', 60000, '2025-03-09', 'bank_transfer', 'Advance'),
  ('pay-9', 'job-6', 20000, '2025-03-13', 'cash', 'Advance');

-- Job Internal Costs
INSERT INTO job_internal_costs (id, job_id, type, category, description, amount, date) VALUES
  ('ic-1', 'job-1', 'diesel', 'job', 'Diesel for drilling', 18000, '2025-02-05'),
  ('ic-2', 'job-1', 'labour', 'job', 'Labour charges', 12000, '2025-02-05'),
  ('ic-3', 'job-2', 'diesel', 'job', 'Diesel for drilling', 22000, '2025-02-20'),
  ('ic-4', 'job-2', 'labour', 'job', 'Labour charges', 15000, '2025-02-20'),
  ('ic-5', 'job-3', 'diesel', 'job', 'Diesel cost', 15000, '2025-03-04');

-- Overhead Costs
INSERT INTO overhead_costs (id, category, description, amount, date, recurring) VALUES
  ('oh-1', 'Rent', 'Office/yard rent for February', 25000, '2025-02-01', TRUE),
  ('oh-2', 'Rent', 'Office/yard rent for March', 25000, '2025-03-01', TRUE),
  ('oh-3', 'Maintenance', 'Drilling rig maintenance', 18000, '2025-02-15', FALSE),
  ('oh-4', 'Insurance', 'Equipment insurance premium', 12000, '2025-01-15', TRUE),
  ('oh-5', 'Utilities', 'Electricity and water bills', 8000, '2025-02-28', TRUE),
  ('oh-6', 'Transport', 'Vehicle maintenance and fuel', 15000, '2025-03-05', FALSE),
  ('oh-7', 'Salary', 'Staff salaries - February', 60000, '2025-02-28', TRUE),
  ('oh-8', 'Salary', 'Staff salaries - March', 60000, '2025-03-28', TRUE);

-- Activity Log
INSERT INTO activity_log (id, action, details, timestamp, type) VALUES
  ('al-1', 'Job Created', 'New job for Kavita Rani at Faridabad', '2025-03-12T10:00:00Z', 'job'),
  ('al-2', 'Job Started', 'Job #4 for Priya Verma started at Sohna Road', '2025-03-10T08:00:00Z', 'job'),
  ('al-3', 'Payment Received', '₹25,000 advance from Priya Verma via UPI', '2025-03-06T09:00:00Z', 'billing'),
  ('al-4', 'Job Completed', 'Job #3 for Mohammed Irfan completed - 150ft drilled', '2025-03-04T17:00:00Z', 'job'),
  ('al-5', 'Inventory Purchase', '200ft GI Casing purchased from Steel India Corp', '2025-01-15T11:00:00Z', 'inventory'),
  ('al-6', 'Bill Generated', 'Bill ₹1,72,000 generated for Sunita Sharma', '2025-02-21T10:00:00Z', 'billing'),
  ('al-7', 'Overhead Cost', '₹18,000 rig maintenance recorded', '2025-02-15T14:00:00Z', 'cost');

-- App State
INSERT INTO app_state (key, value) VALUES ('jobCounter', '7');
