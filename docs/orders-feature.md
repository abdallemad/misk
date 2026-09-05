# Orders Feature

Admin **read-first** view of orders: list them, open one to see its lines and
its shipping address, and move its status along the fulfilment track.

## Related documents

- [`folder-structure.md`](./folder-structure.md) — the layer architecture, and the list-page convention this follows
- [`admin-dashboard.md`](./admin-dashboard.md) — the console shell, the shared list primitives
- [`customers-feature.md`](./customers-feature.md) — the sibling read-first feature; the order rows link into it
- [`checkout-orders-feature.md`](./checkout-orders-feature.md) — **built** — where orders are actually **created** (cash on delivery, not Stripe) and where stock moves; also `/account/orders`, the shopper's own read-only twin of this console
- [`payments-feature.md`](./payments-feature.md) — the Stripe path this shop has not built; would sit *beside* checkout, not instead of it
- [`admin-access-control.md`](./admin-access-control.md) — why the status action re-checks `isAdmin()`

---

## Routes

```text
/admin/orders          the list  (?q= search, ?status= filter, ?page= paging)
/admin/orders/[id]     one order: status control, customer, shipping, line items
```

Two routes, the same shape as products and customers: a filtered, paged list,
and an `[id]` detail. No `new/` — an order is **created by checkout**
([`checkout-orders-feature.md`](./checkout-orders-feature.md)), never by the
console.

`[id]` is `Order.id` (a cuid). The console prints it everywhere as `#ABC123`
— the last six characters, upper-cased — which is enough to say "order ABC123"
out loud without a 25-character string in a table cell. `adminOrderRoute(id)`
in `constants/routes.ts` builds the path from the full id.

---

## Read-first: one write, and it is not the interesting one

The console lists and inspects orders freely. The **only** thing it changes is
`status`, and even that is deliberately dumb:

> `updateOrderStatus` moves the row to any of the six statuses from any other.
> It is a fulfilment tool, not a state machine — a mis-click is fixed by
> picking again — and it **does not touch stock or payment.** A variant's
> stock moves once, at order-creation time, inside `order.service.createOrder`
> (see [`checkout-orders-feature.md`](./checkout-orders-feature.md) — cash on
> delivery has no separate payment-confirmation event to move it a second
> time); a manual status nudge here is not that event, and making it
> decrement stock would double-count.

Everything else an orders console might eventually do — refunds, partial
fulfilment, editing a line, re-sending a confirmation — is out of scope and
would each be its own Server Action with its own rules.

```text
  app/admin/orders/
   ├── page.tsx              Server Component — listOrders({ search, status, page })
   └── [id]/page.tsx         Server Component — getOrder(id)
        │
        ↓
  components/admin/orders/
   ├── orders-table.tsx      Server — the list
   ├── orders-filters.tsx    Client — search + status → navigation
   └── order-status-control.tsx  Client — the one write
        │
        ↓
  actions/order/update-order-status.ts   "use server" — isAdmin(), validate, delegate, revalidate
        │
        ↓
  services/order.service.ts   listOrders, getOrder, updateOrderStatus —
                               plus createOrder / getOrderForUser /
                               listOrdersForUser for checkout and
                               /account/orders — checkout-orders-feature.md
        │
        └──→ lib/db.ts        Prisma
```

`order-summary.tsx` (the line-items table this page renders) moved to
`components/shared/` when `/account/orders/[id]` needed the exact same table
for a shopper's own order — `components/admin/orders/index.ts` re-exports it,
so this page's import did not change. See
[`checkout-orders-feature.md`](./checkout-orders-feature.md).

Reads skip the action layer — the documented exception the whole console
takes. The write goes through a Server Action, no exception.

---

## The service

`services/order.service.ts` is the only module that reads or writes `Order` /
`OrderItem` for the console.

### `listOrders({ search, status, page })`

One page (`ORDERS_PAGE_SIZE`, 20), newest first. `search` matches the
customer's name or email **or** the start of the order id — so `#ABC123` in
the search box finds it. The count and the page are one `$transaction`, the
same "the header total and the rows cannot disagree" guarantee the products
and customers lists have.

### `getOrder(id)`

The order with its customer, its line items, and its shipping snapshot, or
`null` (→ `notFound()` on the page). Line labels are built from the **live**
variant via `formatVariantLabel`; each line also carries the variant `sku`
(printed on the bottle, quoted to the customer) and the `unitPrice`
snapshotted at checkout.

`shipping` is `null` unless `shippingStreet` is set — an order placed before
this feature existed has no address, and the page renders «لا يوجد عنوان»
rather than a card of blank rows.

### `updateOrderStatus(id, status)`

