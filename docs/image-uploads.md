# Image Uploads

Where a product photo or a category picture goes when an admin picks a file,
and where the storefront reads it back from.

## Related documents

- [`folder-structure.md`](./folder-structure.md) — the layer architecture; `lib/` as the home for storage clients
- [`categories-feature.md`](./categories-feature.md) — the category image field, and the serverless caveat this change resolves
- [`products-feature.md`](./products-feature.md) — the eight-photo gallery, the 1 MB Server-Action body cliff
- [`store-feature.md`](./store-feature.md) — the storefront that renders these URLs, and the default image
- [`database-seeding.md`](./database-seeding.md) — why seeded rows still carry no image

---

## The move: `public/uploads` → Cloudinary

`lib/uploads.ts` used to write bytes to `public/uploads/<name>` and store a
`/uploads/<name>` URL on the row. Both feature docs flagged the same problem:

> **`public/uploads` is the right answer for local development and a
> long-lived VPS, and the wrong one for a serverless deploy.** On Vercel or
> Lambda the bundle is read-only and each invocation gets a fresh container,
> so an upload written on one request is gone by the next.

That day arrived. `lib/uploads.ts` now uploads to **Cloudinary** and stores
the CDN `secure_url`. The bytes leave the server on the same request that
received them; nothing is written to the filesystem; a redeploy keeps every
image.

### What did *not* change

The public surface of `lib/uploads.ts`:

```ts
saveImage(file: File): Promise<string>          // → the URL to store on the row
deleteImage(url: string | null | undefined): Promise<void>   // never throws
UnsupportedImageError                            // thrown on non-image bytes
```

`category.service.ts` and `product.service.ts` are **untouched** — they still
call `saveImage` / `deleteImage`, still get a URL, still translate
`UnsupportedImageError` into a field error. The forms, the schemas and the
Zod validation are untouched too. This is the layering paying out exactly the
dividend [`categories-feature.md`](./categories-feature.md) promised:
*"swapping this module for an R2 client is a change to these two functions and
nothing else, because nothing above the service layer knows where a URL
points."* Cloudinary instead of R2, same seam.

---

## The layers

```text
  components/admin/{products,categories}/*-field.tsx   pick + preview
        │  (multipart FormData, through the Server Action body — see the cap below)
        ↓
  actions/{product,category}/save-*.ts     "use server" — isAdmin(), parse, delegate
        │
        ↓
  services/{product,category}.service.ts   storeGallery() / storeImage()
        │
        ↓
  lib/uploads.ts        sniff magic bytes → UnsupportedImageError, or…
        │
        ↓
  lib/cloudinary.ts     sign → POST /image/upload  ·  sign → POST /image/destroy
        │
        ↓
  api.cloudinary.com/v1_1/<cloud>/…
```

`lib/cloudinary.ts` is the new module. It is the "Cloudflare R2 Configuration"
slot [`folder-structure.md`](./folder-structure.md) reserved in `lib/` — a
storage client and nothing else — except the provider turned out to be
Cloudinary. Both it and `lib/uploads.ts` are `server-only`.

---

## Why a signed REST call, not the `cloudinary` SDK

`lib/cloudinary.ts` is a direct `fetch` to Cloudinary's upload API with a
hand-built signature. The `cloudinary` npm package would also work; it is not
used, for the reasons this codebase keeps choosing against a dependency
(`react-hook-form`, `@tanstack/react-query`, `ts-node` — all declined
elsewhere and documented):

- The SDK carries a large transitive tree and assumes a Node runtime. The REST
  call is a few dozen lines and runs anywhere `fetch` and `node:crypto` do.
- The signature is not complicated: every parameter that will be sent **except
  `file`, `api_key` and `resource_type`**, sorted by key, joined `k=v` with
  `&`, the API secret appended, then SHA-1 hex. That is the whole of
  `sign()`.
- Keeping the module small keeps the "swap the backend, change nothing above"
  property honest — a fat SDK in `lib/` is harder to argue is "just the seam".

### Signed, server-side — not an unsigned upload preset

The other way to talk to Cloudinary is an **unsigned** upload from the
browser, with a preset configured in the dashboard. Rejected: it would move
the upload off the server and out from behind the `isAdmin()` check, and it
needs dashboard configuration that is not in the repo. Signed server uploads
keep the existing trust boundary — every write still goes UI → Server Action
(`isAdmin()`) → service → here.

---

## Credentials

From `.env`. **Two of the three keys are misspelled there**, so
`lib/cloudinary.ts` and `next.config.ts` accept the canonical spelling as a
fallback and either set works:

| Purpose | `.env` (as found) | Canonical fallback |
| --- | --- | --- |
| Cloud name | `COULDINARY_NAME` | `CLOUDINARY_CLOUD_NAME` |
| API key | `CLOUDINARY_API_KEY` | — |
| API secret | `CLOUDINARY_SECRETE` | `CLOUDINARY_API_SECRET` |

