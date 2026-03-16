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
  suburb?: string
  state?: string
  post_code?: string
}

export type ServiceM8Job = {
  uuid: string
  generated_job_id?: string
  company_uuid?: string
  staff_uuid?: string
  status?: string
  description?: string
  completion_date?: string
  date?: string
  total_price?: string | number
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

function toQueryString(query?: Record<string, string | number | boolean | undefined>) {
  if (!query) return ""
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null) continue
    params.set(k, String(v))
  }
  const qs = params.toString()
  return qs ? `?${qs}` : ""
}

export class ServiceM8Client {
  private readonly apiKey: string
  private readonly baseUrl: string
  private readonly fetchImpl: typeof fetch

  constructor(config: ServiceM8Config) {
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl ?? "https://api.servicem8.com/api_1.0"
    this.fetchImpl = config.fetchImpl ?? fetch
    if (!this.apiKey) throw new Error("Missing ServiceM8 apiKey")
  }

  private async request<T>(path: string): Promise<T> {
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${this.apiKey}`
      }
    })

    if (!response.ok) {
      throw new Error(`ServiceM8 request failed: ${response.status} ${await response.text()}`)
    }

    return await response.json() as T
  }

  async listJobs(options: ServiceM8ListOptions = {}) {
    return this.request<ServiceM8Job[]>(`/job${toQueryString({ limit: options.limit, offset: options.offset, ...(options.query ?? {}) })}`)
  }

  async listStaff(options: ServiceM8ListOptions = {}) {
    return this.request<ServiceM8Staff[]>(`/staff${toQueryString({ limit: options.limit, offset: options.offset, ...(options.query ?? {}) })}`)
  }

  async listCompanies(options: ServiceM8ListOptions = {}) {
    return this.request<ServiceM8Company[]>(`/company${toQueryString({ limit: options.limit, offset: options.offset, ...(options.query ?? {}) })}`)
  }

  async listJobMaterials(options: ServiceM8ListOptions = {}) {
    return this.request<ServiceM8JobMaterial[]>(`/jobmaterial${toQueryString({ limit: options.limit, offset: options.offset, ...(options.query ?? {}) })}`)
  }
}
