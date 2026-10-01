import {
  FlaskConicalIcon,
  RulerIcon,
  SearchIcon,
  type LucideIcon,
} from "lucide-react"

import { Stagger, StaggerItem } from "@/components/motion"
import { HOW_IT_WORKS } from "@/constants/landing"

import { SectionHeading } from "./section-heading"

const ICONS: Record<(typeof HOW_IT_WORKS.steps)[number]["icon"], LucideIcon> = {
  search: SearchIcon,
  ruler: RulerIcon,
  flask: FlaskConicalIcon,
}

/**
 * «إزاي عطرك بيوصلك» — the differentiator in three steps: choose the scent,
 * choose the size (or pure oil by the gram), we blend and bottle it after
 * the order. An `<ol>`, because the order is the point.
 */
export function HowItWorks() {
  return (
    <section
      aria-labelledby="how-title"
      className="border-y border-border bg-secondary/40"
    >
      <div className="mx-auto max-w-page px-4 py-16 sm:px-6 sm:py-20">
        <SectionHeading
          id="how-title"
          eyebrow={HOW_IT_WORKS.eyebrow}
          title={HOW_IT_WORKS.title}
        />

        <Stagger as="ol" className="mt-12 grid gap-10 sm:grid-cols-3">
          {HOW_IT_WORKS.steps.map((step, index) => {
            const Icon = ICONS[step.icon]
            return (
              <StaggerItem as="li" key={step.title} className="text-center">
                <span className="relative mx-auto inline-flex size-12 items-center justify-center rounded-full border border-gold/40 bg-background text-gold">
                  <Icon aria-hidden="true" className="size-5" />
                  <span
                    className="absolute -top-1.5 -end-1.5 inline-flex size-6 items-center justify-center rounded-full bg-gold text-xs font-semibold text-gold-foreground"
                    data-numeric
                  >
                    {index + 1}
                  </span>
                </span>
                <h3 className="mt-4 text-display-xs font-bold">{step.title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
                  {step.body}
                </p>
              </StaggerItem>
            )
          })}
        </Stagger>
      </div>
    </section>
  )
}
