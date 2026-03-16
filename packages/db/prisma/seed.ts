import { PrismaClient, JobStatus, InvoiceStatus, PaymentStatus } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  await prisma.payment.deleteMany()
  await prisma.invoice.deleteMany()
  await prisma.jobMaterial.deleteMany()
  await prisma.job.deleteMany()
  await prisma.staffMetricSnapshot.deleteMany()
  await prisma.dailyMetricSnapshot.deleteMany()
  await prisma.staff.deleteMany()
  await prisma.customer.deleteMany()

  const [alex, sam] = await Promise.all([
    prisma.staff.create({
      data: {
        servicem8StaffUuid: "staff-001",
        firstName: "Alex",
        lastName: "Tech",
        email: "alex@example.com",
        hourlyCostRate: 40,
        hourlyBillableRate: 120
      }
    }),
    prisma.staff.create({
      data: {
        servicem8StaffUuid: "staff-002",
        firstName: "Sam",
        lastName: "Installer",
        email: "sam@example.com",
        hourlyCostRate: 38,
        hourlyBillableRate: 110
      }
    })
  ])

  const [acme, smith] = await Promise.all([
    prisma.customer.create({ data: { name: "ACME Construction", servicem8CompanyUuid: "cust-001" } }),
    prisma.customer.create({ data: { name: "Smith Electrical", servicem8CompanyUuid: "cust-002" } })
  ])

  const now = new Date()
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
  const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)

  const job1 = await prisma.job.create({
    data: {
      servicem8JobUuid: "job-001",
      generatedJobNumber: "1001",
      title: "Aircon Install",
      description: "Split system installation",
      status: JobStatus.COMPLETED,
      assignedStaffId: alex.id,
      customerId: acme.id,
      completedAt: now,
      actualRevenue: 1200,
      actualMaterialCost: 350,
      grossMarginAmount: 850,
      grossMarginPct: 70
    }
  })

  const job2 = await prisma.job.create({
    data: {
      servicem8JobUuid: "job-002",
      generatedJobNumber: "1002",
      title: "Electrical Repair",
      description: "Fault finding and repair",
      status: JobStatus.COMPLETED,
      assignedStaffId: sam.id,
      customerId: smith.id,
      completedAt: twoDaysAgo,
      actualRevenue: 600,
      actualMaterialCost: 120,
      grossMarginAmount: 480,
      grossMarginPct: 80
    }
  })

  await prisma.job.create({
    data: {
      servicem8JobUuid: "job-003",
      generatedJobNumber: "1003",
      title: "Hot Water Service",
      description: "Scheduled replacement",
      status: JobStatus.SCHEDULED,
      assignedStaffId: alex.id,
      customerId: acme.id,
      scheduledStart: now
    }
  })

  await prisma.jobMaterial.createMany({
    data: [
      { jobId: job1.id, servicem8MaterialUuid: "mat-001", name: "Copper Pipe", quantity: 5, unitCost: 20, unitSell: 40, totalCost: 100, totalSell: 200 },
      { jobId: job2.id, servicem8MaterialUuid: "mat-002", name: "Circuit Breaker", quantity: 1, unitCost: 50, unitSell: 120, totalCost: 50, totalSell: 120 }
    ]
  })

  const invoice1 = await prisma.invoice.create({
    data: {
      xeroInvoiceId: "inv-001",
      invoiceNumber: "1001",
      jobId: job1.id,
      customerId: acme.id,
      status: InvoiceStatus.AUTHORISED,
      paymentStatus: PaymentStatus.PAID,
      total: 1200,
      amountPaid: 1200,
      amountDue: 0,
      issueDate: now,
      dueDate: now
    }
  })

  await prisma.invoice.create({
    data: {
      xeroInvoiceId: "inv-002",
      invoiceNumber: "1002",
      jobId: job2.id,
      customerId: smith.id,
      status: InvoiceStatus.AUTHORISED,
      paymentStatus: PaymentStatus.OVERDUE,
      total: 600,
      amountPaid: 0,
      amountDue: 600,
      issueDate: tenDaysAgo,
      dueDate: twoDaysAgo
    }
  })

  await prisma.payment.create({
    data: {
      xeroPaymentId: "pay-001",
      invoiceId: invoice1.id,
      paymentDate: now,
      amount: 1200
    }
  })

  console.log("Seed complete")
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
}).finally(async () => {
  await prisma.$disconnect()
})
