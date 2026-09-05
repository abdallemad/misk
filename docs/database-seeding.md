# Database Seeding

Mock data for development — enough of a catalog, a customer base and an order
history that every admin screen and every storefront page has something real
to render.

## Related documents

- [`folder-structure.md`](./folder-structure.md) — where `scripts/` and `prisma/` sit
- [`categories-feature.md`](./categories-feature.md) — `scripts/seed-categories.mts`, the canonical category seed
- [`admin-access-control.md`](./admin-access-control.md) — `scripts/grant-admin.mts`, and why roles are not seeded
- [`products-feature.md`](./products-feature.md) — the variant-shape and SKU rules this script mirrors
- [`customers-feature.md`](./customers-feature.md) — the console the customer + order rows are for

---

## Running it

```bash
npm run seed-dev
```

That is `node --env-file=.env --experimental-strip-types scripts/seed-dev.mts`
— the same launch shape as `grant-admin` and `seed-categories`: Node strips
the types itself, reads `.env` itself, and there is no extra dependency, no
build step and no `ts-node`. `.mts` rather than `.ts` so Node treats it as ESM
without guessing.

Output on a fresh database:

```text
Seeding development data → ep-….neon.tech

  categories   3
  ingredients  12
  products     14  (60 active variants)
  customers    18  (clerkId seed_dev_*)
  orders       29

Done. Database now holds 16 products, 74 variants, 20 users, 29 orders.
```

The "database now holds" line counts **everything**, not just what this run
wrote — the two-product gap above is real data that was already there. That is
the point of the next section.

---

## The two properties it is built around

### Idempotent

Run it once, run it ten times — the catalog is identical afterwards. Every row
the script owns is written through an `upsert` keyed on a **natural unique
column**, never on a generated id:

| Entity | Upsert key |
| --- | --- |
| `Category` | `slug` |
| `Ingredient` | `name` |
| `Product` | `slug` |
| `ProductVariant` | `sku` (generated — see below) |
| `User` | `clerkId` |
| `ProductIngredient` | `(productId, ingredientId)` |

`Order` is the one entity that cannot work this way — an order has no natural
key, and re-`upsert`ing one would need a deterministic id that then collides
with nothing a real checkout ever produces. So seeded orders are **deleted and
rebuilt** on every run, scoped to `where: { userId: { in: <seeded user ids> } }`.
`OrderItem` cascades from `Order`, so one `deleteMany` clears both. **A real
order placed by a real signed-in account is never in that set** and is never
touched.

The seam between "seeded" and "real" is the `clerkId` prefix `seed_dev_`. A
genuine Clerk id looks like `user_2abc…`; this prefix cannot collide with one,
and it is the handle the script uses to find its own users and their orders.

### Deterministic

Every "random" choice — how many variants a product has, which are low on
stock, how many orders a customer placed, what each order contains — comes from
a single seeded PRNG (`mulberry32`, seeded with a constant). So the seventh
customer has the same order history on every machine and every run. A bug that
only reproduces on one particular shape of data is reproducible here.

---

## What it will not do

### It refuses to run with `NODE_ENV=production`

```text
Refusing to run with NODE_ENV=production. …
```

The fake customers carry `clerkId`s no Clerk instance will ever issue, so they
can never sign in — but they would still land in the admin customers list,
inflate every dashboard count, and skew real revenue reporting. The refusal is
a hard exit before the first write.

It also prints the `DATABASE_URL` host on every run, so a misaimed `.env` is
visible in the first line of output rather than discovered later.

### It uploads no images

