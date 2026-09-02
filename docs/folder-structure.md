# Folder Structure

## Related documents

- [`business-analysis.md`](./business-analysis.md) — product scope and requirements
- [`erd.md`](./erd.md) — entity relationships (Category, Product, ProductVariant, Cart, Order, User)
- [`tech-stack.md`](./tech-stack.md) — Next 16, Clerk auth, Cloudflare R2 (product images), shadcn/Base UI, Prisma, Stripe
- [`storefront-layout.md`](./storefront-layout.md) — the storefront shell (`(marketing)` header, `(shop)` header + category nav), the shared brand lockup, the cart drawer and the account menu
- [`landing-page.md`](./landing-page.md) — `/` and `/about`, the Misk brand story and manufacturing story
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
- [`orders-feature.md`](./orders-feature.md) — admin read-first: order status and fulfilment
- [`customers-feature.md`](./customers-feature.md) — admin read-first: accounts mirrored from Clerk
- [`database-seeding.md`](./database-seeding.md) — mock data for development

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
├── (shop)/                  # header + category nav — see storefront-layout.md
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

---

### shared/

Domain-neutral components used across multiple pages — they take data and
callbacks and know nothing about any entity.

```text
shared/
│
├── empty-state.tsx
├── logo-avatar.tsx
├── pagination.tsx
├── search-input.tsx
├── status-badge.tsx        # order status, stock status
└── index.ts
```

All five are used by **both** the storefront and the admin console.
`components/admin/shared/index.ts` re-exports them, so admin features keep
importing from a single path:

```ts
import { PageContainer, Pagination } from "@/components/admin/shared"  // admin
import { EmptyState, Pagination } from "@/components/shared"           // storefront
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
> The product form was predicted to be the one that pulled it in. It has two
> pieces of `useState` and nothing else: the dependency turned out to be on
> the form's **structure** (`productType` decides which selects exist) rather
> than on any field's *value*, and structure is cheap to hold by hand. The
> prediction comes true the day a form needs live cross-field validation. See
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
├── products/     # built — table + form page + gallery + variant editor
│                 #   products-feature.md
│
└── shared/       # page container, page header, section card,
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
├── search/
├── cart/
└── order/
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
├── product.service.ts     # built — products-feature.md
├── category.service.ts    # built — categories-feature.md
├── search.service.ts
├── cart.service.ts
├── order.service.ts
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
> judgement about that feature, not a repeal of the rule. The first screen
> with genuine client state (drag-to-reorder, client-side filtering,
> optimistic updates) is the one that should add it.

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
- Cart Item Schema
- Checkout Schema

Shared between forms and server actions whenever possible.

---

# lib/

Application libraries and shared clients.

```text
lib/
│
├── db.ts        # the Prisma client — import as `import { db } from "@/lib/db"`
├── uploads.ts   # image storage under public/uploads — categories-feature.md
└── utils.ts     # `cn()`
```

In development the client is parked on `globalThis` so `next dev`'s module
reloading reuses one connection pool instead of opening a new one on every
save and exhausting the database's connection limit. Only the service layer
should import it.

Also belongs here:

- React Query Client
- Clerk Configuration
- Cloudflare R2 Configuration (product image gallery uploads)
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
├── migrations/
│
└── seed.ts
```

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
- `Order` / `OrderItem` — order-time snapshot of product name, variant
  label, and price, so a later price change never rewrites history
- `User` — mirrored from Clerk. `clerkId` is the join key (not `email`,
  which a user can change); `role` is `USER | ADMIN`, itself mirrored from
  Clerk `publicMetadata.role`. Written by `/auth-callback`.

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
├── uploads.ts         # accepted image types + size cap + gallery cap,
│                      #   shared with the client because lib/uploads.ts
│                      #   is server-only
├── catalog.ts         # the four catalog enums, in order, with their
│                      #   Arabic — products-feature.md
└── design-system.ts   # tones, order status, stock, category + type accents
```

Nothing outside `routes.ts` writes a route string literal, so a rename costs
one edit rather than a grep. `admin-nav.ts` is read by the sidebar, the
breadcrumbs *and* the overview's section cards, so the three cannot disagree
about what a route is called.

Also belongs here:

- Query Keys
- Product Types (`ALCOHOL_BASED`, `RAW_OIL`) — built, in `catalog.ts`
- Bottle Sizes / Bottle Styles / Oil Weights — built, in `catalog.ts`
- Roles
- Permissions
- Pagination Limits

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
  - *One documented exception:* the `/admin` dashboard is a read-only Server
    Component tree that calls services directly, because there is nothing to
    cache or mutate and the figures belong in the first paint.
- Hooks should call Server Actions.
- Server Actions should call Services.
- Services should communicate with Prisma.
- Business logic belongs only inside Services — including the rule that a
  product's variant shape depends on its type.
- Validation belongs inside Schemas.
- Shared UI belongs inside Components.
- Helpers belong inside Utils.

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
