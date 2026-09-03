"use client"

import { createContext, useContext, useEffect, useState } from "react"

/**
 * Lets a detail page name its own last breadcrumb.
 *
 * The breadcrumb trail is built from the URL and `ADMIN_NAV`
 * (`admin-breadcrumbs.tsx`). That works for every segment that *is* a nav
 * item, and falls apart on the ones that are not: on `/admin/products/<cuid>`
 * the id segment has no nav entry, and prefix-matching used to light «العطور»
 * for it too — so the trail read «لوحة التحكم / العطور / العطور» instead of
 * naming the perfume.
 *
 * There is no server-side way to hand the header a value from the page below
 * it (they are siblings under the layout), so the page registers its title
 * through this context on mount and clears it on unmount. The header reads it
 * for the leaf crumb.
 *
 * The setter comes from `useState` and is referentially stable, so it sits in
 * its own context away from the value — a component that only *sets* the title
 * never re-renders when the title changes.
 */

const SetBreadcrumbTitleContext = createContext<(title: string | null) => void>(
  () => {}
)
const BreadcrumbTitleContext = createContext<string | null>(null)

export function BreadcrumbTitleProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [title, setTitle] = useState<string | null>(null)

  return (
    <SetBreadcrumbTitleContext.Provider value={setTitle}>
      <BreadcrumbTitleContext.Provider value={title}>
        {children}
      </BreadcrumbTitleContext.Provider>
    </SetBreadcrumbTitleContext.Provider>
  )
}

/** Read the registered title — for the breadcrumb trail itself. */
export function useBreadcrumbTitle(): string | null {
  return useContext(BreadcrumbTitleContext)
}

/**
 * Rendered by a detail page (server component) with the entity's name, so the
 * last crumb reads «… / العطور / لاكوست إسنشل» instead of a repeated label or
 * a raw id. Renders nothing.
 *
 * `title` is a prop rather than read from data here so the page stays a
 * Server Component — this is the only piece that has to be on the client.
 */
export function BreadcrumbTitle({ title }: { title: string }) {
  const setTitle = useContext(SetBreadcrumbTitleContext)

  useEffect(() => {
    setTitle(title)
    return () => setTitle(null)
  }, [setTitle, title])

  return null
}
