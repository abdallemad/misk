# Store Feature

`/store` — the public storefront catalogue. Browse perfumes by category,
search by name, narrow by product type, sort, and page through the result.

## Related documents

- [`folder-structure.md`](./folder-structure.md) — the layer architecture, and the list-page convention this reuses on the storefront
- [`admin-dashboard.md`](./admin-dashboard.md) — where the list-page convention (service shape, `useListNavigation`, `<Pagination>`) was first written down
- [`products-feature.md`](./products-feature.md) — the admin CRUD that fills this catalogue; the note there that predicted a separate storefront query
- [`categories-feature.md`](./categories-feature.md) — the segments the chips filter by
- [`image-uploads.md`](./image-uploads.md) — Cloudinary URLs, and the `image.png` fallback the cards use
- [`cart-feature.md`](./cart-feature.md) — **built** — `/cart` and Add to Cart, which this document's buy box and card actions call into
- [`misk_business_analysis.md`](./misk_business_analysis.md) — section 7, "category navigation: Youth / Women / Men"

---

## Routes

```text
/store            the catalogue  (?category= chip · ?q= search · ?type= filter · ?sort= · ?page= paging)
/store/[slug]     one perfume: gallery, variants + prices, ingredients, two (disabled) buy buttons
```

The catalogue is one page with all its state in the URL. There is **no
`/store/[category]` path segment** — the by-category view is a `?category=`
filter (see below). `/store/[slug]` *is* a real page; it is keyed by the
perfume's slug (a shareable URL, and the thing the admin typed for exactly
that reason).

Both are distinct from the still-unbuilt path-based storefront the
`folder-structure.md` "Related documents" list sketches as `catalog-feature.md`
/ `category-feature.md` / `product-page.md` under `/shop`. `ROUTES.store` and
`ROUTES.shop` are kept apart so the two can coexist; if they are ever unified,
`/shop` is the URL that wins.

> **On the folder name.** `app/store/` is a plain folder, not a `(shop)` route
> group — the URL genuinely is `/store`, so a group would only strip the
> segment and force it to be re-added. `app/store/layout.tsx` owns the
> storefront header and footer, which is the property a route group would have
> provided.

---

## "Render the products by the category"

The brief was *"render the products by the category and give a filtration and
search and pagination"*. Grouped-by-category sections and pagination pull in
opposite directions — a page that is both "all of Youth, then all of Women"
*and* "12 per page" cannot be either cleanly. So the by-category view is a
**filter, rendered as chips**:

- a chip row — «الكل» + one per active segment, each with its live count —
  sitting above the search/sort bar;
- selecting one sets `?category=<slug>`, and the page heading becomes that
  segment's name and its scent note (`categoryAccent(slug).note`);
- every card also carries its category as a coloured eyebrow, so the grid
  reads *by category* even when the filter is «الكل».

This is the same answer the admin products list gives ("filter by category",
not "a page per category"), and it keeps one mental model across the two
surfaces.

---

## The layers

```text
  app/store/
   ├── layout.tsx        Server Component — StoreHeader + StoreFooter
   ├── loading.tsx       skeleton — the catalogue query
   ├── page.tsx          Server Component — parses searchParams, calls the service
   └── [slug]/
        ├── loading.tsx  skeleton — the product query
        └── page.tsx     Server Component — getStoreProduct + generateMetadata
        │
        ↓
  components/store/
   ├── store-chrome.tsx           Server — header + footer
   ├── store-category-nav.tsx     Server — the chips; each is a plain <Link>
   ├── store-filters.tsx          Client — search + type + sort → useListNavigation
   ├── store-product-grid.tsx     Server — the grid, or the empty state
   ├── store-product-card.tsx     Server — one perfume in the grid, a <Link>
   ├── store-product-gallery.tsx  Client — main image + thumbnail swap
   ├── add-to-cart-form.tsx       Client — the product page's <select> + buy
   └── store-card-actions.tsx     Client — the catalogue card's quick-add
        │
        ↓
  services/catalog.service.ts  listCatalog() · listCatalogCategories() · getStoreProduct()
        │
        └──→ lib/db.ts         Prisma
```

`add-to-cart-form.tsx` and `store-card-actions.tsx` are the two places a
shopper adds to the cart — see [`cart-feature.md`](./cart-feature.md), which
also documents why the *reads* below stay in this feature's own service while
those two components call into `actions/cart/`.

Reads skip the action layer — the same documented exception the whole admin
console takes for its lists: the grid *is* the page, it is read-only, and it
belongs in the first paint. There is nothing here that writes, so there is no
Server Action in this feature at all.

### A separate service, because the admin's answers a different question

`catalog.service.ts` is new, and it exists because `product.service.ts` said
it would:

> *The storefront will sort by something else entirely, which is fine — that
> is a different query in a different module.*

