export type XeroTokenSet = {
  accessToken: string
  refreshToken?: string
  expiresAt?: number
  tenantId: string
}

export type XeroConfig = {
  clientId: string
  clientSecret: string
  redirectUri: string
  tokenSet?: XeroTokenSet
  baseUrl?: string
  fetchImpl?: typeof fetch
}

export type XeroContact = {
  ContactID: string
  Name?: string
  EmailAddress?: string
  Phones?: Array<{ PhoneType?: string; PhoneNumber?: string }>
}

export type XeroInvoice = {
  InvoiceID: string
  Type?: string
  Contact?: XeroContact
  InvoiceNumber?: string
  Reference?: string
  Date?: string
  DueDate?: string
  Status?: string
  SubTotal?: number
  TotalTax?: number
  Total?: number
  AmountDue?: number
  AmountPaid?: number
}

export type XeroPayment = {
  PaymentID: string
  Date?: string
  Amount?: number
  Invoice?: { InvoiceID: string }
}

export type XeroAuthTokenResponse = {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type: string
  scope?: string
}

type JsonRecord = Record<string, unknown>

function encodeBasicAuth(clientId: string, clientSecret: string): string {
  return Buffer.from(`${clientId}:${clientSecret}`).toString("base64")
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

export class XeroClient {
  private readonly clientId: string
  private readonly clientSecret: string
  private readonly redirectUri: string
  private readonly baseUrl: string
  private readonly fetchImpl: typeof fetch
  private tokenSet?: XeroTokenSet

  constructor(config: XeroConfig) {
    this.clientId = config.clientId
    this.clientSecret = config.clientSecret
    this.redirectUri = config.redirectUri
    this.baseUrl = config.baseUrl ?? "https://api.xero.com/api.xro/2.0"
    this.fetchImpl = config.fetchImpl ?? fetch
    this.tokenSet = config.tokenSet
  }

  getAuthorizationUrl(
    state: string,
    scopes: string[] = ["openid", "profile", "email", "accounting.transactions", "offline_access"]
  ): string {
    const url = new URL("https://login.xero.com/identity/connect/authorize")
    url.searchParams.set("response_type", "code")
    url.searchParams.set("client_id", this.clientId)
    url.searchParams.set("redirect_uri", this.redirectUri)
    url.searchParams.set("scope", scopes.join(" "))
    url.searchParams.set("state", state)
    return url.toString()
  }

  async exchangeCodeForToken(code: string): Promise<XeroTokenSet> {
    const response = await this.fetchImpl("https://identity.xero.com/connect/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${encodeBasicAuth(this.clientId, this.clientSecret)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: this.redirectUri,
      }),
    })

    if (!response.ok) {
      throw new Error(`Xero token exchange failed: ${response.status} ${await response.text()}`)
    }

    const json = (await response.json()) as XeroAuthTokenResponse
    const tokenSet: XeroTokenSet = {
      accessToken: json.access_token,
      refreshToken: json.refresh_token,
      expiresAt: Date.now() + json.expires_in * 1000,
      tenantId: this.tokenSet?.tenantId ?? "",
    }
    this.tokenSet = tokenSet
    return tokenSet
  }

  async refreshToken(): Promise<XeroTokenSet> {
    if (!this.tokenSet?.refreshToken) {
      throw new Error("Missing Xero refresh token")
    }

    const response = await this.fetchImpl("https://identity.xero.com/connect/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${encodeBasicAuth(this.clientId, this.clientSecret)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: this.tokenSet.refreshToken,
      }),
    })

    if (!response.ok) {
      throw new Error(`Xero token refresh failed: ${response.status} ${await response.text()}`)
    }

    const json = (await response.json()) as XeroAuthTokenResponse
    const tokenSet: XeroTokenSet = {
      accessToken: json.access_token,
      refreshToken: json.refresh_token ?? this.tokenSet.refreshToken,
      expiresAt: Date.now() + json.expires_in * 1000,
      tenantId: this.tokenSet.tenantId,
    }
    this.tokenSet = tokenSet
    return tokenSet
  }

  setTenantId(tenantId: string): void {
    this.tokenSet = {
      accessToken: this.tokenSet?.accessToken ?? "",
      refreshToken: this.tokenSet?.refreshToken,
      expiresAt: this.tokenSet?.expiresAt,
      tenantId,
    }
  }

  setTokenSet(tokenSet: XeroTokenSet): void {
    this.tokenSet = tokenSet
  }

  getTokenSet(): XeroTokenSet | undefined {
    return this.tokenSet
  }

  private async ensureAccessToken(): Promise<string> {
    if (!this.tokenSet?.accessToken) {
      throw new Error("Missing Xero access token")
    }

    if (this.tokenSet.expiresAt && Date.now() > this.tokenSet.expiresAt - 60_000 && this.tokenSet.refreshToken) {
      await this.refreshToken()
    }

    return this.tokenSet.accessToken
  }

  private async request<T>(path: string, query?: Record<string, string | number | boolean | undefined>): Promise<T> {
    const accessToken = await this.ensureAccessToken()

    if (!this.tokenSet?.tenantId) {
      throw new Error("Missing Xero tenantId")
    }

    const response = await this.fetchImpl(`${this.baseUrl}${path}${toQueryString(query)}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
        "Xero-tenant-id": this.tokenSet.tenantId,
      },
    })

    if (!response.ok) {
      throw new Error(`Xero request failed: ${response.status} ${await response.text()}`)
    }

    return (await response.json()) as T
  }

  async listConnections(): Promise<JsonRecord[]> {
    const accessToken = await this.ensureAccessToken()
    const response = await this.fetchImpl("https://api.xero.com/connections", {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Xero connections request failed: ${response.status} ${await response.text()}`)
    }

    return (await response.json()) as JsonRecord[]
  }

  async listInvoices(params?: Record<string, string | number | boolean | undefined>): Promise<XeroInvoice[]> {
    const result = await this.request<{ Invoices: XeroInvoice[] }>("/Invoices", params)
    return result.Invoices ?? []
  }

  async listPayments(params?: Record<string, string | number | boolean | undefined>): Promise<XeroPayment[]> {
    const result = await this.request<{ Payments: XeroPayment[] }>("/Payments", params)
    return result.Payments ?? []
  }

  async listContacts(params?: Record<string, string | number | boolean | undefined>): Promise<XeroContact[]> {
    const result = await this.request<{ Contacts: XeroContact[] }>("/Contacts", params)
    return result.Contacts ?? []
  }
}
