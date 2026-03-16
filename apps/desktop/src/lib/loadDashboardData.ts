import { prisma } from "@dashm8/db"
import { linkCustomersById } from "@dashm8/core"

export async function loadDashboardData() {
  const [jobs, invoices, payments, materials, staff, customers] = await Promise.all([
    prisma.job.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.invoice.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.payment.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.jobMaterial.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.staff.findMany({ orderBy: { firstName: "asc" } }),
    prisma.customer.findMany({ orderBy: { name: "asc" } })
  ])

  return {
    jobs,
    invoices,
    payments,
    materials,
    staff,
    customersById: linkCustomersById(customers)
  }
}
