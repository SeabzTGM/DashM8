import { DashboardTabs } from "../components/DashboardTabs"

type Props = {
  data: Awaited<ReturnType<typeof import("../lib/loadDashboardData").loadDashboardData>>
}

export default function OverviewPage({ data }: Props) {
  return (
    <div style={{ padding: 32, fontFamily: "sans-serif", background: "#f3f4f6", minHeight: "100vh" }}>
      <h1 style={{ marginBottom: 8 }}>dashm8</h1>
      <p style={{ color: "#6b7280", marginTop: 0 }}>ServiceM8 + Xero business dashboard</p>
      <DashboardTabs data={data} />
    </div>
  )
}
