import Link from "next/link"
import {
  ArrowLeftIcon,
  PackageIcon,
  ReceiptTextIcon,
  TriangleAlertIcon,
  UsersIcon,
} from "lucide-react"

import {
  PageContainer,
  PageHeader,
  SectionCard,
  StatTile,
} from "@/components/admin/shared"
import { buttonVariants } from "@/components/ui/button"
import { ADMIN_NAV } from "@/constants/admin-nav"
import { getDashboardStats } from "@/services/admin.service"

export const metadata = {
  title: "نظرة عامة",
}

/**
 * `/admin` — the console overview.
 *
 * A Server Component that calls `admin.service` directly. That is the one
 * documented exception to "UI talks to hooks": the figures are read-only,
 * there is nothing to mutate or cache, and they belong in the first paint
 * rather than arriving after a client round trip.
 *
 * The section cards below are the sidebar's own data (`ADMIN_NAV`), so this
 * page cannot list a section the rail does not have, or miss one it does.
 */
export default async function AdminOverviewPage() {
  const stats = await getDashboardStats()

  return (
    <PageContainer>
      <PageHeader
        title="لوحة التحكم"
        description="حالة المتجر في سطر واحد — الكتالوج، الطلبات المفتوحة، والمخزون الذي يحتاج انتباهًا."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="العطور"
          value={stats.products}
          hint={`${stats.activeProducts} معروضة للبيع`}
          icon={PackageIcon}
        />
        <StatTile
          label="الطلبات"
          value={stats.orders}
          hint={`${stats.openOrders} قيد التنفيذ`}
          icon={ReceiptTextIcon}
          tone={stats.openOrders > 0 ? "info" : "neutral"}
        />
        <StatTile
          label="العملاء"
          value={stats.users}
          hint="حسابات مُزامَنة من Clerk"
          icon={UsersIcon}
        />
        <StatTile
          label="مخزون منخفض"
          value={stats.lowStockVariants}
          hint={
            stats.lowStockVariants > 0
              ? "أحجام تحتاج إعادة تحضير"
              : "كل الأحجام ضمن الحد الآمن"
          }
          icon={TriangleAlertIcon}
          tone={stats.lowStockVariants > 0 ? "warning" : "success"}
        />
      </div>

      <SectionCard
        title="أقسام اللوحة"
        description="كل ما يمكنك إدارته من هنا."
      >
        <ul className="grid gap-3 sm:grid-cols-2">
          {ADMIN_NAV.flatMap((group) => group.items)
            .filter((item) => !item.exact)
            .map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="group flex items-start gap-3 rounded-lg border border-border p-4 transition-colors outline-none hover:border-gold/40 hover:bg-accent/40 focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-neutral-soft text-neutral-soft-foreground">
                    <item.icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-sm font-medium">{item.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.description}
                    </span>
                  </span>
                  {/* Points along the reading direction — RTL, so leftwards. */}
                  <ArrowLeftIcon
                    aria-hidden="true"
                    className="ms-auto size-4 shrink-0 self-center text-muted-foreground transition-transform group-hover:-translate-x-0.5"
                  />
                </Link>
              </li>
            ))}
        </ul>
      </SectionCard>

      <div className="flex justify-start">
        <Link
          href="/"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          معاينة المتجر كما يراه الزائر
        </Link>
      </div>
    </PageContainer>
  )
}
