import Link from "next/link"
import { PlusIcon } from "lucide-react"

import {
  ProductsFilters,
  ProductsTable,
} from "@/components/admin/products"
import {
  AdminPagination,
  PageContainer,
  PageHeader,
  SectionCard,
} from "@/components/admin/shared"
import { Button } from "@/components/ui/button"
import { PRODUCT_TYPES } from "@/constants/catalog"
import { ROUTES } from "@/constants/routes"
import { listCategoryOptions } from "@/services/category.service"
import { listProducts } from "@/services/product.service"
import type { ProductListFilters } from "@/services/product.service"
import { formatNumber } from "@/utils/format"

export const metadata = { title: "العطور" }

/**
 * `/admin/products` — the perfume console.
 *
 * A Server Component that reads through `product.service` directly, the same
 * documented exception the overview and the categories list take: the table
 * is the first thing on the page, it is read-only, and it belongs in the
 * first paint rather than arriving after a client round trip. Everything that
 * **writes** goes back through a Server Action — see `actions/product/`.
 *
 * Search, filters and paging are query params (`?q=`, `?category=`, `?type=`,
 * `?status=`, `?page=`), read here and passed to `listProducts`. The filter
 * bar is a Client Component only to turn a select change into a navigation;
 * there is no client data cache. See docs/products-feature.md.
 */
export default async function AdminProductsPage(
  props: PageProps<"/admin/products">
) {
  const sp = await props.searchParams

  const search = typeof sp.q === "string" && sp.q.trim() ? sp.q.trim() : undefined
  const categoryId = typeof sp.category === "string" ? sp.category : undefined
  const productType =
    typeof sp.type === "string" &&
    (PRODUCT_TYPES as readonly string[]).includes(sp.type)
      ? (sp.type as ProductListFilters["productType"])
      : undefined
  const status =
    sp.status === "active" || sp.status === "hidden" ? sp.status : undefined
  const pageParam = typeof sp.page === "string" ? Number(sp.page) : 1
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1

  const [result, categories] = await Promise.all([
    listProducts({ search, categoryId, productType, status, page }),
    listCategoryOptions(),
  ])

  const filtered = Boolean(search || categoryId || productType || status)

  return (
    <PageContainer>
      <PageHeader
        title="العطور"
        description="إضافة وتعديل العطور وأحجامها وأسعارها."
        actions={
          <Button variant="gold" render={<Link href={ROUTES.adminProductNew} />}>
            <PlusIcon aria-hidden="true" />
            عطر جديد
          </Button>
        }
      />

      <SectionCard
        title="كل العطور"
        description={
          filtered
            ? `${formatNumber(result.total)} نتيجة مطابقة.`
            : result.total === 0
              ? "لم يُضف أي عطر بعد."
              : `${formatNumber(result.total)} عطرًا.`
        }
        flush
      >
        <div className="px-4 pt-4">
          <ProductsFilters
            categories={categories}
            search={search}
            categoryId={categoryId}
            productType={productType}
            status={status}
          />
        </div>

        <ProductsTable products={result.products} filtered={filtered} />

        <AdminPagination
          page={result.page}
          pageCount={result.pageCount}
          basePath={ROUTES.adminProducts}
          params={{
            q: search,
            category: categoryId,
            type: productType,
            status,
          }}
        />
      </SectionCard>
    </PageContainer>
  )
}
