import Link from "next/link"
import { ShoppingBagIcon } from "lucide-react"

import { Stagger, StaggerItem } from "@/components/motion"
import { buttonVariants } from "@/components/ui/button"
import { ABOUT_CTA } from "@/constants/about"
import { ROUTES } from "@/constants/routes"
import { cn } from "@/lib/utils"

/**
 * The closing band — the landing page's `FinalCta` band, with a second,
 * outline button to `/contact`: someone who read the whole story may have a
 * question before they shop. The gold button keeps the `shine`.
 */
export function AboutCta() {
  return (
    <section
      aria-labelledby="about-cta-title"
      className="brand-sheen border-t border-border"
    >
      <Stagger className="mx-auto flex max-w-page flex-col items-center px-4 py-16 text-center sm:px-6 sm:py-20">
        <StaggerItem className="max-w-2xl">
          <h2
            id="about-cta-title"
            className="text-display-sm sm:text-display-md"
          >
            {ABOUT_CTA.title}
          </h2>
        </StaggerItem>
        <StaggerItem className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href={ROUTES.store}
            className={cn(buttonVariants({ variant: "gold", size: "xl" }), "shine")}
          >
            <ShoppingBagIcon data-icon="inline-start" />
            {ABOUT_CTA.primary}
          </Link>
          <Link
            href={ROUTES.contact}
            className={buttonVariants({ variant: "outline", size: "xl" })}
          >
            {ABOUT_CTA.secondary}
          </Link>
        </StaggerItem>
      </Stagger>
    </section>
  )
}