Seeded categories and products have `imageUrl = null` and no `ProductImage`
rows — a deliberate choice, not a limitation. Images now go to Cloudinary
(`lib/uploads.ts` → `lib/cloudinary.ts`, see
[`image-uploads.md`](./image-uploads.md)), so the old reason ("`public/uploads`
is not writable on serverless") is gone; the reasons that remain are that the
script would have to hit an external API on every run, ship image bytes in the
repo, and import a `server-only` module. The admin tables render a placeholder
tile for a missing image, and the `/store` storefront falls back to
`public/image.png` (`DEFAULT_PRODUCT_IMAGE`).

If you want pictures on the seeded catalog, add them through the admin console
after seeding — that path is real and tested.

### It does not grant anyone admin

Every seeded user is a plain `USER`. Admin is a Clerk-side fact
([`admin-access-control.md`](./admin-access-control.md)) and stays one:

```bash
npm run grant-admin -- you@example.com
```

---

## What it generates

### Catalog

- **3 categories** — `youth` / `women` / `men`, the same copy as
  `seed-categories.mts`. This script is a superset of that one; the two lists
  are kept in step by hand, with `seed-categories.mts` staying the canonical
  source.
- **12 ingredients** — a believable raw-material list (medical ethanol, oud
  grades, Taïf rose, white musk, …), each with the one-line description the
  "Quality & Ingredients" panel wants.
- **14 products** — 10 `ALCOHOL_BASED` and 4 `RAW_OIL`, spread across the three
  categories, two of them `isActive: false` so the "hidden" state has a row.
  Each links 1–4 ingredients with a `note`.
- **Variants** — every alcohol product gets the full 3 sizes × 2 styles grid
  (6 rows); every raw-oil product gets 3 weights. Prices scale from a per-
  product base by size / style / weight multipliers and round to the nearest
  10 EGP so the list reads like a real price sheet. Stock is drawn from a set
  that includes `0` and `2`, so the low-stock dashboard tile and the stock
  badges have something to show. Roughly one variant in twelve on an active
  product is retired.

The SKU is **generated, not stored in the seed data** — `MISK-<SLUG>-<SIZE>-<STYLE>`
for alcohol, `MISK-<SLUG>-<WEIGHT>` for raw oil — a trimmed echo of
`mintSkus()` in `product.service.ts`. It doubles as the variant's upsert key,
which is what makes the variant grid stable across runs.

### Customers and orders

- **18 users** with Arabic display names, `@example.com` emails, some with a
  phone, `clerkId` `seed_dev_01` … `seed_dev_18`. Sign-up dates are spread
  across the last ~10 months.
- **~29 orders** — each seeded user gets 0–5, weighted toward "has ordered a
  couple of times". Every order has 1–3 line items pointing at real active
  variants, `unitPrice` snapshotted from the variant, `totalPrice` summed from
  the lines, a `createdAt` within the last 120 days, a status weighted toward
  the resolved end (`DELIVERED` most common, a few `PENDING` / `CONFIRMED` /
  `IN_PRODUCTION` so the "open orders" count is non-zero, one in ~twenty
  `CANCELLED`), and an **Egyptian shipping-address snapshot** on the
  `Order.shipping*` columns (name + phone from the customer, and a
  governorate / city / center / street / building each picked from a fixed
  list) — the same shape checkout writes, so
  [`orders-feature.md`](./orders-feature.md)'s detail page has an address to
  render.

Cancelled orders are excluded from a customer's lifetime-value figure, which
matches how [`customers-feature.md`](./customers-feature.md) computes it.

---

## Resetting

There is no `--reset` flag. To start from an empty database:

```bash
npx prisma db push --force-reset   # drops and recreates every table
npm run seed-dev
```

`--force-reset` is destructive and unguarded — it is a local-development
command and nothing else. On a database you care about, take a migration
instead.

---

## Extending it

The source data is a handful of arrays at the top of
[`scripts/seed-dev.mts`](../scripts/seed-dev.mts): `CATEGORIES`,
`INGREDIENTS`, `PRODUCTS`, `CUSTOMERS`, plus `SHIPPING_AREAS` (governorate +
city pairs), `CENTERS` and `STREETS` for order addresses. The governorates in
`SHIPPING_AREAS` are a subset of `EGYPT_GOVERNORATES`
(`src/constants/egypt.ts`), written out again by hand rather than imported —
this script runs through plain Node type-stripping with no bundler, so it has
no `@/` path-alias resolution. Add an entry and re-run; the upserts make it
additive. The
only rule is that a `PRODUCT` entry's `ingredients[].name` must match an
`INGREDIENTS` entry exactly, or the link is silently skipped.

After a **schema change** (like the `Order.shipping*` columns this script now
fills), run `npx prisma db push` then `npx prisma generate` before seeding —
and stop the dev server first, or `generate` cannot replace the query-engine
DLL it has open.

Changing the PRNG seed (`makeRng(20260903)`) reshuffles every stock level and
order history without touching the catalog's shape.
