# Cart Feature

`/cart`, and Add to Cart from the product page's variant `<select>` and from
every catalogue card. Cart-only: checkout — placing an order, cash on
delivery — is **not** built here. See "What is deliberately not here" below.

## Related documents

- [`folder-structure.md`](./folder-structure.md) — the layer architecture, and why this feature departs from it
- [`store-feature.md`](./store-feature.md) — the catalogue and product page this adds to
- [`products-feature.md`](./products-feature.md) — `ProductVariant`, the thing a cart line actually points at
- [`checkout-orders-feature.md`](./checkout-orders-feature.md) — where "cash on delivery" and `Order` creation belong, not built yet
- [`payments-feature.md`](./payments-feature.md) — the Stripe path this project also has *not* taken here; COD is the one this shop asked for

---

## Route

```text
/cart     the shopper's cart — line items, quantities, a subtotal, and a
          disabled "الدفع عند الاستلام" (cash on delivery) button
```

Its own layout, `app/cart/layout.tsx`, rendering the same `StoreHeader` /
`StoreFooter` `app/store/layout.tsx` does — not nested under `store/`, because
the URL genuinely is `/cart`, the same reasoning `app/store/` and `app/admin/`
already give for being plain folders rather than route groups.

---

## The one departure from the documented architecture: no `Cart` table

`folder-structure.md`'s ERD and its `Product Detail + Add to Cart` example
both list `Cart` / `CartItem` as core models, with the standard
`UI → hook → action → service → Prisma → Database` chain. **There is no
`Cart` or `CartItem` model in `schema.prisma`.** The cart lives in a signed,
`httpOnly` cookie instead. This is a deliberate, documented departure — the
same kind of call `categories-feature.md` makes against React Query and
`products-feature.md` makes against `react-hook-form` — and it is worth being
exact about why.

A database cart needs two things a cookie does not:

1. **A row to attach it to.** A signed-out shopper has no `User` row —
   `syncCurrentUser()` only ever runs on `/auth-callback`
   ([`auth-callback.md`](./auth-callback.md)) — so an anonymous `Cart` needs
   its own identity (a second cookie holding a cart id, at minimum) before it
   can point at anything.
2. **A merge, at sign-in, between the anonymous cart and the signed-in one.**
   What happens when both already hold a line for the same variant? That is a
   real feature, and building it to throw it away — this round is
   deliberately **cart-only**, with no checkout to make the durability of a
   `Cart` row pay for itself yet — would be premature.

A cookie sidesteps both: it works identically for a signed-in and a
signed-out shopper, because it was never tied to either. The trade is size (a
cookie is realistically a few KB, so `MAX_CART_LINES` and
`MAX_LINE_QUANTITY` cap it — see below) and durability (clearing cookies
empties the cart; there is no server-side backup). Both are acceptable for a
cart that does not yet check out.

**This is not the final answer.** The day checkout is built, a cart's
contents have to become durable — an `Order` is created from *something*, and
`payment.service.ts` needs a row it can lock during that transaction. That is
the point at which `Cart` / `CartItem` earn their place in `schema.prisma`,
and the cookie becomes at most the anonymous half of a merge-on-sign-in flow.
Until then, the cookie is simpler and correct for what this feature actually
does.

### The cookie holds *only* an id and a quantity

```json
[{ "v": "cm3x…variantId", "q": 2 }]
```

Never a price, a name, a stock figure, or anything else that could go stale in
the shop's favour or the shopper's. `getCart()` re-resolves every line against
the database on every read (see below), so nothing the cookie holds can cost
the shop money even if a shopper edits it by hand — the worst a tampered
cookie can do is name a `variantId` that does not exist, which is read as "not
in the cart."

---

## The layers

