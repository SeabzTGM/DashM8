import { InvoiceStatus, JobStatus, PaymentStatus, PrismaClient } from "@prisma/client"
import { ServiceM8Client } from "@dashm8/integrations-servicem8"
import { XeroClient } from "@dashm8/integrations-xero"

function parseAmount(value: string | number | null | undefined): number {
  if (value == null) return 0
  const n = typeof value === "number" ? value : Number(value)
  return Number.isFinite(n) ? n : 0
}

function parseDate(value?: string | null): Date | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function mapJobStatus(status?: string | null): JobStatus {
  const s = (status ?? "").toUpperCase()
  if (s.includes("QUOTE")) return JobStatus.QUOTE
  if (s.includes("SCHEDULE")) return JobStatus.SCHEDULED
  if (s.includes("PROGRESS")) return JobStatus.IN_PROGRESS
  if (s.includes("COMPLETE")) return JobStatus.COMPLETED
  if (s.includes("CANCEL")) return JobStatus.CANCELLED
  if (s.includes("HOLD")) return JobStatus.ON_HOLD
  return JobStatus.WORK_ORDER
}

export class SyncEngine {
  constructor(
    private prisma: PrismaClient,
    private servicem8: ServiceM8Client,
    private xero: XeroClient
  ) {}

  async runFullSync(): Promise<void> {
    const [staffRows, companyRows, jobRows, materialRows, contacts, invoices, payments] = await Promise.all([
      this.servicem8.listStaff(),
      this.servicem8.listCompanies(),
      this.servicem8.listJobs(),
      this.servicem8.listJobMaterials(),
      this.xero.listContacts(),
      this.xero.listInvoices(),
      this.xero.listPayments()
    ])

    for (const staff of staffRows) {
      await this.prisma.staff.upsert({
        where: { servicem8StaffUuid: staff.uuid },
        create: {
          servicem8StaffUuid: staff.uuid,
          firstName: staff.first ?? null,
          lastName: staff.last ?? null,
          email: staff.email ?? null,
          isActive: staff.active ?? true
        },
        update: {
          firstName: staff.first ?? null,
          lastName: staff.last ?? null,
          email: staff.email ?? null,
          isActive: staff.active ?? true
        }
      })
    }

    for (const company of companyRows) {
      await this.prisma.customer.upsert({
        where: { servicem8CompanyUuid: company.uuid },
        create: {
          servicem8CompanyUuid: company.uuid,
          name: company.name ?? "Unknown customer",
          email: company.email ?? null,
          phone: company.phone ?? null,
          suburb: company.suburb ?? null
        },
        update: {
          name: company.name ?? "Unknown customer",
          email: company.email ?? null,
          phone: company.phone ?? null,
          suburb: company.suburb ?? null
        }
      })
    }

    const staffMap = new Map((await this.prisma.staff.findMany({ select: { id: true, servicem8StaffUuid: true } }))
      .filter((x) => x.servicem8StaffUuid)
      .map((x) => [x.servicem8StaffUuid as string, x.id]))
    const customerMap = new Map((await this.prisma.customer.findMany({ select: { id: true, servicem8CompanyUuid: true } }))
      .filter((x) => x.servicem8CompanyUuid)
      .map((x) => [x.servicem8CompanyUuid as string, x.id]))

    for (const job of jobRows) {
      await this.prisma.job.upsert({
        where: { servicem8JobUuid: job.uuid },
        create: {
          servicem8JobUuid: job.uuid,
          generatedJobNumber: job.generated_job_id ?? null,
          title: job.description ?? null,
          description: job.description ?? null,
          status: mapJobStatus(job.status),
          assignedStaffId: job.staff_uuid ? staffMap.get(job.staff_uuid) ?? null : null,
          customerId: job.company_uuid ? customerMap.get(job.company_uuid) ?? null : null,
          createdAtSource: parseDate(job.date),
          completedAt: parseDate(job.completion_date),
          actualRevenue: parseAmount(job.total_price)
        },
        update: {
          generatedJobNumber: job.generated_job_id ?? null,
          title: job.description ?? null,
          description: job.description ?? null,
          status: mapJobStatus(job.status),
          assignedStaffId: job.staff_uuid ? staffMap.get(job.staff_uuid) ?? null : null,
          customerId: job.company_uuid ? customerMap.get(job.company_uuid) ?? null : null,
          createdAtSource: parseDate(job.date),
          completedAt: parseDate(job.completion_date),
          actualRevenue: parseAmount(job.total_price),
          syncUpdatedAt: new Date()
        }
      })
    }

    const jobsByExternal = new Map((await this.prisma.job.findMany({ select: { id: true, servicem8JobUuid: true } }))
      .map((x) => [x.servicem8JobUuid, x.id]))

    for (const material of materialRows) {
      const jobId = material.job_uuid ? jobsByExternal.get(material.job_uuid) : null
      if (!jobId) continue

      await this.prisma.jobMaterial.upsert({
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
          totalSell: parseAmount(material.qty) * parseAmount(material.price)
        },
        update: {
          name: material.name ?? "Unknown material",
          description: material.description ?? null,
          quantity: parseAmount(material.qty),
          unitCost: parseAmount(material.cost),
          unitSell: parseAmount(material.price),
          totalCost: parseAmount(material.qty) * parseAmount(material.cost),
          totalSell: parseAmount(material.qty) * parseAmount(material.price)
        }
      })
    }

