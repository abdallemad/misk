import {
  HandHeartIcon,
  ScaleIcon,
  WalletIcon,
  type LucideIcon,
} from "lucide-react"

import { Stagger, StaggerItem } from "@/components/motion"
import { ABOUT_VALUES, type AboutValueIcon } from "@/constants/about"

import { SectionHeading } from "../landing/section-heading"

const ICONS: Record<AboutValueIcon, LucideIcon> = {
  hand: HandHeartIcon,
  scale: ScaleIcon,
  wallet: WalletIcon,
}

/**
 * The founder's text unpacked into three values — handmade, chosen
 * materials in balanced measures, quality for everyone — as cards on the
 * tinted band the landing page alternates to. Same heading component and
 * stagger as the landing sections.
 */
export function AboutValues() {
  return (
    <section
      aria-labelledby="about-values-title"
      className="border-y border-border bg-secondary/40"
    >
      <div className="mx-auto max-w-page px-4 py-16 sm:px-6 sm:py-20">
        <SectionHeading
          id="about-values-title"
          eyebrow={ABOUT_VALUES.eyebrow}
          title={ABOUT_VALUES.title}
        />

        <Stagger as="ul" className="mt-14 grid gap-6 sm:grid-cols-3">
          {ABOUT_VALUES.blocks.map((block) => {
            const Icon = ICONS[block.icon]
            return (
              <StaggerItem
                as="li"
                key={block.title}
                className="rounded-xl border border-border bg-card p-8 text-center"
              >
                <span className="mx-auto inline-flex size-12 items-center justify-center rounded-lg bg-gold-soft text-gold-soft-foreground">
                  <Icon aria-hidden="true" className="size-6" />
                </span>
                <h3 className="mt-5 text-display-xs font-bold">{block.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{block.body}</p>
              </StaggerItem>
            )
          })}
        </Stagger>
      </div>
    </section>
  )
}
