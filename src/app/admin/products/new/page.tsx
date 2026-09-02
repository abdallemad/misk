import Link from "next/link"
import { BoxesIcon } from "lucide-react"

import { ProductForm } from "@/components/admin/products"
import { PageContainer, PageHeader } from "@/components/admin/shared"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { ROUTES } from "@/constants/routes"
import { listCategoryOptions } from "@/services/category.service"

export const metadata = { title: "عطر جديد" }

/**
 * `/admin/products/new` — the create form.
 *
 * A static segment, so it is matched before the `[id]` route beside it. That
 * is Next.js's own precedence rule and not a coincidence to be relied on
 * quietly: `new` is a reserved product id here, and cuids never look like it.
 *
 * **A perfume cannot exist without a category** — `Product.categoryId` is
 * required — so a shop with no segments yet gets a way forward instead of a
 * select with nothing in it and a form that can only fail on submit.
 */
export default async function NewProductPage() {
  const categories = await listCategoryOptions()

  return (
    <PageContainer>
      <PageHeader
        title="عطر جديد"
        description="الاسم والوصف والصور، ثم الأحجام والأسعار."
      />

      {categories.length === 0 ? (
        <Empty className="rounded-xl border border-dashed border-border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BoxesIcon />
            </EmptyMedia>
            <EmptyTitle>أضف فئة أولًا</EmptyTitle>
            <EmptyDescription>
              كل عطر يندرج تحت فئة واحدة — شبابي، نسائي، رجالي — ولا توجد أي
              فئة بعد.
            </EmptyDescription>
          </EmptyHeader>
          <Button variant="gold" render={<Link href={ROUTES.adminCategories} />}>
            إدارة الفئات
          </Button>
        </Empty>
      ) : (
        <ProductForm product={null} categories={categories} />
      )}
    </PageContainer>
  )
}
