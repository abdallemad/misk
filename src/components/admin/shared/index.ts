/**
 * The admin console's shared building blocks, behind one import path.
 *
 * Feature folders import from `@/components/admin/shared` and never reach
 * into a file directly, so a primitive can be split or renamed without
 * touching the pages that use it.
 *
 * The re-exports at the bottom are deliberate: `StatusBadge` and friends are
 * domain-neutral and already live in `components/shared`, used by the
 * storefront too. Re-exporting rather than duplicating means an order badge
 * in the admin table and one on the customer's order page can never drift
 * apart. See docs/folder-structure.md.
 *
 * `list-controls.tsx` (the `useListNavigation` hook) is **not** re-exported
 * here on purpose: it is `"use client"`, and its callers are themselves
 * client filter components that import it by path. Keeping it out of this
 * barrel means a Server Component page can pull `PageContainer` from here
 * without dragging a client module into the graph.
 */

export { AdminPagination } from "./admin-pagination"
export { ComingSoon } from "./coming-soon"
export { PageContainer } from "./page-container"
export { PageHeader } from "./page-header"
export { SectionCard } from "./section-card"
export { StatTile } from "./stat-tile"

export {
  BrandLoader,
  StatusBadge,
  OrderStatusBadge,
  StockBadge,
} from "@/components/shared"
