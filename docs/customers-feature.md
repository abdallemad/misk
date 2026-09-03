# Customers Feature

Admin **read-first** view of the people who have signed in — their accounts,
mirrored from Clerk, and the orders they have placed. The one thing the
console can change about a customer is their **role**.

## Related documents

- [`folder-structure.md`](./folder-structure.md) — the layer architecture, and the list-page convention this follows
- [`admin-dashboard.md`](./admin-dashboard.md) — the console shell and shared list primitives
- [`auth-callback.md`](./auth-callback.md) — how a `User` row comes to exist at all
- [`admin-access-control.md`](./admin-access-control.md) — how `role` gates `/admin`, and the bootstrap rule the in-app control keeps
- [`orders-feature.md`](./orders-feature.md) — the sibling read-first feature; each order row links to it
- [`database-seeding.md`](./database-seeding.md) — where the customers and orders on a dev database come from

---

## Routes

```text
/admin/customers          the list  (?q= search, ?role= filter, ?page= paging)
/admin/customers/[id]     one customer: profile, order history, role control
```

Two routes, the same split [`products-feature.md`](./products-feature.md)
makes: a list fits on one page, an order history and a role control do not.
`[id]` is `User.id` (a cuid), not `clerkId`. `adminCustomerRoute(id)` in
`constants/routes.ts` builds the path.

---

## Read-first: everything is a read except `role`

A customer account is owned by **Clerk** and mirrored into Postgres by
`syncCurrentUser()` on every visit to `/auth-callback`
([`auth-callback.md`](./auth-callback.md)). So the console reads freely and
writes almost nothing:

