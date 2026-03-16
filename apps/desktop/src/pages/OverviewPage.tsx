import { getAttentionJobs, getJobsTrend, getOverviewKpis, getRevenueTrend, getStaffLeaderboard } from "@dashm8/core"
import { StatCard } from "../components/StatCard"

type Props = {
  data: Awaited<ReturnType<typeof import("../lib/loadDashboardData").loadDashboardData>>
}

function money(value: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0
  }).format(value)
}

export default function OverviewPage({ data }: Props) {
  const kpis = getOverviewKpis(data)
  const leaderboard = getStaffLeaderboard(data)
  const attention = getAttentionJobs(data)
  const revenueTrend = getRevenueTrend(data)
  const jobsTrend = getJobsTrend(data)

  return (
    <div className="container">
      <h1>dashm8</h1>
      <p className="muted">ServiceM8 + Xero business dashboard</p>

      <div className="grid kpi-grid">
        <StatCard title="Jobs Today" value={kpis.jobsCompletedToday} />
        <StatCard title="Jobs This Week" value={kpis.jobsCompletedThisWeek} />
        <StatCard title="Jobs This Month" value={kpis.jobsCompletedThisMonth} />
        <StatCard title="Revenue This Month" value={money(kpis.revenueInvoicedThisMonth)} />
        <StatCard title="Cash Collected" value={money(kpis.cashCollectedThisMonth)} />
        <StatCard title="Material Cost" value={money(kpis.materialCostThisMonth)} />
        <StatCard title="Jobs Awaiting Payment" value={kpis.jobsAwaitingPayment} />
        <StatCard title="Overdue Amount" value={money(kpis.overdueAmount)} />
      </div>

      <div className="layout-two">
        <div>
          <div className="section-title">Staff Leaderboard</div>
          <table className="table">
            <thead>
              <tr>
                <th>Staff</th>
                <th>Jobs</th>
                <th>Revenue</th>
                <th>Material Cost</th>
                <th>Gross Margin</th>
                <th>Awaiting Payment</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((row) => (
                <tr key={row.staffId}>
                  <td>{row.name}</td>
                  <td>{row.jobsCompleted}</td>
                  <td>{money(row.revenue)}</td>
                  <td>{money(row.materialCost)}</td>
                  <td>{money(row.grossMargin)}</td>
                  <td>{row.jobsAwaitingPayment}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="section-title">Attention Queue</div>
          <table className="table">
            <thead>
              <tr>
                <th>Job</th>
                <th>Customer</th>
                <th>Staff</th>
                <th>Reason</th>
                <th>Amount Due</th>
              </tr>
            </thead>
            <tbody>
              {attention.map((row) => (
                <tr key={`${row.jobId}-${row.reason}`}>
                  <td>{row.title}</td>
                  <td>{row.customerName ?? "—"}</td>
                  <td>{row.staffName ?? "—"}</td>
                  <td><span className="badge">{row.reason}</span></td>
                  <td>{row.amountDue ? money(row.amountDue) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <div className="section-title">Revenue Trend (30d)</div>
          <div className="card">
            <pre>{JSON.stringify(revenueTrend.slice(-10), null, 2)}</pre>
          </div>

          <div className="section-title">Jobs Trend (30d)</div>
          <div className="card">
            <pre>{JSON.stringify(jobsTrend.slice(-10), null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  )
}
