import "server-only"

import {
  cloudinaryDestroy,
  cloudinaryUpload,
  publicIdFromUrl,
} from "@/lib/cloudinary"
import type { AcceptedImageMime } from "@/constants/uploads"

/**
 * Image storage — now **Cloudinary**, via `lib/cloudinary.ts`.
 *
 * This module used to write files under `public/uploads`, which
 * `docs/categories-feature.md` flagged at length as "the right answer for
 * local development and a long-lived VPS, and the wrong one for a serverless
 * deploy": the bundle is read-only there and every invocation gets a fresh
 * container, so an upload written on one request was gone by the next.
 * Cloudinary removes that caveat — the bytes leave the server on the same
 * request that received them, and the stored value is a CDN URL that survives
 * a redeploy.
 *
 * **The public surface is unchanged**, which is the point of the layering:
 * `category.service.ts` and `product.service.ts` still call `saveImage` /
 * `deleteImage`, still get a URL to put on a row, and still translate
 * `UnsupportedImageError` into a field error. Nothing above this file knows
 * where a URL points. See docs/image-uploads.md.
 *
 * Still `server-only` — it reaches the API-secret path in `lib/cloudinary.ts`.
 */

/**
 * Identify an image by its magic bytes.
 *
 * The browser-supplied `file.type` is a claim, not a fact — it is trivially
 * spoofed on a direct POST to the Server Action. Sniffing the content means
 * the type we hand Cloudinary (and store) is the format the bytes actually
 * are, and an upload that is not an image at all is rejected here rather than
 * by the API.
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

/** Raised when the bytes are not one of the four supported formats. */
export class UnsupportedImageError extends Error {
  constructor() {
    super("Uploaded bytes are not a JPEG, PNG, WebP or AVIF image.")
    this.name = "UnsupportedImageError"
  }
}

/**
 * Upload an image to Cloudinary and return the URL to store on the row.
 *
 * Throws `UnsupportedImageError` when the content does not match a supported
 * format — callers in the service layer translate that into a field error —
 * and `CloudinaryError` when the API itself refuses, which the services log
 * and surface as a generic "could not save the image".
 */
export async function saveImage(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()

  const type = sniffImageType(new Uint8Array(buffer))
  if (!type) throw new UnsupportedImageError()

  const { secureUrl } = await cloudinaryUpload(buffer, type)
  return secureUrl
}

/**
 * Delete a previously stored image. Never throws.
 *
 * Anything that is not one of our own Cloudinary URLs is ignored — a
 * hand-edited `imageUrl`, or a `/uploads/...` path written before this module
 * moved to Cloudinary, deletes nothing.
 */
export async function deleteImage(
  url: string | null | undefined
): Promise<void> {
  if (!url) return

  const publicId = publicIdFromUrl(url)
  if (!publicId) return

  await cloudinaryDestroy(publicId)
}
