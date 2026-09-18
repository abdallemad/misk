# Landing Page & Marketing Pages

`/` — the front door: a hero (with a search box), the three founding
categories, a real "latest perfumes" grid, and the manufacturing story.
`/about` and `/contact` are its two siblings — the fuller brand story, and
every channel to reach the shop. All three share the same storefront chrome
and the same `components/marketing/` footer, and none of the three fetches
anything a shopper needs to be signed in for.

## Related documents

- [`folder-structure.md`](./folder-structure.md) — the layer architecture; this document was pre-referenced there before `/` (and `/about`) existed
- [`store-feature.md`](./store-feature.md) — **built** — `catalog.service.ts` (what "latest perfumes" and the search box both read), `StoreProductCard` (reused as-is), and the header nav (`StoreHeader` / `StoreNavMenu`) all three pages here share instead of owning their own
- [`cart-feature.md`](./cart-feature.md) — «اشترِ الآن» / «أضف إلى السلة» on each card on `/` are the exact same buttons and the exact same reasoning as the catalogue grid's, because it is the exact same component
- [`categories-feature.md`](./categories-feature.md) — Youth / Women / Men, the three segments the category strip still hard-codes
- [`misk_business_analysis.md`](./misk_business_analysis.md) — the internal planning document `/about` translates into customer-facing copy; the brand story `Craft` (on both `/` and `/about`) translates into three claims

---

## Routes

```text
/           the landing page — hero + search, category strip, latest perfumes, craft story
/about      the fuller manufacturing story — the two product lines, the three categories
/contact    every channel to reach the shop — WhatsApp, Instagram, Facebook, email, phone
```

Three plain folders under `src/app/`, not a `(marketing)` route group — the
same "the URL really is this, so a group would only strip a segment and
force it back" reasoning `app/store/` and `app/admin/` already give. `/`
is `src/app/page.tsx` specifically (the root file), not
`(marketing)/page.tsx` — nothing else in the sketched `(marketing)` group is
built, so the group would exist for one route alone.

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

## The hero search box

A plain `<form action={ROUTES.store}>` with `<input type="search" name="q">`
— no `"use client"`, no `onSubmit`, no JavaScript at all. A native GET form
submission already does exactly what is wanted: the browser navigates to
`/store?q=<value>`, which `store-filters.tsx` already reads back out via its
own `search` prop — the identical query param `/store`'s own search box
writes. This is not a second search implementation; it is the same one
`/store` already has, reached from one more place. `role="search"` and
`aria-label` on the `<Input>` match the accessibility annotations
`store-filters.tsx`'s own search box already carries.

No separate `/search` page or `search.service.ts` was built —
`folder-structure.md` still lists `search-feature.md` as a distinct,
unbuilt feature (a relevance-ranked search across perfumes, under the
still-unbuilt `(shop)` group). This search box deliberately reuses the
already-working `contains` search `/store` has today rather than building
that.

---

## `/about` — the manufacturing story, in full

`docs/misk_business_analysis.md` is an internal planning document — English,
written to design the catalog's data model, not to be read by a shopper.
`/about` is what that document's substance looks like translated into
Arabic brand copy: §2 (in-house manufacturing) becomes the intro and an
expanded three-point `Craft` (the same three claims `/` teases, written with
more depth here); §4 (the two product formats) becomes a two-card "خطّان
لكل ذوق" comparison — alcohol-based (30/50/100ml) side by side with raw oil /
«دهن» (5/8/12g, sold by weight); the three categories get a short paragraph
and a link to each
`/store?category=` filter, deliberately **not** a second copy of `/`'s own
category cards (the same picker appearing identically on two pages a
shopper might visit back to back would just be repetition, not
information). Nothing on this page is copied verbatim from the
business-analysis document — it names *what to say*, not *how to say it to
a customer*.

A plain (non-`async`) Server Component — nothing on `/about` reads the
database, so there is nothing to fetch.

---

## `/contact` — every channel, one card each

WhatsApp, Instagram, Facebook, email, phone — five cards, each a `<Link>`
(external ones get `target="_blank" rel="noopener noreferrer"`), reading
their values from `constants/contact.ts` rather than being typed inline.

**`constants/contact.ts` holds the shop's real channels** — WhatsApp/phone,
Instagram, Facebook, email. The phone/WhatsApp number is in the same
Egyptian mobile format this project already assumes everywhere else
(`checkout.schema.ts`'s `PHONE_PATTERN`, `scripts/seed-dev.mts`'s seeded
customers).

