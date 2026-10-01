import Link from "next/link"
import { DropletIcon, FlaskConicalIcon, type LucideIcon } from "lucide-react"

import { Stagger, StaggerItem } from "@/components/motion"
import { buttonVariants } from "@/components/ui/button"
import { PRODUCT_TYPES } from "@/constants/catalog"
import { PRODUCT_TYPE_ACCENT, type ProductType } from "@/constants/design-system"
import { FORMAT_COPY, FORMAT_SECTION } from "@/constants/landing"
import { ROUTES } from "@/constants/routes"
import { cn } from "@/lib/utils"
import { formatPrice } from "@/utils/format"

import { SectionHeading } from "./section-heading"

const ICONS: Record<ProductType, LucideIcon> = {
  ALCOHOL_BASED: FlaskConicalIcon,
  RAW_OIL: DropletIcon,
}

/**
 * «كحولي ولا دهن خالص؟» — the two product lines side by side: who each
 * suits, how it wears, and what it starts at.
 *
 * The "from" price is **read from the database** (`getFormatPriceFloors`),
 * never typed into the copy — a line with nothing on sale shows no price at
 * all rather than one the shop cannot honour. Each column links to the
 * store filtered to that line (`/store?type=…`).
 */
export function FormatComparison({
  priceFloors,
}: {
  priceFloors: Record<ProductType, number | null>
}) {
  return (
    <section
      aria-labelledby="format-title"
      className="border-y border-border bg-secondary/40"
    >
      <div className="mx-auto max-w-page px-4 py-16 sm:px-6 sm:py-20">
        <SectionHeading id="format-title" {...FORMAT_SECTION} />

        <Stagger className="mx-auto mt-10 grid max-w-4xl gap-4 md:grid-cols-2">
          {PRODUCT_TYPES.map((type) => {
            const copy = FORMAT_COPY[type]
            const accent = PRODUCT_TYPE_ACCENT[type]
            const Icon = ICONS[type]
            const floor = priceFloors[type]

            return (
              <StaggerItem
                as="article"
                key={type}
                className="flex flex-col rounded-xl border border-border bg-card p-6 sm:p-8"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "inline-flex size-10 items-center justify-center rounded-lg bg-secondary",
                      accent.text
                    )}
                  >
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                  <div>
                    <h3 className="text-display-xs font-bold">{copy.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {copy.unitNote}
                    </p>
                  </div>
                </div>

                <dl className="mt-6 flex-1 space-y-4 text-sm">
                  <div>
                    <dt className="font-medium">يناسب مين؟</dt>
                    <dd className="mt-1 text-muted-foreground">{copy.suits}</dd>
                  </div>
                  <div>
                    <dt className="font-medium">الثبات</dt>
                    <dd className="mt-1 text-muted-foreground">{copy.lasts}</dd>
                  </div>
                  {floor !== null ? (
                    <div>
                      <dt className="font-medium">السعر</dt>
                      <dd className="mt-1 text-muted-foreground">
                        يبدأ من{" "}
                        <span
                          className="text-base font-medium text-foreground"
                          data-numeric
                        >
                          {formatPrice(floor)}
                        </span>
                      </dd>
                    </div>
                  ) : null}
                </dl>

                <Link
                  href={`${ROUTES.store}?type=${type}`}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "mt-8 w-full"
                  )}
                >
                  {copy.cta}
                </Link>
              </StaggerItem>
            )
          })}
        </Stagger>
      </div>
    </section>
  )
}
