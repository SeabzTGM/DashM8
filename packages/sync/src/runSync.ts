import "dotenv/config"
import { prisma } from "@dashm8/db"
import { ServiceM8Client } from "@dashm8/integrations-servicem8"
import { XeroClient } from "@dashm8/integrations-xero"
import { SyncEngine } from "./syncEngine"

async function main() {
  const servicem8 = new ServiceM8Client({
    apiKey: process.env.SERVICEM8_API_KEY ?? ""
  })

  const xero = new XeroClient({
    clientId: process.env.XERO_CLIENT_ID ?? "",
    clientSecret: process.env.XERO_CLIENT_SECRET ?? "",
    redirectUri: process.env.XERO_REDIRECT_URI ?? "",
    tokenSet: {
      accessToken: process.env.XERO_ACCESS_TOKEN ?? "",
      refreshToken: process.env.XERO_REFRESH_TOKEN ?? undefined,
      tenantId: process.env.XERO_TENANT_ID ?? ""
    }
  })

  const engine = new SyncEngine(prisma, servicem8, xero)
  await engine.runFullSync()
  console.log("Sync complete")
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
}).finally(async () => {
  await prisma.$disconnect()
})
