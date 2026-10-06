# Legal Pages — Terms, Privacy, Refunds

`/terms`, `/privacy` and `/refunds` — the shop's terms and conditions, its
privacy policy, and its cancellation / return / refund policy. Three routes,
one layout, and all the words in one constants file. Both footers link to
all three.

> **Not legal advice.** The pages were drafted from how the code actually
> behaves and from the owner's policy decisions (2026-10-06). They cite
> Egypt's Consumer Protection Law (181/2018) and Personal Data Protection
> Law (151/2020) by name. A lawyer should read them before the shop relies
> on them.

## Related documents

- [`landing-page.md`](./landing-page.md) — the marketing pages these sit beside, the `SiteFooter` that links them, and the shared header
- [`checkout-orders-feature.md`](./checkout-orders-feature.md) — **built** — cash on delivery, the seven checkout fields, and the order statuses the terms and the refund policy quote
- [`cart-feature.md`](./cart-feature.md) — the cart cookie the privacy policy discloses
- [`admin-access-control.md`](./admin-access-control.md) — Clerk, the sign-in provider the privacy policy names
- [`store-feature.md`](./store-feature.md) — `StoreFooter`, the second footer that carries the links
- [`misk_business_analysis.md`](./misk_business_analysis.md) — the brand, its founder, and its made-to-order model

---

## Routes

```text
/terms      الشروط والأحكام        — 12 sections
/privacy    سياسة الخصوصية         — 9 sections
/refunds    الاسترجاع والاسترداد    — 4 key facts + 7 sections
```

Three plain folders under `src/app/`, the same as `/about` and `/contact`:
each `page.tsx` is a few lines — `metadata`, `StoreHeader`, `<LegalPage
doc={…} />`, `SiteFooter`. Public, static, no data fetching.

---

## One layout, three documents as data

The copy is **data**, not markup: `src/constants/legal.ts` exports `TERMS`,
`PRIVACY` and `REFUNDS`, each a `LegalDoc`:

| Field | What it is |
| --- | --- |
| `eyebrow` / `title` / `intro` | The header — `title` is the page's `<h1>` |
| `description` | `metadata.description` |
| `highlights?` | Key facts as cards above the sections (only `/refunds` has them: window, condition, return shipping, refund method) |
| `sections` | `{ id, heading, blocks }[]` — `id` is the `#anchor`; a block is a paragraph string or `{ list, ordered? }` |

`components/marketing/legal/legal-page.tsx` (`LegalPage`) renders any of
them: header with «آخر تحديث», the highlight cards, numbered sections beside
a sticky contents list, then a contact block and links to the other two
pages.

**Why data instead of three hand-written pages.** Three pages written by
hand drift — one grows a contents list, another a different heading size.
More importantly, the facts inside them are shared: the return window, the
refund time and the order status names appear on two pages each, and in more
than one sentence on `/refunds`. As constants they are written once:

| Constant | Value | Quoted in |
| --- | --- | --- |
| `RETURN_WINDOW_DAYS` | 14 | `/terms` (cancellation), `/refunds` (highlights, description, four sections) |
| `REFUND_WORKING_DAYS` | 7 | `/refunds` (highlights, description, refund section) |
| `DAMAGE_REPORT_HOURS` | 48 | `/refunds` — a request to report breakage fast, not a cut-off |
| `ORDER_STATUS_LABEL.*` | «قيد التحضير» etc. | `/terms` (the order stages), `/terms` + `/refunds` (when cancelling stops being free) |
| `LEGAL_UPDATED_AT` | `2026-10-06` | «آخر تحديث» on all three — **bump it with any wording change** |
| `LEGAL_LINKS` | the three routes + labels | `SiteFooter`, `StoreFooter`, each page's "other policies" row |

The status names come from `constants/design-system.ts`, the same labels
`/account/orders` shows — so "free to cancel until «قيد التحضير»" names the
exact badge a shopper sees on their order.

**The contact block is appended by the layout**, from `constants/contact.ts`
(WhatsApp, phone, email), not written into each document — all three pages
always point at the same, current channels.

---

## The owner's policy decisions (2026-10-06)

These were business decisions, asked of the owner rather than invented:

| Question | Decision |
| --- | --- |
| Return window, and what can come back | **14 days** from delivery, **sealed and unused** in its original packaging. A broken, leaking or wrong bottle can come back within the same 14 days even if opened |
| Who pays return shipping | **Depends on fault** — Mesk if the item is damaged or wrong; the customer for a change of mind |
| How a cash-on-delivery refund is paid | **Vodafone Cash or InstaPay**, within **7 working days** of receiving and inspecting the return |
| When cancelling stops being free | **Free until the order is «قيد التحضير»** (`IN_PRODUCTION`) — after that the perfume has been mixed, and the return rules apply instead |

