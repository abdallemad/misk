import {
  FlaskConicalIcon,
  LeafIcon,
  SparklesIcon,
  type LucideIcon,
} from "lucide-react"

import { Reveal, Stagger, StaggerItem } from "@/components/motion"
import { QUALITY } from "@/constants/landing"

const ICONS: Record<(typeof QUALITY.blocks)[number]["icon"], LucideIcon> = {
  flask: FlaskConicalIcon,
  leaf: LeafIcon,
  sparkles: SparklesIcon,
}

/**
 * «عارفين إيه اللي جوه كل إزازة» — the three manufacturing claims the shop
 * can stand behind (docs/misk_business_analysis.md §2 and §6): pharmaceutical-
 * grade ethanol, graded oils, blended to order. Nothing else is claimed here.
 */
export function Quality() {
  return (
    <section
      aria-labelledby="quality-title"
      className="mx-auto max-w-page px-4 py-16 sm:px-6 sm:py-20"
    >
      <Reveal className="mx-auto max-w-prose text-center">
        <Reveal variant="draw">
          <hr className="rule-gold" />
        </Reveal>
        <p className="eyebrow mt-6">{QUALITY.eyebrow}</p>
        <h2
          id="quality-title"
          className="mt-3 text-display-sm sm:text-display-md"
        >
          {QUALITY.title}
        </h2>
      </Reveal>

      <Stagger className="mt-14 grid gap-8 sm:grid-cols-3">
        {QUALITY.blocks.map((block) => {
          const Icon = ICONS[block.icon]
          return (
            <StaggerItem key={block.title} className="text-center">
              <span className="mx-auto inline-flex size-10 items-center justify-center rounded-lg bg-gold-soft text-gold-soft-foreground">
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <h3 className="mt-4 text-display-xs font-bold">{block.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{block.body}</p>
            </StaggerItem>
          )
        })}
      </Stagger>
    </section>
  )
}
