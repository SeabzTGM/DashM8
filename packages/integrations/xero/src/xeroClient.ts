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
  fetchImpl?: typeof fetch
}

export type XeroContact = {
  ContactID: string
  Name?: string
  EmailAddress?: string
}

export type XeroInvoice = {
  InvoiceID: string
  Contact?: XeroContact
  InvoiceNumber?: string
  Reference?: string
  Date?: string
  DueDate?: string
  Status?: string
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

function encodeBasicAuth(clientId: string, clientSecret: string): string {
  return Buffer.from(`${clientId}:${clientSecret}`).toString("base64")
}

export class XeroClient {
  private readonly clientId: string
  private readonly clientSecret: string
  private readonly redirectUri: string
  private readonly fetchImpl: typeof fetch
  private tokenSet?: XeroTokenSet

  constructor(config: XeroConfig) {
    this.clientId = config.clientId
    this.clientSecret = config.clientSecret
    this.redirectUri = config.redirectUri
    this.fetchImpl = config.fetchImpl ?? fetch
    this.tokenSet = config.tokenSet
  }

  setTokenSet(tokenSet: XeroTokenSet) {
    this.tokenSet = tokenSet
  }

  getAuthorizationUrl(state: string): string {
    const url = new URL("https://login.xero.com/identity/connect/authorize")
    url.searchParams.set("response_type", "code")
    url.searchParams.set("client_id", this.clientId)
    url.searchParams.set("redirect_uri", this.redirectUri)
    url.searchParams.set("scope", "openid profile email accounting.transactions offline_access")
    url.searchParams.set("state", state)
    return url.toString()
  }

  async exchangeCodeForToken(code: string): Promise<XeroTokenSet> {
    const response = await this.fetchImpl("https://identity.xero.com/connect/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${encodeBasicAuth(this.clientId, this.clientSecret)}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: this.redirectUri
      })
    })

    if (!response.ok) {
      throw new Error(`Xero token exchange failed: ${response.status} ${await response.text()}`)
    }

    const json = await response.json() as { access_token: string; refresh_token?: string; expires_in: number }
    const tokenSet = {
      accessToken: json.access_token,
      refreshToken: json.refresh_token,
      expiresAt: Date.now() + json.expires_in * 1000,
      tenantId: this.tokenSet?.tenantId ?? ""
    }
    this.tokenSet = tokenSet
    return tokenSet
  }

  private async ensureAccessToken() {
    if (!this.tokenSet?.accessToken) throw new Error("Missing Xero access token")
    return this.tokenSet.accessToken
  }

  private async request<T>(path: string): Promise<T> {
    const accessToken = await this.ensureAccessToken()
    if (!this.tokenSet?.tenantId) throw new Error("Missing Xero tenantId")

    const response = await this.fetchImpl(`https://api.xero.com/api.xro/2.0${path}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
        "Xero-tenant-id": this.tokenSet.tenantId
      }
    })

    if (!response.ok) {
      throw new Error(`Xero request failed: ${response.status} ${await response.text()}`)
    }

    return await response.json() as T
  }

  async listContacts() {
    const result = await this.request<{ Contacts: XeroContact[] }>("/Contacts")
    return result.Contacts ?? []
  }

  async listInvoices() {
    const result = await this.request<{ Invoices: XeroInvoice[] }>("/Invoices")
    return result.Invoices ?? []
  }

  async listPayments() {
    const result = await this.request<{ Payments: XeroPayment[] }>("/Payments")
    return result.Payments ?? []
  }
}
