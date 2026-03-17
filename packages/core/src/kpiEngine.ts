import type { Invoice, Job, JobMaterial, Payment, Staff } from "@prisma/client"

export type DashboardDataset = {
  jobs: Job[]
  invoices: Invoice[]
  payments: Payment[]
  materials: JobMaterial[]
  staff: Staff[]
  customersById?: Record<string, { name: string | null | undefined }>
}

export function linkCustomersById(
  customers: Array<{ id: string; name: string | null | undefined }>
): Record<string, { name: string | null | undefined }> {
  return customers.reduce<Record<string, { name: string | null | undefined }>>((acc, customer) => {
    acc[customer.id] = { name: customer.name }
    return acc
  }, {})
}

function toNumber(value: unknown): number {
  if (value == null) return 0
  if (typeof value === "number") return value
  if (typeof value === "bigint") return Number(value)
  return Number(value) || 0
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function startOfWeek(date: Date): Date {
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  return startOfDay(new Date(date.getFullYear(), date.getMonth(), date.getDate() + diff))
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function getOverviewKpis(data: DashboardDataset, now = new Date()) {
  const today = startOfDay(now)
  const week = startOfWeek(now)
  const month = startOfMonth(now)

  const jobsCompletedToday = data.jobs.filter((j) => j.completedAt && j.completedAt >= today).length
  const jobsCompletedThisWeek = data.jobs.filter((j) => j.completedAt && j.completedAt >= week).length
  const jobsCompletedThisMonth = data.jobs.filter((j) => j.completedAt && j.completedAt >= month).length

  const revenueInvoicedThisMonth = data.invoices
    .filter((i) => i.issueDate && i.issueDate >= month)
    .reduce((sum, i) => sum + toNumber(i.total), 0)

  const cashCollectedThisMonth = data.payments
    .filter((p) => p.paymentDate && p.paymentDate >= month)
    .reduce((sum, p) => sum + toNumber(p.amount), 0)

  const materialCostThisMonth = data.jobs
    .filter((j) => j.completedAt && j.completedAt >= month)
    .reduce((sum, j) => sum + toNumber(j.actualMaterialCost), 0)

  const awaiting = data.invoices.filter((i) => i.paymentStatus !== "PAID" && toNumber(i.amountDue) > 0)
  const overdue = awaiting.filter((i) => i.dueDate && i.dueDate < today)

  return {
    jobsCompletedToday,
    jobsCompletedThisWeek,
    jobsCompletedThisMonth,
    revenueInvoicedThisMonth,
    cashCollectedThisMonth,
    materialCostThisMonth,
    jobsAwaitingPayment: awaiting.length,
    overdueInvoices: overdue.length,
    overdueAmount: overdue.reduce((sum, i) => sum + toNumber(i.amountDue), 0)
  }
}

export function getStaffLeaderboard(data: DashboardDataset, now = new Date()) {
  const month = startOfMonth(now)
  const invoicesByJobId = new Map<string, Invoice[]>()

  for (const invoice of data.invoices) {
    if (!invoice.jobId) continue
    const arr = invoicesByJobId.get(invoice.jobId) ?? []
    arr.push(invoice)
    invoicesByJobId.set(invoice.jobId, arr)
  }

  return data.staff.map((staff) => {
    const jobs = data.jobs.filter((j) => j.assignedStaffId === staff.id && j.completedAt && j.completedAt >= month)
    const revenue = jobs.reduce((sum, j) => sum + toNumber(j.actualRevenue), 0)
    const materialCost = jobs.reduce((sum, j) => sum + toNumber(j.actualMaterialCost), 0)
    const grossMargin = jobs.reduce((sum, j) => sum + toNumber(j.grossMarginAmount), 0)
    const awaiting = jobs.filter((job) => {
      const inv = invoicesByJobId.get(job.id) ?? []
      return inv.some((i) => i.paymentStatus !== "PAID" && toNumber(i.amountDue) > 0)
    }).length

    return {
      staffId: staff.id,
      name: [staff.firstName, staff.lastName].filter(Boolean).join(" ") || staff.email || "Unknown",
      jobsCompleted: jobs.length,
      revenue,
      materialCost,
      grossMargin,
      jobsAwaitingPayment: awaiting
    }
  }).sort((a, b) => b.revenue - a.revenue)
}

export function getAttentionJobs(data: DashboardDataset, now = new Date()) {
  const today = startOfDay(now)
  const staffById = new Map(data.staff.map((s) => [s.id, s]))
  const invoicesByJobId = new Map<string, Invoice[]>()

  for (const invoice of data.invoices) {
    if (!invoice.jobId) continue
    const arr = invoicesByJobId.get(invoice.jobId) ?? []
    arr.push(invoice)
    invoicesByJobId.set(invoice.jobId, arr)
  }

  const rows: Array<{
    jobId: string
    title: string
    staffName: string | null
    customerName: string | null
    reason: string
    amountDue?: number
  }> = []

  for (const job of data.jobs) {
    const invoices = invoicesByJobId.get(job.id) ?? []
    const staff = job.assignedStaffId ? staffById.get(job.assignedStaffId) : undefined
    const staffName = staff ? [staff.firstName, staff.lastName].filter(Boolean).join(" ") || staff.email || "Unknown" : null
    const customerName = job.customerId ? data.customersById?.[job.customerId]?.name ?? null : null

    if (job.completedAt && invoices.length === 0) {
      rows.push({
        jobId: job.id,
        title: job.title ?? "Untitled job",
        staffName,
        customerName,
        reason: "Completed but not invoiced"
      })
    }

    for (const invoice of invoices) {
      if (invoice.paymentStatus !== "PAID" && toNumber(invoice.amountDue) > 0) {
        rows.push({
          jobId: job.id,
          title: job.title ?? "Untitled job",
          staffName,
          customerName,
          reason: invoice.dueDate && invoice.dueDate < today ? "Invoice overdue" : "Invoice awaiting payment",
          amountDue: toNumber(invoice.amountDue)
        })
      }
    }
  }

  return rows
}

export function getRevenueTrend(data: DashboardDataset, days = 30, now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1))
  const buckets = new Map<string, { date: string; invoiced: number; collected: number }>()

  for (let i = 0; i < days; i += 1) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
    const key = d.toISOString().slice(0, 10)
    buckets.set(key, { date: key, invoiced: 0, collected: 0 })
  }

  for (const invoice of data.invoices) {
    if (!invoice.issueDate || invoice.issueDate < start) continue
    const key = invoice.issueDate.toISOString().slice(0, 10)
    const bucket = buckets.get(key)
    if (bucket) bucket.invoiced += toNumber(invoice.total)
  }

  for (const payment of data.payments) {
    if (!payment.paymentDate || payment.paymentDate < start) continue
    const key = payment.paymentDate.toISOString().slice(0, 10)
    const bucket = buckets.get(key)
    if (bucket) bucket.collected += toNumber(payment.amount)
  }

  return Array.from(buckets.values())
}

export function getJobsTrend(data: DashboardDataset, days = 30, now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1))
  const buckets = new Map<string, { date: string; jobsCompleted: number }>()

  for (let i = 0; i < days; i += 1) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
    const key = d.toISOString().slice(0, 10)
    buckets.set(key, { date: key, jobsCompleted: 0 })
  }

  for (const job of data.jobs) {
    if (!job.completedAt || job.completedAt < start) continue
    const key = job.completedAt.toISOString().slice(0, 10)
    const bucket = buckets.get(key)
    if (bucket) bucket.jobsCompleted += 1
  }

  return Array.from(buckets.values())
}
