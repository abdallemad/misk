import * as React from "react"

const MOBILE_BREAKPOINT = 768
const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

function subscribe(onStoreChange: () => void) {
  const mql = window.matchMedia(MOBILE_QUERY)
  mql.addEventListener("change", onStoreChange)
  return () => mql.removeEventListener("change", onStoreChange)
}

/**
 * Diverges from the stock shadcn `use-mobile`, which sets state inside an
 * effect and trips `react-hooks/set-state-in-effect`. `useSyncExternalStore`
 * is the intended hook for reading a browser API like this, and it renders
 * `false` on the server exactly as the original did.
 *
 * Re-running `shadcn add sidebar` will overwrite this file — re-apply the
 * change if it comes back.
 */
export function useIsMobile() {
  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => false
  )
}
