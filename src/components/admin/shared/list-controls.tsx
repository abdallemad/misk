"use client"

/**
 * `useListNavigation` moved to `@/components/shared/use-list-navigation` so the
 * storefront catalogue filters can share the exact hook the admin console's
 * filter bars use. This file stays as the import path those admin components
 * already reference — see docs/admin-dashboard.md, "List pages".
 */
export { useListNavigation } from "@/components/shared/use-list-navigation"
