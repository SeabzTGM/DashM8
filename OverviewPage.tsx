
import React from "react"
import { getOverviewKpis, getStaffLeaderboard, getRevenueTrend, getJobsTrend } from "./kpiEngine"

type Props = {
  data: any
}

function StatCard({ title, value }: { title: string; value: any }) {
  return (
    <div style={{ padding: 16, border: "1px solid #ddd", borderRadius: 8 }}>
      <div style={{ fontSize: 12, color: "#666" }}>{title}</div>
      <div style={{ fontSize: 24, fontWeight: 600 }}>{value}</div>
    </div>
  )
}

function Table({ rows }: { rows: any[] }) {
  if (!rows.length) return <div>No data</div>

  const columns = Object.keys(rows[0])

  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c} style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {columns.map((c) => (
              <td key={c} style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                {String(row[c])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default function OverviewPage({ data }: Props) {

  const kpis = getOverviewKpis(data)
  const leaderboard = getStaffLeaderboard(data)
  const revenueTrend = getRevenueTrend(data)
  const jobsTrend = getJobsTrend(data)

  return (
    <div style={{ padding: 32, fontFamily: "sans-serif" }}>

      <h1>Business Dashboard</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 32 }}>
        <StatCard title="Jobs Today" value={kpis.jobsCompletedToday} />
        <StatCard title="Jobs This Month" value={kpis.jobsCompletedThisMonth} />
        <StatCard title="Revenue This Month" value={`$${kpis.revenueInvoicedThisMonth}`} />
        <StatCard title="Cash Collected" value={`$${kpis.cashCollectedThisMonth}`} />
        <StatCard title="Material Cost" value={`$${kpis.materialCostThisMonth}`} />
        <StatCard title="Jobs Awaiting Payment" value={kpis.jobsAwaitingPayment} />
        <StatCard title="Overdue Invoices" value={kpis.overdueInvoices} />
        <StatCard title="Overdue Amount" value={`$${kpis.overdueAmount}`} />
      </div>

      <h2>Staff Leaderboard</h2>
      <Table rows={leaderboard} />

      <h2 style={{ marginTop: 40 }}>Revenue Trend (30 days)</h2>
      <pre>{JSON.stringify(revenueTrend, null, 2)}</pre>

      <h2 style={{ marginTop: 40 }}>Jobs Completed Trend (30 days)</h2>
      <pre>{JSON.stringify(jobsTrend, null, 2)}</pre>

    </div>
  )
}
