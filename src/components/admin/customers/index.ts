/**
 * The customers feature's components, behind one import path — the same barrel
 * convention `components/admin/shared`, `…/categories` and `…/products` use,
 * so the pages import from a single stable path and files can be split or
 * renamed without touching them.
 *
 * Everything is a Server Component except `CustomersFilters` (turns a filter
 * change into a navigation) and `CustomerRoleControl` (the one write in the
 * feature — promote / demote, behind a confirm dialog).
 */

export { CustomerOrdersTable } from "./customer-orders-table"
export { CustomerRoleControl } from "./customer-role-control"
export { CustomersFilters } from "./customers-filters"
export { CustomersTable } from "./customers-table"
