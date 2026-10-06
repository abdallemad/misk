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
├── customers/        #   /admin/customers  — built — customers-feature.md
│   └── [id]/         #   /admin/customers/[id]
├── orders/           #   /admin/orders     — built — orders-feature.md
│   └── [id]/         #   /admin/orders/[id]
└── settings/         #   /admin/settings   — scaffold
```

> **On the folder name.** [`folder-structure.md`](./folder-structure.md)
> sketches this as a `(admin)` route group. It is a plain `admin/` folder
> instead, because the URL genuinely is `/admin` — a route group would strip
> the segment and the routes would have to re-add it as `(admin)/admin/…`,
> which buys nothing. The layout still belongs to this subtree only, which is
> the property the route group was there to provide.

`settings/` is the last scaffold page — it exists so the sidebar is honest:
every nav item routes to a real page that says what belongs there and which
doc specifies it, rather than a 404 that looks like a bug. It is deleted by
the pull request that builds it — `categories/` was the first scaffold to go,
then `products/`, `customers/`, `orders/`.

The four built sections answer the "one page or several?" question
differently and say why: [`categories-feature.md`](./categories-feature.md)
keeps everything in dialogs on the list;
[`products-feature.md`](./products-feature.md) takes `new/` and `[id]/`
routes, because a perfume carries a gallery and an open-ended collection of
variants; [`customers-feature.md`](./customers-feature.md) and
[`orders-feature.md`](./orders-feature.md) are **read-first** — a list plus an
`[id]/` route, and between them exactly two writes (a customer's role, an
order's status), because a customer identity lives in Clerk and an order is
created by checkout.

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
is how a segment gets «العطور» instead of `products`.

### The last crumb on a detail page

Nav labels are matched by **exact href**. Prefix matching (the first version)
lit the section's own label for its sub-segments too, so
`/admin/products/<id>` read «… / العطور / العطور». With exact matching the id
segment has no nav entry and falls to a fallback:

1. the title a detail page registered through **`BreadcrumbTitle`** — a
   `"use client"` component the page renders with the entity's name (a
   product, a customer, `#ABC123` for an order). It writes the name into a
   context (`breadcrumb-title.tsx`) on mount and clears it on unmount; the
   header reads it for the leaf crumb. `BreadcrumbTitleProvider` wraps the
   header *and* the page in `admin/layout.tsx`, because they are siblings and
   there is no server-side way to pass a value up from one to the other.
2. failing that, `«…»` for an opaque id (a cuid), or a title-cased word for
   anything else (`new` → `New`, though `new/page.tsx` also registers «عطر
   جديد»).

The pre-hydration render shows the fallback for one frame, then the effect
swaps in the real name — acceptable for a detail page, and the reason the id
placeholder is `«…»` and not a raw cuid.

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
| `AdminPagination` | Prev / next paging for a list page — Server Component, `<Link>`-based, carries the active filters through, hidden on a single page. The storefront's `/store` uses `components/shared/pagination.tsx` (`<Pagination>`), which has since grown numbered pages; consolidating the two (and so giving the admin lists page numbers too) is a pending cleanup |
| `ComingSoon` | Scaffold body for a section not built yet |

The barrel also re-exports `StatusBadge`, `OrderStatusBadge`, `StockBadge`
and `BrandLoader` from `components/shared`. Re-exporting rather than
duplicating means an order badge in the admin table and one on the customer's
order page can never drift apart.

**`list-controls.tsx` is not in the barrel.** It re-exports `useListNavigation`
— a `"use client"` hook that now lives at
`components/shared/use-list-navigation.ts`, so the storefront catalogue's
filter bar can share it (see [`store-feature.md`](./store-feature.md)). Admin
filter components still import it by path
(`@/components/admin/shared/list-controls`), unchanged. Keeping it out of the
barrel means a Server Component page can pull `PageContainer` from the barrel
without dragging a client module into its graph.

---

## List pages: pagination and filters are not optional

Every list screen in the console — products, customers, orders — ships with
paging and with whatever filters the page needs. This is a rule, not a
per-feature choice, and it has one shape. The storefront `/store` catalogue
follows the same shape outside `/admin` — see
[`store-feature.md`](./store-feature.md).

**The service** takes `{ search?, page?, …filters }` and returns
`{ rows, total, page, pageCount }`. The count and the page go out as one
`$transaction` so the header total and the rows cannot disagree.

**The page** (a Server Component) reads the params off `searchParams`,
validates them, calls the service, and renders:

