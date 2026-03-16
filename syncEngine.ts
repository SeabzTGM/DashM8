import { PrismaClient, InvoiceStatus, JobStatus, PaymentStatus } from "@prisma/client"
import { ServiceM8Client, ServiceM8Company, ServiceM8Job, ServiceM8JobMaterial, ServiceM8Staff } from "./servicem8Client"
import { XeroClient, XeroContact, XeroInvoice, XeroPayment } from "./xeroClient"

type SyncEngineDeps = {
  prisma: PrismaClient
  servicem8: ServiceM8Client
  xero: XeroClient
}

function parseAmount(value: string | number | null | undefined): number {
  if (value == null) return 0
  const n = typeof value === "number" ? value : Number(value)
  return Number.isFinite(n) ? n : 0
}

function parseDate(value?: string | null): Date | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function mapJobStatus(status?: string | null): JobStatus {
  const normalized = (status ?? "").trim().toUpperCase()
  if (normalized.includes("QUOTE")) return JobStatus.QUOTE
  if (normalized.includes("WORK")) return JobStatus.WORK_ORDER
  if (normalized.includes("SCHEDULE")) return JobStatus.SCHEDULED
  if (normalized.includes("PROGRESS")) return JobStatus.IN_PROGRESS
  if (normalized.includes("COMPLETE")) return JobStatus.COMPLETED
  if (normalized.includes("HOLD")) return JobStatus.ON_HOLD
  if (normalized.includes("CANCEL")) return JobStatus.CANCELLED
  return JobStatus.WORK_ORDER
}

function mapInvoiceStatus(status?: string | null): InvoiceStatus {
  const normalized = (status ?? "").trim().toUpperCase()
  if (normalized === "DRAFT") return InvoiceStatus.DRAFT
  if (normalized === "SUBMITTED") return InvoiceStatus.SUBMITTED
  if (normalized === "VOIDED") return InvoiceStatus.VOIDED
  if (normalized === "DELETED") return InvoiceStatus.DELETED
  if (normalized === "PAID" || normalized === "AUTHORISED") return InvoiceStatus.AUTHORISED
  return InvoiceStatus.AUTHORISED
}

function mapPaymentStatus(invoice: XeroInvoice): PaymentStatus {
  const amountDue = parseAmount(invoice.AmountDue)
  const amountPaid = parseAmount(invoice.AmountPaid)
  const dueDate = parseDate(invoice.DueDate)

  if ((invoice.Status ?? "").toUpperCase() == "VOIDED") return PaymentStatus.VOIDED
  if (amountDue <= 0) return PaymentStatus.PAID
  if (amountPaid > 0 && amountDue > 0) return PaymentStatus.PARTIAL
  if (dueDate && dueDate.getTime() < Date.now()) return PaymentStatus.OVERDUE
  return PaymentStatus.PENDING
}

async function syncStaff(prisma: PrismaClient, staffRows: ServiceM8Staff[]) {
  for (const row of staffRows) {
    await prisma.staff.upsert({
      where: { servicem8StaffUuid: row.uuid },
      create: {
        servicem8StaffUuid: row.uuid,
        firstName: row.first ?? null,
        lastName: row.last ?? null,
        email: row.email ?? null,
        isActive: row.active ?? true,
      },
      update: {
        firstName: row.first ?? null,
        lastName: row.last ?? null,
        email: row.email ?? null,
        isActive: row.active ?? true,
      },
    })
  }
}

async function syncCustomersFromServiceM8(prisma: PrismaClient, companies: ServiceM8Company[]) {
  for (const company of companies) {
    await prisma.customer.upsert({
      where: { servicem8CompanyUuid: company.uuid },
      create: {
        servicem8CompanyUuid: company.uuid,
        name: company.name ?? "Unknown customer",
        email: company.email ?? null,
        phone: company.phone ?? null,
        mobile: company.mobile ?? null,
        suburb: company.suburb ?? null,
        state: company.state ?? null,
        postcode: company.post_code ?? null,
      },
      update: {
        name: company.name ?? "Unknown customer",
        email: company.email ?? null,
        phone: company.phone ?? null,
        mobile: company.mobile ?? null,
        suburb: company.suburb ?? null,
        state: company.state ?? null,
        postcode: company.post_code ?? null,
      },
    })
  }
}

