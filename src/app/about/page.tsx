import type { Metadata } from "next"

import {
  AboutCta,
  AboutHero,
  AboutStory,
  AboutValues,
} from "@/components/marketing/about"
import { FormatComparison, Quality } from "@/components/marketing/landing"
import { SiteFooter } from "@/components/marketing/site-footer"
import { MotionProvider, NoJsMotionReset } from "@/components/motion"
import { StoreHeader } from "@/components/store"
import { ABOUT_SEO } from "@/constants/about"
import { getFormatPriceFloors } from "@/services/catalog.service"

export const metadata: Metadata = {
  title: ABOUT_SEO.title,
  description: ABOUT_SEO.description,
}

/**
 * `/about` — the brand's story in the founder's words, laid out in the
 * landing page's design so the two read as one site.
 *
 * Top to bottom: hero (the sign-off as the `<h1>`, the story's first
 * sentence under it) → the story beside a quote panel → three values →
 * the landing page's own `Quality` (what goes into a bottle) and
 * `FormatComparison` (alcohol vs. pure oil, with live "from" prices) →
 * a closing band to `/store` and `/contact`.
 *
 * The story's sentences are `BRAND_ABOUT` (`constants/about.ts`) — the same
 * text the footer prints, from the same constant. The one read is the
 * format price floors, which is why this page is `async` now; it goes
 * straight to `catalog.service`, the storefront's documented read
 * exception. Animated like `/`: `MotionProvider` around `<main>`'s
 * sections, plus the no-JS reset. See docs/landing-page.md, "`/about`".
 */
export default async function AboutPage() {
  const priceFloors = await getFormatPriceFloors()

  return (
    <>
      <StoreHeader />
      <main className="flex-1">
        <NoJsMotionReset />
        <MotionProvider>
          <AboutHero />
          <AboutStory />
          <AboutValues />
          <Quality />
          <FormatComparison priceFloors={priceFloors} />
          <AboutCta />
        </MotionProvider>
      </main>
      <SiteFooter />
    </>
  )
}
