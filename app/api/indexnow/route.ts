import { submitIndexNow } from "@/lib/indexnow"

export async function POST(req: Request) {
  const { url } = await req.json()

  if (!url) {
    return Response.json({ error: "Missing URL" }, { status: 400 })
  }

  await submitIndexNow(url)

  return Response.json({ success: true })
}