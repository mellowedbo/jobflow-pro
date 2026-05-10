<div align="center">

<img src="https://img.shields.io/badge/Version-2.0-000?style=for-the-badge&labelColor=emerald" />
<img src="https://img.shields.io/badge/Next.js-16-000?style=for-the-badge&logo=nextdotjs&labelColor=black" />
<img src="https://img.shields.io/badge/Supabase-PostgreSQL-000?style=for-the-badge&logo=supabase&labelColor=3ECF8E" />
<img src="https://img.shields.io/badge/TypeScript-Strict-000?style=for-the-badge&logo=typescript&labelColor=3178C6" />

<br /><br />

# DrillOps Pro

### Enterprise Resource Planning for Borewell Drilling Operations

*Two years of iterative development. Born from the field. Built for the business.*

[🚀 **Launch Demo**](https://jobflow-pro.vercel.app) · [📖 **Documentation**](#features) · [🗺️ **Roadmap**](#roadmap)

</div>

---

## Overview

DrillOps Pro is a vertically-focused ERP platform designed and built for borewell drilling operations in India. It manages the complete operational lifecycle — from the first customer inquiry to the final invoice payment — while tracking every asset, every rupee, and every metre drilled.

This isn't a generic project management tool with drilling labels slapped on. Every data model, every workflow, every calculation reflects how borewell operations actually run on the ground:

- **Per-foot drilling rates** that vary by diameter and soil conditions
- **Advance-and-balance payment structures** standard in Indian construction
- **Casing type tracking** (GI vs PVC) with separate rate cards
- **Service bundling** — welding, transportation, flushing, filter installation — tacked onto every job
- **Soil type logging** that directly impacts cost and billing
- **Inventory consumption** linked to specific jobs for per-job costing

The system currently processes real operational data across job scheduling, inventory management, billing, payment tracking, and financial analytics — all with multi-user authentication and row-level data isolation.

> **Try it now:** Visit the [live app](https://jobflow-pro.vercel.app) and click **"Launch Demo"** — no account needed. Full experience with realistic sample data across all modules.

---

## Features

### Operations Management

| Feature | Description |
|---------|-------------|
| **Job Scheduling** | Create jobs with customer details, location, drilling specs, casing configuration, and scheduled dates |
| **Job Pipeline** | Five-stage status flow: `Scheduled → Active → Completed → Billed → Closed` with date tracking at each transition |
| **Job Completion** | Record depth drilled, casing consumed, diesel cost, soil type encountered, and service quantities |
| **Service Management** | Predefined service catalogue (Welding, Transportation, Flushing, Filter Installation) with configurable rates, plus custom line items |
| **Customer CRM** | Customer database with full job history, payment patterns, mobile numbers, and location data |
| **Activity Log** | Chronological audit trail of every system action — job events, payments, inventory movements, system alerts |

### Billing & Revenue

| Feature | Description |
|---------|-------------|
| **Auto Invoice Calculation** | Generates bill from drilling (depth × rate/ft) + casing (units × rate/unit) + services + custom items |
| **Payment Recording** | Multi-payment tracking per job with method (Cash / UPI / Bank Transfer / Cheque), dates, and notes |
| **Payment Status Engine** | Automatic `Pending → Partial → Paid` transitions based on total received vs final bill |
| **Advance Management** | Advances captured at booking and tracked against final settlement |
| **Bill Overrides** | Final bill amount can be manually adjusted before invoice generation |

### Inventory & Materials

| Feature | Description |
|---------|-------------|
| **Real-time Stock Tracking** | Current stock, total purchased, total used, total destroyed — updated on every transaction |
| **Purchase Logging** | Supplier, cost per unit, quantity, and notes for every incoming stock movement |
| **Job-linked Consumption** | Inventory usage tied to specific jobs for accurate per-job costing |
| **Damage & Loss Recording** | Separate tracking for destroyed/damaged items |
| **Reorder Level Alerts** | Dashboard flags when any item drops below its reorder threshold |
| **Transaction Audit Trail** | Complete history of every stock movement with cost, date, and context |

### Financial Intelligence

| Feature | Description |
|---------|-------------|
| **Per-Job P&L** | Revenue minus drilling costs, diesel, internal costs, and allocated overheads |
| **Overhead Cost Management** | Monthly overheads (rent, salaries, maintenance, insurance) with recurring flags |
| **Revenue Analytics** | Total revenue, outstanding receivables, collection rates, revenue by period |
| **Cost Breakdown Analysis** | Understand cost distribution: diesel, labour, materials, services, overheads |
| **Reports & Data Export** | CSV export of jobs, payments, inventory transactions, and overhead data |

### Analytics & Intelligence *(Advance Prototype)*

| Feature | Description |
|---------|-------------|
| **Revenue & Profit Trends** | 6-month area chart with revenue and profit overlay |
| **Job Completion Metrics** | Pipeline breakdown, completion rate, average turnaround |
| **Soil Type Analysis** | Average depth and profitability by soil type |
| **Payment Aging Analysis** | Outstanding receivables bucketed by 0-30, 30-60, 60-90, 90+ days |
| **Cash Flow Forecast** | 6-month projected inflow vs outflow based on current pipeline |
| **Customer Acquisition Tracking** | Cumulative customer count over time |
| **Profitability Scoring** | Per-job margin analysis with colour-coded health indicators |

### GIS & Depth Mapping *(Beta)*

| Feature | Description |
|---------|-------------|
| **Depth Visualisation** | Bar chart of drilling depths per location, colour-coded by soil type |
| **Soil Distribution Map** | Donut chart showing proportion of soil types encountered |
| **Depth vs Profitability** | Scatter plot correlating drilling depth with job profitability |
| **Completed Jobs Atlas** | Tabular view of all completed jobs with geographically-relevant data |

### Access Control & Security

| Feature | Description |
|---------|-------------|
| **Role-Based Access Control** | Four-tier permission system: Operator, Manager, Accountant, Owner |
| **Row-Level Security** | Supabase RLS policies enforce data isolation — users only see their own data |
| **Multi-User Authentication** | Email/password auth via Supabase Auth |
| **Demo Mode** | Full app experience with sample data, no authentication required |

#### Role Permissions Matrix

| Module | Operator | Manager | Accountant | Owner |
|--------|:--------:|:-------:|:----------:|:-----:|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Active Jobs | ✅ | ✅ | 👁️ View | ✅ |
| Completed Jobs | ✅ | ✅ | ✅ | ✅ |
| Billing | ❌ | ❌ | ✅ | ✅ |
| Inventory | ✅ | ✅ | ❌ | ✅ |
| Costs & P&L | ❌ | ✅ | ✅ | ✅ |
| Customers | ❌ | ✅ | ✅ | ✅ |
| Reports | ❌ | ✅ | ✅ | ✅ |
| Analytics | ❌ | ✅ | ✅ | ✅ |
| Depth Map | ❌ | ✅ | ❌ | ✅ |
| Settings | ❌ | ❌ | ❌ | ✅ |

### User Experience

| Feature | Description |
|---------|-------------|
| **Dark Mode** | System-aware dark theme with manual toggle |
| **Responsive Design** | Optimised for desktop, tablet, and mobile with adaptive sidebar |
| **Animated Transitions** | Smooth view transitions with Framer Motion |
| **Toast Notifications** | Real-time feedback for all operations |
| **Confirmation Dialogs** | Destructive action safeguards |
| **Role Switcher** | Switch between permission levels for testing and demonstration |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client (Browser)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │ React 19 │  │ Zustand  │  │ Recharts │  │shadcn/ui│ │
│  │ App Rtr  │  │  State   │  │ Charts   │  │  Radix  │ │
│  └────┬─────┘  └────┬─────┘  └──────────┘  └─────────┘ │
│       │              │                                     │
│       │   ┌──────────┴──────────┐                         │
│       │   │  Supabase JS Client │ ← Auth + Realtime       │
│       │   └──────────┬──────────┘                         │
└───────┼──────────────┼────────────────────────────────────┘
        │              │
┌───────┼──────────────┼────────────────────────────────────┐
│       │     Server (Vercel Edge)                           │
│  ┌────┴─────┐  ┌─────┴──────┐  ┌────────────────────┐   │
│  │ 17 API   │  │ Auth       │  │ Snake↔camelCase    │   │
│  │ Routes   │  │ Token      │  │ Transform Layer    │   │
│  │ (REST)   │  │ Verify     │  │                    │   │
│  └────┬─────┘  └─────┬──────┘  └────────────────────┘   │
└───────┼──────────────┼────────────────────────────────────┘
        │              │
┌───────┼──────────────┼────────────────────────────────────┐
│       │    Supabase (PostgreSQL)                           │
│  ┌────┴────────────┴──────┐  ┌──────────────────────┐    │
│  │ 11 Tables + Indexes    │  │ Row-Level Security   │    │
│  │  Foreign Keys          │  │ auth.uid() Policies  │    │
│  │  Auto-profile Trigger  │  │ Per-table RLS        │    │
│  └────────────────────────┘  └──────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 16 (App Router, Turbopack) | Full-stack React framework |
| Language | TypeScript (strict) | Type safety across the stack |
| Styling | Tailwind CSS 4 + shadcn/ui | Utility-first with accessible primitives |
| State | Zustand | Lightweight global state management |
| Database | Supabase (PostgreSQL) | Managed Postgres with built-in auth |
| Auth | Supabase Auth + RLS | JWT-based auth with row-level policies |
| Charts | Recharts | Composable charting for analytics |
| Animations | Framer Motion | View transitions and micro-interactions |
| Notifications | Sonner | Toast notification system |
| Theming | next-themes | Dark mode with system detection |
| Deployment | Vercel | Edge-deployed with serverless functions |

### Database Schema

```
┌──────────────────┐     ┌──────────────────┐
│    profiles      │     │      jobs        │
│──────────────────│     │──────────────────│
│ id (PK, FK→auth) │◄────│ user_id (FK)     │
│ full_name        │     │ id (PK)          │
│ email            │     │ customer_name    │
│ created_at       │     │ mobile           │
└──────────────────┘     │ location         │
                         │ drilling_rate    │
                         │ casing_type      │
                         │ status           │
                         │ ...              │
                         └───────┬──────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
   ┌──────────┴──────┐  ┌───────┴───────┐  ┌───────┴────────┐
   │  job_services   │  │  job_payments │  │ job_int_costs  │
   │─────────────────│  │───────────────│  │────────────────│
   │ job_id (FK)     │  │ job_id (FK)   │  │ job_id (FK)    │
   │ service_key     │  │ amount        │  │ type           │
   │ rate            │  │ method        │  │ amount         │
   │ quantity        │  │ date          │  │ category       │
   └─────────────────┘  └───────────────┘  └────────────────┘

   ┌──────────────────┐     ┌──────────────────────────┐
   │ inventory_items  │     │ inventory_transactions   │
   │──────────────────│     │──────────────────────────│
   │ id (PK)          │◄────│ item_id (FK)             │
   │ user_id (FK)     │     │ type (purchase/used/dest)│
   │ name             │     │ quantity, cost_per_unit  │
   │ unit             │     │ total_cost               │
   │ current_stock    │     │ date, supplier, note     │
   │ reorder_level    │     └──────────────────────────┘
   └──────────────────┘

   ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
   │  overhead_costs  │     │  activity_log    │     │    app_state     │
   │──────────────────│     │──────────────────│     │──────────────────│
   │ id (PK)          │     │ id (PK)          │     │ user_id (PK,FK)  │
   │ user_id (FK)     │     │ user_id (FK)     │     │ job_counter      │
   │ category         │     │ action           │     │ settings (jsonb) │
   │ amount           │     │ details          │     └──────────────────┘
   │ recurring        │     │ type, timestamp  │
   └──────────────────┘     └──────────────────┘
```

All tables enforce Row Level Security with `auth.uid()` policies. No cross-tenant data access is possible at the database level.

---

## The Two-Year Development Journey

DrillOps Pro was not a hackathon project. It is the product of continuous, need-driven development spanning over two years — each feature added because the business required it, each rewrite because the previous architecture couldn't sustain the next set of demands.

### Phase 1 — Digitisation (Early 2024)

The business was running on WhatsApp messages, paper receipts, and a shared spreadsheet that nobody updated. The first version of what would become DrillOps Pro was a simple local application that could do one thing: record a job and mark it complete. No billing. No inventory. No analytics. But it replaced a whiteboard, and that was enough to start.

- Local-first architecture with SQLite storage
- Basic CRUD operations for job records
- Manual status tracking through a simple interface
- The first version was barely functional, but it proved that the operational data could be captured digitally

### Phase 2 — Billing & Money (Mid 2024)

Once jobs were being tracked, the obvious gap was financial. Invoices were calculated on paper or in heads — and the math was frequently wrong. The billing module was the first major addition:

- Per-foot drilling rate calculation with casing cost overlay
- Service line items with configurable rates
- Advance tracking at the time of booking
- Payment recording with method and date
- The billing logic was designed around how Indian drilling businesses actually charge — not how Western SaaS billing systems work

### Phase 3 — Inventory (Late 2024)

The realisation hit when we compared purchased diesel against billed diesel: significant quantities were unaccounted for. Inventory tracking was built to solve a specific cash leak:

- Stock tracking with opening balances
- Purchase logging with supplier and cost data
- Job-linked consumption tracking for per-job costing
- Damage and loss recording
- Reorder level alerts to prevent stockouts during active drilling
- FIFO-inspired cost tracking for CA compliance

### Phase 4 — The Platform Rewrite (Early 2025)

The local-only architecture couldn't support multiple users or devices. The entire application was rebuilt from scratch with a proper full-stack architecture:

- Migrated from client-side SQLite to PostgreSQL via Supabase
- Built 17 RESTful API routes with JWT authentication
- Implemented Row Level Security for multi-tenant data isolation
- Designed a camelCase ↔ snake_case transformation layer between frontend and database
- Added multi-user email/password authentication
- Responsive UI overhaul with shadcn/ui component library

### Phase 5 — Intelligence Layer (Mid 2025)

With operational data flowing through the system, the next step was making it useful beyond day-to-day operations:

- Per-job P&L calculation with overhead allocation
- Overhead cost tracking with recurring flags
- Customer CRM with job history and payment patterns
- Activity log for full operational audit trail
- Reports module with CSV export for external accounting

### Phase 6 — Analytics & Access Control (2026)

The current phase focuses on making the system enterprise-ready:

- **Role-Based Access Control** — Four-tier permission system (Operator, Manager, Accountant, Owner) with granular page-level access
- **Analytics Dashboard** — Revenue trends, payment aging, cash flow forecasting, profitability scoring
- **GIS/Depth Mapping (Beta)** — Depth visualisation by location, soil type distribution, depth-profitability correlation
- **Demo Mode** — Full application experience without authentication, designed for portfolio reviews and investor demonstrations
- **Dark Mode** — Complete theme system with system preference detection
- **Mobile Responsive** — Full functionality on phones and tablets with adaptive navigation

---

## About mellowedbones

mellowedbones is a solo development studio run by a BBA Finance student who believes that the best software for an industry is built by someone who understands the industry.

The finance and systems thinking background shaped every aspect of DrillOps Pro — not as an afterthought, but as a foundational design principle:

- **Billing logic** models the actual advance-and-balance cash flow patterns used in Indian drilling operations, not generic subscription billing
- **P&L tracking** was designed around how financial statements are actually read — revenue at the top, direct costs below, overheads allocated by period
- **Inventory valuation** follows FIFO principles because that is what our CA requires for compliance reporting
- **Payment aging analysis** mirrors how receivables are tracked in practice — 0-30, 30-60, 60-90, 90+ day buckets
- **Cost allocation** distinguishes between job-level direct costs and period-level overheads because conflating them produces misleading profitability figures
- **The RBAC system** reflects actual organisational structure in a drilling company — the operator on the rig needs different data than the accountant in the office

This project started because existing ERP solutions were either too generic (treating drilling like any other service business) or too expensive (six-figure implementations for a small operation). DrillOps Pro exists in the gap — vertical, specific, and built by someone who uses it.

---

## Roadmap

Features actively in development or planned for the next release cycle:

### GIS & Predictive Intelligence
- **Interactive Depth Map** — Pin completed jobs on a map with depth, soil type, and profitability overlay
- **Soil/Clay Type GIS Layer** — Build a geographic model of subsurface conditions from historical drilling data
- **Profitability Prediction Engine** — Input a location and get a predicted depth range, soil profile, and estimated margin before committing a rig
- **Route Optimisation** — Daily scheduling that minimises travel time between job sites
- **Seasonal Demand Modelling** — Predict busy periods from historical job volume data

### Enterprise Accounting
- **Double-Entry Bookkeeping** — Replace single-entry cash tracking with proper debit/credit accounting
- **GST Compliance Module** — Automatic CGST/SGST calculations on invoices, GSTR-ready reports
- **TDS Tracking** — Tax deducted at source on contractor and vendor payments
- **Bank Reconciliation** — Match recorded payments to bank statement entries
- **Financial Statement Generation** — Auto-produced Profit & Loss, Balance Sheet, Cash Flow Statement
- **Audit Trail** — Immutable transaction log for compliance and review

### Operational Enhancements
- **Granular Role Permissions** — Move from page-level to action-level access control (e.g., Operator can view but not edit billing on a job)
- **SMS/WhatsApp Integration** — Automated booking confirmations, payment receipts, and job status updates
- **Digital Sign-Off** — Mobile job completion confirmation with customer signature capture
- **Photo Documentation** — Attach site condition photos to job records
- **Recurring Job Contracts** — Annual maintenance and service agreements for existing borewells
- **Multi-Rig Management** — Track rig assignments, team allocation, and equipment scheduling
- **Vendor Portal** — Supplier-facing interface for purchase orders and delivery tracking

### Platform
- **Offline-First Mode** — Service Worker-based offline operation with background sync
- **Multi-Language Support** — Tamil, Telugu, Hindi localisation for field operators
- **Mobile App** — React Native wrapper for dedicated mobile experience
- **API Documentation** — OpenAPI spec for third-party integrations
- **White-Label Support** — Customisable branding for other drilling businesses

---

## Quick Start

### Instant Demo (No Setup Required)
Visit **[jobflow-pro.vercel.app](https://jobflow-pro.vercel.app)** and click **"Launch Demo"**. The full application loads with realistic sample data — no account, no database, no configuration. You can switch between Operator, Manager, Accountant, and Owner roles to see how access control works.

### Self-Hosted with Supabase
1. Clone this repository
2. Create a free project at [supabase.com](https://supabase.com)
3. Run the SQL schema from `supabase/schema.sql` in the Supabase SQL Editor
4. In Supabase → Authentication → Settings → disable "Confirm email" for testing
5. Set environment variables in your deployment platform:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
   ```
6. Deploy to Vercel (recommended) or run locally with `bun install && bun dev`

---

## Project Stats

| Metric | Value |
|--------|-------|
| Development Duration | 2+ years |
| Major Rewrites | 2 |
| Database Tables | 11 with RLS |
| API Routes | 17 RESTful endpoints |
| UI Components | 50+ shadcn/ui components |
| Role Levels | 4 (Operator → Owner) |
| Application Views | 11 |
| Chart Types | 8 (bar, line, area, pie, donut, scatter, progress, table) |
| Demo Data Records | 4 jobs, 5 inventory items, 4 overheads, 6 activity entries |

---

<div align="center">

*Built by [mellowedbones](https://github.com/mellowedbo) — where finance thinking meets systems building.*

*Two years. One drill rig at a time.*

</div>
