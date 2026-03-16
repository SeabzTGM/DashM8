# ServiceM8 + Xero Business Dashboard

## Project purpose
Build a desktop business dashboard for a trade or field service business using the ServiceM8 API as the operational source of truth and the Xero API as the financial source of truth.

The app should help owners and managers quickly answer:
- How many jobs were completed today, this week, and this month?
- What revenue has been invoiced and what cash has been collected?
- What are material costs and rough gross margins?
- Which jobs are unpaid, overdue, or need attention?
- How is each staff member performing compared with the team total?

## Product direction
Start with an internal single-business desktop app.
Design the code so it can later become a multi-tenant SaaS product.

## Recommended stack
- Desktop shell: Tauri
- Frontend: React + TypeScript + Vite
- Styling: Tailwind CSS
- Charts: Recharts
- Local backend: Node.js + TypeScript
- Database: SQLite via Prisma for MVP
- Validation: Zod
- Date handling: date-fns
- Data fetching: TanStack Query

If a better implementation detail is needed, prefer stable and widely used libraries.

## Core architecture
Use a layered structure:
1. `apps/desktop` for the Tauri + React UI
2. `packages/core` for shared types, metric formulas, and business rules
3. `packages/integrations` for ServiceM8 and Xero API clients
4. `packages/db` for Prisma schema and data access
5. `packages/sync` for import, normalization, and metric snapshot jobs

Prefer a monorepo layout.

## Data source rules
- ServiceM8 is the source of truth for jobs, staff assignments, job status, scheduling, and job materials.
- Xero is the source of truth for invoices, payments, accounts receivable, supplier bills, and accounting totals.
- Do not mix definitions casually. Each KPI must document which source it comes from.
- If two systems disagree, preserve both raw values and expose the mapping or reconciliation issue.

## MVP features
Build these first:

### Executive dashboard
- Jobs completed today / week / month
- Revenue invoiced this month
- Cash collected this month
- Material costs this month
- Jobs awaiting payment
- Overdue invoices
- Jobs needing attention
- 30 day trend charts
- Per-staff leaderboard

### Operations dashboard
- Jobs by status
- Completed jobs by staff member
- Average job cycle time
- Completed but not invoiced jobs
- Jobs stuck in a status too long
- Unassigned jobs

### Financial dashboard
- Invoiced revenue
- Collected revenue
- Outstanding receivables
- Aged receivables buckets
- Material costs
- Estimated gross margin
- Invoiced but unpaid jobs

### Attention dashboard
- Completed but not invoiced
- Invoiced but unpaid
- Overdue invoices
- High material cost jobs
- Jobs with negative or low margin
- Jobs with missing staff assignment
- Jobs with no recent updates

## KPI definitions
Implement KPI formulas explicitly and keep them in shared code.

### Core KPIs
- `jobsCompleted`: count of jobs with a completed status in the selected date range
- `jobsCompletedByStaff`: completed jobs grouped by assigned staff
- `revenueInvoiced`: sum of approved or issued Xero sales invoices in range
- `cashCollected`: sum of Xero payments received in range
- `materialCosts`: sum of ServiceM8 job material cost values in range
- `jobsAwaitingPayment`: jobs linked to invoices not fully paid
- `jobsNeedingAttention`: jobs matching one or more exception rules
- `averageRevenuePerJob`: `revenueInvoiced / jobsCompleted`
- `estimatedGrossMargin`: `(revenueInvoiced - materialCosts) / revenueInvoiced`

### Exception rules
A job needs attention if any of the following is true:
- completed but not invoiced after configurable threshold
- invoiced but unpaid after configurable threshold
- overdue invoice exists
- missing assigned staff
- material cost exceeds configurable percentage of invoice total
- status unchanged for too many days
- negative estimated margin

Make thresholds configurable in one place.

## Useful secondary metrics
Add these after MVP:
- Quote to job conversion rate
- Average days from completion to invoice
- Average days from invoice to payment
- Revenue by customer
- Revenue by job category
- Margin by staff member
- Repeat customer rate
- Rework or callback rate
- Supplier spend from Xero bills
- Labor utilization if time tracking becomes available

