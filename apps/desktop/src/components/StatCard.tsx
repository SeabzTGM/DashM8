type Props = {
  title: string
  value: string | number
}

export function StatCard({ title, value }: Props) {
  return (
    <div className="card">
      <div className="muted">{title}</div>
      <div className="big">{value}</div>
    </div>
  )
}
