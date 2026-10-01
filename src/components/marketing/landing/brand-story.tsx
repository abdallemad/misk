import Link from "next/link"

import { Reveal } from "@/components/motion"
import { buttonVariants } from "@/components/ui/button"
import { BRAND_STORY } from "@/constants/landing"
import { ROUTES } from "@/constants/routes"

import { SectionHeading } from "./section-heading"

/** A short teaser of the brand story, handing off to `/about` for the rest. */
export function BrandStory() {
  return (
    <section
      aria-labelledby="story-title"
      className="mx-auto max-w-page px-4 py-16 sm:px-6 sm:py-20"
    >
      <SectionHeading
        id="story-title"
        eyebrow={BRAND_STORY.eyebrow}
        title={BRAND_STORY.title}
      />
      <Reveal
        as="p"
        delay={0.1}
        className="mx-auto mt-5 max-w-prose text-center text-base text-muted-foreground"
      >
        {BRAND_STORY.body}
      </Reveal>
      <Reveal delay={0.2} className="mt-8 flex justify-center">
        <Link
          href={ROUTES.about}
          className={buttonVariants({ variant: "outline", size: "lg" })}
        >
          {BRAND_STORY.cta}
        </Link>
      </Reveal>
    </section>
  )
}
