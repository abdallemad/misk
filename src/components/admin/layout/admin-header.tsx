import { UserButton } from "@clerk/nextjs"

import { AdminBreadcrumbs } from "@/components/admin/layout/admin-breadcrumbs"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

/**
 * The bar across the top of every admin page.
 *
 * A Server Component — only the breadcrumbs and the toggles need the client,
 * and each of those is its own island. Nothing here awaits, so it never
 * blocks the page beneath it from streaming.
 *
 * `sticky` rather than `fixed`: it scrolls with the content area only, so
 * the sidebar keeps its own independent scroll and the header never covers
 * a focused row in a long table.
 */
function AdminHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background/85 px-4 backdrop-blur-sm">
      <SidebarTrigger className="-ms-1" />
      <Separator
        orientation="vertical"
        className="me-1 data-[orientation=vertical]:h-4"
      />

      <AdminBreadcrumbs />

      {/* Pushes the controls to the trailing edge — `ms-auto` rather than a
          left/right margin, so it follows the RTL direction. */}
      <div className="ms-auto flex items-center gap-2">
        <ThemeToggle />
        <UserButton />
      </div>
    </header>
  )
}

export { AdminHeader }
