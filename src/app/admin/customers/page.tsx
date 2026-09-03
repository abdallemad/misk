import {
  CustomersFilters,
  CustomersTable,
} from "@/components/admin/customers"
import {
  AdminPagination,
  PageContainer,
  PageHeader,
  SectionCard,
} from "@/components/admin/shared"
import { ROUTES } from "@/constants/routes"
import { listCustomers } from "@/services/customer.service"
import type { CustomerListFilters } from "@/services/customer.service"
import { formatNumber } from "@/utils/format"

export const metadata = { title: "العملاء" }

/**
 * `/admin/customers` — the customer console.
 *
 * A Server Component that reads through `customer.service` directly, the same
 * documented exception the overview, the categories list and the products
 * list take: the table is the first thing on the page, it is read-only, and
 * it belongs in the first paint.
 *
 * The feature has exactly one write — promoting or demoting a customer — and
 * it lives on the detail page behind a Server Action. Search, the role
 * filter, and paging are all query params (`?q=`, `?role=`, `?page=`),
 * handled on the server on each navigation. No client cache.
 *
 * See docs/customers-feature.md.
 */
export default async function AdminCustomersPage(
  props: PageProps<"/admin/customers">
) {
  const sp = await props.searchParams

  const search = typeof sp.q === "string" && sp.q.trim() ? sp.q.trim() : undefined
  const role: CustomerListFilters["role"] =
    sp.role === "ADMIN" || sp.role === "USER" ? sp.role : undefined
  const pageParam = typeof sp.page === "string" ? Number(sp.page) : 1
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1

  const { customers, total, page: currentPage, pageCount } = await listCustomers({
    search,
    role,
    page,
  })

  const filtered = Boolean(search || role)

  return (
    <PageContainer>
      <PageHeader
        title="العملاء"
        description="الحسابات المُزامَنة من Clerk وسِجل طلباتها."
      />

      <SectionCard
        title="كل العملاء"
        description={
          filtered
            ? `${formatNumber(total)} نتيجة مطابقة.`
            : `${formatNumber(total)} حسابًا مسجّلًا.`
        }
        flush
      >
        <div className="px-4 pt-4">
          <CustomersFilters search={search} role={role} />
        </div>

        <CustomersTable
          customers={customers}
          search={search}
          filtered={filtered}
        />

        <AdminPagination
          page={currentPage}
          pageCount={pageCount}
          basePath={ROUTES.adminCustomers}
          params={{ q: search, role }}
        />
      </SectionCard>
    </PageContainer>
  )
}
