import Link from "next/link"
import { PlusIcon } from "lucide-react"

import { ProductsTable } from "@/components/admin/products"
import { PageContainer, PageHeader, SectionCard } from "@/components/admin/shared"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/constants/routes"
import { listProducts } from "@/services/product.service"
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
 * Unlike the categories console, create and edit are their own routes rather
 * than dialogs on this one. A perfume is a gallery plus an open-ended list of
 * variants, which is more than a dialog should hold, and a real route means a
 * half-finished product has a URL someone can be sent.
 *
 * See docs/products-feature.md.
 */
export default async function AdminProductsPage() {
  const products = await listProducts()

  const visible = products.filter((product) => product.isActive).length

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
          products.length === 0
            ? "لم يُضف أي عطر بعد."
            : `${formatNumber(products.length)} عطرًا، منها ${formatNumber(visible)} معروضة في المتجر.`
        }
        flush
      >
        <ProductsTable products={products} />
      </SectionCard>
    </PageContainer>
  )
}
