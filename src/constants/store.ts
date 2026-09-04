/**
 * Storefront catalogue constants — the client-safe half of `/store`.
 *
 * These live here rather than in `services/catalog.service.ts` for the same
 * reason `constants/uploads.ts` exists apart from `lib/uploads.ts`: the
 * service is `server-only` (it imports Prisma), and the filter bar
 * (`components/store/store-filters.tsx`) is a Client Component that needs the
 * sort list to build its `<select>`. So the vocabulary lives here and both
 * sides read the same array.
 *
 * The page-size limit stays next to the service — the same call
 * `PRODUCTS_PAGE_SIZE` / `ORDERS_PAGE_SIZE` make (see docs/folder-structure.md).
 */

export type StoreSort = "newest" | "price-asc" | "price-desc" | "name"

/** In the order the sort `<select>` offers them; the first is the default. */
export const STORE_SORTS = [
  "newest",
  "price-asc",
  "price-desc",
  "name",
] as const satisfies readonly StoreSort[]

export const DEFAULT_STORE_SORT: StoreSort = "newest"

/** Arabic labels, rendered verbatim in the sort control. */
export const STORE_SORT_LABEL: Record<StoreSort, string> = {
  newest: "الأحدث",
  "price-asc": "الأقل سعرًا",
  "price-desc": "الأعلى سعرًا",
  name: "أبجديًا",
}
