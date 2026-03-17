import { getJobsTrend, getRevenueTrend } from "@dashm8/core"
import type { DashboardData } from "./types"
import { PlaceholderCard, SectionTitle, Table, money } from "./shared"

export function TrendsTab({ data }: { data: DashboardData }) {
  const revenue7 = getRevenueTrend(data, 7)
  const revenue30 = getRevenueTrend(data, 30)
  const jobs30 = getJobsTrend(data, 30)

  return (
    <div>
      <SectionTitle>Revenue vs Jobs Completed</SectionTitle>
      <Table
        columns={["Date", "Invoiced", "Collected", "Jobs Completed"]}
        rows={revenue30.map((row) => {
          const matchingJobs = jobs30.find((jobRow) => jobRow.date === row.date)
          return {
            Date: row.date,
            Invoiced: money(row.invoiced),
            Collected: money(row.collected),
            "Jobs Completed": matchingJobs?.jobsCompleted ?? 0,
          }
        })}
      />

      <SectionTitle>Trend Roadmap</SectionTitle>
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
        <PlaceholderCard
          title="7-day / 30-day / 12-month trends"
          description="7-day and 30-day are scaffolded now. Add monthly snapshot tables for 12-month and seasonal views."
        />
        <PlaceholderCard
          title="Margin trend"
          description="Add daily or monthly gross margin snapshots to chart margin movement over time."
        />
        <PlaceholderCard
          title="Debtors trend"
          description="Track total outstanding and overdue balances by day or month from invoices and payments."
        />
        <PlaceholderCard
          title="Staff productivity trend"
          description="Add per-staff daily snapshot rows for jobs completed, revenue, and utilisation."
        />
      </div>

      <SectionTitle>Last 7 Days Revenue</SectionTitle>
      <Table
        columns={["Date", "Invoiced", "Collected"]}
        rows={revenue7.map((row) => ({
          Date: row.date,
          Invoiced: money(row.invoiced),
          Collected: money(row.collected),
        }))}
      />
    </div>
  )
}
