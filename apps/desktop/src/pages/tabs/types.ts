export type DashboardData = {
  jobs: any[]
  invoices: any[]
  payments: any[]
  materials: any[]
  staff: any[]
  customersById?: Record<string, { name?: string | null }>
}
