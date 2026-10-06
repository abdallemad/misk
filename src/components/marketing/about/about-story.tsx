import { QuoteIcon } from "lucide-react"

import { Reveal, Stagger, StaggerItem } from "@/components/motion"
import { ABOUT_STORY, BRAND_ABOUT } from "@/constants/about"

/**
 * The founder's story — the rest of `BRAND_ABOUT` after the hero's opening
 * sentence — as text beside a visual panel, the same two-column layout and
 * gold-ringed `brand-sheen` panel as the landing page's audience sections
 * (`audience-section.tsx`), so `/about` reads as the same site. The panel
 * holds the sign-off as a quote, attributed to the founder. Below `lg` the
 * panel stacks under the text and everything centres.
 */
export function AboutStory() {
  return (
    <section aria-labelledby="about-story-title">
      <div className="mx-auto grid max-w-page items-center gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2 lg:gap-16">
        <Stagger className="flex flex-col items-center text-center lg:items-start lg:text-start">
          <StaggerItem as="p" className="eyebrow">
            {ABOUT_STORY.eyebrow}
          </StaggerItem>
          <StaggerItem>
            <h2
              id="about-story-title"
              className="mt-4 max-w-xl text-display-sm sm:text-display-md lg:text-display-lg"
            >
              {ABOUT_STORY.title}
            </h2>
          </StaggerItem>
          <StaggerItem
            as="p"
            className="mt-6 max-w-prose text-base leading-relaxed text-muted-foreground"
          >
            {BRAND_ABOUT.craft}
          </StaggerItem>
          <StaggerItem
            as="p"
            className="mt-4 max-w-prose text-base leading-relaxed text-muted-foreground"
          >
            {BRAND_ABOUT.belief}
          </StaggerItem>
        </Stagger>

        <Reveal delay={0.15} className="w-full">
          <figure className="brand-sheen relative mx-auto flex aspect-[4/3] w-full max-w-lg flex-col items-center justify-center overflow-hidden rounded-2xl border border-border p-8 text-center shadow-sm">
            <span
              aria-hidden="true"
              className="absolute size-80 rounded-full border border-gold/20"
            />
            <span
              aria-hidden="true"
              className="absolute size-56 rounded-full border border-gold/30"
            />

            <span className="relative inline-flex size-16 items-center justify-center rounded-full bg-gold text-gold-foreground shadow-md">
              <QuoteIcon aria-hidden="true" className="size-7" />
            </span>
            <blockquote className="relative mt-6 max-w-xs font-display text-display-xs sm:text-display-sm">
              {BRAND_ABOUT.signOff}
            </blockquote>
            <figcaption className="relative mt-4 text-sm text-muted-foreground">
              {ABOUT_STORY.attribution}
            </figcaption>
          </figure>
        </Reveal>
      </div>
    </section>
  )
}