`product.service.listProducts` is a work queue for an admin — it orders by
`updatedAt`, shows hidden perfumes, and carries per-row order counts and
delete guards. A shopper asks *"what can I buy, filed how, sorted how I
chose"*. Reusing `listProducts` would have meant a pile of `if (forStorefront)`
branches through a function that is already the most rule-dense in the repo.
Two small queries in two modules beat one big one with a mode flag.

Both modules obey the rule that only the service layer touches Prisma.

---

## The service

### `listCatalog({ search, categorySlug, productType, sort, page })`

Returns `{ products, total, page, pageCount }` — the shape every list in this
codebase returns.

**Only sellable perfumes.** The `where` is `isActive: true`, under a category
that is `isActive: true`, with `variants: { some: { isActive: true } }`. A
shopper is never shown a hidden perfume, a perfume under a retired segment, or
one with no purchasable option. `search` matches `name` **or** `description`,
case-insensitively; `productType` narrows to one line.

**One query, then sort and page in memory.** Unlike the admin lists — which
count and take one page in a `$transaction` — this pulls *every* match in a
single `findMany` and does the price sort, the total and the slice in
JavaScript. That is a deliberate call:

- The catalogue is **bounded**. A perfume house carries dozens of products,
  not thousands. The whole matching set is a few dozen small rows.
- **Price sort needs it.** A card's price is `min(active variant price)`.
  Prisma cannot `orderBy` a related-aggregate like that, so a SQL price sort
  would be a `$queryRaw` or a second round trip. In memory it is one line.
- The "header total and rows cannot disagree" guarantee the `$transaction`
  gives the admin lists is **free here** — total and rows come off the *same*
  query, so there is nothing to race.
- It is the same in-memory-aggregate trade `product.service.listProducts`
  ("computed here instead of in SQL … the whole page is already in memory")
  and `customer.service.listCustomers` already make.

If the catalogue ever grows past a few hundred perfumes, this is the one
function to move the sort and the paging back into SQL. `STORE_PAGE_SIZE` (12
— divides into 2 / 3 / 4 columns) lives next to it, the same as
`PRODUCTS_PAGE_SIZE` and friends.

### `listCatalogCategories()`

The chips: `isActive` segments that have at least one sellable perfume, in
storefront order (`position` then `name`), each with a filtered `_count`. A
segment whose every perfume is hidden or variant-less is left out — a chip
that leads to an empty grid is a dead end.

### `getStoreProduct(slug)`

One perfume for `/store/[slug]`, or `null` (→ `notFound()`). The **same
sellability gate** as `listCatalog` — the perfume and its category both
`isActive`, at least one active variant — so a stale link to a retired
perfume is a 404, not a broken page. Returns the gallery URLs in order, the
active variants flattened to `{ label, oilGrade, price, stock }` (label from
`formatVariantLabel`, so "100ml · عبوة فاخرة" or "8g"), and the ingredient
links flattened to `{ name, note }`.

Wrapped in **React's `cache()`** so `generateMetadata` and the page component
share one query per request. Prisma calls are not request-deduplicated the way
`fetch` is, and without this the page would hit the database twice for the same
row.

### `StoreSort` lives in `constants/`, not the service

`catalog.service.ts` is `server-only` (it imports Prisma). `store-filters.tsx`
is a Client Component and needs the sort list to build its `<select>`. So
`StoreSort` / `STORE_SORTS` / `STORE_SORT_LABEL` / `DEFAULT_STORE_SORT` live in
`constants/store.ts` — the exact split `constants/uploads.ts` has from
`lib/uploads.ts`, and `constants/catalog.ts` has from anything server-side.
The service re-exports the `StoreSort` *type* for callers already reaching for
it.

---

## Filters, search and pagination — the shared convention, on the storefront

This is [`admin-dashboard.md`](./admin-dashboard.md)'s "List pages" rule
applied outside `/admin` for the first time:

- **The service** takes `{ search?, page?, …filters }` and returns
  `{ products, total, page, pageCount }`.
- **The page** (a Server Component) parses and validates the params off
  `searchParams`, calls the service, and renders the chip nav + the filter bar
  + the grid + `<Pagination>`.
- **`store-filters.tsx` (`"use client"`)** is a search `<Input>` (applies on
  submit — navigating per keystroke is a request storm) and type / sort
  `<Select>`s (apply on change), all through **`useListNavigation`**, which
  does nothing but `router.push` new query params. No React Query, no client
  cache — the grid is server-rendered on every navigation.

### Two pieces were promoted to `components/shared/` to make this possible

`folder-structure.md` always listed `components/shared/pagination.tsx` as
*"used by both the storefront and the admin console"*. It did not exist; this
feature created it.

