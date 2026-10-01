import { Reveal } from "@/components/motion"
import { cn } from "@/lib/utils"

type SectionHeadingProps = {
  eyebrow: string
  title: string
  intro?: string
  /** `id` for the `<h2>`, so the section can be `aria-labelledby` it. */
  id: string
  className?: string
}

/**
 * The centred eyebrow + `<h2>` + optional one-liner every section on `/`
 * opens with — written once so the nine sections cannot drift apart in
 * spacing or heading level (exactly one `<h1>` on the page, in the hero;
 * every section title is an `<h2>`, every card title under it an `<h3>`).
 *
 * It is also where the scroll-reveal pattern starts: every section's heading
 * fades up as it enters the viewport, and the section's grid (a `Stagger`)
 * follows it in. See docs/landing-page.md, "Motion".
 */
export function SectionHeading({
  eyebrow,
  title,
  intro,
  id,
  className,
}: SectionHeadingProps) {
  return (
    <Reveal className={cn("mx-auto max-w-prose text-center", className)}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 id={id} className="mt-3 text-display-sm sm:text-display-md">
        {title}
      </h2>
      {intro ? (
        <p className="mt-3 text-base text-muted-foreground">{intro}</p>
      ) : null}
    </Reveal>
  )
}
