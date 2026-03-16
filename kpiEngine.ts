import { Invoice, Job, JobMaterial, Payment, PaymentStatus, Staff } from "@prisma/client"

export type OverviewKpis = {
  jobsCompletedToday: number
  jobsCompletedThisWeek: number
  jobsCompletedThisMonth: number
  revenueInvoicedThisMonth: number
  cashCollectedThisMonth: number
  materialCostThisMonth: number
  jobsAwaitingPayment: number
  overdueInvoices: number
  overdueAmount: number
}

export type StaffLeaderboardRow = {
  staffId: string
  name: string
  jobsCompleted: number
  revenue: number
  materialCost: number
  grossMargin: number
  jobsAwaitingPayment: number
}

export type AttentionJobRow = {
  jobId: string
  title: string
  staffName: string | null
  customerName: string | null
  reason: string
  amountDue?: number
  completedAt?: Date | null
}

export type DashboardDataset = {
  jobs: Job[]
  invoices: Invoice[]
  payments: Payment[]
  materials: JobMaterial[]
  staff: Staff[]
  customersById?: Record<string, { name: string | null | undefined }>
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

function toNumber(value: unknown): number {
  if (value == null) return 0
  if (typeof value === "number") return value
  if (typeof value === "bigint") return Number(value)
  return Number(value) || 0
}

function isSameOrAfter(date: Date | null | undefined, threshold: Date): boolean {
  return !!date && date.getTime() >= threshold.getTime()
}

function isBefore(date: Date | null | undefined, threshold: Date): boolean {
  return !!date && date.getTime() < threshold.getTime()
}

function safeName(staff: Staff | undefined): string {
  if (!staff) return "Unassigned"
  const full = [staff.firstName, staff.lastName].filter(Boolean).join(" ").trim()
  return full || staff.externalName || staff.email || "Unknown"
}

export function getOverviewKpis(data: DashboardDataset, now = new Date()): OverviewKpis {
  const todayStart = startOfDay(now)
  const weekStart = startOfWeek(now)
  const monthStart = startOfMonth(now)

  const jobsCompletedToday = data.jobs.filter((job) => isSameOrAfter(job.completedAt, todayStart)).length
  const jobsCompletedThisWeek = data.jobs.filter((job) => isSameOrAfter(job.completedAt, weekStart)).length
  const jobsCompletedThisMonth = data.jobs.filter((job) => isSameOrAfter(job.completedAt, monthStart)).length

  const revenueInvoicedThisMonth = data.invoices
    .filter((invoice) => isSameOrAfter(invoice.issueDate, monthStart))
    .reduce((sum, invoice) => sum + toNumber(invoice.total), 0)

  const cashCollectedThisMonth = data.payments
    .filter((payment) => isSameOrAfter(payment.paymentDate, monthStart))
    .reduce((sum, payment) => sum + toNumber(payment.amount), 0)

  const materialCostThisMonth = data.jobs
    .filter((job) => isSameOrAfter(job.completedAt, monthStart))
    .reduce((sum, job) => sum + toNumber(job.actualMaterialCost), 0)

  const jobsAwaitingPayment = data.invoices.filter(
    (invoice) =>
      invoice.paymentStatus !== PaymentStatus.PAID &&
      toNumber(invoice.amountDue) > 0
  ).length

  const overdueInvoices = data.invoices.filter(
    (invoice) =>
      invoice.paymentStatus !== PaymentStatus.PAID &&
      isBefore(invoice.dueDate, todayStart) &&
      toNumber(invoice.amountDue) > 0
  )

  const overdueAmount = overdueInvoices.reduce((sum, invoice) => sum + toNumber(invoice.amountDue), 0)

  return {
    jobsCompletedToday,
    jobsCompletedThisWeek,
    jobsCompletedThisMonth,
    revenueInvoicedThisMonth,
    cashCollectedThisMonth,
    materialCostThisMonth,
    jobsAwaitingPayment,
    overdueInvoices: overdueInvoices.length,
    overdueAmount,
  }
}

export function getStaffLeaderboard(data: DashboardDataset, now = new Date()): StaffLeaderboardRow[] {
  const monthStart = startOfMonth(now)

  const jobById = new Map(data.jobs.map((job) => [job.id, job]))
  const invoicesByJobId = new Map<string, Invoice[]>()

  for (const invoice of data.invoices) {
    if (!invoice.jobId) continue
    const current = invoicesByJobId.get(invoice.jobId) ?? []
    current.push(invoice)
    invoicesByJobId.set(invoice.jobId, current)
  }

  return data.staff
    .map((staffMember) => {
      const staffJobs = data.jobs.filter((job) => job.assignedStaffId === staffMember.id)
      const completedJobs = staffJobs.filter((job) => isSameOrAfter(job.completedAt, monthStart))
      const revenue = completedJobs.reduce((sum, job) => sum + toNumber(job.actualRevenue), 0)
      const materialCost = completedJobs.reduce((sum, job) => sum + toNumber(job.actualMaterialCost), 0)
      const grossMargin = completedJobs.reduce((sum, job) => sum + toNumber(job.grossMarginAmount), 0)

      const jobsAwaitingPayment = completedJobs.filter((job) => {
        const invoices = invoicesByJobId.get(job.id) ?? []
        return invoices.some(
          (invoice) => invoice.paymentStatus !== PaymentStatus.PAID && toNumber(invoice.amountDue) > 0
        )
      }).length

      return {
        staffId: staffMember.id,
        name: safeName(staffMember),
        jobsCompleted: completedJobs.length,
        revenue,
        materialCost,
        grossMargin,
        jobsAwaitingPayment,
      }
    })
    .sort((a, b) => b.revenue - a.revenue)
}

export function getAttentionJobs(data: DashboardDataset, now = new Date()): AttentionJobRow[] {
  const todayStart = startOfDay(now)
  const staffById = new Map(data.staff.map((member) => [member.id, member]))
  const invoicesByJobId = new Map<string, Invoice[]>()

  for (const invoice of data.invoices) {
    if (!invoice.jobId) continue
    const current = invoicesByJobId.get(invoice.jobId) ?? []
    current.push(invoice)
    invoicesByJobId.set(invoice.jobId, current)
  }

  const rows: AttentionJobRow[] = []

  for (const job of data.jobs) {
    const staffName = job.assignedStaffId ? safeName(staffById.get(job.assignedStaffId)) : null
    const customerName = job.customerId ? data.customersById?.[job.customerId]?.name ?? null : null
    const invoices = invoicesByJobId.get(job.id) ?? []

    if (job.completedAt && invoices.length === 0) {
      rows.push({
        jobId: job.id,
        title: job.title ?? "Untitled job",
        staffName,
        customerName,
        reason: "Completed but not invoiced",
        completedAt: job.completedAt,
      })
    }

    for (const invoice of invoices) {
      if (invoice.paymentStatus !== PaymentStatus.PAID && toNumber(invoice.amountDue) > 0) {
        rows.push({
          jobId: job.id,
          title: job.title ?? "Untitled job",
          staffName,
          customerName,
          reason: isBefore(invoice.dueDate, todayStart) ? "Invoice overdue" : "Invoice awaiting payment",
          amountDue: toNumber(invoice.amountDue),
          completedAt: job.completedAt,
        })
      }
    }

    if (!job.assignedStaffId) {
      rows.push({
        jobId: job.id,
        title: job.title ?? "Untitled job",
        staffName: null,
        customerName,
        reason: "Missing assigned staff",
        completedAt: job.completedAt,
      })
    }

    const materialCost = toNumber(job.actualMaterialCost)
    const revenue = toNumber(job.actualRevenue)
    if (revenue > 0 && materialCost / revenue > 0.6) {
      rows.push({
        jobId: job.id,
        title: job.title ?? "Untitled job",
        staffName,
        customerName,
        reason: "High material cost ratio",
        completedAt: job.completedAt,
      })
    }

    const margin = toNumber(job.grossMarginPct)
    if (revenue > 0 && margin > 0 && margin < 20) {
      rows.push({
        jobId: job.id,
        title: job.title ?? "Untitled job",
        staffName,
        customerName,
        reason: "Low gross margin",
        completedAt: job.completedAt,
      })
    }
  }

  return rows.sort((a, b) => {
    const aTime = a.completedAt ? a.completedAt.getTime() : 0
    const bTime = b.completedAt ? b.completedAt.getTime() : 0
    return bTime - aTime
  })
}

export function getRevenueTrend(data: DashboardDataset, days = 30, now = new Date()) {
  const start = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1)))
  const buckets = new Map<string, { date: string; invoiced: number; collected: number }>()

  for (let i = 0; i < days; i += 1) {
    const current = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
    const key = current.toISOString().slice(0, 10)
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
  const start = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1)))
  const buckets = new Map<string, { date: string; jobsCompleted: number }>()

  for (let i = 0; i < days; i += 1) {
    const current = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
    const key = current.toISOString().slice(0, 10)
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

export function linkCustomersById(
  customers: Array<{ id: string; name: string | null | undefined }>
): Record<string, { name: string | null | undefined }> {
  return customers.reduce<Record<string, { name: string | null | undefined }>>((acc, customer) => {
    acc[customer.id] = { name: customer.name }
    return acc
  }, {})
}