    for (const contact of contacts) {
      const existing = await this.prisma.customer.findFirst({
        where: {
          OR: [
            { xeroContactId: contact.ContactID },
            ...(contact.Name ? [{ name: contact.Name }] : [])
          ]
        }
      })

      if (existing) {
        await this.prisma.customer.update({
          where: { id: existing.id },
          data: {
            xeroContactId: contact.ContactID,
            name: contact.Name ?? existing.name,
            email: contact.EmailAddress ?? existing.email
          }
        })
      } else {
        await this.prisma.customer.create({
          data: {
            xeroContactId: contact.ContactID,
            name: contact.Name ?? "Unknown customer",
            email: contact.EmailAddress ?? null
          }
        })
      }
    }

    const customerByXero = new Map((await this.prisma.customer.findMany({ select: { id: true, xeroContactId: true } }))
      .filter((x) => x.xeroContactId)
      .map((x) => [x.xeroContactId as string, x.id]))
    const jobByNumber = new Map((await this.prisma.job.findMany({ select: { id: true, generatedJobNumber: true } }))
      .filter((x) => x.generatedJobNumber)
      .map((x) => [x.generatedJobNumber as string, x.id]))

    for (const invoice of invoices) {
      const amountDue = parseAmount(invoice.AmountDue)
      const amountPaid = parseAmount(invoice.AmountPaid)
      const dueDate = parseDate(invoice.DueDate)
      const paymentStatus =
        amountDue <= 0 ? PaymentStatus.PAID :
        amountPaid > 0 ? PaymentStatus.PARTIAL :
        dueDate && dueDate.getTime() < Date.now() ? PaymentStatus.OVERDUE :
        PaymentStatus.PENDING

      await this.prisma.invoice.upsert({
        where: { xeroInvoiceId: invoice.InvoiceID },
        create: {
          xeroInvoiceId: invoice.InvoiceID,
          invoiceNumber: invoice.InvoiceNumber ?? null,
          reference: invoice.Reference ?? null,
          customerId: invoice.Contact?.ContactID ? customerByXero.get(invoice.Contact.ContactID) ?? null : null,
          jobId: invoice.InvoiceNumber ? jobByNumber.get(invoice.InvoiceNumber) ?? null : null,
          status: InvoiceStatus.AUTHORISED,
          paymentStatus,
          issueDate: parseDate(invoice.Date),
          dueDate: dueDate,
          total: parseAmount(invoice.Total),
          amountPaid,
          amountDue
        },
        update: {
          invoiceNumber: invoice.InvoiceNumber ?? null,
          reference: invoice.Reference ?? null,
          customerId: invoice.Contact?.ContactID ? customerByXero.get(invoice.Contact.ContactID) ?? null : null,
          jobId: invoice.InvoiceNumber ? jobByNumber.get(invoice.InvoiceNumber) ?? null : null,
          paymentStatus,
          issueDate: parseDate(invoice.Date),
          dueDate: dueDate,
          total: parseAmount(invoice.Total),
          amountPaid,
          amountDue
        }
      })
    }

    const invoiceByXero = new Map((await this.prisma.invoice.findMany({ select: { id: true, xeroInvoiceId: true } }))
      .filter((x) => x.xeroInvoiceId)
      .map((x) => [x.xeroInvoiceId as string, x.id]))

    for (const payment of payments) {
      const invoiceId = payment.Invoice?.InvoiceID ? invoiceByXero.get(payment.Invoice.InvoiceID) : null
      if (!invoiceId) continue

      await this.prisma.payment.upsert({
        where: { xeroPaymentId: payment.PaymentID },
        create: {
          xeroPaymentId: payment.PaymentID,
          invoiceId,
          paymentDate: parseDate(payment.Date) ?? new Date(),
          amount: parseAmount(payment.Amount)
        },
        update: {
          invoiceId,
          paymentDate: parseDate(payment.Date) ?? new Date(),
          amount: parseAmount(payment.Amount)
        }
      })
    }
  }
}
