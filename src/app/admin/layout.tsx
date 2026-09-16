import { auth } from "@clerk/nextjs/server"
import type { Metadata } from "next"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"

import {
  AdminHeader,
  AdminSidebar,
  BreadcrumbTitleProvider,
} from "@/components/admin/layout"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { isAdmin } from "@/services/auth.service"

export const metadata: Metadata = {
  title: {
    default: "لوحة التحكم",
    template: "%s · لوحة التحكم",
  },
  // The console must never reach an index, and it is not a shareable page.
  robots: { index: false, follow: false },
}

/**
 * `/admin` — the console shell, and the gate in front of it.
 *
 * Two independent checks stand between the public and this tree, both here
 * rather than split with `proxy.ts` — see that file for why a path-matching
 * gate at the proxy layer is deprecated:
 *
 *   1. `auth.protect()` requires a session, bouncing a signed-out visitor to
 *      sign-in before any of this renders.
 *   2. `isAdmin()` requires that session to be an admin.
 *
 * Both live in this layout because every nested admin route renders *inside*
 * it — so there is no `/admin/*` page that can be added later and forget to
 * protect itself.
 *
 * `notFound()` rather than a redirect or a 403 for the role check: a
 * non-admin should not learn that `/admin` exists. See
 * docs/admin-access-control.md.
 */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await auth.protect()
  if (!(await isAdmin())) notFound()

  // The rail's open/closed state is persisted in a cookie by the sidebar's
  // client component. Reading it here means the server renders the sidebar
  // in the state the user left it — without this the markup always says
  // "open" and a user who collapsed it sees it flash open on every load.
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false"

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AdminSidebar />
      <SidebarInset className="min-w-0">
        {/* Wraps the header *and* the page, so a detail page can register its
            title (a product name, a customer name) for the last breadcrumb. */}
        <BreadcrumbTitleProvider>
          <AdminHeader />
          {children}
        </BreadcrumbTitleProvider>
      </SidebarInset>
    </SidebarProvider>
  )
}
