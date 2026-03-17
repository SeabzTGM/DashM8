import type { DashboardData } from "./types"
import { money, PlaceholderCard, SectionTitle, StatCard, StatGrid, Table } from "./shared"

export function CustomersTab({ data }: { data: DashboardData }) {
  const invoicesWithCustomers = data.invoices.filter((invoice) => invoice.customerId)
  const averageInvoiceValue =
    invoicesWithCustomers.length > 0
      ? invoicesWithCustomers.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0) /
        invoicesWithCustomers.length
      : 0

  const revenueByCustomer = Object.entries(data.customersById ?? {}).map(([customerId, customer]) => {
    const customerRevenue = data.invoices
      .filter((invoice) => invoice.customerId === customerId)
      .reduce((sum, invoice) => sum + Number(invoice.total || 0), 0)

    const invoiceCount = data.invoices.filter((invoice) => invoice.customerId === customerId).length

    return {
      customerId,
      name: customer?.name ?? "Unknown customer",
      revenue: customerRevenue,
      invoices: invoiceCount,
    }
  }).sort((a, b) => b.revenue - a.revenue)

  const repeatCustomerRate = revenueByCustomer.length
    ? Math.round((revenueByCustomer.filter((row) => row.invoices > 1).length / revenueByCustomer.length) * 100)
    : 0

  return (
    <div>
      <StatGrid>
        <StatCard title="Average Invoice Value" value={money(averageInvoiceValue)} />
        <StatCard title="Repeat Customer Rate" value={`${repeatCustomerRate}%`} />
        <StatCard title="Revenue per Customer" value={money(revenueByCustomer[0]?.revenue ?? 0)} subtitle="Top customer revenue" />
        <StatCard title="Top 10 Customers" value={Math.min(revenueByCustomer.length, 10)} />
      </StatGrid>

      <SectionTitle>Top Customers by Revenue</SectionTitle>
      <Table
        columns={["Customer", "Revenue", "Invoices"]}
        rows={revenueByCustomer.slice(0, 10).map((row) => ({
          Customer: row.name,
          Revenue: money(row.revenue),
          Invoices: row.invoices,
        }))}
      />

      <SectionTitle>Customer Quality Gaps</SectionTitle>
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
        <PlaceholderCard
          title="Job volume by suburb / area"
          description="Add suburb or service area fields from ServiceM8 company/job address records."
        />
        <PlaceholderCard
          title="Payment behavior by customer"
          description="Add aged receivables and average days-to-pay metrics grouped by customer."
        />
      </div>
    </div>
  )
}
