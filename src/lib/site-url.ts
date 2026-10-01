import "server-only"

import { headers } from "next/headers"

/**
 * The site's absolute origin — `https://example.com`, no trailing slash — for
 * the few places that must print an absolute URL (JSON-LD structured data).
 *
 * `NEXT_PUBLIC_SITE_URL` wins when set, and should be set in production: it
 * is the canonical domain, independent of whichever host a request came in
 * on. Without it, the origin is rebuilt from the request's own forwarded
 * host/proto headers — correct on Vercel and on `localhost`, and good enough
 * for the page that asked. Returns `null` when neither is available, and the
 * caller omits the URL fields rather than printing a relative one.
 */
export async function getSiteOrigin(): Promise<string | null> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (configured) return configured.replace(/\/+$/, "")

  const h = await headers()
  const host = h.get("x-forwarded-host") ?? h.get("host")
  if (!host) return null

  const proto =
    h.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1")
      ? "http"
      : "https")

  return `${proto}://${host}`
}
