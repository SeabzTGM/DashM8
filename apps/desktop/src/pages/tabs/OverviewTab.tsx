import { getAttentionJobs, getOverviewKpis, getStaffLeaderboard, getRevenueTrend } from "@dashm8/core"
import type { DashboardData } from "./types"
import { money, SectionTitle, StatCard, StatGrid, Table } from "./shared"

export function OverviewTab({ data }: { data: DashboardData }) {
  const kpis = getOverviewKpis(data)
  const leaderboard = getStaffLeaderboard(data)
  const attention = getAttentionJobs(data)
  const revenueTrend = getRevenueTrend(data).slice(-7)

  return (
    <div>
      <StatGrid>
        <StatCard title="Jobs Today" value={kpis.jobsCompletedToday} />
        <StatCard title="Jobs This Week" value={kpis.jobsCompletedThisWeek} />
        <StatCard title="Jobs This Month" value={kpis.jobsCompletedThisMonth} />
        <StatCard title="Revenue This Month" value={money(kpis.revenueInvoicedThisMonth)} />
        <StatCard title="Cash Collected" value={money(kpis.cashCollectedThisMonth)} />
        <StatCard title="Material Cost" value={money(kpis.materialCostThisMonth)} />
        <StatCard title="Jobs Awaiting Payment" value={kpis.jobsAwaitingPayment} />
        <StatCard title="Overdue Amount" value={money(kpis.overdueAmount)} />
      </StatGrid>

      <SectionTitle>Staff Leaderboard</SectionTitle>
      <Table
        columns={["Staff", "Jobs", "Revenue", "Material Cost", "Gross Margin", "Awaiting Payment"]}
        rows={leaderboard.map((row) => ({
          Staff: row.name,
          Jobs: row.jobsCompleted,
          Revenue: money(row.revenue),
          "Material Cost": money(row.materialCost),
          "Gross Margin": money(row.grossMargin),
          "Awaiting Payment": row.jobsAwaitingPayment,
        }))}
      />

      <SectionTitle>Attention Queue</SectionTitle>
      <Table
        columns={["Job", "Customer", "Staff", "Reason", "Amount Due"]}
        rows={attention.map((row) => ({
          Job: row.title,
          Customer: row.customerName ?? "—",
          Staff: row.staffName ?? "—",
          Reason: row.reason,
          "Amount Due": row.amountDue ? money(row.amountDue) : "—",
        }))}
      />

      <SectionTitle>7-Day Revenue Snapshot</SectionTitle>
      <Table
        columns={["Date", "Invoiced", "Collected"]}
        rows={revenueTrend.map((row) => ({
          Date: row.date,
          Invoiced: money(row.invoiced),
          Collected: money(row.collected),
        }))}
      />
    </div>
  )
}
