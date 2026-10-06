# Landing Page & Marketing Pages

`/` — the front door, rebuilt around the audience research: a brand-promise
hero, **one section per audience segment** (each headed by its key message),
a category selector **mapped from the database**, the perfumes shoppers actually order
most, how an order is made, the quality claims, alcohol vs. pure oil with
live "from" prices, a brand-story teaser and a closing band. `/about` and
`/contact` are its two siblings — the brand story in the founder's words, and
every channel to reach the shop. All three share the same storefront chrome
and the same `components/marketing/` footer, and none of the three fetches
anything a shopper needs to be signed in for. The three legal pages
(`/terms`, `/privacy`, `/refunds`) share that chrome too — see
[`legal-pages.md`](./legal-pages.md).

## Related documents

- [`folder-structure.md`](./folder-structure.md) — the layer architecture; this document was pre-referenced there before `/` (and `/about`) existed
- [`store-feature.md`](./store-feature.md) — **built** — `catalog.service.ts` (every read on `/`: segment categories, best sellers, price floors), `StoreProductCard` (reused as-is), and the header nav (`StoreHeader` / `StoreNavMenu`) all three pages here share instead of owning their own
- [`categories-feature.md`](./categories-feature.md) — the `Category` table, and the four `segment*` columns this page's category cards read (and the admin form that edits them)
- [`cart-feature.md`](./cart-feature.md) — «اشترِ الآن» / «أضف إلى السلة» on each card on `/` are the exact same buttons and the exact same reasoning as the catalogue grid's, because it is the exact same component
- [`database-seeding.md`](./database-seeding.md) — `seed-categories.mts`, which back-fills the founding segments' card copy
- [`misk_business_analysis.md`](./misk_business_analysis.md) — the internal planning document; the source of every manufacturing claim `/` makes, and (§1.1) of the founder's brand-story text `/about` and the footer quote verbatim
- [`legal-pages.md`](./legal-pages.md) — `/terms`, `/privacy`, `/refunds`, linked from both footers

---

## Routes

```text
/           the landing page — see "The page, top to bottom" below
/about      the brand story in the founder's words, the values, the quality claims, the two formats
/contact    every channel to reach the shop — WhatsApp, Instagram, Facebook, email, phone
```

Three plain folders under `src/app/`, not a `(marketing)` route group — the
same "the URL really is this, so a group would only strip a segment and
force it back" reasoning `app/store/` and `app/admin/` already give. `/`
is `src/app/page.tsx` specifically (the root file), not
`(marketing)/page.tsx` — nothing else in the sketched `(marketing)` group is
built, so the group would exist for one route alone.

---

## The page, top to bottom

`src/app/page.tsx` is now short: it runs four reads in parallel and hands
each section its data. Every section is a Server Component in
`components/marketing/landing/`, so the category cards and the product
cards are in the first HTML a crawler receives.