Validates the status against `ORDER_STATUSES`, updates the row, maps `P2025`
(the row vanished) to a message instead of a thrown digest. Returns a result
object, never throws — the same contract every other mutation in the console
uses.

---

## Shipping address: a snapshot, not a lookup

`Order` carries nine nullable shipping columns — a governorate dropdown plus
four free-text pieces of an Egyptian address, not one combined address line:

```prisma
shippingName        String?
shippingPhone       String?
shippingPhone2      String?   // alternate contact number, collected at checkout
shippingGovernorate String?   // محافظة — one of EGYPT_GOVERNORATES (src/constants/egypt.ts)
shippingCity        String?   // المدينة
shippingCenter      String?   // المركز
shippingStreet      String?   // الشارع
shippingBuilding    String?   // العمارة
shippingCountry     String?   @default("EG")
```

`shippingStreet`/`shippingBuilding` replaced an earlier `shippingLine1`
("street + building" combined into one string) once checkout started
collecting the building number as its own field —
[`checkout-orders-feature.md`](./checkout-orders-feature.md) has the checkout
side of this. `shippingCenter` (المركز, the administrative division under the
governorate) is new for the same reason.

They are a **snapshot taken at checkout**, exactly like the price and variant
label on `OrderItem`: if the customer later edits their saved address, the
address a past order was shipped to must not change under it. So the order
carries its own copy, and this console only ever reads it.

Nullable because the column is younger than some rows. Applied with
`prisma db push` (the project has no `migrations/` — same as the
`Category` enum→table change in [`categories-feature.md`](./categories-feature.md)).
On a database with real orders, backfilling is not required — the read path
treats "no `shippingStreet`" as "no address".

> **`Order.currency` still defaults to `"SAR"`** while `utils/format.ts`
> formats every price as `EGP`. That mismatch predates this feature and is
> not addressed here — `formatPrice` ignores the stored code. It is written
> down so the next person does not think this feature introduced it.

---

## List pages ship with pagination and filters

This feature, and the round that built it, established the console's standard
for any list screen — see [`folder-structure.md`](./folder-structure.md), the
"List pages" rule. In short:

- **Pagination is not optional.** Every list service returns
  `{ rows, total, page, pageCount }` and every list page renders
  `<AdminPagination>`.
- **Filters are whatever the page needs.** Orders needs status + text search;
  products needs category + type + status + search; customers needs role +
  search. Each is a `"use client"` `*-filters.tsx` that calls
  `useListNavigation` (`components/admin/shared/list-controls.tsx`) to turn a
  change into a `router.push` with new query params.
- **The URL is the state.** No React Query, no client cache — the list is
  server-rendered on every navigation. The filter component is a client
  component *only* to convert an input event into a navigation.

---

## Files

| File | What it is |
| --- | --- |
| `prisma/schema.prisma` | `Order.shipping*` columns (incl. `shippingPhone2`); `@@index([status])` |
| `src/app/admin/orders/page.tsx` | The list — Server Component, `?q=` / `?status=` / `?page=` |
| `src/app/admin/orders/[id]/page.tsx` | One order — status, customer, shipping (incl. the alternate phone), items. `notFound()` on a stale id |
| `src/components/admin/orders/index.ts` | Barrel — re-exports `OrderSummary` from `components/shared/` |
| `…/orders-table.tsx` | The list rows — id, customer, date, status, total |
| `…/orders-filters.tsx` | Search + status — a client filter bar over `useListNavigation` |
| `…/order-status-control.tsx` | The status `<select>` and its Server Action call |
| `src/components/shared/order-summary.tsx` | Line items + a stored-total footer — shared with `/account/orders/[id]` |
| `src/actions/order/update-order-status.ts` | `"use server"` — the one write this feature owns |
| `src/services/order.service.ts` | `listOrders`, `getOrder`, `updateOrderStatus` — plus `createOrder` and the customer-facing reads, see `checkout-orders-feature.md` |
| `src/constants/routes.ts` | `adminOrderRoute(id)` |
| `src/constants/design-system.ts` | `ORDER_STATUSES` — the six in fulfilment order |

---

## Extending this

**A real state machine** (block `DELIVERED → PENDING`, require a reason to
cancel). Put the allowed-transitions table in the service and reject an
illegal one with a message; the control already renders whatever the service
accepts.

**Refunds.** A separate Server Action — a refund moves money and restores
stock, which a status change deliberately does not. There is no Stripe
integration yet to refund *through*; for a cash-on-delivery order a "refund"
is really "restock the returned variants," which `order.service.ts` could do
directly.

**An order-time variant label.** Add `variantLabel` to `OrderItem`, write it
at checkout, and read it here instead of `formatVariantLabel(variant)`. Then a
variant renamed or retired after purchase no longer changes what a past order
says it contained.