Three smaller choices were made in drafting and are worth the owner's
confirmation: a damaged / wrong item gets the shopper's choice of a
replacement or a full refund; a change-of-mind refund is the **perfume's
price** (the original delivery fee, if any, is not refunded); and shipping
fees are described as "explained before the order is confirmed", since the
code has no shipping-fee field to quote.

---

## What the pages claim, and where it is true

Every factual line is a claim about the code. If the code changes, the line
must change with it:

| Claim | Where it is true |
| --- | --- |
| Cash on delivery only; no card data collected | `checkout-orders-feature.md` — no payment step, no `paymentMethod` |
| Browsing and the cart need no account; ordering does | `/checkout` is signed-in only (an `Order` needs a `User`) |
| Delivery inside Egypt, every governorate | `EGYPT_GOVERNORATES` (27) is the only address the checkout accepts |
| We collect name + email (account); phone, alternate phone, governorate / city / center / street / building (order) | `User` + the `Order.shipping*` snapshot in `prisma/schema.prisma` |
| The cart lives in a cookie on your device | `cart-feature.md` — the `httpOnly` cart cookie, no `Cart` table |
| Sign-in is handled by Clerk; we never see the password | `@clerk/nextjs` — the app stores a `clerkId`, never a password |
| Theme preference is stored in the browser | `next-themes` (localStorage) |
| **No analytics, no ad cookies, no third-party trackers** | No analytics package in `package.json`. **Adding one (Vercel Analytics, GA, a pixel) means editing the cookies section of `/privacy` first** |
| Order stages: بانتظار التأكيد → مؤكّد → قيد التحضير → تم الشحن → تم التسليم | `ORDER_STATUSES` |
| The order number is at the top of the order page | `/account/orders/[id]` prints `#<last 6 of id>` |
| Some perfumes are inspired by well-known brands; Mesk is independent and these are not the originals | The landing page's "ريحة مطابقة للبراند" claims — the terms say plainly what that means |

Things the pages deliberately **do not** promise, because nothing in the
code backs them: a delivery time, a shipping price, a self-service cancel
button (cancelling is a WhatsApp / phone message — there is no shopper-side
cancel action), or e-mail notifications.

---

## Layout details

- **No motion.** A policy is read, not browsed; text that fades in as you
  scroll is text that is briefly not there. These pages do not use
  `MotionProvider`.
- **Contents list `lg`+ only**, sticky at `top-24` (clear of the sticky
  header). Below `lg` it would be twelve links between the shopper and the
  first section.
- **Sections are `scroll-mt-24`**, so a `#anchor` jump lands below the
  header instead of under it.
- **«آخر تحديث» is a written-out date** («6 أكتوبر 2026»), not
  `formatDate`'s numeric `06/10/2026` — a bare d/m/y reads as June to anyone
  used to m/d/y. It is formatted in UTC: the constant is a bare date (UTC
  midnight), and formatting it in a timezone west of Greenwich would print
  the day before.
- Lists use a gold marker; the return steps are an `<ol>`.

---

## Both footers link here

- **`SiteFooter`** (`/`, `/about`, `/contact`, the legal pages): in the
  bottom row, between the copyright and the badge.
- **`StoreFooter`** (`/store`, `/cart`, `/checkout`, `/account/*`): it was
  only a brand mark and a copyright line; the links were added because the
  checkout is exactly where a shopper looks for the refund rules.

---

## Files

| File | What it is |
| --- | --- |
| `src/app/terms/page.tsx` | `/terms` |
| `src/app/privacy/page.tsx` | `/privacy` |
| `src/app/refunds/page.tsx` | `/refunds` |
| `src/components/marketing/legal/legal-page.tsx` | `LegalPage` — the one layout |
| `src/components/marketing/legal/index.ts` | Barrel |
| `src/constants/legal.ts` | `TERMS` / `PRIVACY` / `REFUNDS`, the policy constants, `LEGAL_LINKS`, the `LegalDoc` type |
| `src/constants/routes.ts` | `ROUTES.terms` / `.privacy` / `.refunds` |
| `src/components/marketing/site-footer.tsx` | Links in the bottom row |
| `src/components/store/store-chrome.tsx` | `StoreFooter` — links added |