async function syncCustomersFromXero(prisma: PrismaClient, contacts: XeroContact[]) {
  for (const contact of contacts) {
    const existing = await prisma.customer.findFirst({
      where: {
        OR: [
          { xeroContactId: contact.ContactID },
          ...(contact.Name ? [{ name: contact.Name }] : []),
        ],
      },
    })

    if (existing) {
      await prisma.customer.update({
        where: { id: existing.id },
        data: {
          xeroContactId: contact.ContactID,
          name: contact.Name ?? existing.name,
          email: contact.EmailAddress ?? existing.email,
        },
      })
      continue
    }

    await prisma.customer.create({
      data: {
        xeroContactId: contact.ContactID,
        name: contact.Name ?? "Unknown customer",
        email: contact.EmailAddress ?? null,
      },
    })
  }
}

async function syncJobs(prisma: PrismaClient, jobs: ServiceM8Job[]) {
  const staffRows = await prisma.staff.findMany({ select: { id: true, servicem8StaffUuid: true } })
  const customerRows = await prisma.customer.findMany({ select: { id: true, servicem8CompanyUuid: true } })

  const staffByExternal = new Map(staffRows.filter(x => x.servicem8StaffUuid).map(x => [x.servicem8StaffUuid as string, x.id]))
  const customerByExternal = new Map(customerRows.filter(x => x.servicem8CompanyUuid).map(x => [x.servicem8CompanyUuid as string, x.id]))

  for (const job of jobs) {
    await prisma.job.upsert({
      where: { servicem8JobUuid: job.uuid },
      create: {
        servicem8JobUuid: job.uuid,
        generatedJobNumber: job.generated_job_id ?? null,
        title: job.description ?? null,
        description: job.description ?? null,
        status: mapJobStatus(job.status),
        assignedStaffId: job.staff_uuid ? staffByExternal.get(job.staff_uuid) ?? null : null,
        customerId: job.company_uuid ? customerByExternal.get(job.company_uuid) ?? null : null,
        createdAtSource: parseDate(job.date),
        completedAt: parseDate(job.completion_date),
        actualRevenue: parseAmount(job.total_price),
      },
      update: {
        generatedJobNumber: job.generated_job_id ?? null,
        title: job.description ?? null,
        description: job.description ?? null,
        status: mapJobStatus(job.status),
        assignedStaffId: job.staff_uuid ? staffByExternal.get(job.staff_uuid) ?? null : null,
        customerId: job.company_uuid ? customerByExternal.get(job.company_uuid) ?? null : null,
        createdAtSource: parseDate(job.date),
        completedAt: parseDate(job.completion_date),
        actualRevenue: parseAmount(job.total_price),
        syncUpdatedAt: new Date(),
      },
    })
  }
}

async function syncJobMaterials(prisma: PrismaClient, materials: ServiceM8JobMaterial[]) {
  const jobs = await prisma.job.findMany({ select: { id: true, servicem8JobUuid: true } })
  const jobsByExternal = new Map(jobs.map(x => [x.servicem8JobUuid, x.id]))

  for (const material of materials) {
    const jobId = material.job_uuid ? jobsByExternal.get(material.job_uuid) : null
    if (!jobId) continue

    await prisma.jobMaterial.upsert({
      where: { servicem8MaterialUuid: material.uuid },
      create: {
        servicem8MaterialUuid: material.uuid,
        jobId,
        name: material.name ?? "Unknown material",
        description: material.description ?? null,
        quantity: parseAmount(material.qty),
        unitCost: parseAmount(material.cost),
        unitSell: parseAmount(material.price),
        totalCost: parseAmount(material.qty) * parseAmount(material.cost),
        totalSell: parseAmount(material.qty) * parseAmount(material.price),
      },
      update: {
        name: material.name ?? "Unknown material",
        description: material.description ?? null,
        quantity: parseAmount(material.qty),
        unitCost: parseAmount(material.cost),
        unitSell: parseAmount(material.price),
        totalCost: parseAmount(material.qty) * parseAmount(material.cost),
        totalSell: parseAmount(material.qty) * parseAmount(material.price),
        sourceUpdatedAt: new Date(),
      },
    })
  }

  const materialTotals = await prisma.jobMaterial.groupBy({
    by: ["jobId"],
    _sum: { totalCost: true, totalSell: true },
  })

  for (const total of materialTotals) {
    const revenue = Number(total._sum.totalSell ?? 0)
    const cost = Number(total._sum.totalCost ?? 0)
    await prisma.job.update({
      where: { id: total.jobId },
      data: {
        actualMaterialCost: cost,
        grossMarginAmount: revenue - cost,
        grossMarginPct: revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0,
      },
    })
  }
}

