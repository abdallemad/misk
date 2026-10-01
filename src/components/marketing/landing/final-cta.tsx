import Link from "next/link"
import { ShoppingBagIcon } from "lucide-react"

import { Stagger, StaggerItem } from "@/components/motion"
import { buttonVariants } from "@/components/ui/button"
import { FINAL_CTA } from "@/constants/landing"
import { ROUTES } from "@/constants/routes"
import { cn } from "@/lib/utils"

/**
 * The closing band — one line, one button, straight to `/store`. The line
 * and the button stagger in; the button carries the same CSS `shine` as the
 * hero's primary CTA — the only two on the page.
 */
export function FinalCta() {
  return (
    <section aria-labelledby="final-cta-title" className="brand-sheen border-t border-border">
      <Stagger className="mx-auto flex max-w-page flex-col items-center px-4 py-16 text-center sm:px-6 sm:py-20">
        <StaggerItem className="max-w-2xl">
          <h2
            id="final-cta-title"
            className="text-display-sm sm:text-display-md"
          >
            {FINAL_CTA.title}
          </h2>
        </StaggerItem>
        <StaggerItem className="mt-8">
          <Link
            href={ROUTES.store}
            className={cn(buttonVariants({ variant: "gold", size: "xl" }), "shine")}
          >
            <ShoppingBagIcon data-icon="inline-start" />
            {FINAL_CTA.cta}
          </Link>
        </StaggerItem>
      </Stagger>
    </section>
  )
}
