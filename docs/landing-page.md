# Landing Page

`/` — the front door. A hero, the three founding categories, a real "latest
perfumes" grid pulled from the catalogue, and the manufacturing story.

## Related documents

- [`folder-structure.md`](./folder-structure.md) — the layer architecture; this document was pre-referenced there before it existed
- [`store-feature.md`](./store-feature.md) — **built** — `catalog.service.ts` (what "latest perfumes" reads), `StoreProductCard` (reused here as-is), and the header nav (`StoreHeader` / `StoreNavMenu`) this page now shares instead of owning its own
- [`cart-feature.md`](./cart-feature.md) — «اشترِ الآن» / «أضف إلى السلة» on each card here are the exact same buttons and the exact same reasoning as the catalogue grid's, because it is the exact same component
- [`categories-feature.md`](./categories-feature.md) — Youth / Women / Men, the three segments the category strip still hard-codes
- [`misk_business_analysis.md`](./misk_business_analysis.md) — the brand story `Craft` translates into three claims

---

## Route

```text
/     the landing page — hero, category strip, latest perfumes, craft story
```

A plain `src/app/page.tsx`, not a `(marketing)` route group — the same
"the URL really is this, so a group would only strip a segment and force it
back" reasoning `app/store/` and `app/admin/` already give. `/about` is
**still not built** (see "What is deliberately not here").

---

## From a design-system exercise to a real page

`page.tsx`'s own doc comment used to say this plainly:

> *Placeholder copy and hard-coded products for now: the point of this file
> today is to exercise the design system end to end. Once the catalog is
> wired up, the sections here move into `components/marketing/` and the
> products come from `product.service.ts`.*

The catalog has been wired up for a while now (`store-feature.md`), and this
round is what actually followed through on that note — partially. Three
things changed:

| Section | Before | Now |
| --- | --- | --- |
| Header | A bespoke `SiteHeader` — flat category links + «حكايتنا», its own `AuthNav`/`ThemeToggle`/cart icon | The shared `StoreHeader` (`components/store`) — the same «المتجر» / «حسابي» hover dropdowns `/store`, `/cart`, `/checkout` and `/account/*` already render |
| "Featured" perfumes | `FEATURED` — three hard-coded objects, a decorative `<DropletIcon>` instead of a photo, no real price or stock | `Latest` — `catalog.service.listCatalog({ sort: "newest" })`, the first six real, active, in-stock perfumes, rendered with the actual `StoreProductCard` (photo, live price, live stock badge, live buy buttons) |
| Text alignment | Hero and section headers were start-aligned (RTL default) inside a centered *container* | Hero and every section heading are centered — `mx-auto` + `text-center` on the text block, the button row `justify-center` |

The **category strip did not move to real data** — see below for why that one
stays hard-coded on purpose, unlike the other two.

### Why `StoreHeader`, not `SiteHeader`

The page's own header used to duplicate what `StoreHeader` already builds:
`AuthNav`, `ThemeToggle`, a cart icon with the live count, and a nav — except
its nav was three flat links (Youth / Women / Men) plus «حكايتنا», hand-rolled
separately from the one `store-feature.md`'s "Header nav — hover dropdowns"
section documents. Landing on `/` used to mean a shopper saw a *different*
header than every other storefront page, with none of the dropdown grouping
those pages got. Rendering the same `StoreHeader` here means `/` is simply
one more page inside the storefront chrome — the same "the header nav" a
shopper already learned on `/store` now works identically the moment they
land on `/`.

`SiteFooter` was **not** replaced the same way. `StoreFooter` (also in
`components/store`) is deliberately minimal — brand mark and a copyright
line, nothing else — because `/store`, `/cart`, `/checkout` and `/account/*`
don't need a footer nav; a shopper already deep in a task has the header.
The landing page is different: it is often the *first* page, and its footer
is where «حكايتنا» / «نظام التصميم» / the category links live for someone who
scrolled all the way down instead of using the header. Swapping it for
`StoreFooter` would have deleted those links outright, so `page.tsx` keeps
its own `SiteFooter`.

### Why "latest", not "featured"

