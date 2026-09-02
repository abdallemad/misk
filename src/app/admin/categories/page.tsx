import { CategoriesTable, NewCategoryButton } from "@/components/admin/categories"
import { PageContainer, PageHeader, SectionCard } from "@/components/admin/shared"
import { listCategories } from "@/services/category.service"
import { formatNumber } from "@/utils/format"

export const metadata = { title: "الفئات" }

/**
 * `/admin/categories` — the category console.
 *
 * A Server Component that reads through `category.service`, exactly as the
 * overview reads through `admin.service`: the list is the first thing on the
 * page, so it belongs in the first paint rather than arriving after a client
 * round trip. Everything that **writes** goes back through a Server Action —
 * see `actions/category/`.
 *
 * The table below is a Client Component only because create, edit and delete
 * are dialogs. It receives its rows as a prop and never fetches: after a
 * mutation the action revalidates this path, this component runs again, and
 * fresh rows flow down. There is no second copy of the data on the client.
 *
 * See docs/categories-feature.md.
 */
export default async function AdminCategoriesPage() {
  const categories = await listCategories()

  const visible = categories.filter((category) => category.isActive).length

  return (
    <PageContainer>
      <PageHeader
        title="الفئات"
        description="شبابي، نسائي، رجالي — وما يندرج تحت كلٍّ منها."
        actions={<NewCategoryButton />}
      />

      <SectionCard
        title="كل الفئات"
        description={
          categories.length === 0
            ? "لم تُضف أي فئة بعد."
            : `${formatNumber(categories.length)} فئة، منها ${formatNumber(visible)} معروضة في المتجر.`
        }
        flush
      >
        <CategoriesTable categories={categories} />
      </SectionCard>
    </PageContainer>
  )
}
