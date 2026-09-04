import { Pagination } from "@/components/shared/pagination"
import {
  StoreCategoryNav,
  StoreFilters,
  StoreProductGrid,
} from "@/components/store"
import { PRODUCT_TYPES } from "@/constants/catalog"
import { categoryAccent } from "@/constants/design-system"
import { ROUTES } from "@/constants/routes"
import { STORE_SORTS, type StoreSort } from "@/constants/store"
import {
  listCatalog,
  listCatalogCategories,
  type CatalogFilters,
} from "@/services/catalog.service"
import { formatNumber } from "@/utils/format"

export const metadata = {
  title: "المتجر",
  description:
    "تصفّح عطور مِسك حسب الفئة، وابحث عن رائحتك المفضّلة — كحولية أو دهن عطري مركّز.",
}

/**
 * `/store` — the storefront catalogue.
 *
 * A Server Component that reads through `catalog.service` directly — the same
 * exception the admin lists take, for the same reason: the grid is the page,
 * it is read-only, and it belongs in the first paint.
 *
 * Category, search, type, sort and page are all query params, read here and
 * passed to `listCatalog`. The chip nav is server-rendered; only the
 * search/type/sort bar is a Client Component, and only to turn an input event
 * into a navigation. This is the list-page convention from
 * docs/folder-structure.md, applied to the storefront. See
 * docs/store-feature.md.
 */
export default async function StorePage(props: PageProps<"/store">) {
  const sp = await props.searchParams

  const search =
    typeof sp.q === "string" && sp.q.trim() ? sp.q.trim() : undefined
  const categorySlug =
    typeof sp.category === "string" && sp.category ? sp.category : undefined
  const productType =
    typeof sp.type === "string" &&
    (PRODUCT_TYPES as readonly string[]).includes(sp.type)
      ? (sp.type as CatalogFilters["productType"])
      : undefined
  const sort =
    typeof sp.sort === "string" &&
    (STORE_SORTS as readonly string[]).includes(sp.sort)
      ? (sp.sort as StoreSort)
      : undefined
  const pageParam = typeof sp.page === "string" ? Number(sp.page) : 1
  const page =
    Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1

  const [result, categories] = await Promise.all([
    listCatalog({ search, categorySlug, productType, sort, page }),
    listCatalogCategories(),
  ])

  const activeCategory = categories.find(
    (category) => category.slug === categorySlug
  )
  const filtered = Boolean(search || categorySlug || productType)
  // Carried onto the category chips so switching category keeps search + sort.
  const preserved = { q: search, type: productType, sort }

  return (
    <div className="mx-auto max-w-page px-4 pb-16 sm:px-6">
      <header className="brand-sheen -mx-4 mb-8 border-b border-border px-4 py-12 sm:-mx-6 sm:px-6 sm:py-16">
        <p className="eyebrow">المتجر</p>
        <h1 className="mt-3 text-display-md sm:text-display-lg">
          {activeCategory ? activeCategory.name : "كل العطور"}
        </h1>
        <p className="mt-3 max-w-prose text-sm text-muted-foreground">
          {activeCategory
            ? categoryAccent(activeCategory.slug).note ||
              "تصفّح عطور هذه الفئة."
            : "عطور نمزجها بأنفسنا من كحول طبي نقي وزيوت فاخرة. اختر الفئة، أو ابحث بالاسم."}
        </p>
      </header>

      <div className="flex flex-col gap-4">
        <StoreCategoryNav
          categories={categories}
          activeSlug={categorySlug}
          params={preserved}
        />
        <StoreFilters
          search={search}
          productType={productType}
          sort={sort}
        />
        <p className="text-xs text-muted-foreground">
          {filtered
            ? `${formatNumber(result.total)} نتيجة مطابقة`
            : `${formatNumber(result.total)} عطر`}
        </p>
      </div>

      <div className="mt-8">
        <StoreProductGrid products={result.products} filtered={filtered} />
      </div>

      <Pagination
        page={result.page}
        pageCount={result.pageCount}
        basePath={ROUTES.store}
        params={{
          q: search,
          category: categorySlug,
          type: productType,
          sort,
        }}
        className="mt-12"
      />
    </div>
  )
}
