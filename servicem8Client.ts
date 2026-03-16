export type ServiceM8Config = {
  apiKey: string
  companyUuid?: string
  baseUrl?: string
  fetchImpl?: typeof fetch
}

export type ServiceM8ListOptions = {
  limit?: number
  offset?: number
  query?: Record<string, string | number | boolean | undefined>
}

export type ServiceM8Staff = {
  uuid: string
  first?: string
  last?: string
  email?: string
  active?: boolean
}

export type ServiceM8Company = {
  uuid: string
  name?: string
  email?: string
  phone?: string
  mobile?: string
  suburb?: string
  state?: string
  post_code?: string
}

export type ServiceM8Job = {
  uuid: string
  generated_job_id?: string
  company_uuid?: string
  staff_uuid?: string
  job_address?: string
  status?: string
  category_uuid?: string
  description?: string
  purchase_order_number?: string
  completion_date?: string
  date?: string
  quote_date?: string
  total_price?: string | number
  total_tax?: string | number
}

export type ServiceM8JobMaterial = {
  uuid: string
  job_uuid?: string
  name?: string
  description?: string
  qty?: string | number
  cost?: string | number
  price?: string | number
}

function toQueryString(query?: Record<string, string | number | boolean | undefined>): string {
  if (!query) return ""
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue
    params.set(key, String(value))
  }
  const qs = params.toString()
  return qs ? `?${qs}` : ""
}

export class ServiceM8Client {
  private readonly apiKey: string
  private readonly baseUrl: string
  private readonly fetchImpl: typeof fetch
  private readonly companyUuid?: string

  constructor(config: ServiceM8Config) {
    this.apiKey = config.apiKey
    this.companyUuid = config.companyUuid
    this.baseUrl = config.baseUrl ?? "https://api.servicem8.com/api_1.0"
    this.fetchImpl = config.fetchImpl ?? fetch

    if (!this.apiKey) {
      throw new Error("Missing ServiceM8 apiKey")
    }
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`ServiceM8 request failed: ${response.status} ${text}`)
    }

    if (response.status === 204) {
      return undefined as T
    }

    return (await response.json()) as T
  }

  async listJobs(options: ServiceM8ListOptions = {}): Promise<ServiceM8Job[]> {
    const query = {
      limit: options.limit,
      offset: options.offset,
      ...(options.query ?? {}),
    }
    return this.request<ServiceM8Job[]>(`/job${toQueryString(query)}`)
  }

  async getJob(jobUuid: string): Promise<ServiceM8Job> {
    return this.request<ServiceM8Job>(`/job/${jobUuid}.json`)
  }

  async listJobMaterials(jobUuid?: string, options: ServiceM8ListOptions = {}): Promise<ServiceM8JobMaterial[]> {
    const query = {
      limit: options.limit,
      offset: options.offset,
      ...(jobUuid ? { job_uuid: jobUuid } : {}),
      ...(options.query ?? {}),
    }
    return this.request<ServiceM8JobMaterial[]>(`/jobmaterial${toQueryString(query)}`)
  }

  async listStaff(options: ServiceM8ListOptions = {}): Promise<ServiceM8Staff[]> {
    const query = {
      limit: options.limit,
      offset: options.offset,
      ...(options.query ?? {}),
    }
    return this.request<ServiceM8Staff[]>(`/staff${toQueryString(query)}`)
  }

  async listCompanies(options: ServiceM8ListOptions = {}): Promise<ServiceM8Company[]> {
    const query = {
      limit: options.limit,
      offset: options.offset,
      ...(options.query ?? {}),
    }
    return this.request<ServiceM8Company[]>(`/company${toQueryString(query)}`)
  }

  async listAllJobs(pageSize = 500): Promise<ServiceM8Job[]> {
    const rows: ServiceM8Job[] = []
    let offset = 0

    for (;;) {
      const batch = await this.listJobs({ limit: pageSize, offset })
      rows.push(...batch)
      if (batch.length < pageSize) break
      offset += pageSize
    }

    return rows
  }

  async listAllJobMaterials(pageSize = 500): Promise<ServiceM8JobMaterial[]> {
    const rows: ServiceM8JobMaterial[] = []
    let offset = 0

    for (;;) {
      const batch = await this.listJobMaterials(undefined, { limit: pageSize, offset })
      rows.push(...batch)
      if (batch.length < pageSize) break
      offset += pageSize
    }

    return rows
  }

  async listAllStaff(pageSize = 200): Promise<ServiceM8Staff[]> {
    const rows: ServiceM8Staff[] = []
    let offset = 0

    for (;;) {
      const batch = await this.listStaff({ limit: pageSize, offset })
      rows.push(...batch)
      if (batch.length < pageSize) break
      offset += pageSize
    }

    return rows
  }

  async listAllCompanies(pageSize = 500): Promise<ServiceM8Company[]> {
    const rows: ServiceM8Company[] = []
    let offset = 0

    for (;;) {
      const batch = await this.listCompanies({ limit: pageSize, offset })
      rows.push(...batch)
      if (batch.length < pageSize) break
      offset += pageSize
    }

    return rows
  }

  getCompanyUuid(): string | undefined {
    return this.companyUuid
  }
}
