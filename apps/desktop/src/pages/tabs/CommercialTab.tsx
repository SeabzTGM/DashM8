import type { DashboardData } from "./types"
import { money, PlaceholderCard, SectionTitle, StatCard, StatGrid, Table } from "./shared"

export function CommercialTab({ data }: { data: DashboardData }) {
  const totalRevenue = data.jobs.reduce((sum, job) => sum + Number(job.actualRevenue || 0), 0)
  const totalMaterialCost = data.jobs.reduce((sum, job) => sum + Number(job.actualMaterialCost || 0), 0)
  const grossProfit = data.jobs.reduce((sum, job) => sum + Number(job.grossMarginAmount || 0), 0)
  const completedNotInvoiced = data.jobs.filter((job) => {
    const relatedInvoice = data.invoices.find((invoice) => invoice.jobId === job.id)
    return job.completedAt && !relatedInvoice
  }).length
  const partiallyPaid = data.invoices.filter(
    (invoice) => Number(invoice.amountPaid || 0) > 0 && Number(invoice.amountDue || 0) > 0
  ).length

  return (
    <div>
      <StatGrid>
        <StatCard title="Gross Profit" value={money(grossProfit)} />
        <StatCard title="Total Revenue" value={money(totalRevenue)} />
        <StatCard title="Material Cost" value={money(totalMaterialCost)} />
        <StatCard title="Completed Not Invoiced" value={completedNotInvoiced} />
        <StatCard title="Partially Paid Invoices" value={partiallyPaid} />
        <StatCard title="Unbilled Materials" value="—" subtitle="Needs material billing flag" />
      </StatGrid>

      <SectionTitle>Gross Profit by Job</SectionTitle>
      <Table
        columns={["Job", "Revenue", "Material Cost", "Gross Profit"]}
        rows={data.jobs.map((job) => ({
          Job: job.title ?? "Untitled job",
          Revenue: money(Number(job.actualRevenue || 0)),
          "Material Cost": money(Number(job.actualMaterialCost || 0)),
          "Gross Profit": money(Number(job.grossMarginAmount || 0)),
        }))}
      />

      <SectionTitle>Commercial Health Gaps</SectionTitle>
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
        <PlaceholderCard
          title="Gross profit by service category"
          description="Add service category to jobs and map category names during ServiceM8 sync."
        />
        <PlaceholderCard
          title="Material variance"
          description="Add estimated material cost/qty fields so estimated vs actual can be calculated."
        />
        <PlaceholderCard
          title="Labor variance"
          description="Add quoted hours and actual hours fields per job and optionally per technician."
        />
      </div>
    </div>
  )
}
