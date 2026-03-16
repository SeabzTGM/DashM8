import { useEffect, useState } from "react"
import OverviewPage from "./pages/OverviewPage"
import { loadDashboardData } from "./lib/loadDashboardData"

type Data = Awaited<ReturnType<typeof loadDashboardData>>

export default function App() {
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
      .then(setData)
      .catch((err) => {
        console.error(err)
        setError(err instanceof Error ? err.message : "Failed to load dashboard")
      })
  }, [])

  if (error) {
    return <div className="container"><div className="card">Error: {error}</div></div>
  }

  if (!data) {
    return <div className="container"><div className="card">Loading dashboard…</div></div>
  }

  return <OverviewPage data={data} />
}