| # | Section | Component | Data |
| --- | --- | --- | --- |
| 1 | Hero — the brand promise (the page's only `<h1>`), «تسوّق المجموعة» → `/store`, «حكاية الصناعة» → `/about`, trust line, search box, a carousel of product photos | `hero.tsx` + `hero-carousel.tsx` | the best-sellers that have a photo (up to 5) |
| 2–4 | One section per audience segment — gift buyers, luxury on a budget, long day out — each headed by its key message; from `lg` each is `sticky top-4` so they stack as you scroll (wrapper `<div>` ends the stack) | `audience-section.tsx` (`AudienceSections`) | static — `constants/landing.ts`; the budget section's «عطور تبدأ من» is the live lowest price |
| 3 | «أي عطر يشبهك؟» — one card per category | `category-segments.tsx` | **database** — `listSegmentCategories()` |
| 4 | «الأكثر طلبًا» (or «أحدث العطور») — six product cards | `best-sellers.tsx` | **database** — `listBestSellers(6)` |
| 5 | «إزاي عطرك بيوصلك» — three steps | `how-it-works.tsx` | static |
| 6 | «عارفين إيه اللي جوه كل إزازة» — three quality claims | `quality.tsx` | static |
| 7 | «كحولي ولا دهن خالص؟» — two-column comparison | `format-comparison.tsx` | **database** — `getFormatPriceFloors()` |
| 8 | «من الزيت للإزازة، بإيدينا» — brand-story teaser → `/about` | `brand-story.tsx` | static |
| 9 | Closing band → `/store` | `final-cta.tsx` | static |
| — | Footer — category links | `site-footer.tsx` | **database** — `listCatalogCategories()` |
| — | JSON-LD — `Organization` + `ItemList` of `Product` | `landing-json-ld.tsx` | the best-seller row |

Every fixed string on the page lives in **`constants/landing.ts`** — the
hero, the audience cards, the section frames, the steps, the claims, the
format copy, the story and the closing line — so a copy change is one edit
there. The section components hold markup, not words.

**There is no reviews section.** The brief says to render one only if
reviews exist in the database, and to never invent testimonials. The schema
has no review table, so there is nothing to render — see "Social proof"
below for what adding one takes.

---

## The hero carousel

The hero's photo is a carousel (`hero-carousel.tsx`, a Client Component)
of the best-sellers that have a real photo — best-seller order, at most
`HERO_SLIDES_MAX` (5) — each slide a link to that perfume with its
category and name captioned over a dark gradient. With no photos in the
catalogue it falls back to one placeholder slide and renders no controls.

- **Built on `embla-carousel-react` directly**, not on
  `components/ui/carousel.tsx`: the shadcn wrapper positions its arrows and
  reads ← / → for a left-to-right page. Here embla runs with
  `direction: "rtl"`, the "previous" arrow sits on the right, and ← means
  *next* — the way a right-to-left reader expects.
- **Autoplay** every `HERO_AUTOPLAY_MS` (5s), paused while the pointer or
  focus is inside and while the tab is hidden; **never started** under
  `prefers-reduced-motion: reduce`. A `setInterval` calling `scrollNext()` —
  no autoplay plugin dependency.
- **Performance.** Only slide one loads eagerly with `fetchPriority="high"`
  (it is the LCP image); slides 2–5 keep `next/image`'s lazy default. Embla
  moves the track with a `transform`. The whole carousel sits inside the
  hero's `settle` reveal — a scale, never an opacity fade, for the same LCP
  reason.
- **A11y.** A `region` labelled «عطور مختارة» with
  `aria-roledescription="carousel"`; each slide a `group` labelled
  «n من N»; dots are buttons with `aria-current`.

The carousel shows whatever photos the products have — see "Content still
needed": if those are other brands' bottles, so is the carousel.

---

## Audience segments vs. categories — two sections, on purpose

The marketing research produced three **audience segments**:

| Segment | Key message (used verbatim as the card headline) | Card links to |
| --- | --- | --- |
| Gift buyers | «هدية فاخرة بتغليف أنيق، وسعر يخليك تهادي الكل.» | `/store` |
| Luxury lovers on a budget | «ريحة البراند اللي بتحبها، بجودة عالية وسعر يناسبك.» | `/store?sort=price-asc` |
| Out of the house all day | «رش مرة الصبح، وريحتك تفضل معاك طول اليوم.» | `/store?type=ALCOHOL_BASED` |

These are **needs a shopper arrives with**, not shelves. The shop's
`Category` rows (شبابي, نسائي, الدهان والمسك, للجنسن…) are gender / style
shelves, and a perfume is filed on exactly one of them. Putting the gift
message on the «شبابي» card, or turning the three segments into categories
(which would empty the real shelves — `Product.categoryId` is single-valued),
would both have misrepresented the catalogue. So the page answers each
question in its own section:

- **Sections 2–4** are the segments — one full section each, static copy,
  each pointing at the store view that answers that need.
- **Section 3** is the categories — rows from the database, each card
  pointing at `/store?category=<slug>`.

This was an explicit decision with the shop owner when the page was rebuilt.

### One section per audience

The segments first shipped as three cards under one «بتدوّر على إيه؟»
heading. The owner asked for each to get **a section of its own**, and
that is the shape now: three `<section>`s in research order, each with

- an eyebrow question in gold with the segment's icon («بتدوّر على هدية؟»),
- the **key message as the section's `<h2>`** — so the page's outline reads
  as the three messages, one per stop,
- one line of body copy, three supporting points (a gold check each — the
  research's own "solution" line, split into its three claims), and the
  segment's CTA,
- a visual panel beside the text: the segment's icon in a gold disc inside
  two hairline gold rings (the same ring as the brand's placeholder image),
  with a one-line caption in the display face.

Sides alternate — text on the right, panel on the left, then flipped
(`lg:order-last` on the text column) — and so does the background (the
middle section gets `bg-secondary/40` between hairline borders), so three
sections in a row read as three distinct stops. Below `lg` the panel stacks
under the text and the text centres, the same rule as the hero.

**Only one panel shows a price, and it is live.** The budget segment's whole
promise is the price, so its panel prints «عطور تبدأ من …» from the
catalogue's real lowest price (the smaller of `getFormatPriceFloors()`'s two
floors, `lowestPrice()` in `page.tsx`) — and prints nothing if nothing is on
sale. The other two panels make no numeric claim. The grouping heading
«بتدوّر على إيه؟» and its `AUDIENCE_SECTION` constant are gone; each segment
is its own section now, so there is nothing to group.

---

## The category selector — categories are data now

This used to be `CategoryStrip`, a hard-coded `["youth", "women", "men"]`
reading its copy from `CATEGORY_ACCENT`, with a paragraph here defending
that choice ("founding segments, not rows an admin adds on a Tuesday"). That
defence did not survive contact with the live shop: the admin had already
created «الدهان والمسك» and «للجنسن» and retired «رجالي», so the hard-coded
strip was advertising a shelf with nothing on it and hiding two that were
selling. **Nothing on `/` names a category any more.**

`catalog.service.listSegmentCategories()` returns the same set, order and
gate as `listCatalogCategories()` — active, **with at least one sellable
perfume**, sorted by `position` then name — plus the card copy. A category
with nothing to buy gets no card, for the same "a card that leads to an
empty grid is a dead end" reason the store's chips give; it appears the
moment its first perfume goes on sale.

### The four `segment*` columns, and their fallbacks

`Category` gained four nullable columns (migration
`20260930120000_category_segment_copy`). Each card takes the most specific
value it has:

| Card part | Column | Falls back to |
| --- | --- | --- |
| Headline (`<h3>`) | `segmentHeadline` | `name` |
| Description | `segmentDescription` | `description`, then the generic `SEGMENT_FALLBACK_DESCRIPTION` |
| Button text | `segmentCtaLabel` | «تسوّق <name>» |
| Icon / image | `segmentIconOrImage` | the category's own `imageUrl`, then a sparkle icon |

`segmentIconOrImage` holds either an **icon key** from `SEGMENT_ICON_KEYS`
(`sparkles`, `flower`, `flame`, `gift`, `gem`, `sun`, `moon`, `leaf`,
`droplet`, `heart`) or an **image** — a public path (`/…`) or one of our own
`https://res.cloudinary.com/…` URLs. Nothing else: `next.config.ts` allows no
other remote image host, and `next/image` throws at render on one it does
not allow. The admin schema rejects anything else, and the card ignores an
unusable value rather than crashing (`isSegmentImageSrc`).

The admin edits all four in `/admin/categories`, in a «بطاقة الصفحة
الرئيسية» group at the bottom of the category dialog — see
[`categories-feature.md`](./categories-feature.md).

**The grid adapts to any count.** `grid-cols-[repeat(auto-fit,minmax(15rem,1fr))]`
rather than a fixed `sm:grid-cols-3`: one, two, four or seven categories all
lay out evenly, one column on a phone.

**The accent line survives.** Each card still carries its category colour
through `categoryAccent(slug)` — the neutral accent for any slug
`CATEGORY_ACCENT` has never heard of, never a direct index (see the warning
in [`categories-feature.md`](./categories-feature.md)).

---

## Best sellers — ranked by real orders

`listBestSellers(6)` sums `OrderItem.quantity` per perfume across every order
that is not `CANCELLED`, ranks sellable perfumes by that, and fills the rest
of the row newest-first. The heading is **earned**: «الأكثر طلبًا» only when
the top card has real orders behind it; on a shop with no orders the same
section says «أحدث العطور» instead of claiming a popularity nobody measured.

This replaces the old `Latest` section (`listCatalog({ sort: "newest" })`
sliced to six). No `Product.isFeatured` flag was added — "most ordered" is a
fact the database already holds; "featured" would be an editorial choice
that needs an admin control. The cards are `StoreProductCard`, unchanged:
photo, name, the admin-written description, "from" price, stock badge, and
the live add-to-cart buttons.

`catalog.service.ts` grew a private `loadCards(where)` so `listCatalog` and
`listBestSellers` build a card through one mapping — see
[`store-feature.md`](./store-feature.md).

---

## Choose your format — prices from the database

`getFormatPriceFloors()` returns the cheapest active variant of a sellable
perfume per product type. The comparison prints «يبدأ من …» from that number
and **omits the price line entirely** for a line with nothing on sale, so
the page never promises a price the shop cannot honour. Each column links
to `/store?type=ALCOHOL_BASED` / `/store?type=RAW_OIL`, the filter the store
already reads.

---

## Claims the page makes

Every claim on `/` has to be literally true. The ones that come from the
manufacturing story (`misk_business_analysis.md` §2, §6) and the checkout
flow were already on the site and are verifiable in the code:

- blended to order («يُمزَج عند الطلب») — the business model
- choose your size, 30/50/100 ml, or pure oil by the gram, 5/8/12 g — the `BottleSize` / `OilWeight` enums
- pharmaceutical-grade ethanol, graded oils — §6
- cash on delivery («الدفع عند الاستلام») — `/checkout`
- "from" prices — read live

**These come from the audience research and are the owner's to stand
behind** — the code cannot verify them: gift-ready elegant packaging
(«بتغليف أنيق»), scents that match the brands customers love («ريحة مطابقة
للبراند»), and all-day longevity («طول اليوم»). The research also said
"lasts a day or two" and named a specific third-party brand as a match;
the page deliberately says neither — "all day" is the more conservative
claim, and naming another company's trademark on the storefront is a legal
question, not a copy one.

---

## SEO basics

- **One `<h1>`** (the hero), an `<h2>` per section, `<h3>` for every card
  title under it — enforced by the shared `SectionHeading`.
- **`<title>` and meta description** from `LANDING_SEO` in
  `constants/landing.ts`. `title.absolute` skips the root layout's
  "%s · مِسك" template, which would otherwise print the brand twice. The
  keywords in it («عطور مركّزة», «هدايا عطور») are **placeholders** until the
  keyword research is done.
- **Alt text on every image**; only the hero photo loads eagerly with
  `fetchPriority="high"` — every other image keeps `next/image`'s default
  `loading="lazy"`.
- **Server-rendered** — the category and product sections are in the
  initial HTML.
- **JSON-LD** — `LandingJsonLd` renders one `<script type="application/ld+json">`
  holding an `Organization` (name, email, phone, the Instagram/Facebook
  profiles from `constants/contact.ts`) and an `ItemList` of the best-seller
  `Product`s, each with an `AggregateOffer` (EGP low/high price, offer count,
  `InStock` — or `PreOrder` at zero stock, because blended-to-order means
  "made after you order", not "gone"). It describes only what is on the page.
  `<` is escaped to `<`, per Next's JSON-LD guide.
- **Absolute URLs** in the JSON-LD come from `lib/site-url.ts`:
  `NEXT_PUBLIC_SITE_URL` when set (it should be, in production), otherwise
  rebuilt from the request's forwarded host. No `canonical` is set yet —
  without a `metadataBase` it would resolve against the wrong host off
  Vercel; that belongs to the deeper SEO pass.

---

## The hero search box

A plain `<form action={ROUTES.store}>` with `<input type="search" name="q">`
— no `"use client"`, no `onSubmit`, no JavaScript at all. A native GET form
submission already does exactly what is wanted: the browser navigates to
`/store?q=<value>`, which `store-filters.tsx` already reads back out via its
own `search` prop — the identical query param `/store`'s own search box
writes. It survived the rebuild — the brief's hero did not list it, but it
was an earlier explicit request, and it sits under the trust line.

No separate `/search` page or `search.service.ts` was built —
`folder-structure.md` still lists `search-feature.md` as a distinct,
unbuilt feature.

---

## Motion

The landing page animates, to one pattern, on `motion` (the package
formerly called Framer Motion, v12) — kept lean on purpose.

### The pattern

| Moment | What moves | How | Where |
| --- | --- | --- | --- |
| **Enter** (on load) | The hero only: text column staggers in (80ms apart), the headline with a short blur-in; the carousel settles from a 1.06 zoom | `Stagger trigger="mount"`, `blurUp`, `settle` | `hero.tsx` |
| **Reveal** (on scroll) | Every section heading fades up 16px; the section's grid follows, its children staggered; the quality section's gold rule draws itself out | `Reveal` / `Stagger` + `StaggerItem`, `fadeUp`, `draw` | every other section |
| **Hover** | Cards that link somewhere rise 2px with a softer shadow | CSS `.lift` | category cards (product cards keep their own image zoom) |
| **Accent** (loop) | A slow sheen crosses the gold CTA every 6s | CSS `.shine` | the hero's «تسوّق المجموعة» and the closing band's button — only those two |

Every entrance uses the same curve as the rest of the site — `--ease-luxe`,
`cubic-bezier(0.22, 1, 0.36, 1)`, "slow in, settled out" — as `EASE_LUXE` in
`constants/motion.ts`, with the durations, rise distance, stagger gap and
viewport rule beside it. Reveals fire **once**.

### The pieces

- `constants/motion.ts` — tokens: `EASE_LUXE`, `DURATION`, `RISE`, `STAGGER`,
  `REVEAL_VIEWPORT`.
- `components/motion/variants.ts` — the only four entrances: `fadeUp`
  (default), `blurUp` (headline only), `settle` (imagery), `draw` (a rule).
- `components/motion/reveal.tsx` — `Reveal`, `Stagger`, `StaggerItem`.
  Client Components that take **server-rendered children**, so every
  section stays a Server Component and its markup stays in the first HTML.
  `as` keeps semantics — a staggered `<ul>` is still a `<ul>` of `<li>`s.
- `components/motion/motion-provider.tsx` — `LazyMotion` + `MotionConfig`,
  wrapped around `<main>` in `app/page.tsx` only.
- `globals.css` — `.shine`, `.lift` and the `shine` keyframes, under
  "Motion — the CSS half".

### Performance, and why it is built this way

- **`LazyMotion` + `domAnimation` + `m.*`**, not `motion.*`. It ships the
  animation features the page uses (animate, variants, in-view) and leaves
  out layout animation and drag. `strict` makes a stray heavy `motion.div`
  throw in development. The provider wraps `/` only, so no other route pays
  for it.
- **Compositor-only properties.** Entrances move `opacity` and `transform`
  (`y`, `scale`, `scaleX`). `filter: blur()` is used once, on the hero
  headline — never on a grid.
- **The LCP image never fades.** `settle` scales the hero photo but leaves
  its opacity at 1. An element held at `opacity: 0` is not painted, and not
  counted as LCP, until it fades in.
- **Loops and hovers are CSS.** The sheen is a `transform` keyframe on a
  pseudo-element, and the lift is a `:hover` transition. Neither runs
  JavaScript per frame or needs hydration. The lift is behind
  `@media (hover: hover)`, so touch screens don't get a stuck raised card.
- **Observers disconnect.** `once: true` — after an element reveals, it stops
  being watched.
- **`amount: "some"`, not a fraction.** A staggered grid is one observed
  element, and on a phone the one-column best-seller grid is ~3000px tall. A
  fractional threshold (0.2 → 600px on screen) can exceed a short or
  landscape viewport, and the grid would then never reveal. This was caught
  while testing the first version, which used `amount: 0.2`.

### Accessibility and robustness

- **Reduced motion.** `MotionConfig reducedMotion="user"` honours the OS
  setting: transforms are dropped and only the opacity fades remain. The CSS
  half turns the sheen off and the lift into a no-op under
  `prefers-reduced-motion: reduce`.
- **No JavaScript.** Every animated element carries `data-motion`. A
  `<noscript><style>` — `<NoJsMotionReset />` (`components/motion/
  no-js-motion-reset.tsx`), rendered by every page that animates (`/`,
  `/about`) — resets them to `opacity: 1; transform: none; filter: none`, so
  nothing stays at its hidden starting state. It lived inline in `page.tsx`
  until `/about` became the second animated page.

### Magic UI / React Bits, and why they are not installed

The pattern follows two Magic UI components — **BlurFade** (the in-view
fade-and-rise every reveal here is) and **Shiny Button** (the CTA sheen) —
but neither library is installed. Both publish copy-in components built on
the full `motion.*` API, which defeats `LazyMotion`'s saving and would
throw under `strict`. Writing the two patterns against `m.*` (and the sheen
as pure CSS) keeps what they look like and drops what they cost. To add
another effect from either catalogue, port it the same way: `m.*` instead
of `motion.*`, variants from `variants.ts`, tokens from
`constants/motion.ts`.

---

## Centered

Every section heading is centred (`SectionHeading`: `mx-auto max-w-prose
text-center`) — the centred design the page was asked for earlier, kept
through the rebuild.

**The hero is the one exception, by request.** Its text column is centred
only while the photo stacks under it (phones and tablets). From `lg` up,
where the text sits beside the photo, it is start-aligned — the right edge,
in RTL: `lg:items-start lg:text-start` on the column, `lg:justify-start` on
the button row and the trust line. Logical `start`, not `right`, so the
alignment follows the page direction rather than a hard-coded side.

---

## Tone

Warm, simple, Egyptian-friendly Arabic — short sentences, one idea per
block, in the same voice as the research's key messages. `/about` now
speaks in that voice too — it is built from the founder's own text.
`/contact` is still in the more formal register it was written in.

---

## `/about` — the brand story, in the founder's words

Rebuilt 2026-10-06 around the owner's own text (`misk_business_analysis.md`
§1.1) and in the landing page's design, so `/about` reads as the same site
as `/` rather than an older sibling.

**The text is one constant.** `BRAND_ABOUT` in `src/constants/about.ts`
holds the founder's paragraph **verbatim**, split at its sentence breaks
(`origin`, `craft`, `belief`, `signOff`) plus `full` — all four joined.
`/about` lays the pieces out; the footer prints `full`. Neither component
holds a copy of the words, so the page and the footer cannot drift apart.
The rest of `/about`'s fixed copy (`ABOUT_HERO`, `ABOUT_STORY`,
`ABOUT_VALUES`, `ABOUT_CTA`, `ABOUT_SEO`) lives in the same file, the way
`constants/landing.ts` holds `/`.