`Product` has no `isFeatured` flag, and this round did not add one — a
hand-picked "featured" set is an editorial decision (which perfumes to put
in the shop window) that belongs to an admin control, not a hard-coded array
in a page component pretending to be one. `listCatalog({ sort: "newest" })`
is a real, already-correct answer to a related but simpler question — "what
did we just add" — reusing the exact sort `/store`'s own «الأحدث» option
already offers, with the exact same sellability gate (`isActive` perfume,
`isActive` category, at least one active variant). `LATEST_COUNT = 6` takes
the first two rows of the same `sm:grid-cols-2 lg:grid-cols-3` grid `/store`
uses. If the shop ever wants genuinely curated picks instead of "newest
first", that is the day `Product.isFeatured` (or a small join table, if more
than one list is ever needed) becomes worth the migration — see "Extending
this".

**Empty catalogue, handled.** `Latest` returns `null` when `listCatalog`
comes back with nothing (a fresh, unseeded database) rather than rendering an
empty heading over a blank grid.

### Why the category strip stayed hard-coded

`CategoryStrip` still maps over a literal `["youth", "women", "men"]` and
reads their copy from `constants/design-system.ts`'s `CATEGORY_ACCENT`,
**not** `catalog.service.listCatalogCategories()` — the read `StoreHeader`'s
«المتجر» dropdown and `/store`'s own chips both already use. This is not an
oversight; `categories-feature.md` is explicit that Youth / Women / Men are
the shop's **founding segments**, designed copy and a hand-picked accent
colour each, not rows an admin is expected to add more of on a Tuesday. The
landing page's three cards are that same designed set, in the same
`CATEGORY_ACCENT` this project already treats as the source of truth for
"how these three are described" — pulling them from the database instead
would only add a query for data that is, today, exactly as fixed as the
constant already says it is. The day a fourth category is a real,
often-added thing (rather than a rare, deliberate one), this is the section
to switch to `listCatalogCategories()` — the same day `categories-feature.md`
itself would need updating.

---

## Centered

Every section's heading — the hero's eyebrow/title/description, "تسوّق حسب
الفئة", "أحدث العطور", and the already-centered "الجودة والمكوّنات" — is now
`mx-auto max-w-3xl` (hero) or `mx-auto max-w-prose` (the rest) with
`text-center`, and the button rows under them are `justify-center`. Grids
(the category cards, the product cards) were already visually balanced by
their own `grid` columns and needed no change; "centered" describes the
*text* blocks that sit above and below them, which used to sit flush to the
line's start (the RTL default) inside an already-centered *container*. The
`Craft` section was centered before this round and is unchanged — the rest
of the page now reads consistently with it instead of the other way around.

---

## Files

| File | What it is |
| --- | --- |
| `src/app/page.tsx` | The whole page — now an `async` Server Component |
| `src/components/store/store-chrome.tsx` | `StoreHeader` — reused here, not reimplemented |
| `src/components/store/store-product-card.tsx` | `StoreProductCard` — reused here for the "latest" grid |
| `src/services/catalog.service.ts` | `listCatalog({ sort: "newest" })` — the read this page now makes |
| `src/constants/design-system.ts` | `CATEGORY_ACCENT` — the category strip's hard-coded copy and colour |

---

## What is deliberately not here

**`/about`.** Both «حكاية الصناعة» (hero) and «حكايتنا» (footer) link to
`/about`, which does not exist — `folder-structure.md` has sketched it since
before this page had real data, under the still-unbuilt `(marketing)` route
group. Neither link was added by this round; they were dead before it and
stay dead after it. Building `/about` is its own round, with its own
`landing-page.md` update once it exists.

**A hand-picked "featured" list.** See "Why 'latest', not 'featured'" above —
`listCatalog({ sort: "newest" })` is what stands in for it today.

**`components/marketing/`.** The original doc comment predicted the landing
page's sections would move into a `components/marketing/` folder once the
catalogue existed. They have not — `Hero`, `CategoryStrip`, `Latest`, `Craft`
and `SiteFooter` are still private functions inside `page.tsx`, because
nothing outside this one page renders any of them. That folder is worth
creating the day a second page (`/about`, most likely) needs to share one of
these sections, not before.

---

## Extending this

**A real "featured" flag.** Add `Product.isFeatured Boolean @default(false)`,
an admin toggle next to `isActive` in the product form, and swap `Latest`'s
`listCatalog({ sort: "newest" })` call for a filtered one. Everything else —
`StoreProductCard`, the grid, the empty-state guard — stays exactly as it is.

**`/about`.** Once built, this document's "What is deliberately not here"
entry for it should become a "Routes" entry instead, and the hero/footer
links stop being dead ones.

**Category strip from real data.** The day a fourth category stops being a
rare event, swap `CategoryStrip`'s hard-coded array for
`listCatalogCategories()` — `StoreHeader` and `/store` already show the
shape that read takes.
