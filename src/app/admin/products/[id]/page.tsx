import { notFound } from "next/navigation"

import { ProductForm } from "@/components/admin/products"
import { PageContainer, PageHeader } from "@/components/admin/shared"
import { listCategoryOptions } from "@/services/category.service"
import { getProduct } from "@/services/product.service"

export const metadata = { title: "تعديل عطر" }

/**
 * `/admin/products/[id]` — the edit form.
 *
 * `params` is a promise in this version of Next.js and has to be awaited;
 * `PageProps<'/admin/products/[id]'>` is the generated helper that types it
 * from the route literal, so the key is `id` because the folder is `[id]`
 * and for no other reason.
 *
 * The two reads are issued together rather than one after the other — they
 * do not depend on each other, and awaiting them in sequence would add a
 * round trip to every load of this page for nothing.
 *
 * `notFound()` rather than an error: a stale bookmark to a deleted perfume is
 * a 404, not a failure, and the `/admin` layout keeps the sidebar standing
 * around it either way.
 */
export default async function EditProductPage(
  props: PageProps<"/admin/products/[id]">
) {
  const { id } = await props.params

  const [product, categories] = await Promise.all([
    getProduct(id),
    listCategoryOptions(),
  ])

  if (!product) notFound()

  return (
    <PageContainer>
      <PageHeader
        title={product.name}
        description="التعديلات تظهر في المتجر فور الحفظ."
      />

      <ProductForm product={product} categories={categories} />
    </PageContainer>
  )
}
