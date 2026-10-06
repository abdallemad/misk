import Link from "next/link"
import {
  ArrowLeftIcon,
  CheckIcon,
  GemIcon,
  GiftIcon,
  SunIcon,
  type LucideIcon,
} from "lucide-react"

import { Reveal, Stagger, StaggerItem } from "@/components/motion"
import { buttonVariants } from "@/components/ui/button"
import { AUDIENCES, type Audience, type AudienceIcon } from "@/constants/landing"
import { cn } from "@/lib/utils"
import { formatPrice } from "@/utils/format"

const ICONS: Record<AudienceIcon, LucideIcon> = {
  gift: GiftIcon,
  gem: GemIcon,
  sun: SunIcon,
}

/**
 * The marketing research's three audience segments — **one full section
 * each**, in research order: gift buyers, luxury lovers on a budget, people
 * out of the house all day. Each section's `<h2>` is that segment's key
 * message, verbatim.
 *
 * Static copy (`constants/landing.ts`), not database rows: these are *needs*
 * a shopper arrives with, not shelves a perfume is filed on, so each section
 * points at the store view that answers the need (everything / cheapest
 * first / the spray line). The DB-driven category selector follows them.
 *
 * Layout: text beside a visual panel, the sides alternating section by
 * section (and the background with them) so three sections in a row read as
 * three distinct stops rather than one long block. Below `lg` the panel
 * stacks under the text and everything centres — the same rule as the hero.
 *
 * Scrolling: from `lg` each section is `sticky top-4`, so the next one
 * slides up over it and the three stack like cards. The wrapper `<div>` is
 * the sticky boundary — once it ends, the last section scrolls away with it
 * instead of staying pinned under the rest of the page. Below `lg` the panel
 * stacks under the text and a section outgrows the viewport, so pinning it
 * would hide its bottom (the CTA) under the next one; there they just scroll.
 *
 * `priceFrom` is the catalogue's live lowest price (`getFormatPriceFloors`);
 * only a segment with `showPriceFrom` prints it, and only when it exists.
 */
export function AudienceSections({ priceFrom }: { priceFrom: number | null }) {
  return (
    <div>
      {AUDIENCES.map((audience, index) => (
        <AudienceSection
          key={audience.id}
          audience={audience}
          flipped={index % 2 === 1}
          priceFrom={audience.showPriceFrom ? priceFrom : null}
        />
      ))}
    </div>
  )
}

function AudienceSection({
  audience,
  flipped,
  priceFrom,
}: {
  audience: Audience
  flipped: boolean
  priceFrom: number | null
}) {
  const Icon = ICONS[audience.icon]
  const titleId = `${audience.id}-title`

  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        // Opaque: a stuck section must hide the one it slides over. The
        // flipped tint is layered on `bg-background` for the same reason —
        // `bg-secondary/40` alone would let the section beneath show through.
        "bg-background lg:sticky lg:top-4",
        flipped &&
          "border-y border-border bg-linear-to-b from-secondary/40 to-secondary/40"
      )}
    >
      <div className="mx-auto grid max-w-page items-center gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2 lg:gap-16">
        <Stagger
          className={cn(
            "flex flex-col items-center text-center lg:items-start lg:text-start",
            flipped && "lg:order-last"
          )}
        >
          <StaggerItem
            as="p"
            className="inline-flex items-center gap-2 text-sm font-medium text-gold"
          >
            <Icon aria-hidden="true" className="size-4" />
            {audience.eyebrow}
          </StaggerItem>

          <StaggerItem>
            <h2
              id={titleId}
              className="mt-4 max-w-xl text-display-sm sm:text-display-md lg:text-display-lg"
            >
              {audience.headline}
            </h2>
          </StaggerItem>

          <StaggerItem
            as="p"
            className="mt-5 max-w-prose text-base text-muted-foreground"
          >
            {audience.body}
          </StaggerItem>

          <StaggerItem as="ul" className="mt-7 grid gap-3 text-start">
            {audience.points.map((point) => (
              <li key={point} className="flex items-center gap-3 text-sm">
                <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-gold-soft text-gold-soft-foreground">
                  <CheckIcon aria-hidden="true" className="size-3.5" />
                </span>
                {point}
              </li>
            ))}
          </StaggerItem>

          <StaggerItem className="mt-9">
            <Link
              href={audience.cta.href}
              className={buttonVariants({ variant: "outline", size: "xl" })}
            >
              {audience.cta.label}
              <ArrowLeftIcon data-icon="inline-end" />
            </Link>
          </StaggerItem>
        </Stagger>

        <Reveal delay={0.15} className="w-full">
          <div className="brand-sheen relative mx-auto flex aspect-[4/3] w-full max-w-lg flex-col items-center justify-center overflow-hidden rounded-2xl border border-border p-8 text-center shadow-sm">
            {/* Two hairline rings — the same gold ring as the brand's
                placeholder image — for depth without a photo. */}
            <span
              aria-hidden="true"
              className="absolute size-80 rounded-full border border-gold/20"
            />
            <span
              aria-hidden="true"
              className="absolute size-56 rounded-full border border-gold/30"
            />

            <span className="relative inline-flex size-20 items-center justify-center rounded-full bg-gold text-gold-foreground shadow-md">
              <Icon aria-hidden="true" className="size-9" />
            </span>
            <p className="relative mt-6 max-w-xs font-display text-display-xs sm:text-display-sm">
              {audience.panel}
            </p>
            {priceFrom !== null ? (
              <p className="relative mt-3 text-sm text-muted-foreground">
                عطور تبدأ من{" "}
                <span
                  className="text-lg font-semibold text-foreground"
                  data-numeric
                >
                  {formatPrice(priceFrom)}
                </span>
              </p>
            ) : null}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