async function syncInvoices(prisma: PrismaClient, invoices: XeroInvoice[]) {
  const customers = await prisma.customer.findMany({ select: { id: true, xeroContactId: true, name: true } })
  const jobs = await prisma.job.findMany({ select: { id: true, generatedJobNumber: true } })

  const customerByXero = new Map(customers.filter(x => x.xeroContactId).map(x => [x.xeroContactId as string, x.id]))
  const jobByGeneratedNumber = new Map(jobs.filter(x => x.generatedJobNumber).map(x => [x.generatedJobNumber as string, x.id]))

  for (const invoice of invoices) {
    const reference = invoice.Reference ?? ""
    const matchedJobId = invoice.InvoiceNumber
      ? jobByGeneratedNumber.get(invoice.InvoiceNumber) ?? null
      : (jobByGeneratedNumber.get(reference) ?? null)

    await prisma.invoice.upsert({
      where: { xeroInvoiceId: invoice.InvoiceID },
      create: {
        xeroInvoiceId: invoice.InvoiceID,
        invoiceNumber: invoice.InvoiceNumber ?? null,
        reference: invoice.Reference ?? null,
        customerId: invoice.Contact?.ContactID ? customerByXero.get(invoice.Contact.ContactID) ?? null : null,
        jobId: matchedJobId,
        status: mapInvoiceStatus(invoice.Status),
        paymentStatus: mapPaymentStatus(invoice),
        issueDate: parseDate(invoice.Date),
        dueDate: parseDate(invoice.DueDate),
        subTotal: parseAmount(invoice.SubTotal),
        taxTotal: parseAmount(invoice.TotalTax),
        total: parseAmount(invoice.Total),
        amountPaid: parseAmount(invoice.AmountPaid),
        amountDue: parseAmount(invoice.AmountDue),
      },
      update: {
        invoiceNumber: invoice.InvoiceNumber ?? null,
        reference: invoice.Reference ?? null,
        customerId: invoice.Contact?.ContactID ? customerByXero.get(invoice.Contact.ContactID) ?? null : null,
        jobId: matchedJobId,
        status: mapInvoiceStatus(invoice.Status),
        paymentStatus: mapPaymentStatus(invoice),
        issueDate: parseDate(invoice.Date),
        dueDate: parseDate(invoice.DueDate),
        subTotal: parseAmount(invoice.SubTotal),
        taxTotal: parseAmount(invoice.TotalTax),
        total: parseAmount(invoice.Total),
        amountPaid: parseAmount(invoice.AmountPaid),
        amountDue: parseAmount(invoice.AmountDue),
        syncUpdatedAt: new Date(),
      },
    })
  }
}

async function syncPayments(prisma: PrismaClient, payments: XeroPayment[]) {
  const invoices = await prisma.invoice.findMany({ select: { id: true, xeroInvoiceId: true } })
  const invoiceByXero = new Map(invoices.filter(x => x.xeroInvoiceId).map(x => [x.xeroInvoiceId as string, x.id]))

  for (const payment of payments) {
    const invoiceId = payment.Invoice?.InvoiceID ? invoiceByXero.get(payment.Invoice.InvoiceID) : null
    if (!invoiceId) continue

    await prisma.payment.upsert({
      where: { xeroPaymentId: payment.PaymentID },
      create: {
        xeroPaymentId: payment.PaymentID,
        invoiceId,
        paymentDate: parseDate(payment.Date) ?? new Date(),
        amount: parseAmount(payment.Amount),
      },
      update: {
        invoiceId,
        paymentDate: parseDate(payment.Date) ?? new Date(),
        amount: parseAmount(payment.Amount),
        sourceUpdatedAt: new Date(),
      },
    })
  }
}

export class SyncEngine {
  private readonly prisma: PrismaClient
  private readonly servicem8: ServiceM8Client
  private readonly xero: XeroClient

  constructor(deps: SyncEngineDeps) {
    this.prisma = deps.prisma
    this.servicem8 = deps.servicem8
    this.xero = deps.xero
  }

  async runFullSync(): Promise<void> {
    const [staff, companies, jobs, materials, contacts, invoices, payments] = await Promise.all([
      this.servicem8.listAllStaff(),
      this.servicem8.listAllCompanies(),
      this.servicem8.listAllJobs(),
      this.servicem8.listAllJobMaterials(),
      this.xero.listContacts(),
      this.xero.listInvoices(),
      this.xero.listPayments(),
    ])

    await syncStaff(this.prisma, staff)
    await syncCustomersFromServiceM8(this.prisma, companies)
    await syncCustomersFromXero(this.prisma, contacts)
    await syncJobs(this.prisma, jobs)
    await syncJobMaterials(this.prisma, materials)
    await syncInvoices(this.prisma, invoices)
    await syncPayments(this.prisma, payments)
  }
}
