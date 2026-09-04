# Folder Structure

## Related documents

- [`business-analysis.md`](./business-analysis.md) — product scope and requirements
- [`erd.md`](./erd.md) — entity relationships (Category, Product, ProductVariant, Cart, Order, User)
- [`tech-stack.md`](./tech-stack.md) — Next 16, Clerk auth, Cloudinary (product + category images — see `image-uploads.md`), shadcn/Base UI, Prisma, Stripe
- [`storefront-layout.md`](./storefront-layout.md) — the storefront shell (`(marketing)` header, `(shop)` header + category nav), the shared brand lockup, the cart drawer and the account menu
- [`landing-page.md`](./landing-page.md) — `/` and `/about`, the Misk brand story and manufacturing story
- [`store-feature.md`](./store-feature.md) — **built** — `/store` (the public catalogue: browse by category, search, filter by type, sort, page) and `/store/[slug]` (one perfume: gallery, variants + prices, ingredients, two disabled buy buttons). Query-param driven, follows the list-page convention. The `/shop/*` docs below are the separate, still-unbuilt path-based storefront
- [`image-uploads.md`](./image-uploads.md) — **built** — where a product photo or category picture goes (Cloudinary, via `lib/cloudinary.ts` + `lib/uploads.ts`), and the `public/image.png` default the storefront falls back to
- [`catalog-feature.md`](./catalog-feature.md) — `/shop`, the flat public perfume listing and its derived filter facets (category, type, size)
- [`category-feature.md`](./category-feature.md) — `/shop/[category]`, browse by Youth / Women / Men
- [`product-page.md`](./product-page.md) — `/shop/[category]/[slug]`, the product detail page: gallery, ingredients, and the variant selector that branches by product type (bottle vs. raw oil)
- [`search-feature.md`](./search-feature.md) — `/search`, name/description search across perfumes
- [`cart-feature.md`](./cart-feature.md) — `/cart` and Add to cart: variant-aware line items, and why the same product can appear twice with two different sizes
- [`checkout-orders-feature.md`](./checkout-orders-feature.md) — checkout and `/account/orders`: capturing a price + variant snapshot at time of purchase
- [`payments-feature.md`](./payments-feature.md) — Stripe Checkout and `POST /api/webhook`: the only route handler in the app
- [`auth-callback.md`](./auth-callback.md) — `/auth-callback`, the sign-in landing strip that mirrors the Clerk user into the `User` table
- [`admin-dashboard.md`](./admin-dashboard.md) — the `/admin` console and its reusable components
- [`admin-access-control.md`](./admin-access-control.md) — how `/admin` is locked down
- [`categories-feature.md`](./categories-feature.md) — admin CRUD for Youth / Women / Men
- [`products-feature.md`](./products-feature.md) — **built** — admin CRUD for the sellable entity: gallery upload and the inline variant-collection editor (size+style rows vs. weight rows, depending on product type). The ingredients editor is deliberately not in it yet; that document says why
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
├── (marketing)/            # header only — see storefront-layout.md
│   ├── layout.tsx
│   ├── page.tsx             #   /        — landing-page.md
│   └── about/                #   /about   — landing-page.md
│
├── store/                  #   /store  — built — the public catalogue.
│   ├── layout.tsx           #   storefront header + footer (StoreHeader/Footer)
│   ├── loading.tsx          #   skeleton for the catalogue query
│   ├── page.tsx             #   filter by category / search / type / sort / page
│   └── [slug]/              #   /store/[slug] — one perfume: gallery, variants
│       └── page.tsx         #     + prices, ingredients, two disabled buy
│                            #     buttons — store-feature.md. A plain folder,
│                            #     same reasoning as admin/: the URL really
│                            #     is /store
│
├── (shop)/                  # header + category nav — see storefront-layout.md
│                            #   NOT built yet — the path-based storefront the
│                            #   docs plan, distinct from /store above
│   ├── layout.tsx
│   ├── shop/
│   │   ├── page.tsx          #   /shop                       — catalog-feature.md
│   │   └── [category]/
│   │       ├── page.tsx      #   /shop/[category]             — category-feature.md
│   │       └── [slug]/
│   │           └── page.tsx  #   /shop/[category]/[slug]      — product-page.md
│   ├── search/                #   /search                     — search-feature.md
│   ├── cart/                  #   /cart                       — cart-feature.md
│   └── account/
│       ├── orders/            #   /account/orders + [orderNumber] — checkout-orders-feature.md
│       └── profile/           #   /account/profile
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
├── store/         # built — /store + /store/[slug]: chrome, category chips,
│                  #   filter bar, product grid + card, product gallery, the
│                  #   two disabled buy buttons. store-feature.md
│
├── product/
│
├── search/
│
├── cart/
│
├── orders/
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
- Select (used for size / weight / bottle style pickers)
- Form / Field / FieldError — the error-map trio every admin form is built
  from; see [`admin-dashboard.md`](./admin-dashboard.md)

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
├── brand-lockup.tsx  brand-loader.tsx  auth-nav.tsx  theme-*.tsx   # built
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

