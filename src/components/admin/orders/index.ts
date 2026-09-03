/**
 * The orders feature's components, behind one import path — the same barrel
 * convention the other admin features use.
 *
 * `OrdersTable` and `OrderSummary` are Server Components; `OrdersFilters`
 * (turns a filter change into a navigation) and `OrderStatusControl` (the
 * feature's one write) are the client islands.
 */

export { OrderStatusControl } from "./order-status-control"
export { OrderSummary } from "./order-summary"
export { OrdersFilters } from "./orders-filters"
export { OrdersTable } from "./orders-table"