`isCloudinaryConfigured()` returns `false` when any is missing; `saveImage`
then throws, and the service surfaces the generic "could not save the image"
field error rather than a stack trace.

Every asset is uploaded under the `misk/` folder, and Cloudinary mints a
random `public_id` — we never send one, so nothing attacker-controlled reaches
the asset name (the same property the old code got from a random filename).

---

## Deleting

`deleteImage(url)` recovers the `public_id` from a stored URL and calls
`/image/destroy`. A secure URL looks like:

```text
https://res.cloudinary.com/<cloud>/image/upload/v1699999999/misk/abc123.jpg
                                                └ version ┘ └ public_id ┘└ext┘
```

`publicIdFromUrl()` strips the origin, the `/image/upload/` marker, the
`v<digits>/` version segment and the extension. Anything that is **not** one
of our own Cloudinary URLs — a hand-edited value, or a legacy `/uploads/...`
path from before this change — returns `null` and `deleteImage` does nothing.
That mirrors the old guard ("ignores anything that is not one of our own
`/uploads/` URLs") and means a database still holding old local paths does not
throw; those files just stop being cleaned up (they were dev-only and
git-ignored anyway).

`deleteImage` still **never throws** — cleanup is best-effort, because the row
is already correct by the time it runs and failing a good save over a stale
asset is the wrong trade. The service's ordering rules
([`products-feature.md`](./products-feature.md), "Ordering, because failures
are asymmetric") are unchanged: new files first, then the rows, then unlink
the old ones.

---

## `next.config.ts` — two upload-related settings now

### `images.remotePatterns`

`next/image` refuses a remote `src` unless its host is allow-listed. Product
and category images are now `https://res.cloudinary.com/...`, so:

```ts
images: {
  remotePatterns: [
    { protocol: "https", hostname: "res.cloudinary.com", pathname: `/${CLOUD_NAME}/**` },
  ],
}
```

Scoped to `/<cloud-name>/**` so it cannot be pointed at an arbitrary
Cloudinary account. The cloud name is read from the same env var
`lib/cloudinary.ts` reads.

### `serverActions.bodySizeLimit` — still there, still needed

The computed 1 MB-plus-gallery cap is **unchanged**. The upload still travels
through the Server Action as `multipart/form-data` — Cloudinary is called from
*inside* the service, not from the browser — so the whole body is still
buffered before the action runs, and the reasoning in
[`products-feature.md`](./products-feature.md) ("The 1 MB cliff, and why the
limit is computed") still applies verbatim. Moving the upload to a browser →
Cloudinary direct POST would remove this constraint; that is a larger change
and is not done here.

---

## The default image

A product with no photo of its own falls back to **`public/image.png`** — a
real file, referenced as `DEFAULT_PRODUCT_IMAGE` in `constants/uploads.ts`.
Because it is a local asset it needs no `remotePatterns` entry and optimises
like any other file in `public/`.

Where the fallback is applied:

| Surface | Behaviour |
| --- | --- |
| Storefront `/store` card | Shows `image.png` when `coverImageUrl` is `null`, so the grid never has a hole in it. See [`store-feature.md`](./store-feature.md). |
| Admin products table | **Unchanged** — still a placeholder icon. An admin needs to see at a glance which perfumes are missing a photo; a stand-in image would hide that. |
| Admin gallery / image fields | **Unchanged** — an empty picker shows an empty state, not a fake image. |

Swap `public/image.png` to change the placeholder; nothing else moves.

---

## Testing it by hand

The admin forms are behind Clerk + the admin role, so the fastest check of the
credentials and the signature is a direct one:

1. In the admin console, edit a product, add a photo, save. The gallery tile
   should render (proof the `remotePatterns` entry matches).
2. Open the row in Cloudinary's Media Library — the asset is under `misk/`.
3. Remove the photo and save again; the asset disappears from `misk/`
   (proof `deleteImage` → `publicIdFromUrl` → destroy works).

A seeded catalogue (`npm run seed-dev`) carries **no images** — every card on
`/store` shows `image.png` until photos are added through the console. That is
unchanged and is [`database-seeding.md`](./database-seeding.md)'s call, not a
regression.

---

## Extending this

**Responsive / transformed images.** Cloudinary can resize and reformat on
the fly via URL segments (`.../image/upload/w_600,f_auto,q_auto/...`). A
`next/image` custom `loader` that injects those would cut bytes further.
Nothing stores anything but the base `secure_url` today, so this is additive.

**Browser → Cloudinary direct upload.** Sign an upload on the server, hand the
browser a short-lived signature, POST the file straight to Cloudinary. Removes
the `bodySizeLimit` constraint and the double hop. It is a real feature — a
new Server Action that returns a signature, a client uploader, and a decision
about orphaned assets when the form is then abandoned — not a refactor of this
module.

**Moving off Cloudinary.** Rewrite `lib/cloudinary.ts` (or replace it and
re-point `lib/uploads.ts`). Same seam as last time; nothing above the service
layer knows the provider's name.
