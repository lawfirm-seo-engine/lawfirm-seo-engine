export const dynamic = "force-static"

export function GET() {
  const robots = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /private/
Disallow: /cases/_template
Disallow: /server-sitemap.xml

User-agent: Yeti
Allow: /

User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

Sitemap: https://daeonlawfintech.com/sitemap.xml
`

  return new Response(robots, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  })
}
