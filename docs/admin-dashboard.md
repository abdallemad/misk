# Admin Dashboard

The `/admin` console — its shell, its navigation, and the components every
admin feature is built from.

## Related documents

- [`admin-access-control.md`](./admin-access-control.md) — how the console is locked down
- [`auth-callback.md`](./auth-callback.md) — how a user gets a row and a role
- [`folder-structure.md`](./folder-structure.md) — the layer architecture

---

## Routes

```text
src/app/admin/
│
├── layout.tsx        # guard + SidebarProvider + sidebar + header
├── loading.tsx       # skeleton matching the overview's shape
├── error.tsx         # error boundary — keeps the sidebar standing
├── page.tsx          #   /admin            — the overview (real data)
│
├── products/         #   /admin/products   — built — products-feature.md
│   ├── new/          #   /admin/products/new
│   └── [id]/         #   /admin/products/[id]
├── categories/       #   /admin/categories — built — categories-feature.md
├── orders/           #   /admin/orders     — scaffold
├── customers/        #   /admin/customers  — scaffold
└── settings/         #   /admin/settings   — scaffold
```

> **On the folder name.** [`folder-structure.md`](./folder-structure.md)
> sketches this as a `(admin)` route group. It is a plain `admin/` folder
> instead, because the URL genuinely is `/admin` — a route group would strip
> the segment and the routes would have to re-add it as `(admin)/admin/…`,
> which buys nothing. The layout still belongs to this subtree only, which is
> the property the route group was there to provide.

The remaining scaffold pages exist so the sidebar is honest: every nav item
routes to a real page that says what belongs there and which doc specifies
it, rather than a 404 that looks like a bug. Each is deleted by the pull
request that builds its section — `categories/` was the first to go, then
`products/`.

The two are worth reading as a pair, because they answer the "one page or
several?" question differently and say why:
[`categories-feature.md`](./categories-feature.md) keeps everything in
dialogs on the list; [`products-feature.md`](./products-feature.md) takes
`new/` and `[id]/` routes, because a perfume carries a gallery and an
open-ended collection of variants.

---

## The shell

```tsx
// src/app/admin/layout.tsx
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  if (!(await isAdmin())) notFound()

  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false"

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AdminSidebar />
      <SidebarInset className="min-w-0">
        <AdminHeader />
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
```

Three things are load-bearing:

**The guard is in the layout**, so every nested route inherits it. See
[`admin-access-control.md`](./admin-access-control.md).

**`cookies()` reads the sidebar's persisted state.** The shadcn sidebar
writes `sidebar_state` from the client on every toggle. Without reading it
back on the server, the markup always says "open" and a user who collapsed
the rail watches it flash open on every page load.

**`min-w-0` on `SidebarInset`.** A flex child defaults to `min-width: auto`,
which refuses to shrink below its content — so one wide data table would push
the whole layout sideways instead of scrolling inside its own container.

### A note on `loading.tsx`

`admin/loading.tsx` does **not** cover the first render of `/admin`. The
layout above it awaits `cookies()` and the admin check, and Next.js blocks on
a layout's runtime data before streaming a child's fallback.

It *does* cover every navigation **within** `/admin`, where the layout is
already rendered and only the page re-runs — which is the case that actually
repeats. This is documented behaviour, not a bug; see the "Interaction with
loading.js" caveat in the Next.js `layout.js` reference.

---

## The sidebar

`src/components/admin/layout/admin-sidebar.tsx`

A Client Component for exactly one reason: `usePathname()`, to mark the
active item. It holds no data of its own and never calls a service — the
layout above it stays a Server Component and keeps the guard on the server.

```tsx
<Sidebar side="right" collapsible="icon" variant="inset">
```

- **`side="right"`** — the console is RTL. The underlying shadcn sidebar is
  written with logical properties (`border-e`, `start`/`end`), so the
  collapse animation and the rail handle mirror correctly with no second
  stylesheet.
