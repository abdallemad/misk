# Folder Structure

## Related documents

- [`business-analysis.md`](./business-analysis.md) — product scope and requirements
- [`erd.md`](./erd.md) — entity relationships (Category, Product, ProductVariant, Cart, Order, User)
- [`tech-stack.md`](./tech-stack.md) — Next 16, Clerk auth, Cloudinary (product + category images — see `image-uploads.md`), shadcn/Base UI, Prisma, Stripe
- [`storefront-layout.md`](./storefront-layout.md) — the storefront shell (`(marketing)` header, `(shop)` header + category nav), the shared brand lockup, the cart drawer and the account menu
- [`landing-page.md`](./landing-page.md) — **built** — `/` (hero + search, category strip, a real "latest perfumes" grid), `/about` (the manufacturing story in full) and `/contact` (WhatsApp/Instagram/Facebook/email/phone)
- [`store-feature.md`](./store-feature.md) — **built** — `/store` (the public catalogue: browse by category, search, filter by type, sort, page) and `/store/[slug]` (one perfume: gallery, the Add to Cart buy box, ingredients). Query-param driven, follows the list-page convention. The `/shop/*` docs below are the separate, still-unbuilt path-based storefront
- [`image-uploads.md`](./image-uploads.md) — **built** — where a product photo or category picture goes (Cloudinary, via `lib/cloudinary.ts` + `lib/uploads.ts`), and the `public/image.png` default the storefront falls back to
- [`catalog-feature.md`](./catalog-feature.md) — `/shop`, the flat public perfume listing and its derived filter facets (category, type, size)
- [`category-feature.md`](./category-feature.md) — `/shop/[category]`, browse by Youth / Women / Men
- [`product-page.md`](./product-page.md) — `/shop/[category]/[slug]`, the product detail page: gallery, ingredients, and the variant selector that branches by product type (bottle vs. raw oil)
- [`search-feature.md`](./search-feature.md) — `/search`, name/description search across perfumes
- [`cart-feature.md`](./cart-feature.md) — **built** — `/cart` and Add to Cart from `/store`. The cart is a cookie, not a `Cart` table — the document explains why, and why checkout did not end up needing one either
- [`checkout-orders-feature.md`](./checkout-orders-feature.md) — **built** — `/checkout` (phone(s) + Egyptian address — governorate dropdown, city, center, street, building — then place a cash-on-delivery order) and `/account/orders` (the shopper's own order history + detail)
- [`payments-feature.md`](./payments-feature.md) — Stripe Checkout and `POST /api/webhook`: the only route handler in the app
- [`auth-callback.md`](./auth-callback.md) — `/auth-callback`, the sign-in landing strip that mirrors the Clerk user into the `User` table
- [`admin-dashboard.md`](./admin-dashboard.md) — the `/admin` console and its reusable components
- [`admin-access-control.md`](./admin-access-control.md) — how `/admin` is locked down
- [`categories-feature.md`](./categories-feature.md) — admin CRUD for Youth / Women / Men
- [`products-feature.md`](./products-feature.md) — **built** — admin CRUD for the sellable entity: gallery upload and the inline variant-collection editor (size rows vs. weight rows, depending on product type). The ingredients editor is deliberately not in it yet; that document says why
- [`orders-feature.md`](./orders-feature.md) — **built** — admin read-first: the orders list, one order's lines + shipping-address snapshot, and a status control. Orders are created by checkout, not the console
- [`customers-feature.md`](./customers-feature.md) — **built** — admin read-first: accounts mirrored from Clerk and their order history, with one write — promoting/demoting a customer's role (Clerk-first, mirror follows)
- [`database-seeding.md`](./database-seeding.md) — **built** — `npm run seed-dev`: an idempotent, deterministic mock catalog + customers + orders (with shipping addresses) for development

## Overview

The project follows a **Layer-Based Architecture**.

The goal is to separate responsibilities between presentation, business logic, and data access while keeping the project scalable and maintainable — the same flow applies whether the feature is a customer browsing the shop or an admin editing a product.

Each feature follows the same development flow:

```text
UI
↓
Hook
↓
Server Action
↓
Service
↓
Prisma
↓
Database
```

---

# Project Structure

```text
src/
│
├── app/
│
├── components/
│
├── actions/
│
├── services/
│
├── hooks/
│
├── schemas/
│
├── lib/
│
├── types/
│
├── utils/
│
└── constants/
```

---

# app/

Contains all application routes using the Next.js App Router.

```text
app/
│
├── about/                  #   /about — built — landing-page.md. The
│                            #   manufacturing story in full. A plain folder,
│                            #   not `(marketing)/about` — the sketched group
│                            #   never got built (see the root page.tsx below)
│
├── contact/                #   /contact — built — landing-page.md. WhatsApp
│                            #   / Instagram / Facebook / email / phone, one
│                            #   card each — all placeholder values
│                            #   (constants/contact.ts)
│
├── store/                  #   /store  — built — the public catalogue.
│   ├── layout.tsx           #   storefront header + footer (StoreHeader/Footer)
│   ├── loading.tsx          #   skeleton for the catalogue query
│   ├── page.tsx             #   filter by category / search / type / sort / page
│   └── [slug]/              #   /store/[slug] — one perfume: gallery, the
│       └── page.tsx         #     buy box (AddToCartForm), ingredients —
│                            #     store-feature.md. A plain folder, same
│                            #     reasoning as admin/: the URL really is /store
│
├── cart/                   #   /cart — built — cart-feature.md. Shares the
│   ├── layout.tsx           #   storefront chrome with store/ (its own
│   └── page.tsx             #   layout, not nested — same reasoning as store/)
│
├── checkout/               #   /checkout — built — checkout-orders-feature.md.
│   ├── layout.tsx           #   Signed-in only (proxy.ts) — phone(s) + an
│   └── page.tsx             #   Egyptian address (governorate dropdown/city/
│                            #   center/street/building), then "تأكيد الطلب".
│                            #   Own plain folder, same reasoning as store/
│                            #   and cart/
│
├── account/                #   /account/* — built (orders only) — same
│   ├── layout.tsx           #   storefront chrome. Signed-in only (proxy.ts)
│   └── orders/               #   /account/orders + [id] — checkout-orders-feature.md.
│       ├── page.tsx          #   The shopper's own order history, no paging
│       └── [id]/page.tsx     #   One of the shopper's own orders — 404 if not
│                            #   theirs (getOrderForUser scopes the query)
│
├── (shop)/                  # header + category nav — see storefront-layout.md
│                            #   NOT built yet — the path-based storefront the
│                            #   docs plan, distinct from /store, /cart and
│                            #   /checkout above
│   ├── layout.tsx
│   ├── shop/
│   │   ├── page.tsx          #   /shop                       — catalog-feature.md
│   │   └── [category]/
│   │       ├── page.tsx      #   /shop/[category]             — category-feature.md
│   │       └── [slug]/
│   │           └── page.tsx  #   /shop/[category]/[slug]      — product-page.md
│   ├── search/                #   /search                     — search-feature.md
│   └── account/
│       └── profile/           #   /account/profile — still unbuilt; orders
│                              #   moved above once it existed for real
│
├── admin/                   # the dashboard — admin-dashboard.md
│                            #   a plain folder, not a route group: the URL
│                            #   really is /admin, so a group would only
│                            #   have to re-add the segment
│
├── api/
│   └── webhook/                #   POST /api/webhook — payments-feature.md
│
├── sign-in/  sign-up/  auth-callback/   # auth-callback.md
│
├── page.tsx                  #   / — built — landing-page.md. A plain root
│                              #   file, sibling to about/ and contact/ above
│                              #   rather than a `(marketing)` route group —
│                              #   a group would only strip the segment and
│                              #   force it back for one route. Shares
│                              #   `StoreHeader` (components/store/), the
│                              #   same chrome every other storefront page
│                              #   uses
│
├── layout.tsx                # <html>, <body>, Clerk + Query providers
│
└── not-found.tsx
```

`api/webhook/route.ts` is the **only Route Handler in the application**.
Everything else the browser calls is a Server Action, because a Server Action
carries the session. A webhook has no session — it is authenticated by a
signature over the raw request body — so it needs a real HTTP endpoint. See
[`payments-feature.md`](./payments-feature.md).

Route groups (the parenthesised folders) organise routes without appearing in
the URL, so each group can own a layout without nesting the URL a level
deeper. `(marketing)` and `(shop)` are split because the marketing pages are a
plain header, while every shop page needs the category nav (Youth / Women /
Men) and the cart icon.

### Responsibilities

- Routing
- Layouts
- Server Components
- Metadata
- Route Groups
- Error Pages

Business logic should never live here.

---

# components/

Reusable UI components.

```text
components/
│
├── ui/
│
├── shared/
│
├── forms/
│
├── layout/
│
├── marketing/
│
├── store/         # built — /store + /store/[slug] + /cart's body: chrome
│                  #   (StoreHeader renders StoreNavMenu on sm+ — the
│                  #   header's hover-dropdown nav, over components/ui/
│                  #   navigation-menu.tsx — and MobileNav below sm, a
│                  #   slide-out Sheet with the same links flattened),
│                  #   category chips, filter bar, product grid +
│                  #   card, product gallery, AddToCartForm, StoreCardActions,
│                  #   cart-content.tsx + cart-line-item.tsx + clear-cart-
│                  #   button.tsx. store-feature.md, cart-feature.md — see
│                  #   the "cart/" note below for why the cart UI lives here
│                  #   rather than in a separate components/cart/
│
├── checkout/      # built — checkout-form.tsx + checkout-summary.tsx.
│                  #   checkout-orders-feature.md
│
├── account/       # built — account-orders-table.tsx. The order-detail page
│                  #   under app/account/orders/[id] reuses shared/
│                  #   order-summary.tsx rather than needing one here too
│
├── product/
│
├── search/
│
├── cart/          # NOT built — see the note under this heading below
│
├── orders/        # NOT built — the order-detail line-item table both
│                  #   /admin/orders/[id] and /account/orders/[id] use lives
│                  #   in shared/order-summary.tsx instead; nothing else here
│                  #   has needed a components/orders/ of its own yet
│
└── admin/
```

### ui/

Reusable Shadcn UI wrappers.

Examples:

- Button
- Input
- Card
- Dialog
- Badge
- Select (used for size / weight pickers)
- Form / Field / FieldError — the error-map trio every admin form is built
  from; see [`admin-dashboard.md`](./admin-dashboard.md)
- Dropdown Menu — Base UI's click-triggered `Menu`, for an action list
  attached to one row (a status control, a delete confirm)
- Navigation Menu — built, `navigation-menu.tsx`. Base UI's separate
  `NavigationMenu` primitive, whose trigger opens on **hover**, not just
  click — what the storefront header's «المتجر» / «حسابي» dropdowns are built
  from (`store-nav.tsx`), because `Menu` above does not open on hover. See
  [`store-feature.md`](./store-feature.md)
- Sheet — `sheet.tsx`, scaffolded from the start but not actually rendered
  anywhere until `store-nav.tsx`'s mobile twin, `mobile-nav.tsx`, needed a
  slide-out drawer for the header nav below the `sm` breakpoint. See
  [`store-feature.md`](./store-feature.md)

---

### shared/

Domain-neutral components used across multiple pages — they take data and
callbacks and know nothing about any entity.

```text
shared/
│
├── pagination.tsx           # built — Prev/Next paging, <Link>-based, RTL,
│                            #   hidden on one page. Used by /store; the admin
│                            #   lists still ship their own AdminPagination
├── use-list-navigation.ts   # built — the "use client" hook every filter bar
│                            #   uses to router.push new query params. Moved
│                            #   here from admin/shared/list-controls.tsx,
│                            #   which now re-exports it
├── status-badge.tsx         # built — order status, stock status
├── order-summary.tsx        # built — one order's line items + total. Used
│                            #   by /admin/orders/[id] AND /account/orders/[id]
│                            #   — checkout-orders-feature.md
├── brand-lockup.tsx  brand-loader.tsx  auth-nav.tsx  theme-*.tsx   # built
├── social-icons.tsx         # built — FacebookIcon / InstagramIcon, drawn by
│                            #   hand (lucide-react ships no brand icons) for
│                            #   /contact — landing-page.md
├── empty-state.tsx  logo-avatar.tsx  search-input.tsx              # not built —
│                            #   /store reuses components/ui/empty.tsx instead
└── index.ts
```

`pagination.tsx` and `use-list-navigation.ts` were promoted here by
[`store-feature.md`](./store-feature.md) so the storefront catalogue and the
admin console's filter bars share one implementation:

```ts
import { AdminPagination } from "@/components/admin/shared"              // admin (its own copy, for now)
import { Pagination } from "@/components/shared"                         // storefront
import { useListNavigation } from "@/components/shared/use-list-navigation"  // both
```

---

### cart/

**Empty — the built cart's components live in `components/store/` instead.**
This folder sketched `AddToCartButton`, `CartView`, `CartLineItem` before the
feature existed. The picker turned out to be `AddToCartForm`'s `<select>`
(one control does what a size-vs-weight branching picker was going to), and
`CartView`/`CartLineItem` became `cart-content.tsx` / `cart-line-item.tsx` —
kept beside the rest of the storefront rather than split into a same-purpose
sibling folder, since `/cart` is one more storefront page, not a separate
surface. See [`cart-feature.md`](./cart-feature.md).

---

### product/ and search/

The two public catalog surfaces.

`product/` holds the catalog grid (`CatalogView`, `ProductCard`), the filter
panel `CatalogFilters` (category / product type / size), the product detail
building blocks (`ProductGallery`, `ProductInfo`, `IngredientsList`), and the
`VariantSelector` — the one component that branches by `product.type`:

- `ALCOHOL_BASED` → renders **Size** (30ml / 50ml / 100ml)
- `RAW_OIL` → renders **Weight** (5g / 8g / 12g) only

`search/` holds `SearchView` and `ProductResultCard`, reusing `ProductCard`
so search results and the catalog look identical.

---

### marketing/

Built — but not the way this section originally sketched it. The plan below
predates `/`, `/about` and `/contact` all being real pages; only one file
exists here today.

```text
marketing/
│
└── site-footer.tsx          # built — SiteFooter, shared by /, /about and
                              #   /contact — landing-page.md
```

> **The four-file sketch above never happened, and likely will not as
> written.** `Hero`, `CategoryStrip` and `Latest` (the "featured perfumes,
> category highlights" this doc predicted as `landing-sections.tsx`) turned
> out to be private functions inside `app/page.tsx` instead — nothing outside
> that one page renders them, so splitting them into their own file would be
> indirection with no second caller. `/about`'s sections are similarly
> private to `app/about/page.tsx`, written as their own, more detailed
> definitions rather than an import of `/`'s (see
> [`landing-page.md`](./landing-page.md)). `site-footer.tsx` is the one
> section that *did* need to move here — the day `/`, `/about` and
> `/contact` all needed the identical footer. `legal-sections.tsx` has no
> built counterpart; there is no terms/privacy page yet.

---

### forms/

All forms in the application, plus the shared field primitives they are built
from.

```text
forms/
│
├── form-field.tsx    # TextField, TextareaField, SelectField, ImageUploadField
│
├── product-form.tsx        # includes the inline variant-collection editor
├── category-form.tsx
└── checkout-form.tsx
```

Forms stay presentational: they receive `defaultValues` and an `onSubmit`, and
the caller owns the mutation. That keeps the same component usable in a dialog
and on a full page.

`product-form.tsx` is the one form with branching fields: selecting product
type (`ALCOHOL_BASED` vs `RAW_OIL`) swaps the variant rows the inline editor
renders — size rows, or weight rows — before the product is even saved. See
[`products-feature.md`](./products-feature.md).

> **Both built forms live under `components/admin/<feature>/`, not here.**
> They are not presentational: each owns a `useActionState` bound to its own
> Server Action, and neither is reused outside its console section. Moving
> them into a shared `forms/` folder would separate a form from the action it
> is the client half of, to no one's benefit. This folder is the right home
> for a form two surfaces render — the checkout form, when it exists.

State is managed by **react-hook-form**, validated by the entity's Zod schema
through `standardSchemaResolver`, so the form and the Server Action enforce
identical rules.

> **Not yet installed either, and the product form did not change that.**
> `react-hook-form` is not a dependency. Both built forms are uncontrolled —
> plain `defaultValue` inputs read through the browser's own `FormData`, with
> `useActionState` for the pending and error states — and their Zod schemas
> run only on the server, which keeps the "identical rules" property above
> without a second copy of them in the browser. The trade is a round trip to
> see a message.
>
> The product form was predicted to be the one that pulled it in. It did not
> need to. The dependency turned out to be on the form's **structure**
> (`productType` decides which selects exist) rather than on any field's
> *value*, and structure is cheap to hold by hand — and the "identical rules"
> property the library was wanted for came for free, because the Zod schema
> reads a `FormData` and the browser has one. `parseProductForm` runs in the
> browser on submit and again in the Server Action, from the same module.
>
> The prediction comes true the day a form needs validation *as you type*
> across fields, rather than on submit. See
> [`products-feature.md`](./products-feature.md).

---

### layout/

Application layout components.

Examples:

- Navbar (marketing)
- Category Nav + Cart Icon (shop)
- Footer
- Header

---

### admin/

Admin dashboard components, organised by feature rather than by type.

```text
admin/
│
├── layout/       # sidebar, header, mobile nav, breadcrumbs, user menu
│
├── categories/   # built — table + form dialog + delete dialog
│                 #   categories-feature.md
│
├── products/     # built — table + filters + form page + gallery + variant editor
│                 #   products-feature.md
│
├── customers/    # built — table + filters + order history + role control
│                 #   customers-feature.md
│
├── orders/       # built — table + filters + status control + line-item summary
│                 #   orders-feature.md
│
└── shared/       # page container, page header, section card, stat tile,
                  #   AdminPagination, ComingSoon — plus list-controls.tsx
                  #   (useListNavigation, a "use client" hook, imported by path)
                  # data table wrapper, search input, toolbar,
                  # pagination, empty/loading states, status badge,
                  # delete confirmation dialog
```

`shared/` re-exports through an `index.ts` barrel, so feature folders import
from a single stable path:

```ts
import { PageContainer, PageHeader } from "@/components/admin/shared"
```

See [`admin-dashboard.md`](./admin-dashboard.md) for the full component
catalog and usage examples.

---

# actions/

Server Actions.

```text
actions/
│
├── auth/
├── product/       # built — save-product.ts, delete-product.ts. One save
│                  #   action for the whole form, not createVariant /
│                  #   updateVariant — products-feature.md says why
├── category/      # built — save-category.ts, delete-category.ts
├── customer/      # built — set-role.ts. isAdmin() + a not-self check, then
│                  #   customer.service.setCustomerRole — customers-feature.md
├── order/         # built — update-order-status.ts. The orders console's one
│                  #   write — orders-feature.md
├── search/
├── cart/          # built — add-to-cart.ts, update-cart-item.ts,
│                  #   remove-cart-item.ts, clear-cart.ts. Public — no
│                  #   isAdmin() — and plain-argument functions, not
│                  #   useActionState — cart-feature.md
└── checkout/      # built — place-order.ts. Public too, but gated on
                   #   getCurrentUser() rather than isAdmin() — signed in is
                   #   the bar, not "is an admin". useActionState, because
                   #   this one really is a form with field errors —
                   #   checkout-orders-feature.md
```

### Responsibilities

- Validate requests
- Authenticate users
- Authorize access
- Call Service Layer
- Return safe responses

Server Actions should not contain business logic.

`actions/cart/*` and `actions/checkout/place-order.ts` are the only groups
here with no `isAdmin()` check — every other action folder gates on it
because everything else in the console is admin-only. These two are the
app's public writes: the cart needs no session at all, and checkout needs a
session but not a role.

---

# services/

Business Logic Layer.

```text
services/
│
├── auth.service.ts        # Clerk -> User sync, role resolution — auth-callback.md
├── admin.service.ts       # read-only counts for the /admin overview
├── product.service.ts     # built — products-feature.md. listProducts takes
│                          #   { search, categoryId, productType, status, page }
│                          #   — the ADMIN work queue (updatedAt order, hidden
│                          #   rows, order counts)
├── catalog.service.ts     # built — store-feature.md. The STOREFRONT read
│                          #   model: listCatalog (sellable only, shopper's
│                          #   sort) + listCatalogCategories + getStoreProduct
│                          #   (React cache()'d). A different query in a
│                          #   different module, as product.service.ts said
├── ingredient.service.ts  # built — the raw-material master list
├── category.service.ts    # built — categories-feature.md
├── customer.service.ts    # built — listCustomers + getCustomer, plus one
│                          #   write: setCustomerRole (Clerk first, mirror
│                          #   follows) — customers-feature.md
├── order.service.ts       # built — listOrders + getOrder + updateOrderStatus
│                          #   for the admin console; createOrder +
│                          #   getOrderForUser + listOrdersForUser for
│                          #   checkout and /account/orders. One entity, one
│                          #   owner, two kinds of caller — checkout-orders-
│                          #   feature.md
├── search.service.ts
├── cart.service.ts        # built — getCart, getCartCount, addToCart,
│                          #   updateCartItem, removeCartItem, clearCart.
│                          #   Reads/writes a cookie via lib/cart.ts, not
│                          #   Prisma directly for the cart's own state —
│                          #   still resolves every line against the database
│                          #   on every call. No Cart table — cart-feature.md
└── payment.service.ts
```

`payment.service.ts` is the one service with a caller that is not a Server
Action: `POST /api/webhook` calls into it directly. The rule it still obeys is
the one that matters — the route handler validates and delegates, and every
business rule about what a paid order means (marking it `PAID`, decrementing
variant stock) lives in the service layer. This is the Stripe path and is
still unbuilt; the cash-on-delivery path that *is* built does not wait for a
webhook, so its own stock decrement lives in `order.service.createOrder`
instead — see [`checkout-orders-feature.md`](./checkout-orders-feature.md).

`product.service.ts` owns the rule that keeps the catalog consistent: an
`ALCOHOL_BASED` product's variants must carry `bottleSize` and no
`oilWeight`; a `RAW_OIL` product's variants must carry `oilWeight` and no
`bottleSize`. This is enforced in the service, not just the form, so it can
never be bypassed by a direct Server Action call. See
[`products-feature.md`](./products-feature.md) for the third place it is also
enforced — the database — and why that one is not enough on its own.

### Responsibilities

- Business Rules
- Database Operations
- Transactions
- Complex Queries
- Domain Logic

Only the service layer communicates with Prisma.

---

# hooks/

React Query hooks.

```text
hooks/
│
├── use-products.ts
├── use-categories.ts
├── use-search.ts
├── use-cart.ts
└── use-orders.ts
```

> **Not yet installed.** No feature has needed this layer so far, so
> `@tanstack/react-query` is not a dependency and the root layout has no
> `QueryClientProvider`. The categories console deliberately skips it: its
> table is server-rendered and a mutation calls `revalidatePath`, so a client
> cache would only be a second copy of the same data to keep in step. See the
> reasoning in [`categories-feature.md`](./categories-feature.md) — it is a
> judgement about that feature, not a repeal of the rule.
>
> **Search / filter / pagination did not change this — on the admin *or* the
> storefront.** The products, customers and orders lists, and now `/store`, all
> have them, and all are URL-driven: `?q=` / `?page=` / filter params on
> `searchParams`, a Server Component that re-runs per navigation, and a
> `"use client"` filter bar whose only job is to `router.push` new params. The
> hook that does the push, `useListNavigation`, lives at
> `components/shared/use-list-navigation.ts` and is shared by both surfaces
> (`components/admin/shared/list-controls.tsx` re-exports it). There is no
> client data cache, so there is nothing for React Query to manage. The layer
> earns its place at the first screen with *optimistic* client state —
> drag-to-reorder, an edit that must paint before the server replies — and not
> before.
>
> **The cart was the real temptation, and it still did not pull this in.**
> Add/update/remove is exactly the "optimistic client state" case above — the
> first one in the app. `cart-feature.md` explains the call at length; the
> short version is that every cart control calls its Server Action directly
> from a plain `onClick` inside `useTransition` (the same shape
> `order-status-control.tsx` already uses), with a `Spinner` on the one button
> pressed rather than a client-cached, optimistically-updated row. There is
> still no `use-cart.ts` and no `@tanstack/react-query` dependency. The day a
> cart edit has to *paint* before the server confirms it, this is the file
> that gets written.

### Responsibilities

- Queries
- Mutations
- Cache Management
- Optimistic Updates
- Loading States

UI components should consume hooks instead of calling Server Actions directly.

---

# schemas/

Zod validation schemas.

```text
schemas/
│
├── category.schema.ts    # built — rules, FormData adapter, form-state type
├── product.schema.ts     # built — the same, plus the keyed variant rows
├── cart.schema.ts        # built — the cart cookie's shape (parse/serialize)
│                         #   + the add/update mutation payloads. No FormData
│                         #   adapter — these come from a button, not a form.
│                         #   cart-feature.md
└── checkout.schema.ts    # built — phone / phone2 / governorate / city /
                          #   center / street / building, a FormData adapter
                          #   (this one IS a form) and form state —
                          #   checkout-orders-feature.md
```

Examples:

- Login Schema
- Product Schema (base fields: name, description, category, type, ingredients)
- Variant Schema — **not** a discriminated union, as it turned out: the
  discriminator lives on the *product*, not the row, so `product.schema.ts`
  validates a permissive row and applies the shape rule in a `superRefine`
  that can see `productType`. See
  [`products-feature.md`](./products-feature.md)

> **Schemas are isomorphic, and that is load-bearing.** Nothing in
> `schemas/` may import from `services/`, `lib/db.ts` or anything
> `server-only`. Keeping them pure is what lets the product form run
> `parseProductForm` in the browser before it dispatches, and the Server
> Action run the *same function* on what arrives — one definition of valid,
> enforced twice, with no client copy to drift.
- Cart Item Schema — built, `cart.schema.ts`
- Checkout Schema — built, `checkout.schema.ts`

Shared between forms and server actions whenever possible.

---

# lib/

Application libraries and shared clients.

```text
lib/
│
├── db.ts          # the Prisma client — import as `import { db } from "@/lib/db"`
├── uploads.ts     # image storage — sniff bytes, then hand off to Cloudinary.
│                  #   saveImage / deleteImage / UnsupportedImageError, unchanged
│                  #   public surface — image-uploads.md
├── cloudinary.ts  # the storage client: sign → POST /image/upload · /image/destroy.
│                  #   server-only, dependency-free (a fetch, not the SDK)
├── cart.ts        # built — readCartCookie / writeCartCookie, and nothing
│                  #   else. server-only; writes only work from a Server
│                  #   Action — cart-feature.md
└── utils.ts       # `cn()`
```

In development the client is parked on `globalThis` so `next dev`'s module
reloading reuses one connection pool instead of opening a new one on every
save and exhausting the database's connection limit. Only the service layer
should import it.

Also belongs here:

- React Query Client
- Clerk Configuration
- Cloudinary Configuration (product + category image uploads) — **built**,
  `cloudinary.ts`; see [`image-uploads.md`](./image-uploads.md)
- Stripe Client
- Utility Initializers

---

# prisma/

Prisma configuration.

```text
prisma/
│
├── schema.prisma
│
└── migrations/
```

> **Seeding does not live in `prisma/`.** There is no `prisma/seed.ts` and no
> `prisma.seed` config. Seed scripts are `scripts/*.mts`, run through Node's
> own type stripping with no extra dependency:
> [`scripts/seed-categories.mts`](../scripts/seed-categories.mts) (the three
> founding segments — [`categories-feature.md`](./categories-feature.md)) and
> [`scripts/seed-dev.mts`](../scripts/seed-dev.mts) (`npm run seed-dev` — a
> full mock catalog, customers and orders for development, documented in
> [`database-seeding.md`](./database-seeding.md)).

Core models (see [`erd.md`](./erd.md) for the full diagram):

- `Category` — Youth / Women / Men, plus whatever the admin adds. A table,
  not an enum, and the admin CRUD for it is
  [`categories-feature.md`](./categories-feature.md). Carries `slug` (the
  `/shop/[category]` segment), `imageUrl`, `isActive` and `position`.
- `Product` — name, slug, description, ingredients, images[], productType
  (`ALCOHOL_BASED` | `RAW_OIL`), categoryId, isActive
- `ProductVariant` — productId, bottleSize (`ML_30` | `ML_50` | `ML_100`,
  nullable), oilWeight (`G_5` | `G_8` | `G_12`, nullable), oilGrade, sku,
  price (`Decimal(10,2)`), stock, isActive
- `Cart` / `CartItem` — **still not built**, checkout included. The cart is a
  signed `httpOnly` cookie instead (`{ variantId, quantity }` per line) —
  `checkout-orders-feature.md`'s `createOrder` reads it and re-derives price
  and stock live from `ProductVariant`, so even order creation never needed
  a `Cart` row. See [`cart-feature.md`](./cart-feature.md) for the fuller
  reasoning, including the earlier prediction that checkout would be the
  trigger — it was not.
- `Order` — userId, status (`OrderStatus`, six members), totalPrice, plus a
  **shipping-address snapshot** (`shippingName` / `shippingPhone` /
  `shippingPhone2` / `shippingGovernorate` / `shippingCity` /
  `shippingCenter` / `shippingStreet` / `shippingBuilding` /
  `shippingCountry`, all nullable — captured at checkout, never rewritten;
  older rows carry none). `shippingGovernorate` is validated at checkout
  against the fixed `EGYPT_GOVERNORATES` list (`constants/egypt.ts`).
  `OrderItem` snapshots `unitPrice`. See
  [`orders-feature.md`](./orders-feature.md) and
  [`checkout-orders-feature.md`](./checkout-orders-feature.md) (where the
  snapshot is actually written, for a real order).
- `User` — mirrored from Clerk. `clerkId` is the join key (not `email`,
  which a user can change); `role` is `USER | ADMIN`, itself mirrored from
  Clerk `publicMetadata.role`. Written by `/auth-callback`, and by
  `customer.service.setCustomerRole` when an admin promotes someone.

---

# types/

Global TypeScript types.

Examples:

- Product
- ProductVariant
- Category
- User
- Order
- CartItem
- API Response

---

# utils/

Pure utility functions.

Examples:

- Format Currency
- Format Date
- Slug Generator
- Variant Label Formatter (e.g. `"100ml"` or `"8g"`)
- Pagination Helpers
- String Utilities

Utilities should not depend on React or the database.

Built so far: `format.ts` (prices, dates, the variant label) and `slug.ts`
(the URL-segment rule shared by the category and product forms). There is no
`slugify()` in either, and [`categories-feature.md`](./categories-feature.md)
explains why: the names are Arabic, so the admin types the slug.

---

# constants/

Application constants.

```text
constants/
│
├── routes.ts          # every path, plus `safeRedirect` / `authCallbackUrl`
├── admin-nav.ts       # the /admin sidebar as data — admin-dashboard.md
├── uploads.ts         # accepted image types + size cap + gallery cap, and
│                      #   DEFAULT_PRODUCT_IMAGE (public/image.png). Shared
│                      #   with the client because lib/uploads.ts is
│                      #   server-only — image-uploads.md
├── store.ts           # STORE_SORTS / STORE_SORT_LABEL / DEFAULT_STORE_SORT —
│                      #   the /store sort vocabulary, client-safe half of
│                      #   catalog.service.ts — store-feature.md
├── cart.ts            # MAX_LINE_QUANTITY / MAX_CART_LINES — the cart's
│                      #   limits, shared by the stepper, the schema and the
│                      #   service — cart-feature.md
├── catalog.ts         # the four catalog enums, in order, with their
│                      #   Arabic — products-feature.md
├── egypt.ts           # built — EGYPT_GOVERNORATES, the fixed 27-item list
│                      #   the checkout governorate `<Select>` offers —
│                      #   checkout-orders-feature.md
├── contact.ts         # built — CONTACT — every placeholder value /contact
│                      #   renders (WhatsApp/Instagram/Facebook/email/phone)
│                      #   — landing-page.md
└── design-system.ts   # tones, order status, stock, category + type accents
```

Nothing outside `routes.ts` writes a route string literal, so a rename costs
one edit rather than a grep. `admin-nav.ts` is read by the sidebar, the
breadcrumbs *and* the overview's section cards, so the three cannot disagree
about what a route is called. `design-system.ts` also owns `ORDER_STATUSES`
(the six in fulfilment order) and the `OrderStatus` re-export from Prisma; a
detail route is built with `adminCustomerRoute(id)` / `adminOrderRoute(id)` /
`adminProductRoute(id)` from `routes.ts`.

Also belongs here:

- Query Keys
- Product Types (`ALCOHOL_BASED`, `RAW_OIL`) — built, in `catalog.ts`
- Bottle Sizes / Oil Weights — built, in `catalog.ts`
- Order statuses — built, `ORDER_STATUSES` in `design-system.ts`
- Roles
- Permissions
- Pagination Limits — `PRODUCTS_PAGE_SIZE` / `CUSTOMERS_PAGE_SIZE` /
  `ORDERS_PAGE_SIZE` live next to their service for now (all 20)

---

# Development Flow

Every feature should follow the same implementation order.

```text
1. Build UI

↓

2. Build Form (if needed)

↓

3. Create Zod Schema

↓

4. Create React Query Hook

↓

5. Create Server Action

↓

6. Create Service

↓

7. Connect Prisma

↓

8. Test

↓

9. Refactor
```

---

# Architecture Rules

- UI must never communicate with Prisma.
- UI should communicate only with React Query hooks.
  - *One documented exception:* the `/admin` dashboard is a read-first Server
    Component tree that calls services directly for its **reads**, because
    there is nothing to cache and the data belongs in the first paint. Every
    **write** still goes UI → Server Action → Service.
- Hooks should call Server Actions.
- Server Actions should call Services.
- Services should communicate with Prisma.
- Business logic belongs only inside Services — including the rule that a
  product's variant shape depends on its type.
- Validation belongs inside Schemas.
- Shared UI belongs inside Components.
- Helpers belong inside Utils.

## List pages ship with pagination and filters

Any screen that renders a list of rows — the admin `products`, `customers`,
`orders`, **and the storefront `/store` catalogue** — is built with paging and
with whatever filters the page needs, from the first commit, not "when it gets
slow". A list without paging is a bug the day the table has 30 rows.

The shape is fixed so all list pages look the same:

- **Service:** takes `{ search?, page?, …filters }`, returns
  `{ rows, total, page, pageCount }`. The admin services issue the count and
  the page as one `$transaction`; `catalog.service.listCatalog` pulls the
  whole (bounded) match set in one query and slices in memory, which gives the
  same "total and rows cannot disagree" property — see
  [`store-feature.md`](./store-feature.md).
- **Page (Server Component):** parses/validates the params off `searchParams`,
  calls the service, renders `<XFilters>` + the rows + a pagination component
  (`<AdminPagination>` in the console, the shared `<Pagination>` on `/store`).
- **`<feature>-filters.tsx` (`"use client"`):** a search `<Input>` (applies on
  submit) and `<Select>`s (apply on change), all through `useListNavigation`
  (`components/shared/use-list-navigation.ts`, re-exported from
  `components/admin/shared/list-controls.tsx`) — which only does `router.push`
  with new query params. **No React Query, no client cache**: the list is
  server-rendered on every navigation. See
  [`admin-dashboard.md`](./admin-dashboard.md), "List pages".

## Detail pages name their own breadcrumb

`[id]/page.tsx` renders `<BreadcrumbTitle title={entity.name} />` so the last
crumb reads the entity, not a repeated section label or a raw id. See
[`admin-dashboard.md`](./admin-dashboard.md), "The header".

---

# Feature Example

```text
Product Detail + Add to Cart

UI
│
├── app/(shop)/shop/[category]/[slug]/page.tsx
│
├── components/product/variant-selector.tsx
│
├── components/cart/add-to-cart-button.tsx
│
├── hooks/use-cart.ts
│
├── actions/cart/add-to-cart.ts
│
├── services/cart.service.ts
│
├── schemas/cart.schema.ts
│
└── prisma
```

Workflow:

```text
Variant Selector (size, or weight)

↓

useCart()

↓

addToCartAction()

↓

cartService()

↓

Prisma

↓

Database
```

> **This sketch predates the built feature and describes the future `/shop`
> path, not the `/store` one that exists today.** The real Add to Cart
> (`docs/cart-feature.md`) differs in three ways this document's own rules
> already anticipated: the route is `app/store/[slug]/page.tsx`, not
> `app/(shop)/shop/…`; there is no `variant-selector.tsx` — a `<select>`
> inside `AddToCartForm` does the picking, because a perfume's options turned
> out to be one control, not a component; and the chain ends at a cookie via
> `lib/cart.ts`, not at `Prisma` — there is no `Cart` table yet, and
> `hooks/use-cart.ts` was never written, because the cart's writes go through
> a plain `useTransition` call to the Server Action, the same shape every
> other single-value write in this app already uses. `cart-feature.md`
> explains each departure in full.

---

# Benefits

This architecture provides:

- Clear separation of responsibilities
- Consistent project structure
- Scalable feature development
- Easier testing
- Better maintainability
- Reusable business logic
- Predictable development workflow
- One place (`product.service.ts`) that enforces the size/style-vs-weight
  branching, instead of that rule being re-implemented in every form and
  action that touches a variant
