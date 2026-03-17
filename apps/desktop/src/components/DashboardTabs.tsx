import { useMemo, useState } from "react"
import type { DashboardData } from "./tabs/types"
import { OverviewTab } from "./tabs/OverviewTab"
import { OperationsTab } from "./tabs/OperationsTab"
import { CustomersTab } from "./tabs/CustomersTab"
import { CommercialTab } from "./tabs/CommercialTab"
import { TrendsTab } from "./tabs/TrendsTab"

type TabKey = "overview" | "operations" | "customers" | "commercial" | "trends"

type Props = {
  data: DashboardData
}

const TAB_LABELS: Record<TabKey, string> = {
  overview: "Overview",
  operations: "Operations",
  customers: "Customers",
  commercial: "Commercial",
  trends: "Trends",
}

export function DashboardTabs({ data }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview")

  const content = useMemo(() => {
    switch (activeTab) {
      case "overview":
        return <OverviewTab data={data} />
      case "operations":
        return <OperationsTab data={data} />
      case "customers":
        return <CustomersTab data={data} />
      case "commercial":
        return <CommercialTab data={data} />
      case "trends":
        return <TrendsTab data={data} />
      default:
        return <OverviewTab data={data} />
    }
  }, [activeTab, data])

  return (
    <div>
      <div style={styles.tabRow}>
        {(Object.keys(TAB_LABELS) as TabKey[]).map((tab) => {
          const isActive = tab === activeTab
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                ...styles.tabButton,
                ...(isActive ? styles.tabButtonActive : {}),
              }}
            >
              {TAB_LABELS[tab]}
            </button>
          )
        })}
      </div>

      <div>{content}</div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  tabRow: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    margin: "20px 0 24px",
  },
  tabButton: {
    border: "1px solid #d1d5db",
    background: "#ffffff",
    color: "#111827",
    borderRadius: 999,
    padding: "10px 16px",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
  },
  tabButtonActive: {
    background: "#111827",
    color: "#ffffff",
    borderColor: "#111827",
  },
}