```text
  components/store/
   ├── add-to-cart-form.tsx    Client — the product page's <select> + stepper
   ├── store-card-actions.tsx  Client — the catalogue card's quick-add
   ├── cart-content.tsx        Server — /cart's body: lines + summary + COD
   ├── cart-line-item.tsx      Client — one row: stepper, remove
   └── clear-cart-button.tsx   Client — "إفراغ السلة"
        │
        ↓
  actions/cart/
   ├── add-to-cart.ts
   ├── update-cart-item.ts
   ├── remove-cart-item.ts
   └── clear-cart.ts           "use server" — validate, delegate, revalidate
        │                            ┌──────────────────────────────┐
        ├───────────────────────────→│  schemas/cart.schema.ts       │
        ↓                            │  the cookie's shape + the two │
  services/cart.service.ts           │  mutation payloads             │
   getCart · getCartCount ·          └──────────────────────────────┘
   addToCart · updateCartItem ·
   removeCartItem · clearCart
        │
        ↓
  lib/cart.ts            readCartCookie / writeCartCookie — cookie I/O only
        │
        └──→ lib/db.ts   re-resolves variants on every read and every write
```

### Why there is no `hooks/use-cart.ts`

`folder-structure.md` sketches one — a React Query hook between the UI and
the action, the way the whole architecture diagram is drawn. This project has
never installed `@tanstack/react-query`
([`folder-structure.md`](./folder-structure.md) explains why at length: it
earns its place at *optimistic* client state, and nothing so far has needed
it *enough* to pull in the dependency), and a cart's add/update/remove is
exactly that kind of state — which makes this the first real temptation.

It is still not pulled in. Every cart control instead calls its Server Action
directly from a plain `onClick`, wrapped in `useTransition` — the identical
shape `order-status-control.tsx` and `delete-product-dialog.tsx` already use
for a single-value write. `useTransition` gives a pending flag and keeps the
UI responsive without a client cache to keep in sync; a `Spinner` on the one
button that was actually pressed is enough feedback for a cart this small.
React Query would earn its place the day the cart needs true optimistic
rendering — the row appearing before the server confirms it — which a small,
fast cookie write does not yet justify.

### Why «اشترِ الآن» is disabled everywhere, and «أضف إلى السلة» is not

Both buttons exist on the product page (`AddToCartForm`) and on every
catalogue card (`StoreCardActions`), matching the earlier round that put them
there. Only **«أضف إلى السلة»** does anything:

| Button | State | Why |
| --- | --- | --- |
| «أضف إلى السلة» | live | Calls `addToCartAction`; the cart is what this round builds |
| «اشترِ الآن» | **disabled, unconditionally** | "Buy now" has to lead to checkout, and checkout — cash on delivery, an `Order` row — is not built. The `/cart` page's own confirm button is disabled for the same reason (below) |

`disabled` is a literal `true` on «اشترِ الآن», not `pending || …` — it is
never wired to the add-to-cart transition at all. That is a fix, not a
stylistic choice: an earlier version disabled *both* buttons off the same
`pending` flag, which meant clicking «أضف إلى السلة» also flashed a loading
spinner on «اشترِ الآن» — a button that had not been pressed and was not
doing anything. Giving the two buttons independent state (one real, one
statically disabled) removed the spurious spinner and made the disabled
button honest about never being interactive right now.

### The card can only quick-add one variant

`StoreCardActions` adds `StoreProductCard.defaultVariantId` — the cheapest
*in-stock* active variant (`catalog.service.listCatalog` now orders each
product's variants by price so the first is the default) — one unit at a
time. `null` when nothing on the card is in stock, which disables the button;
there is no fallback to an out-of-stock variant. A shopper who wants a
*different* size opens the product page, where `AddToCartForm`'s `<select>`
is the full picker — the card genuinely cannot do more than quick-add the
obvious option, so it does not pretend to.

---

## The service

`services/cart.service.ts` is the only module that reads or writes the
cart cookie's *contents against the database*. `lib/cart.ts` moves bytes in
and out of the cookie and knows nothing about variants or prices; this module
decides what a legal cart is.

### `getCart()` — resolved fresh, every time

Reads the cookie, then re-fetches every referenced `ProductVariant` — active,
under an active product — from the database, in the cookie's own order (the
order things were added, which is the order a shopper expects to still see).
For each line:

- **Missing or no longer sellable** (retired, hidden, product taken down) →
  dropped, and `adjusted` is set.
- **Quantity capped** to `min(cookie quantity, current stock, MAX_LINE_QUANTITY)`
  → if that changed the number, `adjusted` is set.

