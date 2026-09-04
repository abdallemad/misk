import { PackageIcon } from "lucide-react"

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import type { StoreProductCard as StoreProductCardData } from "@/services/catalog.service"

import { StoreProductCard } from "./store-product-card"

type StoreProductGridProps = {
  products: StoreProductCardData[]
  /** True when a search or filter is in effect, so an empty result reads as
   *  "nothing matched" rather than "the shop is empty". */
  filtered?: boolean
}

/** The catalogue grid, or the empty state when nothing matches. */
export function StoreProductGrid({
  products,
  filtered = false,
}: StoreProductGridProps) {
  if (products.length === 0) {
    return (
      <Empty className="rounded-xl border border-dashed border-border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <PackageIcon />
          </EmptyMedia>
          <EmptyTitle>
            {filtered ? "لا عطور مطابقة" : "لا توجد عطور بعد"}
          </EmptyTitle>
          <EmptyDescription>
            {filtered
              ? "جرّب كلمة بحث أخرى أو أزِل بعض عوامل التصفية."
              : "لم تُضف أي عطور إلى المتجر بعد. تحقّق لاحقًا."}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <StoreProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
