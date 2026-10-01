import Link from "next/link"
import { SearchIcon, ShoppingBagIcon } from "lucide-react"

import { Reveal, Stagger, StaggerItem } from "@/components/motion"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { HERO_COPY } from "@/constants/landing"
import { ROUTES } from "@/constants/routes"
import { cn } from "@/lib/utils"

import { HeroCarousel, type HeroSlide } from "./hero-carousel"

type HeroProps = {
  /** The carousel's photos — see `pickHeroSlides` in `app/page.tsx`. */
  slides: HeroSlide[]
}

/**
 * The page's one `<h1>` — the brand promise — with the two CTAs, the trust
 * line and the search box, beside a carousel of best-seller photos
 * (`hero-carousel.tsx`).
 *
 * Text alignment follows the layout: centred while the photo stacks under
 * the text (phones, tablets), start-aligned — the right edge, in RTL — from
 * `lg` up, where the text column sits beside the photo.
 *
 * The carousel's first slide is the only image on `/` loaded eagerly with a
 * high fetch priority; its other slides and everything below the fold keep
 * `next/image`'s default `loading="lazy"`.
 *
 * **Motion** — the page's one on-load sequence (everything below the fold
 * reveals on scroll instead): the text column staggers in, eyebrow first,
 * the headline with a short blur-in; the carousel settles from a slight zoom
 * with no opacity fade, so the LCP image paints at once. The primary CTA
 * carries the CSS `shine`. See docs/landing-page.md, "Motion".
 *
 * The search box is a plain GET `<form action={ROUTES.store}>` — no client
 * JavaScript; it lands on `/store?q=…`, which the store's own filter bar
 * already reads. See docs/landing-page.md.
 */
export function Hero({ slides }: HeroProps) {
  return (
    <section className="brand-sheen border-b border-border">
      <div className="mx-auto grid max-w-page items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.15fr_1fr]">
        <Stagger
          trigger="mount"
          className="mx-auto flex max-w-2xl flex-col items-center text-center lg:mx-0 lg:items-start lg:text-start"
        >
          <StaggerItem as="p" className="eyebrow">
            {HERO_COPY.eyebrow}
          </StaggerItem>
          <StaggerItem
            as="h1"
            variant="blurUp"
            className="mt-5 text-display-md sm:text-display-lg lg:text-display-xl"
          >
            {HERO_COPY.headline}
          </StaggerItem>
          <StaggerItem
            as="p"
            className="mt-6 max-w-prose text-base text-muted-foreground"
          >
            {HERO_COPY.body}
          </StaggerItem>

          <StaggerItem className="mt-9 flex flex-wrap justify-center gap-3 lg:justify-start">
            <Link
              href={ROUTES.store}
              className={cn(buttonVariants({ variant: "gold", size: "xl" }), "shine")}
            >
              <ShoppingBagIcon data-icon="inline-start" />
              تسوّق المجموعة
            </Link>
            <Link
              href={ROUTES.about}
              className={buttonVariants({ variant: "outline", size: "xl" })}
            >
              حكاية الصناعة
            </Link>
          </StaggerItem>

          <StaggerItem
            as="ul"
            className="mt-5 flex flex-wrap justify-center gap-x-2 text-sm text-muted-foreground lg:justify-start"
          >
            {HERO_COPY.trust.map((item, index) => (
              <li key={item} className="flex items-center gap-2">
                {index > 0 ? <span aria-hidden="true">·</span> : null}
                {item}
              </li>
            ))}
          </StaggerItem>

          <StaggerItem className="mt-8 w-full max-w-md">
            <form action={ROUTES.store} role="search" className="relative w-full">
              <SearchIcon
                aria-hidden="true"
                className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                type="search"
                name="q"
                placeholder="ابحث عن عطرك — مسك، عود، ورد…"
                aria-label="ابحث في المتجر"
                className="h-12 rounded-full bg-background ps-10 pe-28"
              />
              <Button
                type="submit"
                variant="gold"
                size="sm"
                className="absolute end-1.5 top-1/2 -translate-y-1/2 rounded-full"
              >
                بحث
              </Button>
            </form>
          </StaggerItem>
        </Stagger>

        <div className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-2xl border border-border bg-secondary shadow-sm">
          <Reveal trigger="mount" variant="settle" className="absolute inset-0">
            <HeroCarousel slides={slides} />
          </Reveal>
        </div>
      </div>
    </section>
  )
}
