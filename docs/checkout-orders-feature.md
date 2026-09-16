# Checkout & Orders Feature

`/checkout` — the information collector between the cart and a placed order
— and `/account/orders` / `/account/orders/[id]` — where a shopper watches
their own order move along the fulfilment track. Payment is **cash on
delivery**; there is no online payment step.

## Related documents

- [`folder-structure.md`](./folder-structure.md) — the layer architecture this follows
- [`cart-feature.md`](./cart-feature.md) — the cart this feature consumes and clears; also where the product page's «اشترِ الآن» now pushes to `/checkout` from
- [`store-feature.md`](./store-feature.md) — the header's «حسابي» dropdown links to `/account/orders`, this feature's route
- [`orders-feature.md`](./orders-feature.md) — the admin console this shares `Order`/`OrderItem` with
- [`admin-access-control.md`](./admin-access-control.md) — the two-gate pattern `/checkout` now copies
- [`auth-callback.md`](./auth-callback.md) — why a `User` row is guaranteed to exist by the time this feature needs one
- [`payments-feature.md`](./payments-feature.md) — the Stripe path this shop did **not** take; see "Why there is no `payment.service.ts`" below

---

## Routes

```text
/checkout                signed in — phone(s) + Egyptian address (governorate
                          dropdown, city, center, street, building), then
                          "تأكيد الطلب"
/account/orders          signed in — the shopper's own order history, no paging
/account/orders/[id]     signed in — one of the shopper's own orders; 404 if it is not theirs
```

All three sit behind a session gate — `checkout/layout.tsx` and
`account/layout.tsx` each call `auth.protect()`, the same call
`admin/layout.tsx` makes. An `Order` needs a `User` row (`Order.userId` is a
real foreign key), and `syncCurrentUser()` only ever runs on `/auth-callback`
([`auth-callback.md`](./auth-callback.md)) — so a shopper who is not signed in
is bounced to `/sign-in?redirect_url=/checkout`, signs in, passes through
`/auth-callback` (which is what actually creates the row), and lands back on
`/checkout` exactly as `forceRedirectUrl` already does for `/admin`.

This gate used to live in `src/proxy.ts` instead, matched by path. It moved
into each layout because Clerk deprecated `createRouteMatcher` +
`auth.protect()` in the proxy/middleware layer — a path-matching gate can
diverge from how Next.js actually routes a request. See
[`admin-access-control.md`](./admin-access-control.md) for the full reasoning;
`/checkout` and `/account` now follow the same shape `/admin` does, just
without a second, role-based gate.

**Every page under these routes also calls `getCurrentUser()` itself**, and
`placeOrderAction` does too. That is not redundant with the layout's
`auth.protect()` — see [`admin-access-control.md`](./admin-access-control.md)'s
"Gate 1 / Gate 2" reasoning, restated for this feature: the layout protects
the *page render*, but a Server Action is a POST endpoint that never renders
it, so relying on the layout to have covered every way an action could be
invoked is the wrong kind of confidence to have about a write.
`placeOrderAction` re-checks the same way `save-product.ts` re-checks
`isAdmin()`.

---

## The layers

```text
  app/checkout/
   ├── layout.tsx      Server Component — StoreHeader + StoreFooter
   └── page.tsx         getCurrentUser() → redirect /sign-in
                         getCart() → redirect /cart if empty
                         renders CheckoutForm + CheckoutSummary
        │
        ↓
  components/checkout/
   ├── checkout-form.tsx      Client — useActionState, dispatched from onSubmit
   └── checkout-summary.tsx   Server — a read-only echo of the cart
        │                            ┌───────────────────────────────┐
        ├───────────────────────────→│  schemas/checkout.schema.ts   │
        ↓                            │  phone(s) + governorate/city/ │
  actions/checkout/place-order.ts    │  center/street/building       │
   "use server" — getCurrentUser(), └───────────────────────────────┘
   parse, delegate, revalidate,
   redirect() to the order on success
        │
        ↓
  services/order.service.ts   createOrder() — see below
        │
        ├──→ services/cart.service.ts   getCart() to read, clearCart() after
        └──→ lib/db.ts                  one transaction: Order + OrderItem[]
                                         create, ProductVariant.stock decrement

  app/account/
   ├── layout.tsx                       Server Component — same chrome
   ├── orders/page.tsx                  getCurrentUser() → listOrdersForUser()
   └── orders/[id]/page.tsx             getCurrentUser() → getOrderForUser()
        │
        ↓
  components/account/account-orders-table.tsx     Server — the list
  components/shared/order-summary.tsx             Server — one order's lines
                                                    (shared with /admin/orders/[id])
```

