import { headers } from "next/headers"
import { sites } from "@/config/sites"

export async function getCurrentSite() {
  const headersList = await headers()
  const host = headersList.get("host") || "localhost:3000"

  const site = Object.values(sites).find((item) =>
    (item.hostnames as readonly string[]).includes(host)
  )

  return site || sites.daeonlawfintech
}