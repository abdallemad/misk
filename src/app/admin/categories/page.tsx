import { ComingSoon, PageContainer, PageHeader } from "@/components/admin/shared"

export const metadata = { title: "الفئات" }

/** `/admin/categories` — scaffold. See docs/categories-feature.md. */
export default function AdminCategoriesPage() {
  return (
    <PageContainer>
      <PageHeader title="الفئات" description="شبابي، نسائي، رجالي — وما يندرج تحت كلٍّ منها." />
      <ComingSoon section="الفئات" doc="categories-feature.md" />
    </PageContainer>
  )
}
