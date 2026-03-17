import React from "react"

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 style={{ margin: "28px 0 12px", fontSize: 20 }}>{children}</h2>
}

export function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string
  value: string | number
  subtitle?: string
}) {
  return (
    <div style={styles.card}>
      <div style={styles.muted}>{title}</div>
      <div style={styles.big}>{value}</div>
      {subtitle ? <div style={{ ...styles.muted, marginTop: 6 }}>{subtitle}</div> : null}
    </div>
  )
}

export function StatGrid({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 16,
      }}
    >
      {children}
    </div>
  )
}

export function Table({
  columns,
  rows,
}: {
  columns: string[]
  rows: Array<Record<string, React.ReactNode>>
}) {
  return (
    <table style={styles.table}>
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column} style={styles.th}>
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length ? (
          rows.map((row, index) => (
            <tr key={index}>
              {columns.map((column) => (
                <td key={column} style={styles.td}>
                  {row[column] ?? "—"}
                </td>
              ))}
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={columns.length} style={styles.emptyCell}>
              No data
            </td>
          </tr>
        )}
      </tbody>
    </table>
  )
}

export function PlaceholderCard({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div style={styles.card}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>{title}</div>
      <div style={styles.muted}>{description}</div>
    </div>
  )
}

export function money(value: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(value || 0)
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 16,
  },
  muted: {
    color: "#6b7280",
    fontSize: 12,
  },
  big: {
    fontSize: 22,
    fontWeight: 700,
    marginTop: 6,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    overflow: "hidden",
  },
  th: {
    textAlign: "left",
    padding: 12,
    borderBottom: "1px solid #e5e7eb",
    fontWeight: 700,
    background: "#f9fafb",
  },
  td: {
    padding: 12,
    borderBottom: "1px solid #e5e7eb",
  },
  emptyCell: {
    padding: 16,
    color: "#6b7280",
  },
}
