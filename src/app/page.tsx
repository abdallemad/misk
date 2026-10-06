import type { Metadata } from "next"

import {
  AudienceSections,
  BestSellers,
  BrandStory,
  CategorySegments,
  FinalCta,
  FormatComparison,
  Hero,
  HowItWorks,
  LandingJsonLd,
  Quality,
} from "@/components/marketing/landing"
import type { HeroSlide } from "@/components/marketing/landing/hero-carousel"
import { SiteFooter } from "@/components/marketing/site-footer"
import { MotionProvider, NoJsMotionReset } from "@/components/motion"
import { StoreHeader } from "@/components/store"
import {
  BEST_SELLERS_COUNT,
  HERO_SLIDES_MAX,
  LANDING_SEO,
} from "@/constants/landing"
import { storeProductRoute } from "@/constants/routes"
import { DEFAULT_PRODUCT_IMAGE } from "@/constants/uploads"
import { getSiteOrigin } from "@/lib/site-url"
import {
  getFormatPriceFloors,
  listBestSellers,
  listSegmentCategories,
  type StoreProductCard,
} from "@/services/catalog.service"

export const metadata: Metadata = {
  // `absolute` skips the root layout's "%s · مِسك" template, which would
  // otherwise print the brand name twice.
  title: { absolute: LANDING_SEO.title },
  description: LANDING_SEO.description,
}

/** The cheapest option across both product lines, or `null` if nothing is on sale. */
function lowestPrice(floors: Record<string, number | null>): number | null {
  const prices = Object.values(floors).filter((p): p is number => p !== null)
  return prices.length > 0 ? Math.min(...prices) : null
}

/**
 * The hero carousel's slides: the best-sellers that have a real photo, in
 * best-seller order, up to `HERO_SLIDES_MAX` — each linking to its perfume.
 * On a catalogue with no photos at all, one neutral placeholder slide (and
 * the carousel then renders no controls).
 */
function pickHeroSlides(products: StoreProductCard[]): HeroSlide[] {
  const slides = products.flatMap((product) =>
    product.coverImageUrl
      ? [
          {
            src: product.coverImageUrl,
            alt: `عطر ${product.name} من مِسك`,
            href: storeProductRoute(product.slug),
            name: product.name,
            eyebrow: product.category.name,
          },
        ]
      : []
  )

  if (slides.length > 0) return slides.slice(0, HERO_SLIDES_MAX)

  return [
    {
      src: DEFAULT_PRODUCT_IMAGE,
      alt: "إزازة عطر من مِسك",
      href: null,
      name: null,
      eyebrow: null,
    },
  ]
}

/**
 * `/` — the landing page, rebuilt around the audience research.
 *
 * Top to bottom: hero (the brand promise) → one section per audience
 * segment, each headed by its key message → the category selector (mapped from the database) →
 * best sellers (ranked by real orders) → how it works → quality → alcohol
 * vs. pure oil (with "from" prices read live) → brand story → closing band.
 *
 * Every section that shows data is server-rendered here, so the category
 * cards and the product cards are in the first HTML a crawler sees. Reads go
 * straight to `catalog.service` — the storefront's documented read exception
 * (docs/store-feature.md): read-only, and part of the first paint.
 *
 * Everything inside `<main>` runs under `MotionProvider` — the lean
 * `LazyMotion` runtime, scoped to this page so no other route pays for it.
 * The animation pattern is documented in docs/landing-page.md, "Motion".
 *
 * There is **no reviews section**: the schema has no review table, and the
 * page will not invent testimonials. See docs/landing-page.md, "Social
 * proof", for what adding one takes.
 */
export default async function Home() {
  const [bestSellers, categories, priceFloors, origin] = await Promise.all([
    listBestSellers(BEST_SELLERS_COUNT),
    listSegmentCategories(),
    getFormatPriceFloors(),
    getSiteOrigin(),
  ])

  return (
    <>
      <StoreHeader />
      <main className="flex-1">
        <NoJsMotionReset />
        <MotionProvider>
          <Hero slides={pickHeroSlides(bestSellers.products)} />
          <AudienceSections priceFrom={lowestPrice(priceFloors)} />
          <CategorySegments categories={categories} />
          <BestSellers {...bestSellers} />
          <HowItWorks />
          <Quality />
          <FormatComparison priceFloors={priceFloors} />
          <BrandStory />
          <FinalCta />
        </MotionProvider>
      </main>
      <SiteFooter />
      <LandingJsonLd origin={origin} products={bestSellers.products} />
    </>
  )
}
