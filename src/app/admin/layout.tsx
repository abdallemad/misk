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
 * Two independent checks stand between the public and this tree:
 *
 *   1. `proxy.ts` requires a session for `/admin(.*)`, so a signed-out
 *      visitor is bounced to sign-in before any of this renders.
 *   2. This layout requires that session to be an admin.
 *
 * The role check lives here rather than in the proxy because a layout can
 * read it cheaply and, more importantly, because every nested admin route
 * renders *inside* this layout — so there is no `/admin/*` page that can be
 * added later and forget to protect itself.
 *
 * `notFound()` rather than a redirect or a 403: a non-admin should not learn
 * that `/admin` exists. See docs/admin-access-control.md.
 */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
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
