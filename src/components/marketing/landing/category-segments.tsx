import Image from "next/image"
import Link from "next/link"
import {
  ArrowLeftIcon,
  DropletIcon,
  FlameIcon,
  FlowerIcon,
  GemIcon,
  GiftIcon,
  HeartIcon,
  LeafIcon,
  MoonIcon,
  SparklesIcon,
  SunIcon,
  type LucideIcon,
} from "lucide-react"

import { Stagger, StaggerItem } from "@/components/motion"
import { categoryAccent } from "@/constants/design-system"
import {
  CATEGORY_SECTION,
  isSegmentIconKey,
  isSegmentImageSrc,
  SEGMENT_FALLBACK_DESCRIPTION,
  segmentFallbackCta,
  type SegmentIconKey,
} from "@/constants/landing"
import { ROUTES } from "@/constants/routes"
import { cn } from "@/lib/utils"
import type { SegmentCategory } from "@/services/catalog.service"

import { SectionHeading } from "./section-heading"

const ICONS: Record<SegmentIconKey, LucideIcon> = {
  sparkles: SparklesIcon,
  flower: FlowerIcon,
  flame: FlameIcon,
  gift: GiftIcon,
  gem: GemIcon,
  sun: SunIcon,
  moon: MoonIcon,
  leaf: LeafIcon,
  droplet: DropletIcon,
  heart: HeartIcon,
}

type Media = { kind: "icon"; Icon: LucideIcon } | { kind: "image"; src: string }

/**
 * What a card shows at its top, most specific first: the segment's own
 * icon key or image, then the category's uploaded photo, then a sparkle.
 * An image value `next/image` cannot load (a host other than our Cloudinary)
 * is skipped rather than allowed to throw at render.
 */
function resolveMedia(category: SegmentCategory): Media {
  const value = category.segmentIconOrImage?.trim()

  if (value) {
    if (isSegmentIconKey(value)) return { kind: "icon", Icon: ICONS[value] }
    if (isSegmentImageSrc(value)) return { kind: "image", src: value }
  }

  if (category.imageUrl && isSegmentImageSrc(category.imageUrl)) {
    return { kind: "image", src: category.imageUrl }
  }

  return { kind: "icon", Icon: SparklesIcon }
}

/**
 * «أي عطر يشبهك؟» — one card per category, **mapped from the database**.
 *
 * Nothing here names a category: the list, its order (`position`), and the
 * copy on each card all come from `listSegmentCategories()`. A category with
 * no segment copy yet still gets a complete card — `segmentHeadline` falls
 * back to `name`, `segmentDescription` to `description` and then a generic
 * line, the CTA to «تسوّق <name>». Adding, renaming, reordering or retiring
 * a category in `/admin/categories` changes this section with no code edit.
 *
 * The grid is `auto-fit` rather than a fixed column count, so one, two,
 * three or seven categories all lay out evenly — one column on a phone.
 *
 * Renders nothing when there are no sellable categories (a fresh database),
 * rather than an empty heading.
 */
export function CategorySegments({
  categories,
}: {
  categories: SegmentCategory[]
}) {
  if (categories.length === 0) return null

  return (
    <section
      aria-labelledby="categories-title"
      className="border-y border-border bg-secondary/40"
    >
      <div className="mx-auto max-w-page px-4 py-16 sm:px-6 sm:py-20">
        <SectionHeading id="categories-title" {...CATEGORY_SECTION} />

        <Stagger
          as="ul"
          className="mt-10 grid grid-cols-[repeat(auto-fit,minmax(15rem,1fr))] gap-4"
        >
          {categories.map((category) => {
            const accent = categoryAccent(category.slug)
            const media = resolveMedia(category)
            const headline = category.segmentHeadline?.trim() || category.name
            const description =
              category.segmentDescription?.trim() ||
              category.description?.trim() ||
              SEGMENT_FALLBACK_DESCRIPTION
            const cta =
              category.segmentCtaLabel?.trim() ||
              segmentFallbackCta(category.name)

            return (
              <StaggerItem as="li" key={category.id}>
                <Link
                  href={`${ROUTES.store}?category=${encodeURIComponent(category.slug)}`}
                  className="lift group flex h-full flex-col rounded-xl border border-border bg-card p-6 text-center outline-none hover:bg-accent/40 focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {media.kind === "image" ? (
                    <span className="relative mx-auto block size-20 overflow-hidden rounded-full bg-secondary">
                      <Image
                        src={media.src}
                        alt={category.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </span>
                  ) : (
                    <span className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-gold-soft text-gold-soft-foreground">
                      <media.Icon aria-hidden="true" className="size-6" />
                    </span>
                  )}

                  <p className={cn("eyebrow mt-5", accent.text)}>
                    {category.name}
                  </p>
                  <h3 className="mt-2 text-display-xs font-bold">{headline}</h3>
                  <p className="mt-2 flex-1 text-sm text-muted-foreground">
                    {description}
                  </p>

                  <span className="mt-6 inline-flex items-center justify-center gap-1.5 text-sm font-medium text-gold group-hover:underline underline-offset-4">
                    {cta}
                    <ArrowLeftIcon aria-hidden="true" className="size-4" />
                  </span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "mx-auto mt-4 block h-0.5 w-10 rounded-full transition-[width] duration-500 ease-luxe group-hover:w-16",
                      accent.bg
                    )}
                  />
                </Link>
              </StaggerItem>
            )
          })}
        </Stagger>
      </div>
    </section>
  )
}