| Piece | Was | Now |
| --- | --- | --- |
| `useListNavigation` | `components/admin/shared/list-controls.tsx` | `components/shared/use-list-navigation.ts`; the admin path **re-exports** it, so no admin filter component changed |
| `Pagination` | admin-only `AdminPagination` in `components/admin/shared` | new `components/shared/pagination.tsx`, generic (`page` / `pageCount` / `basePath` / `params`), `<Link>`-based, RTL, hidden on one page |

`AdminPagination` is left in place and still used by the four admin lists —
consolidating them onto the shared `<Pagination>` is a mechanical follow-up,
not done here to keep the admin surface untouched by a storefront change.

### Why the category chips are *not* in the client filter bar

`store-category-nav.tsx` is a **Server Component**. Each chip is a plain
`<Link href="/store?category=…">`, and the active one is known from an
`activeSlug` prop the page reads off `searchParams` — no `useSearchParams`, no
client JS. The other params (`q`, `type`, `sort`) are threaded through so
switching category keeps the search and the sort; `page` is dropped, because a
new category has a different number of pages (the same rule `useListNavigation`
enforces for the client controls).

---

## The grid card

`store-product-card.tsx` shows the cover image, the category + type eyebrow,
the name, a two-line description clamp, the "from" price, a stock badge, and —
in a footer — `StoreCardActions`: a quick-add «أضف إلى السلة» plus a
permanently disabled «اشترِ الآن». See
[`cart-feature.md`](./cart-feature.md).

**Everything above the footer is one `<Link>` to `/store/[slug]`; the buttons
are not.** Interactive content cannot nest inside an `<a>`, and the buttons
must not trigger navigation, so the card is a `<Card>` (a plain `<div>` — no
Base UI `render` prop) holding a `<Link>` and a `<CardFooter>` as siblings.
The `<Link>` is `flex flex-col gap-4` so the image / header / price stack with
the same rhythm the card would have given them as direct children; it carries
`group/nav`, and the image's `group-hover/nav:scale` and the title's
`group-hover/nav:underline` key off it (so hovering the footer buttons does
not animate the image).

**Price.** `priceFrom` / `priceTo` are the cheapest and dearest *active*
variant, as numbers — safe here for the same reason `product.service`'s
`toDisplayPrice` gives: shown and compared, never charged. One figure when the
variants agree, "يبدأ من X" when they range, "—" if somehow none is active
(the `where` makes that unreachable, but the guard is free). Rendered through
`formatPrice`, wrapped in `data-numeric` so the Latin digits and «ج.م.» do not
reorder inside the RTL line.

**Image.** `coverImageUrl ?? DEFAULT_PRODUCT_IMAGE` — a perfume with no photo
shows `public/image.png` (a warm ivory placeholder echoing the Misk mark), so
the grid is never ragged. See [`image-uploads.md`](./image-uploads.md). A
seeded catalogue has no images at all, so every card shows the placeholder
until photos are added through the admin console.

---

## The product page — `/store/[slug]`

A Server Component that reads `getStoreProduct` directly (the storefront's
read-first exception, same as the grid) and `notFound()`s on a stale slug.
`generateMetadata` sets the tab title to the perfume's name.

Two columns on `lg` — gallery and info — stacking on narrow screens. The info
column, top to bottom:

| Block | Notes |
| --- | --- |
| Breadcrumb | `المتجر / <category> / <name>`; the first two are links, the category one filters the grid |
| Heading | category (link) · type eyebrow, the name as `<h1>`, the "from" price |
| Description | the full `Product.description` — required and NOT NULL, so always present |
| **Buy box** | `AddToCartForm` — the options select, a quantity stepper, buy now (disabled) / add to cart (live) |
| الجودة والمكوّنات | the ingredient list with notes, only when the perfume has any (the panel [`misk_business_analysis.md`](./misk_business_analysis.md) §6 asks for) |

### `AddToCartForm` replaces the old read-only variant list

«اشترِ الآن» and «أضف إلى السلة» work very differently now. One `<select>` (`variantItems`) shows every
option's label, grade and price — "نفد المخزون" appended, and the `<option>`
itself disabled, for one with none — so it is the picker *and* the price list
at once. A quantity stepper follows, capped at
`min(selected.stock, MAX_LINE_QUANTITY)`.

**«اشترِ الآن» is disabled unconditionally; «أضف إلى السلة» calls
`addToCartAction`.** See [`cart-feature.md`](./cart-feature.md) for the full
reasoning — the short version is that "buy now" has to lead to a checkout
that does not exist yet, and an earlier version disabling both off one shared
`pending` flag made *both* buttons flash a spinner when only one was pressed.
The two are independent now: «اشترِ الآن» is never wired to the transition at
all, and «أضف إلى السلة» owns the only `Spinner` in the component.

### The gallery