| Field | Editable here? |
| --- | --- |
| `name`, `email`, `imageUrl`, `phone` | **No.** Clerk owns them; an edit here would be overwritten on the customer's next sign-in. Writing back to Clerk is a separate, larger feature. |
| `clerkId`, `createdAt` | **No.** Identity and history. |
| `role` | **Yes** — promote to `ADMIN` or demote to `USER`, behind a confirm dialog and a Server Action. See [Role management](#role-management). |

```text
  app/admin/customers/
   ├── page.tsx              Server Component — listCustomers({ search, role, page })
   └── [id]/page.tsx         Server Component — getCustomer(id) + getCurrentUser()
        │
        ↓
  components/admin/customers/
   ├── customers-table.tsx        Server
   ├── customers-filters.tsx      Client — search + role → navigation
   ├── customer-orders-table.tsx  Server
   └── customer-role-control.tsx  Client — the one write, behind AlertDialog
        │
        ↓
  actions/customer/set-role.ts    "use server" — isAdmin(), not-self, validate, delegate
        │
        ↓
  services/customer.service.ts    listCustomers, getCustomer, setCustomerRole
        │
        ├──→ @clerk/nextjs/server  clerkClient() — the source of truth for role
        └──→ lib/db.ts             Prisma — the mirror
```

Paging uses the shared `<AdminPagination>`; the filter bar uses the shared
`useListNavigation` hook — see [`folder-structure.md`](./folder-structure.md),
the "List pages" rule.

---

## The service

### `listCustomers({ search, role, page })`

One page (`CUSTOMERS_PAGE_SIZE`, 20), newest sign-up first, each row carrying:

| Field | How |
| --- | --- |
| `orderCount` | `user.orders.length` from the include |
| `totalSpent` | sum of every order's `totalPrice` **except** `CANCELLED` ones |
| `lastOrderAt` | the most recent `order.createdAt`, or `null` |

The aggregates are computed **in memory** from an `orders` include, not in
SQL: the page is capped at 20 rows, so at most twenty customers' orders are
pulled, and a `groupBy` would be a second query for data the first already
carries. Same trade `product.service.listProducts` makes.

`totalSpent` is a **number, not a `Decimal`** — rendered and compared, never
charged. `search` matches `name` or `email` case-insensitively; `role` narrows
to `ADMIN` or `USER`. The count and the page are one `$transaction`.

### `getCustomer(id)`

The customer with their **full** order history (no paging — one person's
orders are bounded), or `null` (→ `notFound()`). Each order's line items are
flattened to `{ productName, variantLabel, quantity, unitPrice }`, label from
the live variant.

### `setCustomerRole(id, role)` — the write

**Clerk is written first.** `/admin` gates on the Clerk `publicMetadata.role`,
not on this table ([`admin-access-control.md`](./admin-access-control.md)), so:

- a change that only touched Postgres would grant nothing;
- a change that touched Postgres first and then failed at Clerk would leave
  the mirror lying.

So the order is: `clerkClient().users.updateUserMetadata(...)`, and only if
that returns, `db.user.update(...)`. A `clerkId` Clerk does not recognise — a
seed-script account (`seed_dev_*`), or a user deleted in Clerk — comes back as
a 404 and is turned into «لا يوجد حساب مطابق في Clerk», not a thrown digest.

---

## Role management

### Why an in-app control now exists

[`admin-access-control.md`](./admin-access-control.md) says there is
"deliberately no UI" for granting admin, and that the first admin must come
from outside the app. **Both are still true.** What changed is that once a
first admin exists (via `npm run grant-admin`), needing the CLI or the Clerk
dashboard to add a *second* is friction with no security benefit — the
attacker model that rule guards against is "a logged-in non-admin escalates
themselves", and that is closed by two checks in the Server Action:

| Guard | In |
| --- | --- |
| `isAdmin()` — caller must already be an admin | `set-role.ts`, re-checked because the layout guard does not run for a POST |
| **not-self** — `getCurrentUser().id !== targetId` | `set-role.ts`. A lone admin cannot demote themselves and lock the console; nobody can promote themselves in a loop. The detail page renders a disabled control with this reason for your own row. |

The bootstrap path is untouched: `grant-admin` is still how the first admin
(and any admin, if the console is somehow empty of them) is made.

### The control

`customer-role-control.tsx` is behind an `AlertDialog`, not a bare toggle:
granting admin hands someone the whole console, and it should take a
confirming click that spells out what happens ("صلاحية كاملة … عند طلبه
التالي"). The action is awaited in a `useTransition`, not `useActionState`,
because a refusal like "no matching Clerk account" has to be readable while
the dialog is still open. On success the action revalidates, so the badge here
and the role column in the list both refresh.

---

## List pages ship with pagination and filters

Established this round as the console standard — see
[`folder-structure.md`](./folder-structure.md), "List pages". For customers:

- `listCustomers` returns `{ customers, total, page, pageCount }`; the page
  renders `<AdminPagination basePath={ROUTES.adminCustomers} params={{ q, role }} />`.
- `customers-filters.tsx` is a `"use client"` bar: a search box (applies on
  submit) and a role `<Select>` (applies on change), both calling
  `useListNavigation` to `router.push` new query params. The list stays
  server-rendered; there is no client data cache.

The earlier version of this feature used a no-JS `GET <form>` for search and a
bespoke `customers-pagination.tsx`. Both were replaced with the shared pieces
when products and orders needed the same thing — one filter pattern across
three pages beats three.

---

## A note on `OrderStatus`

Rendering an order's status surfaced a latent bug: `constants/design-system.ts`
had a hand-written `OrderStatus` union with members the Prisma enum never had
(`PAID`, `PROCESSING`, `REFUNDED`) and missing ones it does (`CONFIRMED`,
`IN_PRODUCTION`). It is now `export type { OrderStatus }` re-exported from
`@prisma/client` with `ORDER_STATUS_TONE` / `ORDER_STATUS_LABEL` rewritten to
the real six, plus an ordered `ORDER_STATUSES` array. `OrderStatusBadge`, the
orders console and the design-system showcase all pick it up for free.

---

## Files

| File | What it is |
| --- | --- |
| `src/app/admin/customers/page.tsx` | The list — `?q=` / `?role=` / `?page=` |
| `src/app/admin/customers/[id]/page.tsx` | One customer — profile, role control, order history. `notFound()` on a stale id |
| `src/components/admin/customers/index.ts` | Barrel |
| `…/customers-table.tsx` | Server — avatar, name → detail link, role, order count, lifetime value, dates |
| `…/customers-filters.tsx` | Client — search + role, over `useListNavigation` |
| `…/customer-orders-table.tsx` | Server — one customer's orders, line items under each |
| `…/customer-role-control.tsx` | Client — promote / demote, behind an `AlertDialog` |
| `src/actions/customer/set-role.ts` | `"use server"` — `isAdmin()` + not-self, then the service |
| `src/services/customer.service.ts` | `listCustomers`, `getCustomer`, `setCustomerRole` |
| `src/constants/routes.ts` | `adminCustomerRoute(id)` |
| `src/constants/design-system.ts` | `OrderStatus` realigned to the Prisma enum (see above) |

---

## Extending this

**A "has ordered" filter.** Another `searchParams` key, another `where` clause
(`orders: { some: {} }`). Still no client state.

**Writing `name` / `phone` back to Clerk.** A real feature — a Server Action, a
Clerk backend call, a decision about conflict with the next sign-in sync. Not
an extension of this view.

**Impersonation / "view store as this customer".** A Clerk feature, gated
hard, out of scope — noted so it is not reached for casually.