| # | Section | Component | Built from |
| --- | --- | --- | --- |
| 1 | Hero — «عطر يشبهك، بسعر يريّحك.» as the page's `<h1>`, the story's first sentence under it | `about/about-hero.tsx` | `BRAND_ABOUT.origin` + the sign-off |
| 2 | «العطر الجيد مش لازم يكلفك ثروة.» — the story beside a gold-ringed quote panel (the sign-off, attributed to محمد يونس) | `about/about-story.tsx` | `BRAND_ABOUT.craft` / `.belief` / `.signOff` |
| 3 | «فخامة وثبات، من غير تمن الاسم» — three value cards: handmade, chosen materials in balanced measures, quality for everyone | `about/about-values.tsx` | the founder's three claims, unpacked |
| 4 | «عارفين إيه اللي جوه كل إزازة» — the quality claims | `landing/quality.tsx` — **reused** | `constants/landing.ts` |
| 5 | «كحولي ولا دهن خالص؟» — alcohol vs. pure oil, live "from" prices | `landing/format-comparison.tsx` — **reused** | **database** — `getFormatPriceFloors()` |
| 6 | Closing band → `/store`, plus an outline «تواصل معنا» → `/contact` | `about/about-cta.tsx` | `ABOUT_CTA` |

**Same design, on purpose.** The story section is the audience sections'
two-column layout (text beside a `brand-sheen` panel with two hairline gold
rings, stacking and centring below `lg`); the values sit on the same tinted
`bg-secondary/40` band `/` alternates to; headings go through the landing
page's `SectionHeading`; the closing band is `FinalCta`'s band with a second
button. The page runs under `MotionProvider` with the same `Reveal` /
`Stagger` entrances (the hero staggers in on mount, like `/`'s), plus
`<NoJsMotionReset />`.

**Reused, not rewritten.** The old `/about` had its own `Craft` and `Lines`
sections — a second, more formal copy of the claims `Quality` and
`FormatComparison` already make on `/`. Two wordings of one fact is one
wording too many, so `/about` now renders those two components directly.
`FormatComparison` needs the price floors, which makes `/about` **`async`**
for the first time: one read, straight to `catalog.service` (the
storefront's documented read exception).

**What was dropped.** The old page's category chips hard-coded the
`youth` / `women` / `men` slugs — the same hard-coded list `/` replaced with
DB-driven cards ("Categories are data now"), and already out of date against
the live categories. The header's «المتجر» dropdown and the footer both list
the real categories, so `/about` no longer repeats them.

The sections live in `components/marketing/about/` (barrel `index.ts`),
beside `landing/` — not private to `app/about/page.tsx` any more, now that
the page is six sections and the same shape as `/`.

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

## `components/marketing/` — the footer, and now the landing sections

`components/marketing/site-footer.tsx` came first: `SiteFooter`, extracted
the day `/about` and `/contact` needed the same footer `/` had. It is
`async` now — its category links are `listCatalogCategories()`, the same
read the header's «المتجر» dropdown uses, instead of a hard-coded
Youth / Women / Men list.

Under the brand mark the footer prints the founder's «عن مِسك» paragraph
(`BRAND_ABOUT.full`, `constants/about.ts` — the same sentences `/about` is
built from), and its bottom row carries the three legal pages
(`LEGAL_LINKS`, `constants/legal.ts`; see [`legal-pages.md`](./legal-pages.md)).

`components/marketing/landing/` came with the rebuild. The old page kept
`Hero`, `CategoryStrip`, `Latest` and `Craft` as private functions in
`page.tsx`, on the reasoning that nothing else rendered them. Nine sections
plus JSON-LD is past the point where one file reads well, so each section
got its own file — they are still rendered only by `/`, which is why they
sit in a `landing/` folder rather than loose in `marketing/`. `/about`'s
sections followed in their own `about/` folder when it was rebuilt in the
same design, and `legal/` holds the one layout the three legal pages share.

**Why not `StoreFooter`.** `components/store/store-chrome.tsx`'s
`StoreFooter` is deliberately minimal — brand mark, the three policy links
(added with the legal pages — `/checkout` is where a shopper checks the
refund rules) and a copyright line —
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

---

## Files

| File | What it is |
| --- | --- |
| `src/app/page.tsx` | `/` — `metadata`, the four parallel reads, the section order |
| `src/components/marketing/landing/*.tsx` | The sections (`audience-section.tsx` renders three) + `SectionHeading` + `LandingJsonLd`, behind `index.ts` |
| `src/components/marketing/landing/hero-carousel.tsx` | `HeroCarousel` — the hero's RTL embla carousel (Client Component) |
| `src/components/motion/*` | `MotionProvider`, `Reveal` / `Stagger` / `StaggerItem`, the four variants — see "Motion" |
| `src/constants/motion.ts` | Motion tokens — easing, durations, rise, stagger, viewport rule |
| `src/app/globals.css` | `.shine` / `.lift` + the `shine` keyframes — the CSS half of the motion pattern |
| `src/constants/landing.ts` | Every fixed string on `/` (incl. `AUDIENCES` — points, panel captions), `LANDING_SEO`, `SEGMENT_ICON_KEYS` + the icon/image predicates |
| `src/lib/site-url.ts` | `getSiteOrigin()` — absolute origin for the JSON-LD |
| `src/app/about/page.tsx` | `/about` — `async`; one read (`getFormatPriceFloors`), section order, `MotionProvider` |
| `src/components/marketing/about/*.tsx` | `/about`'s own sections — hero, story, values, closing band — behind `index.ts` |
| `src/constants/about.ts` | `BRAND_ABOUT` (the founder's text, verbatim — also the footer's) + every fixed string on `/about` |
| `src/components/motion/no-js-motion-reset.tsx` | `NoJsMotionReset` — the `<noscript>` rule every animated page renders |
| `src/app/contact/page.tsx` | `/contact` — a plain Server Component, no data fetching of its own |
| `src/components/marketing/site-footer.tsx` | `SiteFooter` — async; category links from `listCatalogCategories()`, the founder's paragraph, the legal links |
| `src/components/store/store-chrome.tsx` | `StoreHeader` — reused here, not reimplemented |
| `src/components/store/store-nav.tsx` | `StoreNavMenu` — has the «عن مِسك» dropdown |
| `src/components/store/store-product-card.tsx` | `StoreProductCard` — reused for the best-seller row |
| `src/components/shared/social-icons.tsx` | `FacebookIcon` / `InstagramIcon` — lucide has no brand icons for either |
| `src/services/catalog.service.ts` | `listSegmentCategories` · `listBestSellers` · `getFormatPriceFloors` · `listCatalogCategories` |
| `src/constants/contact.ts` | `CONTACT` — `/contact` and the `Organization` JSON-LD |
| `prisma/migrations/20260930120000_category_segment_copy/` | The four `Category.segment*` columns |
| `scripts/seed-categories.mts` | Back-fills the founding segments' card copy |

---

## What is deliberately not here

**Social proof.** There is no review table, so there is no reviews section —
the page does not invent testimonials. When real reviews exist: add a
`Review` model (product, customer, rating, text, `isPublished` for
moderation), a `listPublishedReviews()` read, and a section that returns
`null` on an empty list, slotted between the brand story and the closing
band. `Product` JSON-LD can then carry a real `aggregateRating`.

**A hand-picked "featured" list.** "Most ordered" is measured; "featured" is
editorial and would need `Product.isFeatured` plus an admin toggle.

**Segments as data.** The three audience cards are copy in
`constants/landing.ts`, not rows. If the owner wants to add a fourth segment
from the admin console one day, that is a small `Audience` table — but a new
audience is a marketing decision made rarely, and a code edit is the right
amount of friction for it today.

**A relevance-ranked `/search`.** The hero's search box reuses `/store`'s
existing `contains` search; a ranked search page is `search-feature.md`.

---

## Content still needed

These are the placeholders the rebuild left for the owner, not the code:

- **Original product descriptions.** The cards (and the JSON-LD) print each
  perfume's `description` as the admin wrote it. The live catalogue's
  descriptions are currently copied from a fragrance database — release
  years, perfumer credits and third-party brand names. Rewrite them in
  `/admin/products` as short, original copy; this is both a content-quality
  and an SEO (duplicate content) issue.
- **Hero photos of our own.** The hero carousel shows the best-sellers'
  product photos. Where those are another brand's bottle, upload an
  own-brand shot to that product.
- **Card copy for admin-created categories** — «الدهان والمسك» and «للجنسن»
  show the fallback line until their `segment*` fields are filled in the
  category dialog.
- **Keywords** in `LANDING_SEO`, and `NEXT_PUBLIC_SITE_URL` in production.

---

## Extending this

**A section.** Add its copy to `constants/landing.ts`, its component to
`components/marketing/landing/` (open it with `SectionHeading` so the heading
order stays `h2`), export it from `index.ts`, and place it in `page.tsx`.
If it reads data, the read goes in `catalog.service.ts` and joins the
`Promise.all`.

**A new category icon.** Add the key to `SEGMENT_ICON_KEYS` and the lucide
component to `ICONS` in `category-segments.tsx` — TypeScript fails the build
until both are done (`Record<SegmentIconKey, LucideIcon>`).
