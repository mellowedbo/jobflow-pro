# Task: Create API Layer for DrillOps Pro ERP

## Summary
Created 17 API route files for the Next.js 16 App Router drilling company ERP application, plus a shared utility module for snake_case ↔ camelCase conversion and job assembly logic.

## Files Created

### Utility Module
- `src/lib/api-utils.ts` — Shared helpers for snake_case ↔ camelCase key conversion, job assembly from DB rows, fetching job relations, grouping by job_id, activity logging, and payment status calculation.

### Jobs API Routes
1. `src/app/api/jobs/route.ts` — GET (list all jobs with services/custom items/payments/costs using Promise.all for parallel fetching), POST (create job with services, custom items, and advance payment)
2. `src/app/api/jobs/[id]/route.ts` — GET (single job with all relations), PATCH (update job including services/custom items), DELETE (delete job with cascading relation deletion)
3. `src/app/api/jobs/[id]/complete/route.ts` — POST (complete job: update status to completed, set completed_at, update depth/casing/diesel/soil, update service/custom quantity_used, deduct casing and diesel inventory with transactions)
4. `src/app/api/jobs/[id]/bill/route.ts` — POST (generate bill: calculate drilling + casing + services + custom items + diesel costs, set billing_generated and final_bill_amount, update status to billed, recalculate payment status)
5. `src/app/api/jobs/[id]/payment/route.ts` — POST (add payment record, recalculate total_paid from all payments, determine payment_status)
6. `src/app/api/jobs/[id]/cost/route.ts` — POST (add internal cost to job)
7. `src/app/api/jobs/[id]/rate/route.ts` — POST (rate a job 1-5)
8. `src/app/api/jobs/[id]/close/route.ts` — POST (close a job, set status to closed)

### Inventory API Routes
9. `src/app/api/inventory/route.ts` — GET (list items), POST (add item with defaults)
10. `src/app/api/inventory/[id]/route.ts` — GET, PATCH
11. `src/app/api/inventory/[id]/purchase/route.ts` — POST (add purchase, update stock with weighted average cost, create transaction)
12. `src/app/api/inventory/[id]/use/route.ts` — POST (use inventory with stock validation, update stock, create transaction)
13. `src/app/api/inventory/[id]/destroy/route.ts` — POST (destroy/damage with stock validation, update stock, create transaction)
14. `src/app/api/inventory/transactions/route.ts` — GET (list all transactions)

### Other API Routes
15. `src/app/api/overheads/route.ts` — GET, POST
16. `src/app/api/activity/route.ts` — GET (newest first, limit 100), POST (add entry)
17. `src/app/api/state/route.ts` — GET/PUT for app_state (jobCounter etc.)

## Key Design Decisions
- All routes use `supabase.from('table_name')` for queries
- snake_case ↔ camelCase conversion is handled by the shared utility
- Next.js 16 convention: `{ params }: { params: Promise<{ id: string }> }` for dynamic segments
- GET /api/jobs uses Promise.all to fetch all relation tables in parallel, then groups by job_id
- Complete job endpoint finds casing item by type (GI/PVC) and diesel item by name, deducts inventory accordingly
- Payment endpoint recalculates total_paid from all payments (not incrementing) for accuracy
- All routes have proper error handling with try/catch and appropriate HTTP status codes
- Lint passes with zero errors
