import "server-only"

import { createHash } from "node:crypto"

/**
 * Cloudinary configuration, plus the two low-level calls `lib/uploads.ts` is
 * built on: a signed upload and a signed destroy.
 *
 * **Signed, server-side, and dependency-free** — a direct `fetch` to
 * Cloudinary's REST API rather than the `cloudinary` npm SDK. The SDK pulls in
 * a large transitive tree and assumes a Node runtime; the REST call is a few
 * dozen lines, runs anywhere `fetch` and `node:crypto` do, and keeps this
 * module the same shape as the local-disk writer it replaced — "swapping the
 * storage backend is a change to these functions and nothing else"
 * (docs/products-feature.md, docs/categories-feature.md). See
 * docs/image-uploads.md.
 *
 * Credentials come from `.env`. Two of the three keys there are misspelled
 * (`COULDINARY_NAME`, `CLOUDINARY_SECRETE`), so the canonical spellings are
 * accepted as a fallback and either set works.
 *
 * `server-only`: this module holds the API secret and must never be pulled
 * into a Client Component — same rule as `lib/db.ts`.
 */

const CLOUD_NAME =
  process.env.CLOUDINARY_CLOUD_NAME ?? process.env.COULDINARY_NAME ?? ""
const API_KEY = process.env.CLOUDINARY_API_KEY ?? ""
const API_SECRET =
  process.env.CLOUDINARY_API_SECRET ?? process.env.CLOUDINARY_SECRETE ?? ""

/** Every Misk asset is uploaded under this folder, so the media library stays tidy. */
export const CLOUDINARY_FOLDER = "misk"

/** The host every stored URL points at — used to recognise our own URLs on delete. */
export const CLOUDINARY_HOST = "res.cloudinary.com"

export function isCloudinaryConfigured(): boolean {
  return Boolean(CLOUD_NAME && API_KEY && API_SECRET)
}

/** The account's cloud name, for `next.config` / diagnostics. */
export function cloudinaryCloudName(): string {
  return CLOUD_NAME
}

/** Raised when a call to Cloudinary fails for a reason that is not the bytes. */
export class CloudinaryError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "CloudinaryError"
  }
}

/**
 * Cloudinary's request signature.
 *
 * Every parameter that will be sent *except* `file`, `api_key` and
 * `resource_type`, sorted by key, joined `key=value` with `&`, the API secret
 * appended, then SHA-1 hex.
 */
function sign(params: Record<string, string | number>): string {
  const payload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&")

  return createHash("sha1")
    .update(payload + API_SECRET)
    .digest("hex")
}

/**
 * Upload bytes and return the stored URL plus Cloudinary's `publicId`.
 *
 * We never pass a `public_id`, so Cloudinary mints a random one — nothing
 * attacker-controlled reaches the asset name, the same property the local
 * writer got from a random filename.
 */
export async function cloudinaryUpload(
  bytes: ArrayBuffer,
  contentType: string
): Promise<{ secureUrl: string; publicId: string }> {
  if (!isCloudinaryConfigured()) {
    throw new CloudinaryError(
      "Cloudinary credentials are missing from the environment."
    )
  }

  const timestamp = Math.floor(Date.now() / 1000)
  const signature = sign({ folder: CLOUDINARY_FOLDER, timestamp })

  const form = new FormData()
  form.append("file", new Blob([bytes], { type: contentType }))
  form.append("api_key", API_KEY)
  form.append("timestamp", String(timestamp))
  form.append("folder", CLOUDINARY_FOLDER)
  form.append("signature", signature)

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: form }
  )

  const body = (await response.json().catch(() => null)) as {
    secure_url?: string
    public_id?: string
    error?: { message?: string }
  } | null

  if (!response.ok || !body?.secure_url || !body.public_id) {
    throw new CloudinaryError(
      body?.error?.message ?? `Cloudinary upload failed (${response.status}).`
    )
  }

  return { secureUrl: body.secure_url, publicId: body.public_id }
}

/**
 * Delete one asset by `publicId`. Never throws — cleanup is best-effort, the
 * same contract `deleteImage` has always had: the row is already correct by
 * the time this runs, and failing a good save because a stale asset could not
 * be removed is the wrong trade.
 */
export async function cloudinaryDestroy(publicId: string): Promise<void> {
  if (!isCloudinaryConfigured()) return

  try {
    const timestamp = Math.floor(Date.now() / 1000)
    const signature = sign({ public_id: publicId, timestamp })

    const form = new FormData()
    form.append("public_id", publicId)
    form.append("api_key", API_KEY)
    form.append("timestamp", String(timestamp))
    form.append("signature", signature)

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/destroy`,
      { method: "POST", body: form }
    )

    if (!response.ok) {
      console.error("[cloudinary] destroy failed", publicId, response.status)
    }
  } catch (error) {
    console.error("[cloudinary] destroy threw", publicId, error)
  }
}

/**
 * Recover the `publicId` from a stored Cloudinary URL, or `null` when the URL
 * is not one of ours (a hand-edited value, or a legacy `/uploads/...` path
 * from before this module used Cloudinary).
 *
 * A secure URL looks like
 * `https://res.cloudinary.com/<cloud>/image/upload/v1699999999/misk/abc123.jpg`
 * — the id is everything after `/image/upload/<version>/`, minus the extension.
 */
export function publicIdFromUrl(url: string): string | null {
  if (!CLOUD_NAME) return null

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }

  if (parsed.hostname !== CLOUDINARY_HOST) return null
  if (!parsed.pathname.startsWith(`/${CLOUD_NAME}/`)) return null

  const marker = "/image/upload/"
  const at = parsed.pathname.indexOf(marker)
  if (at === -1) return null

  const rest = parsed.pathname
    .slice(at + marker.length)
    .replace(/^v\d+\//, "") // strip the version segment
    .replace(/\.[^./]+$/, "") // strip the extension

  return rest || null
}