## Data model guidance
Start with these tables or equivalent models:
- `staff`
- `customers`
- `jobs`
- `job_status_history`
- `job_materials`
- `job_assignments`
- `xero_contacts`
- `xero_invoices`
- `xero_invoice_lines`
- `xero_payments`
- `xero_bills`
- `reconciliation_links`
- `metric_snapshots_daily`
- `sync_runs`

Important mapping fields:
- `servicem8JobUuid`
- `servicem8StaffUuid`
- `servicem8CompanyUuid`
- `xeroContactId`
- `xeroInvoiceId`

Create a reconciliation table that links jobs to invoices and logs confidence or match method.

## Sync strategy
Build sync as import + normalize + snapshot.

### ServiceM8 sync
Import:
- jobs
- staff
- job materials
- job contacts or customers if needed
- payments if exposed in workflow

### Xero sync
Import:
- contacts
- invoices
- payments
- bills
- items if useful later

### Sync rules
- Prefer incremental sync using updated timestamps when supported
- Store raw payloads for debugging during MVP
- Normalize data into internal tables
- Rebuild daily metric snapshots after sync
- Keep sync idempotent
- Log failures with enough context to retry safely

## API client rules
- Keep ServiceM8 and Xero clients isolated behind integration services
- Never call third-party APIs directly from React components
- Wrap all external responses in typed adapters
- Handle pagination, rate limits, and token refresh centrally
- Add test fixtures for common API responses

## UI guidance
Use a clean business dashboard layout.

### Main screens
- Overview
- Operations
- Financial
- Staff
- Attention
- Settings / Integrations

### UX expectations
- Date range selector with presets: today, 7 days, 30 days, month to date, quarter to date
- Staff filter
- Job category filter if available
- Click a metric card to drill into the underlying records
- Show last sync time clearly
- Show warnings when data is stale or reconciliation is incomplete

## Settings and config
Support these settings early:
- ServiceM8 credentials
- Xero credentials
- default date range
- attention rule thresholds
- business timezone
- currency

Never hardcode secrets. Use environment variables for development and encrypted local storage for runtime tokens.

## Code quality rules
- Use TypeScript everywhere possible
- Prefer small pure functions for metric calculations
- Keep business logic out of UI components
- Write tests for KPI formulas and reconciliation logic
- Use descriptive naming over abbreviations
- Avoid large files; split by domain
- Document any assumptions when API fields are uncertain

## Folder conventions
Target a structure similar to:

```text
apps/
  desktop/
packages/
  core/
    src/metrics/
    src/types/
    src/rules/
  integrations/
    src/servicem8/
    src/xero/
  db/
    prisma/
    src/
  sync/
    src/jobs/
    src/reconcile/
```

## Initial build plan
When starting work, follow this order:
1. Create monorepo scaffold with Tauri, React, TypeScript, Prisma, and shared packages
2. Define shared domain types
3. Create SQLite schema and seed helpers
4. Build mock dashboard using seeded data first
5. Add ServiceM8 client and import jobs, staff, and materials
6. Add Xero client and import contacts, invoices, and payments
7. Implement reconciliation between jobs and invoices
8. Replace mock dashboard queries with real synced data
9. Add settings and sync status UI
10. Add tests and error handling

## Output expectations for Codex
When asked to build features in this repo:
- explain the plan briefly
- make code changes directly
- keep diffs focused
- run relevant tests or type checks when possible
- update documentation when architecture changes
- call out assumptions or missing API field mappings

## First tasks to prioritize
If no other direction is provided, start by generating:
1. repository scaffold
2. Prisma schema
3. shared metric types and formulas
4. seeded demo dashboard
5. stub ServiceM8 and Xero integration modules

## Non-goals for MVP
Do not build these in the first version unless explicitly requested:
- payroll
- advanced inventory management
- mobile app
- customer portal
- multi-tenant billing
- complex forecasting or ML

## Notes for implementation
- Keep the app usable with mock data before live integrations are complete
- Prefer deterministic dashboards over flashy visuals
- Every number shown in the UI should be traceable to underlying records
- Reconciliation visibility is important; users must be able to trust or inspect the numbers