**No Facebook or Instagram icon from `lucide-react`.** The package dropped
brand icons some versions back to stay a generic set. `components/shared/
social-icons.tsx` draws two small stand-ins (`FacebookIcon`, `InstagramIcon`)
at the same 24×24 / stroke-width-2 convention every lucide icon here uses, so
they sit next to `<PhoneIcon>` without reading as a different icon set.
WhatsApp needed no such stand-in — `MessageCircleIcon` already reads as
"chat", and the visible «واتساب» label does the rest.

A plain Server Component, same reasoning as `/about`.

---

## `components/marketing/` exists now

The original `page.tsx` doc comment predicted its sections would move into
`components/marketing/` once the catalogue existed. That did not happen the
first time this document was written (nothing else rendered any of them
yet) — it happened this round, because `/about` and `/contact` both needed
the exact same footer `/` already had. `components/marketing/site-footer.tsx`
is the first (and, for now, only) file there: `SiteFooter`, extracted as-is,
with a «تواصل معنا» link added. `Hero`, `CategoryStrip`, `Latest` and
`Craft` stay private functions inside `page.tsx` — nothing outside `/`
renders any of them, and `/about`'s own `Craft`-shaped section is
deliberately a separate, more detailed definition rather than an import of
`/`'s (see "`/about` — the manufacturing story, in full" above).

**Why not `StoreFooter`.** `components/store/store-chrome.tsx`'s
`StoreFooter` is deliberately minimal — brand mark and a copyright line —
because `/store`/`/cart`/`/checkout`/`/account/*` don't need a footer nav; a
shopper mid-task already has the header. A marketing page is often the
*first* page someone lands on, so its footer is where the category links,
«حكايتنا» and «تواصل معنا» live for anyone who scrolled instead of using the
header.

---

## The header nav grew a third dropdown

`store-nav.tsx`'s `StoreNavMenu` (see `store-feature.md`'s "Header nav —
hover dropdowns" section) now has «عن مِسك», grouping «حكايتنا» (`/about`)
and «تواصل معنا» (`/contact`) — the same "two destinations is worth a
dropdown" threshold that made «حسابي» one instead of two more flat links.
It lives in `components/store/`, not `components/marketing/`, because it is
still one component rendering the *whole* site's header nav (store links,
account links, and now these) — splitting the marketing-only entries into a
second nav component would only be indirection for two `<li>`s.

---

## Files

| File | What it is |
| --- | --- |
| `src/app/page.tsx` | `/` — an `async` Server Component (the "latest" read) |
| `src/app/about/page.tsx` | `/about` — a plain Server Component, no data fetching |
| `src/app/contact/page.tsx` | `/contact` — a plain Server Component, no data fetching |
| `src/components/marketing/site-footer.tsx` | `SiteFooter` — shared by all three pages |
| `src/components/store/store-chrome.tsx` | `StoreHeader` — reused here, not reimplemented |
| `src/components/store/store-nav.tsx` | `StoreNavMenu` — now has the «عن مِسك» dropdown |
| `src/components/store/store-product-card.tsx` | `StoreProductCard` — reused here for the "latest" grid |
| `src/components/shared/social-icons.tsx` | `FacebookIcon` / `InstagramIcon` — lucide has no brand icons for either |
| `src/services/catalog.service.ts` | `listCatalog({ sort: "newest" })` — the read `/`'s "latest" section and the search box both rely on |
| `src/constants/design-system.ts` | `CATEGORY_ACCENT` — the category strip's hard-coded copy and colour |
| `src/constants/contact.ts` | `CONTACT` — the shop's real contact channels `/contact` renders |
| `src/constants/routes.ts` | `ROUTES.about`, `ROUTES.contact` |

---

## What is deliberately not here

**A hand-picked "featured" list.** See "Why 'latest', not 'featured'" above —
`listCatalog({ sort: "newest" })` is what stands in for it today.

**A relevance-ranked `/search`.** The hero's search box reuses `/store`'s
existing `contains` search; a real ranked-search page is `search-feature.md`,
a separate, still-unbuilt feature under the sketched `(shop)` group.

---

## Extending this

**A real "featured" flag.** Add `Product.isFeatured Boolean @default(false)`,
an admin toggle next to `isActive` in the product form, and swap `Latest`'s
`listCatalog({ sort: "newest" })` call for a filtered one. Everything else —
`StoreProductCard`, the grid, the empty-state guard — stays exactly as it is.

**Category strip from real data.** The day a fourth category stops being a
rare event, swap `CategoryStrip`'s hard-coded array for
`listCatalogCategories()` — `StoreHeader` and `/store` already show the
shape that read takes.
