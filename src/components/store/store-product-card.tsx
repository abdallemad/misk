import Image from "next/image"
import Link from "next/link"

import { StockBadge } from "@/components/shared/status-badge"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { PRODUCT_TYPE_LABEL } from "@/constants/catalog"
import { categoryAccent } from "@/constants/design-system"
import { storeProductRoute } from "@/constants/routes"
import { DEFAULT_PRODUCT_IMAGE } from "@/constants/uploads"
import { formatPrice } from "@/utils/format"
import type { StoreProductCard as StoreProductCardData } from "@/services/catalog.service"

import { StoreBuyActions } from "./store-buy-actions"

/**
 * One perfume in the catalogue grid.
 *
 * Everything above the footer — image, name, price — is a `<Link>` to
 * `/store/[slug]`. The footer holds the two buy buttons, which are **not**
 * inside the link (interactive content cannot nest in an `<a>`, and they must
 * not trigger navigation). They render disabled — same `StoreBuyActions` the
 * product page uses, in its `card` size.
 *
 * A perfume with no image of its own falls back to `DEFAULT_PRODUCT_IMAGE`
 * (`public/image.png`), so the grid never has a ragged hole in it.
 */
export function StoreProductCard({
  product,
}: {
  product: StoreProductCardData
}) {
  const accent = categoryAccent(product.category.slug)
  const src = product.coverImageUrl ?? DEFAULT_PRODUCT_IMAGE
  const ranged =
    product.priceFrom !== null && product.priceFrom !== product.priceTo

  return (
    <Card className="group overflow-hidden pt-0 transition-shadow hover:shadow-md">
      <Link
        href={storeProductRoute(product.slug)}
        className="group/nav flex flex-col gap-4 outline-none focus-visible:rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <div className="relative aspect-square overflow-hidden bg-secondary">
          <Image
            src={src}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 300px, (min-width: 640px) 45vw, 90vw"
            className="object-cover transition-transform duration-500 ease-luxe group-hover/nav:scale-[1.03]"
          />
        </div>

        <CardHeader>
          <p className="eyebrow">
            <span className={accent.text}>{product.category.name}</span>
            {" · "}
            {PRODUCT_TYPE_LABEL[product.productType]}
          </p>
          <CardTitle className="mt-1.5 font-display text-display-xs font-bold group-hover/nav:underline">
            {product.name}
          </CardTitle>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {product.description}
          </p>
        </CardHeader>

        <CardContent className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {product.priceFrom === null ? (
              "—"
            ) : (
              <>
                {ranged ? "يبدأ من " : null}
                <span
                  className="text-base font-medium text-foreground"
                  data-numeric
                >
                  {formatPrice(product.priceFrom)}
                </span>
              </>
            )}
          </p>
          <StockBadge stock={product.totalStock} />
        </CardContent>
      </Link>

      <CardFooter>
        <StoreBuyActions variant="card" outOfStock={product.totalStock === 0} />
      </CardFooter>
    </Card>
  )
}
