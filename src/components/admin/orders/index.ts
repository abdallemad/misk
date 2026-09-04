/**
 * The orders feature's components, behind one import path — the same barrel
 * convention the other admin features use.
 *
 * `OrdersTable` is a Server Component; `OrdersFilters` (turns a filter
 * change into a navigation) and `OrderStatusControl` (the feature's one
 * write) are the client islands. `OrderSummary` is re-exported from
 * `components/shared/` — it moved there so `/account/orders/[id]` (the
 * shopper's own order) could render the same line-item table without an
 * admin import; this path still works unchanged for `/admin/orders/[id]`.
 */

export { OrderStatusControl } from "./order-status-control"
export { OrderSummary } from "@/components/shared/order-summary"
export { OrdersFilters } from "./orders-filters"
export { OrdersTable } from "./orders-table"
