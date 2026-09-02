import "server-only"

import { randomBytes } from "node:crypto"
import { mkdir, unlink, writeFile } from "node:fs/promises"
import path from "node:path"

import {
  UPLOADS_URL_PREFIX,
  type AcceptedImageMime,
} from "@/constants/uploads"

/**
 * Image storage, on the local filesystem under `public/uploads`.
 *
 * Next.js serves everything in `public/` as a static asset, so a file written
 * to `public/uploads/x.png` is immediately readable at `/uploads/x.png` with
 * no route handler in between. That is the whole appeal, and also the whole
 * caveat:
 *
 *   - **The filesystem must be writable and durable.** On a serverless host
 *     (Vercel, Lambda) it is neither — the bundle is read-only and each
 *     invocation gets a fresh container, so an upload written on one request
 *     is gone by the next. This module is therefore the right thing for local
 *     development and a long-lived VPS/container, and the wrong thing for a
 *     serverless deploy. `docs/tech-stack.md` names Cloudflare R2 as the
 *     production target; swapping this module for an R2 client is a change to
 *     these two functions and nothing else, because nothing above the service
 *     layer knows where a URL points.
 *   - **Files are not in git.** `.gitignore` keeps `public/uploads/*`, so a
 *     fresh clone has categories whose `imageUrl` points at nothing.
 *
 * Only the service layer should import this — same rule as `lib/db.ts`.
 */

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads")

/**
 * Extension by *sniffed* type, never by the uploaded filename.
 *
 * `file.name` is attacker-controlled: it can carry `../`, a second extension
 * (`x.png.html`), or a null byte. Deriving the extension from content instead
 * means the stored name is built entirely from values this module chose.
 */
const EXTENSION: Record<AcceptedImageMime, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
}

/**
 * Identify an image by its magic bytes.
 *
 * The browser-supplied `file.type` is a claim, not a fact — it is trivially
 * spoofed on a direct POST to the Server Action. Since these files are served
 * back as static assets, the guarantee worth having is that what lands in
 * `public/` really is the image format its extension advertises.
 */
function sniffImageType(bytes: Uint8Array): AcceptedImageMime | null {
  const magic = (...signature: number[]) =>
    signature.every((byte, index) => bytes[index] === byte)

  const ascii = (offset: number, text: string) =>
    [...text].every((char, index) => bytes[offset + index] === char.charCodeAt(0))

  if (magic(0xff, 0xd8, 0xff)) return "image/jpeg"
  if (magic(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "image/png"
  // RIFF container, "WEBP" at byte 8.
  if (ascii(0, "RIFF") && ascii(8, "WEBP")) return "image/webp"
  // ISO-BMFF: "ftyp" box at byte 4, brand at byte 8.
  if (ascii(4, "ftyp") && (ascii(8, "avif") || ascii(8, "avis"))) return "image/avif"

  return null
}

/** Raised when the bytes are not one of the four formats above. */
export class UnsupportedImageError extends Error {
  constructor() {
    super("Uploaded bytes are not a JPEG, PNG, WebP or AVIF image.")
    this.name = "UnsupportedImageError"
  }
}

/**
 * Write an uploaded image and return the public URL to store on the row.
 *
 * Throws `UnsupportedImageError` when the content does not match a supported
 * format — callers in the service layer translate that into a field error.
 */
export async function saveImage(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer())

  const type = sniffImageType(bytes)
  if (!type) throw new UnsupportedImageError()

  await mkdir(UPLOADS_DIR, { recursive: true })

  // Random, not slugified-from-the-name: two admins uploading `rose.jpg` must
  // not overwrite each other, and the name must not be guessable enough to
  // probe. The timestamp prefix only keeps a directory listing chronological.
  const filename = `${Date.now().toString(36)}-${randomBytes(8).toString("hex")}.${EXTENSION[type]}`

  await writeFile(path.join(UPLOADS_DIR, filename), bytes)

  return `${UPLOADS_URL_PREFIX}/${filename}`
}

/**
 * Delete a previously stored image. Never throws.
 *
 * Cleanup is best-effort on purpose: the row is already correct by the time
 * this runs, and failing a successful category update because a stale JPEG
 * could not be unlinked would be the wrong trade. A leaked file costs disk;
 * a failed update costs the admin their work.
 *
 * Anything that is not one of *our* URLs is ignored, so a hand-edited
 * `imageUrl` of `/etc/passwd` or `../../.env` deletes nothing.
 */
export async function deleteImage(url: string | null | undefined): Promise<void> {
  if (!url?.startsWith(`${UPLOADS_URL_PREFIX}/`)) return

  // `basename` collapses any traversal the string still contains.
  const target = path.resolve(UPLOADS_DIR, path.basename(url))
  if (path.dirname(target) !== path.resolve(UPLOADS_DIR)) return

  try {
    await unlink(target)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      console.error("[uploads] could not delete", url, error)
    }
  }
}