Reads skip the action layer, the same documented exception the rest of the
storefront takes. `createOrder` is the one write, and it is reached through
exactly one action.

---

## `order.service.ts` now serves two callers, not one

Before this feature, `order.service.ts`'s own doc comment called itself *"the
only module that reads or writes `Order` and `OrderItem` **for the admin
console**."* That qualifier is gone. The rule underneath it — one entity, one
owning module — was never about *who is allowed to call it*; it is the same
rule `product.service.ts` follows for `Product` regardless of whether the
caller is an admin page or, eventually, a storefront one. Checkout is simply
the second caller `Order` always expected to have.

### `createOrder(userId, input)` — four things, one transaction

```ts
export async function createOrder(
  userId: string,
  input: CheckoutFormInput
): Promise<OrderCreateResult>
```

1. **Re-derive price and stock live, inside the transaction.** `getCart()` is
   called first to know *what* the shopper wants, but its prices are what a
   moment-ago read said — not what gets charged. Inside the `$transaction`,
   every requested variant is re-fetched (`isActive`, current `stock`,
   current `price`), and that is what the order actually uses. This is the
   same "checked before insert, not after" discipline
   `product.service.mintSkus` uses for SKUs: the gap between "the cart page
   rendered" and "the order button was pressed" is exactly the window a race
   lives in, and re-deriving inside the transaction closes it.
2. **Create `Order` + `OrderItem[]`** with the shipping snapshot
   `checkout.schema.ts` already validated.
3. **Decrement `ProductVariant.stock`** for each line, in the same
   transaction. See below for why this is the one place it happens.
