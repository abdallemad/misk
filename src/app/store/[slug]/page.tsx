import Link from "next/link"
import { notFound } from "next/navigation"

import { StoreBuyActions } from "@/components/store/store-buy-actions"
import { StoreProductGallery } from "@/components/store/store-product-gallery"
import { StockBadge } from "@/components/shared/status-badge"
import { PRODUCT_TYPE_LABEL } from "@/constants/catalog"
import { categoryAccent } from "@/constants/design-system"
import { ROUTES } from "@/constants/routes"
import { cn } from "@/lib/utils"
import { getStoreProduct } from "@/services/catalog.service"
import { formatPrice } from "@/utils/format"

/**
 * `/store/[slug]` — one perfume's public page.
 *
 * A Server Component that reads `catalog.service.getStoreProduct` directly
 * (the storefront's read-first exception, same as the catalogue grid).
 * `notFound()` on a stale link to a retired perfume — `getStoreProduct`
 * applies the same sellability gate as the grid.
 *
 * The variant list is **display-only**: a shopper sees every size / weight and
 * its price, but the picker that turns one into a cart line is its own feature
 * (docs/product-page.md, docs/cart-feature.md). `StoreBuyActions` renders the
 * two buy buttons disabled until then.
 */
export async function generateMetadata(props: PageProps<"/store/[slug]">) {
  const { slug } = await props.params
  const product = await getStoreProduct(slug)

  if (!product) return { title: "عطر غير موجود" }

  return {
    title: product.name,
    description: product.description.slice(0, 160),
  }
}

export default async function StoreProductPage(
  props: PageProps<"/store/[slug]">
) {
  const { slug } = await props.params
  const product = await getStoreProduct(slug)

  if (!product) notFound()

  const accent = categoryAccent(product.category.slug)
  const ranged =
    product.priceFrom !== null && product.priceFrom !== product.priceTo

  return (
    <div className="mx-auto max-w-page px-4 py-10 sm:px-6 sm:py-14">
      <nav
        aria-label="مسار التنقّل"
        className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground"
      >
        <Link href={ROUTES.store} className="hover:text-foreground">
          المتجر
        </Link>
        <span aria-hidden="true">/</span>
        <Link
          href={`${ROUTES.store}?category=${encodeURIComponent(product.category.slug)}`}
          className="hover:text-foreground"
        >
          {product.category.name}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
        <StoreProductGallery images={product.images} name={product.name} />

        <div className="flex flex-col gap-6">
          <div>
            <p className="eyebrow">
              <Link
                href={`${ROUTES.store}?category=${encodeURIComponent(product.category.slug)}`}
                className={cn("hover:underline", accent.text)}
              >
                {product.category.name}
              </Link>
              {" · "}
              {PRODUCT_TYPE_LABEL[product.productType]}
            </p>
            <h1 className="mt-2 text-display-md sm:text-display-lg">
              {product.name}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              {product.priceFrom === null ? (
                "—"
              ) : (
                <>
                  {ranged ? "يبدأ من " : "السعر "}
                  <span
                    className="text-lg font-medium text-foreground"
                    data-numeric
                  >
                    {formatPrice(product.priceFrom)}
                  </span>
                </>
              )}
            </p>
          </div>

          <p className="text-sm/relaxed text-muted-foreground">
            {product.description}
          </p>

          <StoreBuyActions outOfStock={product.totalStock === 0} />

          <section className="rounded-xl border border-border">
            <h2 className="border-b border-border px-4 py-3 text-sm font-semibold">
              الأحجام والأسعار
            </h2>
            <ul className="divide-y divide-border">
              {product.variants.map((variant) => (
                <li
                  key={variant.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{variant.label}</p>
                    {variant.oilGrade ? (
                      <p className="text-xs text-muted-foreground">
                        {variant.oilGrade}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <StockBadge stock={variant.stock} />
                    <span
                      className="text-sm font-medium tabular-nums"
                      data-numeric
                    >
                      {formatPrice(variant.price)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {product.ingredients.length > 0 ? (
            <section className="rounded-xl bg-secondary/40 p-4">
              <h2 className="text-sm font-semibold">الجودة والمكوّنات</h2>
              <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                {product.ingredients.map((ingredient) => (
                  <li key={ingredient.name}>
                    <span className="text-foreground">{ingredient.name}</span>
                    {ingredient.note ? ` — ${ingredient.note}` : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  )
}
