# Task: RBAC + Analytics/DepthMap Features for DrillOps Pro

## Summary
Added Role-Based Access Control (RBAC) with 4 roles and two new advance/prototype view pages (Analytics & Depth Map).

## Files Changed

### 1. `/home/z/my-project/src/lib/types.ts`
- Added `UserRole` type: `'operator' | 'manager' | 'accountant' | 'owner'`
- Extended `ViewPage` type with `'analytics'` and `'depthmap'`
- Added `ROLE_ACCESS` constant — a complete access control matrix mapping each role to allowed view pages

### 2. `/home/z/my-project/src/lib/store.ts`
- Added `currentRole: UserRole` state (default: `'owner'`)
- Added `setCurrentRole` action
- Imported `UserRole` type

### 3. `/home/z/my-project/src/components/AppShell.tsx`
- Added nav items for `analytics` (with "Pro" badge) and `depthmap` (with "Beta" badge)
- Implemented role-based nav filtering using `ROLE_ACCESS` — sidebar only shows pages the current role can access
- Added `RoleSwitcher` component in sidebar footer — a Select dropdown allowing demo role switching
- Added role badge in top bar header showing current role
- Auto-redirects to dashboard if current view becomes inaccessible after role change
- Imported and wired up `AnalyticsView` and `DepthMapView` in `ViewRenderer`
- Fixed lint error: `setAuthLoading` called synchronously in effect → moved to initial state logic

### 4. `/home/z/my-project/src/components/DepthMapView.tsx` (NEW)
- GIS-style prototype view with "PROTOTYPE" badge
- Completed jobs table with location, depth, soil type, casing, and bill amount
- Depth bar chart per location, color-coded by soil type (Recharts)
- Soil distribution donut/pie chart
- Profitability by depth scatter plot
- GIS Integration notice card explaining future map/predictive modeling plans

### 5. `/home/z/my-project/src/components/AnalyticsView.tsx` (NEW)
- "PRO" branded advanced analytics dashboard
- 4 stat cards: Total Revenue, Outstanding, Avg. Margin, Customers
- Revenue & Profit Trends area chart (6-month)
- Job Completion Rate with progress bar and breakdown
- Average Depth by Soil Type horizontal bar chart
- Customer Acquisition trend area chart
- Outstanding Payments Aging pie chart
- Profitability Score per Job list with margin badges
- Cash Flow Forecast 6-month bar chart (inflow vs outflow)
- "Powered by DrillOps Analytics Engine" branding footer

## Build & Lint Status
- ✅ `npx next build` compiles successfully
- ✅ `bun run lint` passes (0 errors, 1 pre-existing warning in AccountSettingsView)
