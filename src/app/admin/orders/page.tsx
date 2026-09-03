import { OrdersFilters, OrdersTable } from "@/components/admin/orders"
import {
  AdminPagination,
  PageContainer,
  PageHeader,
  SectionCard,
} from "@/components/admin/shared"
import { ORDER_STATUSES, type OrderStatus } from "@/constants/design-system"
import { ROUTES } from "@/constants/routes"
import { listOrders } from "@/services/order.service"
import { formatNumber } from "@/utils/format"

export const metadata = { title: "الطلبات" }

/**
 * `/admin/orders` — the orders console.
 *
 * A Server Component that reads through `order.service` directly, the same
 * documented exception the other admin lists take: the table is read-only and
 * belongs in the first paint. The one write in the feature — changing an
 * order's status — lives on the detail page behind a Server Action.
 *
 * Search (`?q=`), the status filter (`?status=`) and paging (`?page=`) are
 * query params, read here and passed to `listOrders`. The filter bar is a
 * Client Component only to turn a change into a navigation.
 *
 * See docs/orders-feature.md.
 */
export default async function AdminOrdersPage(
  props: PageProps<"/admin/orders">
) {
  const sp = await props.searchParams

  const search = typeof sp.q === "string" && sp.q.trim() ? sp.q.trim() : undefined
  const status: OrderStatus | undefined =
    typeof sp.status === "string" &&
    (ORDER_STATUSES as readonly string[]).includes(sp.status)
      ? (sp.status as OrderStatus)
      : undefined
  const pageParam = typeof sp.page === "string" ? Number(sp.page) : 1
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1

  const { orders, total, page: currentPage, pageCount } = await listOrders({
    search,
    status,
    page,
  })

  const filtered = Boolean(search || status)

  return (
    <PageContainer>
      <PageHeader
        title="الطلبات"
        description="متابعة حالة الطلبات من الدفع حتى التسليم."
      />

      <SectionCard
        title="كل الطلبات"
        description={
          filtered
            ? `${formatNumber(total)} طلبًا مطابقًا.`
            : total === 0
              ? "لا توجد طلبات بعد."
              : `${formatNumber(total)} طلبًا.`
        }
        flush
      >
        <div className="px-4 pt-4">
          <OrdersFilters search={search} status={status} />
        </div>

        <OrdersTable orders={orders} filtered={filtered} />

        <AdminPagination
          page={currentPage}
          pageCount={pageCount}
          basePath={ROUTES.adminOrders}
          params={{ q: search, status }}
        />
      </SectionCard>
    </PageContainer>
  )
}
