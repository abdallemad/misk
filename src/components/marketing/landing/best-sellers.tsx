import Link from "next/link"

import { Stagger, StaggerItem } from "@/components/motion"
import { StoreProductCard } from "@/components/store"
import { buttonVariants } from "@/components/ui/button"
import { BEST_SELLERS_COPY } from "@/constants/landing"
import { ROUTES } from "@/constants/routes"
import type { BestSellers as BestSellersData } from "@/services/catalog.service"

import { SectionHeading } from "./section-heading"

/**
 * The product row — `catalog.service.listBestSellers`, rendered with the
 * store's own `StoreProductCard` (photo, the admin-written description, the
 * "from" price, the stock badge and the live add-to-cart buttons), so a card
 * on `/` and a card on `/store` are the same component.
 *
 * The heading is earned, not assumed: «الأكثر طلبًا» only when the top perfume
 * has real non-cancelled orders behind it, «أحدث العطور» otherwise. Renders
 * nothing on an empty catalogue.
 */
export function BestSellers({ products, ranked }: BestSellersData) {
  if (products.length === 0) return null

  const heading = ranked ? BEST_SELLERS_COPY.ranked : BEST_SELLERS_COPY.newest

  return (
    <section
      aria-labelledby="best-sellers-title"
      className="mx-auto max-w-page px-4 py-16 sm:px-6 sm:py-20"
    >
      <SectionHeading id="best-sellers-title" {...heading} />

      <Stagger className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          // `grid` so the card still stretches to the row's height, as it
          // did when it was the grid cell itself.
          <StaggerItem key={product.id} className="grid">
            <StoreProductCard product={product} />
          </StaggerItem>
        ))}
      </Stagger>

      <div className="mt-10 flex justify-center">
        <Link
          href={ROUTES.store}
          className={buttonVariants({ variant: "outline", size: "lg" })}
        >
          {BEST_SELLERS_COPY.cta}
        </Link>
      </div>
    </section>
  )
}