`store-product-gallery.tsx` is `"use client"` — a large square plus a
thumbnail strip when there is more than one photo, with `useState` for the
swap. Not `embla-carousel-react` (installed, unused): a swipeable carousel
earns its place when a perfume actually carries a handful of photos, and a
seeded catalogue carries none. A perfume with no gallery shows
`DEFAULT_PRODUCT_IMAGE` and no strip.

---

## Sorting

`?sort=` accepts four values, validated against `STORE_SORTS`; anything else
falls to the default:

| `sort` | Order |
| --- | --- |
| `newest` *(default)* | `createdAt` descending |
| `price-asc` | cheapest active variant, ascending |
| `price-desc` | cheapest active variant, descending |
| `name` | `localeCompare(…, "ar")` |

The default is omitted from the URL — picking «الأحدث» clears `?sort=` rather
than writing `?sort=newest`, so the canonical catalogue URL stays clean.

---

## Files

| File | What it is |
| --- | --- |
| `src/app/store/layout.tsx` | Storefront shell — header + footer |
| `src/app/store/page.tsx` | The catalogue — parses `?category` / `?q` / `?type` / `?sort` / `?page` |
| `src/app/store/loading.tsx` | Skeleton for the catalogue query |
| `src/app/store/[slug]/page.tsx` | One perfume — `getStoreProduct` + `generateMetadata`, `notFound()` on a stale slug |
| `src/app/store/[slug]/loading.tsx` | Skeleton for the product query |
| `src/components/store/index.ts` | Barrel |
| `…/store-chrome.tsx` | `StoreHeader` + `StoreFooter` |
| `…/store-category-nav.tsx` | Server — the category chips, plain `<Link>`s |
| `…/store-filters.tsx` | Client — search + type + sort, over `useListNavigation` |
| `…/store-product-grid.tsx` | Server — the grid + the "nothing matched" empty state |
| `…/store-product-card.tsx` | Server — one perfume in the grid: a `<Link>` (image → price) plus a `StoreCardActions` footer |
| `…/store-product-gallery.tsx` | Client — main image + thumbnail swap |
| `…/add-to-cart-form.tsx` | Client — the product page's buy box; see `cart-feature.md` |
| `…/store-card-actions.tsx` | Client — the catalogue card's quick-add; see `cart-feature.md` |
| `src/services/catalog.service.ts` | `listCatalog` + `listCatalogCategories` + `getStoreProduct`; `StoreProductCard.defaultVariantId` |
| `src/constants/store.ts` | `STORE_SORTS`, `STORE_SORT_LABEL`, `DEFAULT_STORE_SORT` — client-safe |
| `src/components/shared/pagination.tsx` | The shared `<Pagination>` (new) |
| `src/components/shared/use-list-navigation.ts` | `useListNavigation`, moved here from `admin/shared` |
| `src/constants/routes.ts` | `ROUTES.store`, `storeProductRoute(slug)` |
| `src/app/page.tsx` | Landing-page CTAs re-pointed from the unbuilt `/shop` to `/store` |

---

## What is deliberately not here

**Checkout.** `/cart` (built — see [`cart-feature.md`](./cart-feature.md))
and Add to Cart are done; placing an order — cash on delivery, an `Order` row
— is not. «اشترِ الآن» stays disabled everywhere and `/cart`'s own confirm
button is disabled too, until `checkout-orders-feature.md` is built.

**Merging `/store` and `/shop`.** `/shop/[category]/[slug]` is the path-based
storefront the older docs plan. `/store` is the list-convention catalogue the
brief asked for. If they are ever unified, `/shop` is the URL that wins (it is
the one already written into `misk_business_analysis.md` and the design docs)
and this feature's service + components move under it largely intact.

**Sorting by relevance on search.** `?q=` is a plain `contains` on name +
description; results keep whatever `?sort=` says. A real relevance rank
(`search.service.ts` in `folder-structure.md`) is its own feature.

**A swipeable gallery.** `embla-carousel-react` is installed; the gallery uses
`useState` thumbnails instead until a perfume carries enough photos to swipe.

---

## Extending this

**A price-range facet, an "in stock only" toggle** — another `searchParams`
key, another clause on the `where` (or, for a client-computed one, another
`cards.filter`). Still no client state.

**Grouped "shop by category" on the unfiltered view** — render the first N of
each active segment as its own row above the paged grid when `?category=` is
absent. The data is already there (`listCatalogCategories` + a per-category
`listCatalog({ categorySlug, page: 1 })`); it is a layout decision, not a
service one.

**Moving the sort and paging into SQL** — when the catalogue outgrows "a few
dozen rows". `listCatalog` is the only function that changes: keep the `where`,
add `orderBy` + `skip` + `take`, and issue the count alongside in a
`$transaction` like the admin lists do. The price sort becomes a `$queryRaw`
over `min(price)` or a denormalised `priceFrom` column.