`CartView.adjusted` renders one notice banner on `/cart` rather than a
per-line diff — a shopper does not need a forensic report of what changed,
just to know the numbers below are already corrected. The correction is
**read-only**, though: `getCart()` cannot write a cookie (see `lib/cart.ts`),
so the adjustment is recomputed on every visit until the next real mutation
(`addToCart` / `updateCartItem` / `removeCartItem`) persists it. That is a
one-request lag with no user-visible cost — the numbers shown are already
right, only the stored cookie briefly disagrees with them.

### `getCartCount()` — cheap, and allowed to be briefly wrong

The number on the header's cart icon sums the cookie's own quantities and
**never touches the database**. That is deliberate: it renders on every
storefront page (`StoreHeader` is `async` for exactly this), so it has to be
near-free. It can overcount for one page view if a variant in the cart was
just retired elsewhere — `getCart()` on `/cart` itself is what corrects it. A
badge a shopper glances at is not worth a query to make exactly right.

### `addToCart` / `updateCartItem` / `removeCartItem` / `clearCart`

Each re-validates the variant against the database before touching the
cookie — `addToCart` refuses outright if the variant or its product is not
active, or has zero stock. Quantities are always clamped to
`min(requested, current stock, MAX_LINE_QUANTITY)`. `updateCartItem` treats a
target of `0` as `removeCartItem` — the stepper's "−" past 1 and a dedicated
remove button end up in the same place. None of the four throws; each returns
`{ ok: true, count }` or `{ ok: false, message }`, the same result-object
contract every mutation in this codebase uses, for the reason
`category.service.ts` gives at length: a thrown error crossing the Server
Action boundary reaches the browser as an opaque digest.

---

## Actions, and why they take plain arguments

Every action in `actions/cart/` is a plain `async function`, called directly
by a client component — `addToCartAction({ variantId, quantity })`,
`updateCartItemAction(variantId, quantity)` — not `useActionState` bound to a
`<form action>`. There is no form: a button click or a stepper nudge already
holds everything it needs in React state, the same shape
`updateOrderStatusAction(orderId, next)` and `deleteProductAction(id)` use for
a single-value admin write.

**No `isAdmin()` check** — the cart is public, unlike every admin action in
this codebase. The schema is still the actual gate: each action is a real POST
endpoint reachable directly, and `addToCartInputSchema` /
`updateCartItemInputSchema` (in `schemas/cart.schema.ts`) are what stop a
hand-crafted call from asking for a quantity above `MAX_LINE_QUANTITY` before
the service ever runs a query.

**Revalidation reaches further than usual.** Every successful mutation calls
both `revalidatePath(ROUTES.cart)` and `revalidatePath("/", "layout")`. The
second one is broader than the admin actions' single `revalidatePath(ROUTES.adminX)`
on purpose: the cart-count badge lives in `StoreHeader`, which every
storefront page renders, and a shopper adding a perfume from `/store` expects
the badge beside them to move, not just the `/cart` page they have not
opened yet. A low-frequency write like "add to cart" can afford the wider
invalidation; an admin table with per-second edits could not.

---

## Limits

`constants/cart.ts` — shared by the client controls (the quantity stepper's
ceiling), the schema (`.max(...)`), and the service (the clamp):

| Constant | Value | What it bounds |
| --- | --- | --- |
| `MAX_LINE_QUANTITY` | 10 | Units of one variant per line — the stepper stops here |
| `MAX_CART_LINES` | 30 | Distinct variants the cart may hold — `addToCart` refuses a 31st *new* line with a message |

---

## `/cart` itself

`app/cart/page.tsx` reads `getCart()` directly (the storefront's read-first
exception) and hands it to `CartContent`, a Server Component. Empty cart →
`Empty` with a link back to `/store`. Otherwise: a list of `CartLineItem`s (a
Client Component each, for its own stepper and remove button), an
`adjusted`-only notice banner, `ClearCartButton`, and a summary panel with the
piece count, the subtotal, and:

```tsx
<Button variant="gold" size="xl" className="w-full" disabled>
  الدفع عند الاستلام
</Button>
```

