export async function loadDashboardData() {
  const now = new Date()
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
  const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)

  return {
    jobs: [
      {
        id: "job-1",
        assignedStaffId: "staff-1",
        customerId: "cust-1",
        title: "Aircon Install",
        completedAt: now,
        actualRevenue: 1200,
        actualMaterialCost: 350,
        grossMarginAmount: 850
      },
      {
        id: "job-2",
        assignedStaffId: "staff-2",
        customerId: "cust-2",
        title: "Electrical Repair",
        completedAt: twoDaysAgo,
        actualRevenue: 600,
        actualMaterialCost: 120,
        grossMarginAmount: 480
      }
    ],
    invoices: [
      {
        id: "inv-1",
        jobId: "job-1",
        issueDate: now,
        dueDate: now,
        total: 1200,
        amountDue: 0,
        paymentStatus: "PAID"
      },
      {
        id: "inv-2",
        jobId: "job-2",
        issueDate: tenDaysAgo,
        dueDate: twoDaysAgo,
        total: 600,
        amountDue: 600,
        paymentStatus: "OVERDUE"
      }
    ],
    payments: [
      {
        id: "pay-1",
        paymentDate: now,
        amount: 1200
      }
    ],
    materials: [],
    staff: [
      { id: "staff-1", firstName: "Alex", lastName: "Tech", email: "alex@example.com" },
      { id: "staff-2", firstName: "Sam", lastName: "Installer", email: "sam@example.com" }
    ],
    customersById: {
      "cust-1": { name: "ACME Construction" },
      "cust-2": { name: "Smith Electrical" }
    }
  }
}