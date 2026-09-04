"use client"

import { useCallback } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

/**
 * The one client-side hook the list pages share — the admin console's filter
 * bars (`products-filters.tsx`, `customers-filters.tsx`, `orders-filters.tsx`)
 * and the storefront catalogue (`store-filters.tsx`).
 *
 * It does **not** fetch or cache anything — the URL is the state, and every
 * change here is a plain navigation that re-runs the page on the server with
 * the new `searchParams`. That is the pattern the app uses instead of React
 * Query: a list is server-rendered, and search / filters / paging are query
 * params, not a client store (see docs/folder-structure.md).
 *
 * `setParams` writes a patch — `null` or `""` removes a key — and **always
 * resets `page`**, because a filtered result has a different number of pages
 * and landing on page 7 of 2 is a dead end.
 *
 * Historically lived at `components/admin/shared/list-controls.tsx`; moved
 * here so the storefront can share it without importing from `admin/`. That
 * path still re-exports this for the admin filter components.
 */
export function useListNavigation(basePath: string) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const setParams = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString())

      for (const [key, value] of Object.entries(patch)) {
        if (value === null || value === "") next.delete(key)
        else next.set(key, value)
      }

      // Any filter or search change starts over from the first page.
      next.delete("page")

      const qs = next.toString()
      router.push(qs ? `${basePath}?${qs}` : basePath)
    },
    [router, searchParams, basePath]
  )

  const clearAll = useCallback(() => {
    router.push(basePath)
  }, [router, basePath])

  return {
    /** Current value of one param, or `""`. */
    get: (key: string) => searchParams.get(key) ?? "",
    /** True when any of `keys` is present — for showing a "clear" button. */
    anyActive: (keys: string[]) => keys.some((key) => searchParams.has(key)),
    setParams,
    clearAll,
    pathname,
  }
}
