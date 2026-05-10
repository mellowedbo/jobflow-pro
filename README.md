# DrillOps Pro — Borewell Operations ERP

> A full-stack enterprise resource planning system built from the ground up for borewell drilling operations — from job scheduling to billing, inventory to accounting, all in one place.

[![Live Demo](https://img.shields.io/badge/Live-Demo_Mode-emerald?style=for-the-badge)](https://jobflow-pro.vercel.app)
[![Stack](https://img.shields.io/badge/Stack-Next.js_16_%7C_Supabase_%7C_TypeScript-blue?style=flat-square)](https://github.com/mellowedbo/jobflow-pro)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=flat-square)]()

---

## 🎯 What Is This?

DrillOps Pro is an operations management and billing platform designed specifically for borewell drilling businesses in India. It handles the entire lifecycle of a drilling job — from the first customer call to the final invoice — while tracking every rupee, every casing pipe, and every litre of diesel along the way.

This isn't a generic ERP reskinned for drilling. Every feature, every workflow, every field was designed around how borewell operations actually work on the ground: the soil types we encounter, the per-foot drilling rates we charge, the advance-and-balance payment structures, the casing and welding services that get tacked onto every job.

**Try it right now — no account needed:**
👉 **[Launch Demo Mode](https://jobflow-pro.vercel.app)** → Click "Launch Demo" on the login screen

---

## ✨ Features

### Job Lifecycle Management
- **Job Scheduling** — Create jobs with customer details, location, scheduled date, drilling rate per foot, casing type (GI/PVC), and advance received
- **Job Tracking** — Real-time status pipeline: `Scheduled → Active → Completed → Billed → Closed`
- **Job Completion** — Record depth drilled, casing used, diesel cost, soil type encountered, and service quantities upon completion
- **Service Management** — Predefined services (Welding, Transportation, Flushing, Filter Installation) with configurable rates, plus custom line items
- **Job Rating** — Customer satisfaction tracking after completion

### Billing & Invoicing
- **Auto Invoice Generation** — Calculates total from drilling (depth × rate/ft), casing (units × rate/unit), services, and custom items
- **Manual Bill Override** — Final bill amount can be adjusted before generation
- **Payment Tracking** — Record multiple payments per job with method (Cash/UPI/Bank Transfer/Cheque), dates, and notes
- **Payment Status** — Automatic tracking: `Pending → Partial → Paid`
- **Advance Management** — Advance received at booking tracked against final bill

### Inventory Management
- **Stock Tracking** — Real-time current stock, total purchased, total used, total destroyed
- **Purchase Logging** — Record purchases with supplier, cost per unit, and notes
- **Usage Tracking** — Link inventory consumption to specific jobs
- **Damage/Loss Recording** — Track destroyed or damaged items separately
- **Reorder Alerts** — Items below reorder level flagged on dashboard
- **Full Transaction History** — Every stock movement logged with date, quantity, cost, and context

### Financial Overview
- **Profit & Loss** — Per-job P&L calculation (Revenue minus Drilling costs, Diesel, Internal costs, Services)
- **Overhead Cost Tracking** — Monthly overheads (rent, salaries, maintenance, insurance) with recurring flags
- **Revenue Analytics** — Total revenue, outstanding payments, payment collection rates
- **Cost Breakdown** — Understand where money goes: diesel, labour, materials, overheads

### Dashboard & Analytics
- **Executive Dashboard** — Active jobs, revenue metrics, inventory alerts, recent activity
- **Job Pipeline View** — Visual representation of jobs across all stages
- **Customer CRM** — Customer database with job history, payment patterns, and contact info
- **Activity Log** — Chronological feed of every action: job created, payment received, inventory purchased, etc.
- **Reports & CSV Export** — Export jobs, payments, inventory data for accounting or analysis

### User Experience
- **Dark Mode** — Full dark theme support
- **Mobile Responsive** — Works on phones, tablets, and desktops
- **Keyboard Navigation** — Accessible and fast
- **Smooth Animations** — Framer Motion transitions between views
- **Toast Notifications** — Real-time feedback for every action
- **Confirmation Dialogs** — Prevent accidental destructive actions

### Technical
- **Supabase Backend** — PostgreSQL with Row Level Security (RLS) — every user only sees their own data
- **Multi-User Auth** — Email/password authentication with Supabase Auth
- **Demo Mode** — Full app experience with sample data, no account required
- **API Layer** — 17 RESTful API routes with auth token verification
- **Snake_case ↔ camelCase** — Automatic data transformation between database and frontend

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS 4, shadcn/ui |
| **State** | Zustand |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth with RLS |
| **Charts** | Recharts |
| **Animations** | Framer Motion |
| **Notifications** | Sonner |
| **Theming** | next-themes |
| **Deployment** | Vercel |

---

## 📊 Database Schema

11 tables with Row Level Security:

```
profiles              → User profile (auto-created on signup)
jobs                  → Main job records
job_services          → Services per job (welding, transport, etc.)
job_custom_items      → Custom line items per job
job_payments          → Payment records per job
job_internal_costs    → Internal costs per job (diesel, labour)
inventory_items       → Stock master list
inventory_transactions→ Every stock movement
overhead_costs        → Monthly business overheads
activity_log          → Chronological activity feed
app_state             → App-level state (counters, settings)
```

All tables enforce `auth.uid()` RLS — users can only read/write their own data. No cross-tenant data leakage.

---

## 🚀 Quick Start

### Option 1: Try It Now (No Setup)
Visit the [live app](https://jobflow-pro.vercel.app) and click **"Launch Demo"**. Full experience with sample data — no account, no database, no configuration.

### Option 2: With Supabase (Cloud Sync)
1. Fork/clone this repo
2. Create a [Supabase](https://supabase.com) free project
3. Run the SQL schema from `supabase/schema.sql` in the Supabase SQL Editor
4. In Supabase Dashboard → Authentication → Settings → **disable "Confirm email"** (for testing)
5. Set environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```
6. Deploy to Vercel (or run `bun install && bun dev`)

---

## 🗺️ The Two-Year Journey

DrillOps Pro wasn't built in a weekend hackathon. It's the product of two years of iterative development, driven by real operational needs from an actual borewell drilling business.

### Year One — The Foundation (2024)
What started as a simple spreadsheet replacement grew into something much more:
- **v0.1** — Basic job tracking in a local SQLite database. Could create jobs and mark them complete. That was it.
- **v0.3** — Added billing calculations. Finally stopped calculating invoices on paper.
- **v0.5** — Inventory tracking. Realised we were losing money on untracked diesel and casing consumption.
- **v0.7** — Payment tracking and advance management. The "who owes us how much" spreadsheet was retired.
- **v0.9** — Dashboard and reports. First time we could actually *see* how the business was doing without tallying receipts.

### Year Two — The Platform (2025-2026)
- **v1.0** — Complete rewrite. Moved from client-side only to a proper full-stack architecture with API routes and a PostgreSQL backend.
- **v1.2** — Customer CRM. Started tracking customer relationships, not just transactions.
- **v1.4** — Overhead cost tracking and per-job P&L. This was the turning point — we went from "are we making money?" to "which jobs are profitable?"
- **v1.6** — Multi-user authentication with Supabase. Row Level Security so each operator only sees their own data.
- **v1.8** — Dark mode, mobile responsiveness, and the UI polish pass.
- **v2.0** — Demo mode for showcasing. Activity log. CSV exports. The version that's on this repo.

### Recent Additions
- **Demo Mode** — Full app experience without needing a Supabase account. Built for portfolio reviews and investor demos.
- **Connection Resilience** — App gracefully degrades when Supabase is unavailable, falling back to demo data.
- **Streamlined Auth** — Simplified Supabase client to eliminate the middleware complexity that was causing deployment issues.

---

## 👤 My Role

I'm a **BBA Finance** student who fell into building software because the business needed it. My background shaped every decision in this project:

- **Billing logic** isn't just "multiply rate × quantity" — it handles advance adjustments, partial payments, and the specific per-foot drilling rate structures used in Indian borewell operations
- **P&L tracking** was designed the way I was taught to read financial statements — revenue at the top, direct costs below, overheads allocated properly
- **Inventory valuation** follows FIFO principles because that's what our CA needs for compliance
- **Payment tracking** mirrors actual cash flow patterns in our industry — advances, milestone payments, and the eternal follow-up for outstanding balances

I didn't start as a developer. I started as someone frustrated that our drilling business was running on WhatsApp messages, paper receipts, and a spreadsheet that nobody updated. Two years later, we have a system that tracks every job, every rupee, and every casing pipe — and I learned to build it along the way.

---

## 🔮 What's Next

These are features we're actively planning or working on. Some are partially prototyped; others are on the roadmap based on our own operational needs:

### GIS & Predictive Analytics
- **Depth Mapping** — Visualise drilling depths across locations to identify patterns
- **Soil/Clay Type Mapping** — Build a geographic model of soil types encountered during drilling
- **Profitability Prediction** — Use historical depth, soil, and cost data to predict whether a job at a given location will be profitable *before* we commit the rig
- **Route Optimisation** — Plan daily job routes to minimise travel time between sites

### Role-Based Access Control
- **Operator** — Job execution: start/complete jobs, record depth, use inventory
- **Manager** — Full operations: scheduling, inventory purchasing, team oversight
- **Accountant** — Financial only: billing, payments, P&L, overheads, reports
- **Owner** — Everything + analytics, user management, business settings

### Proper Accounting
- **Double-Entry Bookkeeping** — Replace the current single-entry cash flow tracking
- **GST Compliance** — Automatic GST calculations on invoices
- **TDS Tracking** — Tax deducted at source on contractor payments
- **Bank Reconciliation** — Match payments to bank statements
- **Financial Statements** — Auto-generated P&L, Balance Sheet, Cash Flow

### Operational Enhancements
- **SMS/WhatsApp Notifications** — Customer booking confirmations, payment receipts
- **Digital Signatures** — Job completion sign-off on mobile
- **Photo Documentation** — Attach site photos to jobs
- **Recurring Job Scheduling** — Annual maintenance contracts for existing borewells
- **Multi-Rig Management** — Track which rig is where, with what team

---

## 🏢 About mellowedbones

mellowedbones is an independent development studio focused on building tools for industries that are underserved by mainstream software. DrillOps Pro is our flagship product — born from our own drilling operations and built to solve problems we face every day.

We believe vertical ERP software doesn't have to cost lakhs or require a team of consultants to set up. If you know your business, you can build the tool that runs it.

---

## 📄 License

This project is proprietary. The code is visible for portfolio and review purposes. All rights reserved.

---

*Built with stubbornness, spreadsheets, and late nights over two years.*