`AddToCartButton` — renders differently depending on product type: it opens a
size + bottle-style picker for alcohol-based perfumes, and a weight picker for
raw oil — and `CartView`, `CartLineItem`. See
[`cart-feature.md`](./cart-feature.md).

---

### product/ and search/

The two public catalog surfaces.

`product/` holds the catalog grid (`CatalogView`, `ProductCard`), the filter
panel `CatalogFilters` (category / product type / size), the product detail
building blocks (`ProductGallery`, `ProductInfo`, `IngredientsList`), and the
`VariantSelector` — the one component that branches by `product.type`:

- `ALCOHOL_BASED` → renders **Size** (30ml / 50ml / 100ml) × **Bottle Style**
  (Luxury / Regular)
- `RAW_OIL` → renders **Weight** (5g / 8g / 12g) only, no bottle style

`search/` holds `SearchView` and `ProductResultCard`, reusing `ProductCard`
so search results and the catalog look identical.

---

### marketing/

The sections of the `(marketing)` pages — one file per route, plus the pieces
more than one of them renders.

```text
marketing/
│
├── hero.tsx
├── landing-sections.tsx      # featured perfumes, category highlights
├── about-sections.tsx        # the manufacturing story: in-house blending,
│                              # oil grades, medical-grade ethanol
└── legal-sections.tsx
```

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
renders — size + bottle style rows, or weight rows — before the product is
even saved. See [`products-feature.md`](./products-feature.md).

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
└── cart/
```

### Responsibilities

- Validate requests
- Authenticate users
- Authorize access
- Call Service Layer
- Return safe responses

Server Actions should not contain business logic.

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
├── order.service.ts       # built — listOrders + getOrder + updateOrderStatus.
│                          #   Reads-first; does not touch stock — orders-feature.md
├── search.service.ts
├── cart.service.ts
└── payment.service.ts
```

`payment.service.ts` is the one service with a caller that is not a Server
Action: `POST /api/webhook` calls into it directly. The rule it still obeys is
the one that matters — the route handler validates and delegates, and every
business rule about what a paid order means (marking it `PAID`, decrementing
variant stock) lives in the service layer.

`product.service.ts` owns the rule that keeps the catalog consistent: an
`ALCOHOL_BASED` product's variants must carry `bottleSize` + `bottleStyle` and
no `oilWeight`; a `RAW_OIL` product's variants must carry `oilWeight` and no
`bottleSize`/`bottleStyle`. This is enforced in the service, not just the
form, so it can never be bypassed by a direct Server Action call. See
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
├── category.schema.ts   # built — rules, FormData adapter, form-state type
└── product.schema.ts    # built — the same, plus the keyed variant rows
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
- Cart Item Schema
- Checkout Schema

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
  nullable), bottleStyle (`LUXURY` | `REGULAR`, nullable), oilWeight (`G_5` |
  `G_8` | `G_12`, nullable), oilGrade, sku, price (`Decimal(10,2)`), stock,
  isActive
- `Cart` / `CartItem` — cartId, variantId, quantity
- `Order` — userId, status (`OrderStatus`, six members), totalPrice, plus a
  **shipping-address snapshot** (`shippingName` / `shippingPhone` /
  `shippingLine1` / `shippingLine2` / `shippingCity` / `shippingGovernorate` /
  `shippingCountry`, all nullable — captured at checkout, never rewritten;
  older rows carry none). `OrderItem` snapshots `unitPrice`. See
  [`orders-feature.md`](./orders-feature.md).
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
- Variant Label Formatter (e.g. `"100ml · Luxury"` or `"8g"`)
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
├── catalog.ts         # the four catalog enums, in order, with their
│                      #   Arabic — products-feature.md
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
- Bottle Sizes / Bottle Styles / Oil Weights — built, in `catalog.ts`
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
Variant Selector (size+style, or weight)

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