- **`collapsible="icon"`** — collapses to a 3rem icon rail rather than
  vanishing, so navigation survives at narrow widths. On mobile it becomes a
  sheet.

### Base UI composition — `render`, not `asChild`

This project's shadcn components are the **Base UI** flavour. There is no
`asChild` anywhere in `components/ui`. Composition goes through `render`:

```tsx
<SidebarMenuButton
  render={<Link href={item.href} />}
  isActive={active}
  tooltip={item.label}
>
  <item.icon aria-hidden="true" />
  <span>{item.label}</span>
</SidebarMenuButton>
```

The button's props and styling are merged onto the `Link`, so each nav item
is a real anchor — middle-clickable, and announced as a link. Writing
`asChild` here compiles and then silently renders a `<button>` that does not
navigate.

### Behaviour worth keeping

- **Mobile taps close the sheet.** Otherwise the user navigates and then
  stares at the menu they just used. Desktop is untouched — the rail is
  persistent there.
- **`aria-current="page"`** on the active item. The `data-active` styling is
  invisible to assistive tech.
- **The wordmark swaps for the mark when collapsed**, via CSS
  (`group-data-[collapsible=icon]:hidden`) rather than by unmounting — keeps
  the transition smooth and avoids a layout jump.
- **A "back to the storefront" item in the footer.** An admin is a shopper
  too, and without it the console is a room with no door.

---

## Navigation is data

`src/constants/admin-nav.ts` is the single source of truth. The sidebar
renders it, the breadcrumbs read labels from it, and the overview's section
cards are generated from it — so the three cannot disagree about what a route
is called.

```ts
export const ADMIN_NAV: AdminNavGroup[] = [
  { label: "نظرة عامة", items: [ /* … */ ] },
  { label: "الكتالوج",  items: [ /* … */ ] },
  { label: "المبيعات",  items: [ /* … */ ] },
  { label: "الإعدادات", items: [ /* … */ ] },
]
```

Adding a section to the console is a one-entry edit here plus a page file.

### Active matching

```ts
export function isActiveNavItem(item: AdminNavItem, pathname: string): boolean {
  if (item.exact) return pathname === item.href
  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}
```

Prefix matching so `/admin/products/new` still lights up «العطور», with a `/`
guard so `/admin/products-archive` does not. The overview sets `exact: true`
because `/admin` prefixes every other admin route and would otherwise stay
lit everywhere.

`findNavItem()` returns the **deepest** match for the same reason: on
`/admin/products` the answer should be «العطور», not «لوحة التحكم».

---

## The header

`src/components/admin/layout/admin-header.tsx` — a Server Component. Only
the breadcrumbs and the toggles need the client, and each is its own island.
Nothing here awaits, so it never blocks the page beneath it from streaming.

`sticky` rather than `fixed`: it scrolls with the content area only, so the
sidebar keeps its own scroll and the header never covers a focused row in a
long table.

Breadcrumbs are built from `ADMIN_NAV_ITEMS`, not by splitting the URL — that
is how a segment gets «العطور» instead of `products`. Segments with no nav
entry (a product id, `new`) fall through to a title-cased crumb, which is
right for an id and adequate until each detail page passes its own.

---

## Shared components

Everything under `src/components/admin/shared/`, behind one barrel:

```ts
import { PageContainer, PageHeader, SectionCard } from "@/components/admin/shared"
```

| Component | What it is for |
| --- | --- |
| `PageContainer` | The padded, width-capped column every admin page renders into |
| `PageHeader` | Title + one line of context + the page's actions |
| `SectionCard` | One titled block — form section, stats panel, table wrapper |
| `StatTile` | One number on the overview |
| `ComingSoon` | Scaffold body for a section not built yet |

The barrel also re-exports `StatusBadge`, `OrderStatusBadge`, `StockBadge`
and `BrandLoader` from `components/shared`. Re-exporting rather than
duplicating means an order badge in the admin table and one on the customer's
order page can never drift apart.

