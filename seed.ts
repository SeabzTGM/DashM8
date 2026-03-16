
import { PrismaClient, JobStatus, InvoiceStatus, PaymentStatus } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {

  // Clear existing data
  await prisma.payment.deleteMany()
  await prisma.invoice.deleteMany()
  await prisma.jobMaterial.deleteMany()
  await prisma.jobStatusHistory.deleteMany()
  await prisma.jobAttentionFlag.deleteMany()
  await prisma.job.deleteMany()
  await prisma.staff.deleteMany()
  await prisma.customer.deleteMany()

  // Create staff
  const staff = await Promise.all([
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

  // Create customers
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        name: "ACME Construction",
        servicem8CompanyUuid: "cust-001"
      }
    }),
    prisma.customer.create({
      data: {
        name: "Smith Electrical",
        servicem8CompanyUuid: "cust-002"
      }
    })
  ])

  // Create jobs
  const job1 = await prisma.job.create({
    data: {
      servicem8JobUuid: "job-001",
      title: "Aircon Install",
      status: JobStatus.COMPLETED,
      assignedStaffId: staff[0].id,
      customerId: customers[0].id,
      completedAt: new Date(),
      actualRevenue: 1200,
      actualMaterialCost: 350,
      grossMarginAmount: 850,
      grossMarginPct: 70
    }
  })

  const job2 = await prisma.job.create({
    data: {
      servicem8JobUuid: "job-002",
      title: "Electrical Repair",
      status: JobStatus.COMPLETED,
      assignedStaffId: staff[1].id,
      customerId: customers[1].id,
      completedAt: new Date(),
      actualRevenue: 600,
      actualMaterialCost: 120,
      grossMarginAmount: 480,
      grossMarginPct: 80
    }
  })

  // Materials
  await prisma.jobMaterial.createMany({
    data: [
      {
        jobId: job1.id,
        name: "Copper Pipe",
        quantity: 5,
        unitCost: 20,
        totalCost: 100,
        totalSell: 200
      },
      {
        jobId: job2.id,
        name: "Circuit Breaker",
        quantity: 1,
        unitCost: 50,
        totalCost: 50,
        totalSell: 120
      }
    ]
  })

  // Invoices
  const invoice1 = await prisma.invoice.create({
    data: {
      jobId: job1.id,
      customerId: customers[0].id,
      status: InvoiceStatus.AUTHORISED,
      paymentStatus: PaymentStatus.PAID,
      total: 1200,
      amountPaid: 1200,
      amountDue: 0,
      issueDate: new Date()
    }
  })

  const invoice2 = await prisma.invoice.create({
    data: {
      jobId: job2.id,
      customerId: customers[1].id,
      status: InvoiceStatus.AUTHORISED,
      paymentStatus: PaymentStatus.PENDING,
      total: 600,
      amountPaid: 0,
      amountDue: 600,
      issueDate: new Date()
    }
  })

  // Payments
  await prisma.payment.create({
    data: {
      invoiceId: invoice1.id,
      paymentDate: new Date(),
      amount: 1200
    }
  })

  console.log("Seed data created")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
