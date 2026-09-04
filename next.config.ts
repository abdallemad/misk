import type { NextConfig } from "next";

import { MAX_GALLERY_IMAGES, MAX_IMAGE_BYTES } from "./src/constants/uploads";

/**
 * A Server Action's request body is capped at **1 MB by default**, and every
 * upload in this application goes through one — there are no upload route
 * handlers (see `docs/folder-structure.md`).
 *
 * That default silently contradicts the app's own limits: the category form
 * offers 4 MB per image and the product gallery offers eight of them, so any
 * upload past the first megabyte was rejected by the framework before the
 * action ever ran — which surfaces as a failed submit with no field error,
 * because the code that would have produced one never executed.
 *
 * So the ceiling is computed from the same constants the form and the Zod
 * schema read, rather than written out as a number that can drift from them.
 * The 1 MB of slack covers the text fields and the `multipart/form-data`
 * boundaries and part headers, which the docs put at 10–20 KB for a typical
 * upload; a whole megabyte is generous on purpose, because being a little
 * over here costs nothing and being under rejects a legitimate save.
 *
 * **This is a real resource decision, not a formality.** The whole body is
 * buffered before the action runs, so this is also the amount of memory one
 * malicious POST can make the server hold. It is the right trade for an
 * admin-only endpoint that re-checks `isAdmin()` (see
 * `docs/admin-access-control.md`) and the wrong one for a public endpoint —
 * if uploads ever move to a public surface, they should go straight to R2
 * with a presigned URL and stop passing through the server at all.
 */
const UPLOAD_BODY_LIMIT = MAX_IMAGE_BYTES * MAX_GALLERY_IMAGES + 1024 * 1024;

/**
 * Product and category images live on Cloudinary now (see
 * `docs/image-uploads.md`), so `next/image` has to be told that
 * `res.cloudinary.com` is an allowed source. Scoped to this account's cloud —
 * `/<cloud-name>/**` — so it cannot be pointed at an arbitrary Cloudinary
 * account. The cloud name is read from the same env var `lib/cloudinary.ts`
 * reads; `.env` currently spells it `COULDINARY_NAME`.
 */
const CLOUDINARY_CLOUD_NAME =
  process.env.CLOUDINARY_CLOUD_NAME ?? process.env.COULDINARY_NAME ?? "";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: UPLOAD_BODY_LIMIT,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: CLOUDINARY_CLOUD_NAME ? `/${CLOUDINARY_CLOUD_NAME}/**` : "/**",
      },
    ],
  },
};

export default nextConfig;
