/**
 * Upload limits — the client-safe half of image handling.
 *
 * These live in `constants/` rather than beside the storage code in
 * `lib/uploads.ts` for one concrete reason: that module is `server-only`, and
 * the file input needs the same list to build its `accept` attribute and the
 * same ceiling to say "4 ميجابايت كحد أقصى" under the field. Importing the
 * storage module into a Client Component would fail the build.
 *
 * So the numbers live here and all three readers — the browser input, the Zod
 * schema, and the writer in `lib/uploads.ts` (which uploads to Cloudinary —
 * see docs/image-uploads.md) — agree by construction.
 */

/**
 * Shown wherever a product has no image of its own — the storefront catalog
 * card, mostly. A real file at `public/image.png`, so it needs no
 * `next.config` allow-listing and is optimised like any other local asset.
 * Swap that file to change the placeholder; nothing else has to move.
 */
export const DEFAULT_PRODUCT_IMAGE = "/image.png"

/** 4 MB. A category card image; anything larger is an unresized camera dump. */
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024

export const MAX_IMAGE_MB = Math.round(MAX_IMAGE_BYTES / (1024 * 1024))

/**
 * How many photos one perfume may carry.
 *
 * A ceiling rather than a guess: the storefront gallery is a carousel, and
 * past roughly this many the shopper stops swiping and the admin stops
 * curating. It is also the bound on how many files one Server Action call
 * has to buffer in memory before any of them reach disk.
 */
export const MAX_GALLERY_IMAGES = 8

export const ACCEPTED_IMAGE_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const

export type AcceptedImageMime = (typeof ACCEPTED_IMAGE_MIME)[number]

/** Value for an `<input type="file" accept>` — mirrors the list above. */
export const IMAGE_ACCEPT_ATTR = ACCEPTED_IMAGE_MIME.join(",")

/** What to call the supported formats in a sentence an admin reads. */
export const IMAGE_FORMATS_LABEL = "JPG أو PNG أو WebP أو AVIF"