**Disabled, with a caption saying so** — the same pattern the buy buttons
have used since they were first added: a real control that is honestly not
wired up yet, rather than hidden as if the shop had no answer for "how do I
pay." Cash on delivery is the payment method this shop asked for; when
checkout is built, this button is what gains the `onClick` (and, per the
reasoning above, is very likely the moment `Cart` becomes a real table).

---

## Files

| File | What it is |
| --- | --- |
| `src/app/cart/layout.tsx` | Storefront chrome, shared with `/store` |
| `src/app/cart/page.tsx` | Reads `getCart()`, renders `CartContent` |
| `src/components/store/cart-content.tsx` | Server — the page body: lines, notice, summary, disabled COD button |
| `…/cart-line-item.tsx` | Client — one row: image, stepper, remove |
| `…/clear-cart-button.tsx` | Client — empty the cart |
| `…/add-to-cart-form.tsx` | Client — the product page's variant `<select>` + stepper + the two buttons |
| `…/store-card-actions.tsx` | Client — the catalogue card's quick-add |
| `src/actions/cart/add-to-cart.ts` | `"use server"` — validate, delegate, revalidate `/cart` + the layout |
| `…/update-cart-item.ts` | Same shape, for the stepper |
| `…/remove-cart-item.ts` | Same shape, for the trash button |
| `…/clear-cart.ts` | Same shape, no input |
| `src/services/cart.service.ts` | `getCart`, `getCartCount`, `addToCart`, `updateCartItem`, `removeCartItem`, `clearCart` |
| `src/lib/cart.ts` | `readCartCookie` / `writeCartCookie` — `server-only`, cookie I/O only |
| `src/schemas/cart.schema.ts` | The cookie's shape + the two mutation payloads — isomorphic, no `server-only` import |
| `src/constants/cart.ts` | `MAX_LINE_QUANTITY`, `MAX_CART_LINES` |
| `src/services/catalog.service.ts` | `StoreProductCard.defaultVariantId`; `listCatalog`'s variant sub-query now orders by price |
| `src/components/store/store-chrome.tsx` | `StoreHeader` is now `async`, renders the cart-count badge |

---

## What is deliberately not here

**Checkout — creating an `Order`, cash on delivery going through.** The
brief for this round was explicitly cart-only. `/cart`'s confirm button and
both product surfaces' «اشترِ الآن» are disabled for exactly this reason. When
checkout is built it needs: a shipping-details step (the fields
`orders-feature.md` already documents as a snapshot on `Order`), a Server
Action that creates the `Order` + `OrderItem` rows and decrements variant
stock inside one transaction (`payment.service.ts`'s documented job even for
a non-Stripe path), and very likely the `Cart` → real-table migration this
document argues for above.

**Signed-in cart persistence / merge-on-sign-in.** A cookie cart is identical
whether or not the shopper is signed in; nothing here reads `getCurrentUser()`.
Building the merge is only worth it once a `Cart` table exists to merge into.

**Multi-variant quick-add from a card.** `StoreCardActions` acts on exactly
one variant. A card is not the place to open a picker; the product page is.

**Saved / shared / abandoned-cart carts.** All would need the cart to survive
past one browser's cookies — see the `Cart` table discussion above.

---

## Extending this

**Wiring up «اشترِ الآن».** Once checkout exists, give it its own handler —
`addToCart` followed by a redirect into the checkout flow — rather than
reusing `addToCartAction`'s button for two purposes silently. `AddToCartForm`
and `StoreCardActions` already isolate the disabled state to that one button,
so enabling it is a local change in each.

**A cart-drawer instead of a full page.** `storefront-layout.md` (still
unbuilt) sketches one. `CartContent` is already a plain function of a
`CartView`, so a `Sheet`-based drawer could render it directly; only the
"where does `getCart()` get called from" question (a layout-level fetch vs.
the drawer fetching on open) would need deciding.

**Moving the cart into `Cart` / `CartItem`.** Rewrite `lib/cart.ts`'s two
functions to read/write rows instead of a cookie, keyed by a cart id cookie
for anonymous shoppers and by `userId` once signed in, with a merge on
`/auth-callback`. `services/cart.service.ts`'s public functions and their
signatures do not need to change — the same seam `image-uploads.md` describes
for swapping a storage backend.
