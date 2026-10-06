import { Stagger, StaggerItem } from "@/components/motion"
import { ABOUT_HERO, BRAND_ABOUT } from "@/constants/about"

/**
 * `/about`'s `<h1>` — the founder's sign-off, «عطر يشبهك، بسعر يريّحك.» —
 * over the first sentence of the story. The same on-load stagger as the
 * landing hero (eyebrow, then the headline blurring in, then the line under
 * it), centred because there is no photo column beside it.
 */
export function AboutHero() {
  return (
    <section className="brand-sheen border-b border-border">
      <Stagger
        trigger="mount"
        className="mx-auto flex max-w-3xl flex-col items-center px-4 py-20 text-center sm:px-6 sm:py-28"
      >
        <StaggerItem as="p" className="eyebrow">
          {ABOUT_HERO.eyebrow}
        </StaggerItem>
        <StaggerItem
          as="h1"
          variant="blurUp"
          className="mt-5 text-display-md sm:text-display-lg lg:text-display-xl"
        >
          {ABOUT_HERO.headline}
        </StaggerItem>
        <StaggerItem
          as="p"
          className="mt-6 max-w-prose text-base text-muted-foreground sm:text-lg"
        >
          {BRAND_ABOUT.origin}
        </StaggerItem>
      </Stagger>
    </section>
  )
}