4. **Clear the cart** — `cart.service.clearCart()` — but only *after* the
   transaction commits. Clearing first and having the order then fail would
   strand the shopper with an empty cart and nothing to show for it, the same
   ordering principle `products-feature.md` uses for gallery uploads ("save
   the new thing first, remove the old thing last").

A line that ran out of stock between being added to the cart and the order
being placed aborts the whole transaction — no partial order — and
`InsufficientStockError` names the perfume so the shopper knows what to
remove, rather than a generic "something went wrong."

### Why there is no `payment.service.ts`

`docs/folder-structure.md` sketches stock moving inside `payment.service.ts`,
reacting to a Stripe webhook that confirms payment happened *after* the order
exists. Cash on delivery has no such event — nobody's card is charged, so
there is nothing to wait for a webhook about. **A COD order is the commitment,
made the moment it is placed.** Writing this feature as "create a PENDING
order now, then decrement stock later when someone confirms payment" would
be modelling a payment step that does not exist, for a webhook this shop will
probably never receive. `createOrder` decrements stock itself, in the same
transaction as the order, and says so in its own doc comment so the next
person does not go looking for a `payment.service.ts` that was never built.

If Stripe is added later (see [`payments-feature.md`](./payments-feature.md)),
that *is* the moment to split it out: a Stripe order would be created
`PENDING` with **no** stock decrement, and a real `payment.service.ts` would
decrement stock only once the webhook confirms the charge. The two payment
methods would then genuinely need different code, which is exactly when
splitting them earns its keep.

### `Order.currency` — fixed forward, not retroactively

[`orders-feature.md`](./orders-feature.md) already flagged a latent bug:
`Order.currency` defaults to `"SAR"` in the schema while `utils/format.ts`
renders every price as `"EGP"` regardless of what is stored — a mismatch that
predated this feature and was left alone because nothing actually reads the
column for formatting (`grep` confirms it: `order.currency` is only ever
passed through a row type, never handed to `Intl.NumberFormat`). `createOrder`
sets `currency: "EGP"` explicitly on every new order — the value that is
actually true — rather than perpetuating the stale schema default now that
this is the one place in the app that writes the column. Older rows, and the
schema's own default, are untouched.

---

## Reading one's own orders, safely

### `getOrderForUser(userId, id)` — ownership is part of the query

```ts
const order = await db.order.findFirst({ where: { id, userId }, ... })
```

Not "fetch by `id`, then check `order.userId === userId` in JavaScript." With
the check in the `where`, a wrong owner and a missing row produce the exact
same result — `null` — which is what lets `/account/orders/[id]` answer a
guessed id belonging to a different shopper with an honest 404 instead of a
403 that would confirm the id exists and simply is not theirs. `getOrder(id)`
(no ownership check) stays exactly as it was, for its one caller,
`/admin/orders/[id]`, where any admin may see any order.

### One mapper, two callers

`getOrder` and `getOrderForUser` share a private `mapOrderDetail()` — the same
`OrderDetail` shape (customer, shipping snapshot, line items with live
variant labels) either way, built once so the admin view and a shopper's own
view of "the same order" can never quietly format one of its fields
differently.

### `listOrdersForUser` — no paging, on purpose

The same call `customer.service.getCustomer` already makes for a customer's
order history on the admin side: one person's orders are bounded, so a
second round trip to page through them buys nothing. If this shop's
best customers ever place enough orders to make that wrong, this is the
function to add `page` to.

### `OrderSummary` moved to `components/shared/`

The line-items-plus-total table used to live in `components/admin/orders/`.
`/account/orders/[id]` needed the exact same table for a shopper's own order,
so it moved to `components/shared/order-summary.tsx` — the same re-export
pattern `StatusBadge` already uses — and
`components/admin/orders/index.ts` re-exports it, so the admin page's import
path did not have to change.

### Each row on `/account/orders` is its own click target, not just `#ABC123`

The list originally matched the admin `OrdersTable`'s convention exactly: the
mono `#ABC123` text was the only `<Link>`, everything else in the row was
inert. On a shopper's own history — where nothing else in the row is
interactive, unlike the admin table's customer-name link and status
control — that made the actual click target smaller than the row it lives
in, for no reason. `AccountOrdersTable` now makes the **whole row** the
target with a "stretched link": a `<Link>` positioned `absolute inset-0`
inside the id cell, `<TableRow className="relative cursor-pointer">`
supplying the positioning context so the link sizes against the row, not just
the cell. The `#ABC123` text becomes a plain `aria-hidden` sibling `<span>`
so its string is not announced twice, and the stretched `<Link>` alone gets
`aria-label="عرض الطلب #ABC123"` for anyone tabbing through or using a screen
reader. The admin `OrdersTable` keeps its own convention (a dedicated eye-icon
button per row) — it was not touched, since that table's other cells really
do hold interactive links a stretched anchor would have to route around.

---

## The checkout form

`checkout.schema.ts` validates seven fields: `phone` (required), `phone2`
(optional, an alternate contact number), and the five pieces of an Egyptian
address — `governorate`, `city`, `center`, `street`, `building` — and nothing
else. No name field: `shippingName` is filled from the signed-in shopper's
`User.name` automatically (already known from their Clerk profile), so the
form does not ask for something the app already has.

**The address is five fields, not two.** The first round of this feature
asked only for `city` + `street` and left `shippingGovernorate` `null`
(see "Extending this" in the previous revision of this document, which named
exactly this as the next step). This round replaced that pair with the shape
an Egyptian shipping address actually has: **المحافظة** (governorate — a
`<Select>` over the fixed `EGYPT_GOVERNORATES` list,
`src/constants/egypt.ts`), **المدينة** (city), **المركز** (center — the
administrative division under the governorate), **الشارع** (street) and
**العمارة** (building). Street and building are deliberately separate fields
rather than one free-text line (the previous `shippingLine1` "street +
building" string) — a courier reading the order detail page gets each on its
own line instead of parsing a combined sentence, and the checkout form can
validate a building number's length independently of a street name's.

**`governorate` is a closed list, not free text** — `z.enum(EGYPT_GOVERNORATES,
…)` in the schema, the identical "written-out literal array, checked at the
boundary" pattern `product.schema.ts`'s `productType` uses for a Prisma enum.
It is not actually a database enum (nothing here ever adds a 28th
governorate), but the same reasoning applies: whatever string arrives in the
`FormData` must be one the `<Select>` actually offered, not anything a direct
POST to `placeOrderAction` might try to smuggle in. The `<Select>` itself is
Base UI's, uncontrolled with `name="governorate"` + `items` + `defaultValue={null}`
— the exact shape `product-form.tsx`'s category picker already uses, which is
what lets it reach `FormData` like a plain `<input>` without any extra wiring.

**`PHONE_PATTERN`** is deliberately Egypt-specific — optional `+20`/`20`,
optional leading `0`, then `1` and one of the four carrier digits, then eight
more — matching the same assumption `utils/format.ts`'s `LOCALE`/`CURRENCY`
already make and [`database-seeding.md`](./database-seeding.md)'s seeded
addresses already model. A shop that ships elsewhere would widen this one
regex, not rewrite the form.

**`CheckoutForm` dispatches from `onSubmit`, not `<form action>`** — the same
call `product-form.tsx` makes, and for the same reason: React resets an
uncontrolled form after a `<form action>` completes, including with errors,
and a shopper who mistyped one digit of their phone number should not have to
retype their street too. `parseCheckoutForm` runs client-side first (visible
without a round trip) and again inside `placeOrderAction` (the actual gate,
because the action is a public POST endpoint).

**`placeOrderAction` redirects to the new order itself, with `redirect()`** —
not the return-state-and-let-the-client-`router.push` pattern this file
described here until a bug fix changed it (and the pattern `product-form.tsx`
still uses). The two are not interchangeable for checkout specifically:

> **The bug this fixed.** `/checkout/page.tsx` redirects to `/cart` whenever
> the cart is empty (see "`/checkout` is not `/cart`" below), and
> `createOrder`'s last step is clearing the cart. The old version returned a
> `{ status: "success", orderId }` state and left a `useEffect` to call
> `router.push(accountOrderRoute(orderId))` — but invoking a Server Action
> also makes Next.js refresh the *current* route (`/checkout`) with fresh
> data, and that refresh reran the page **before** the client's own effect
> got a turn: cart now empty (thanks to the very order that just succeeded),
> so `/checkout/page.tsx` redirected to `/cart` itself, first. The shopper
> landed back on their empty cart instead of the order they had just placed.
> Calling `redirect(accountOrderRoute(orderId))` from inside the action
> avoids the race entirely — the framework navigates straight there from the
> action's own response, so `/checkout/page.tsx` never renders again to see
> the now-empty cart. `CheckoutFormState` lost its `"success"` status and its
> `orderId` field along with this — a successful submission no longer
> returns to the client at all; the type only ever carries an error now.

### `/checkout` is not `/cart`

Editing a quantity or removing a line happens on `/cart`; `/checkout`'s
`CheckoutSummary` is read-only — no stepper, no remove button. By the time a
shopper is on `/checkout` they are confirming what is in the cart, not
shopping, and an empty cart redirects straight back to `/cart` rather than
rendering a form with nothing above it. This is the exact guard the bug above
raced against — it is correct and stays; the fix was in how success
navigates, not in this guard.

---

## The admin side: nothing new to build, one field to show

`getOrder(id)` already returned the shipping snapshot before this feature —
[`orders-feature.md`](./orders-feature.md) documented it at length, including
the "«لا يوجد عنوان» for an order placed before this existed" fallback. That
was written for a snapshot nothing populated yet. Checkout is what populates
it now, and `/admin/orders/[id]`'s "عنوان الشحن" card needed exactly one
addition: a line for `shippingPhone2`, the alternate contact number this
feature is the first to collect.

```prisma
shippingPhone2 String? /// alternate contact number, collected at checkout
```

Applied with `prisma db push` (the project has no `migrations/`, the same
pattern every earlier `Order.shipping*` addition used). Nullable, so an order
placed before this column existed — or one where the shopper left the second
number blank — renders without it, exactly like the six columns before it.

---

## Files

| File | What it is |
| --- | --- |
| `src/app/checkout/layout.tsx` | Storefront chrome, shared with `/store` / `/cart` / `/account` |
| `src/app/checkout/page.tsx` | `getCurrentUser()` + `getCart()` guards, renders the form + summary |
| `src/components/checkout/checkout-form.tsx` | Client — the seven fields (phone(s) + the five address pieces), `useActionState` |
| `…/checkout-summary.tsx` | Server — read-only echo of the cart |
| `src/actions/checkout/place-order.ts` | `"use server"` — `getCurrentUser()`, parse, delegate, revalidate, `redirect()` to the order on success (not a returned state — see "The checkout form") |
| `src/services/order.service.ts` | `createOrder`, `getOrderForUser`, `listOrdersForUser`, plus the pre-existing admin reads/write |
| `src/services/cart.service.ts` | Unchanged — `getCart` / `clearCart` are what `createOrder` calls into |
| `src/schemas/checkout.schema.ts` | `phone` / `phone2` / `governorate` / `city` / `center` / `street` / `building`, `PHONE_PATTERN`, the FormData adapter, form state |
| `src/constants/egypt.ts` | `EGYPT_GOVERNORATES` — the fixed 27-item list the governorate `<Select>` offers |
| `src/app/account/layout.tsx` | Storefront chrome for `/account/*` |
| `src/app/account/orders/page.tsx` | `getCurrentUser()` → `listOrdersForUser()` |
| `src/app/account/orders/[id]/page.tsx` | `getCurrentUser()` → `getOrderForUser()`, `notFound()` if not theirs |
| `src/components/account/account-orders-table.tsx` | Server — a shopper's own order list; each row is a "stretched link" to its detail page |
| `src/components/shared/order-summary.tsx` | Server — one order's line items; moved here from `components/admin/orders/` |
| `src/app/admin/orders/[id]/page.tsx` | Renders `shippingPhone2` and the five-field address when present |
| `prisma/schema.prisma` | `Order.shippingPhone2`; `Order.shippingGovernorate`/`shippingCity`/`shippingCenter`/`shippingStreet`/`shippingBuilding` (replacing the earlier `shippingLine1`/`shippingLine2` pair) |
| `src/app/checkout/layout.tsx` | `auth.protect()` — the session gate for `/checkout(.*)` |
| `src/constants/routes.ts` | `ROUTES.checkout`, `accountOrderRoute(id)` |

---

## What is deliberately not here

**Editing or cancelling a placed order.** A shopper's `/account/orders/[id]`
is read-only, on purpose — the same status-changing control the admin console
has is deliberately absent here; a mis-placed order is a phone call to the
shop, not a self-service edit, given the order is already a real commitment
to a courier.

**A payment step.** Cash on delivery, by the brief. Stripe
([`payments-feature.md`](./payments-feature.md)) is a different feature with
a different stock-timing rule — see "Why there is no `payment.service.ts`"
above.

**An editable shipping name.** Not asked for; `shippingName` is inferred from
the signed-in account rather than typed. (The governorate field this bullet
used to name is built now — see "The checkout form" above.)

**Multiple saved addresses / an address book.** Every checkout collects a
fresh address; nothing is remembered on the `User` for next time. The
snapshot-per-order principle ([`orders-feature.md`](./orders-feature.md))
means even a saved-address feature would still write a fresh copy onto each
`Order` — this is a UI convenience to add later, not a data-model change.

---

## Extending this

**Real-time stock warnings on `/checkout`.** `CheckoutSummary` reads the same
`getCart()` result the page already has, which is already stock-aware
(`cart.adjusted`) — surfacing that banner here too is a small addition, not a
new read.

**An order-time variant label.** `orders-feature.md` already names this
extension for `OrderItem` — add `variantLabel`, write it in `createOrder`'s
`orderItems` alongside `unitPrice`, and both `getOrder`/`getOrderForUser`
read it instead of recomputing from the live variant.

**Stripe, alongside COD.** A `paymentMethod` column on `Order`, a real
`payment.service.ts` for the Stripe path only, and a fork at checkout: COD
keeps calling `createOrder` exactly as it does today; Stripe creates a
`PENDING` order with stock **not** yet decremented and hands off to Checkout,
decrementing only when the webhook confirms the charge.