### A note on tall dialogs

`DialogContent` is a `position: fixed` popup centred on the viewport, which
means a dialog taller than the screen cannot be scrolled to — its footer, and
therefore its submit button, is simply unreachable. Any dialog with more than
a handful of fields should cap itself and scroll its middle:

```tsx
<DialogContent className="grid-rows-[auto_minmax(0,1fr)_auto] max-h-[80svh]">
  <DialogHeader>…</DialogHeader>
  <DialogBody>…the fields…</DialogBody>
  <DialogFooter>…</DialogFooter>
</DialogContent>
```

`DialogBody` is a `ScrollArea`; the row template and the cap are on the
content because a dialog with two rows would otherwise stretch its footer.
The full reasoning — including why `svh` and not `vh`, and why `minmax(0,1fr)`
and not `1fr` — is on the component in
[`dialog.tsx`](../src/components/ui/dialog.tsx).

### Conventions these encode

- **`PageHeader` owns the `<h1>`** and nothing else in the console does, so
  every admin page has exactly one. The layout supplies the chrome; the page
  supplies the heading.
- **`SectionCard` leaves spacing to the card's own `--card-spacing` token**
  and its `[.border-b]:pb-*` rule. Hard-coding padding would put admin cards
  on a different rhythm from storefront ones.
- **`StatTile` takes a design-system `Tone`, not a colour.** Passing
  `warning` is how a low-stock tile says "look at me" without the component
  knowing what stock is. Digits are `tabular-nums` so a row of tiles does not
  jitter as counts change width.

---

## The overview, and the one architectural exception

`/admin/page.tsx` is a Server Component that calls `admin.service` directly,
skipping the hook-and-action layer:

```tsx
const stats = await getDashboardStats()
```

This is the exception [`folder-structure.md`](./folder-structure.md)
documents: the figures are read-only, there is nothing to mutate or cache,
and they belong in the first paint rather than arriving after a client round
trip. **It does not generalise** — anything that writes goes back through a
Server Action.

`getDashboardStats()` issues its six counts as one `$transaction`:

```ts
await db.$transaction([
  db.product.count(),
  db.product.count({ where: { isActive: true } }),
  db.order.count(),
  db.order.count({ where: { status: { in: OPEN_ORDER_STATUSES } } }),
  db.user.count(),
  db.productVariant.count({ where: { isActive: true, stock: { lte: LOW_STOCK_THRESHOLD } } }),
])
```

Six sequential counts could show 12 orders in one tile and 13 in the next if
an order lands between them. A dashboard that contradicts itself is worse
than a slightly stale one — and it is one round trip instead of six.

---

## Error handling

`admin/error.tsx` sits **inside** the layout, so a failed query takes out the
content area and leaves the sidebar and header standing — the admin can
navigate to another section instead of being dropped on a blank page.

`error.message` is deliberately not rendered: React replaces it with a
generic string in production anyway, and in development the overlay already
shows the real one. The `digest` is shown, because it is the only handle on a
specific production failure in the server logs.

---

## Adding a section

1. Add an entry to `ADMIN_NAV` in `src/constants/admin-nav.ts` and a route
   constant in `src/constants/routes.ts`.
2. Replace the scaffold page with a real one:

   ```tsx
   export default async function AdminOrdersPage() {
     const orders = await getOrders()   // services/order.service.ts

     return (
       <PageContainer>
         <PageHeader title="الطلبات" description="…" actions={<…/>} />
         <SectionCard title="…" flush>
           <OrdersTable orders={orders} />
         </SectionCard>
       </PageContainer>
     )
   }
   ```

3. Feature components go in `src/components/admin/<feature>/`.
4. Anything that **writes** goes through a Server Action that re-checks
   `isAdmin()` — the layout guard does not run for a Server Action POST. See
   [`admin-access-control.md`](./admin-access-control.md).