```tsx
<div className="px-4 pt-4">
  <XFilters … />           {/* "use client" */}
</div>
<XTable rows={result.rows} filtered={filtered} />
<AdminPagination
  page={result.page}
  pageCount={result.pageCount}
  basePath={ROUTES.adminX}
  params={{ q: search, /* …the other filters */ }}
/>
```

**The filter bar** (`x-filters.tsx`, `"use client"`) renders a search
`<Input>` (applies on submit — navigating per keystroke is a request storm)
and `<Select>`s (apply on change), all through `useListNavigation`:

```ts
const nav = useListNavigation(ROUTES.adminX)
nav.setParams({ category: value || null })   // always resets ?page=
nav.clearAll()                                // back to the bare route
```

`useListNavigation` does **no fetching and no caching** — it turns an input
event into a `router.push` with new query params, and the page re-renders on
the server. That is the console's answer to "where does the React Query layer
go": it does not, until a screen has *optimistic* client state
(drag-to-reorder, edits that must paint before the server replies). A
URL-driven filter is not that. See
[`folder-structure.md`](./folder-structure.md). The hook now lives at
`components/shared/use-list-navigation.ts` (the `admin/shared/list-controls`
path re-exports it) so `/store` shares the exact implementation.

**The table** takes a `filtered` boolean so an empty result reads as "nothing
matched" instead of "add your first —".

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

### Forms: `<Form>`, `<Field name>`, `<FieldError />`

A form in this console is three components from `components/ui`, and the whole
error story falls out of them:

```tsx
<Form errors={errors} onSubmit={handleSubmit}>
  <Field name="slug">
    <FieldLabel htmlFor="slug">المعرّف</FieldLabel>
    <Input id="slug" name="slug" />
    <FieldError />
  </Field>
</Form>
```

`errors` is a flat `Record<fieldName, message>` — hand it a Zod parse result
and every matching field goes red, every `<FieldError />` finds its own
message with no props, and focus moves to the first invalid control. Editing a
flagged field clears its message.

Three things worth knowing:

- **`<Form>` renders `noValidate`.** Native `required` / `min` / `pattern`
  bubbles are off by design: they are a second, weaker copy of rules that live
  in the Zod schema, they cannot express most of them, and they pre-empt the
  better message. `maxLength` and `accept` stay — they prevent input rather
  than report on it.
- **`<Field>` is Base UI's `Field.Root`.** Its `name` is what joins it to the
  error map; without one it behaves exactly like the plain wrapper it used to
  be, which is why the category dialog kept working unchanged.
- **`<FieldError />` with no children** reads from the form.
  `<FieldError>message</FieldError>` always renders, for a message the form
  does not know about — the gallery field uses both.

[`products-feature.md`](./products-feature.md) is the worked example, including
why the product form dispatches its action from `onSubmit` rather than
`<form action>`.

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
   export default async function AdminOrdersPage(
     props: PageProps<"/admin/orders">
   ) {
     const sp = await props.searchParams
     // …parse & validate q / page / your filters off sp…
     const result = await listOrders({ search, status, page })  // service

     return (
       <PageContainer>
         <PageHeader title="الطلبات" description="…" actions={<…/>} />
         <SectionCard title="…" flush>
           <div className="px-4 pt-4"><OrdersFilters … /></div>
           <OrdersTable orders={result.orders} filtered={filtered} />
           <AdminPagination
             page={result.page}
             pageCount={result.pageCount}
             basePath={ROUTES.adminOrders}
             params={{ q: search, status }}
           />
         </SectionCard>
       </PageContainer>
     )
   }
   ```

3. Feature components go in `src/components/admin/<feature>/`.
4. **If the page is a list, it ships with pagination and filters** — the
   service returns `{ rows, total, page, pageCount }`, the page renders
   `<AdminPagination>`, and a `"use client"` `<feature>-filters.tsx` drives
   `?q=` / your filter params through `useListNavigation`. See
   [the "List pages" section](#list-pages-pagination-and-filters-are-not-optional)
   above. This is not optional and not "later" — a list without paging is a
   bug the day the shop has 30 rows.
5. Anything that **writes** goes through a Server Action that re-checks
   `isAdmin()` — the layout guard does not run for a Server Action POST. See
   [`admin-access-control.md`](./admin-access-control.md).
6. A detail page (`[id]/page.tsx`) renders `<BreadcrumbTitle title={…} />` so
   its last breadcrumb reads the entity's name, not a repeated label or a raw
   id.
