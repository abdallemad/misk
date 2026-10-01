import type { Variants } from "motion/react"

import { DURATION, EASE_LUXE, RISE, STAGGER } from "@/constants/motion"

/**
 * The only four ways anything on the storefront animates in. Every variant
 * uses `hidden` → `visible`, so a `Stagger` container can drive any of them
 * in its children by name alone.
 *
 * Only compositor-friendly properties move: `opacity` and `transform`
 * (`y`, `scale`, `scaleX`). `filter: blur()` is the one exception, and only
 * `blurUp` uses it — kept to a few words of headline, never a grid.
 *
 * Each `visible` is a function of `custom` (a delay in seconds) so a lone
 * `Reveal` can be offset without breaking the variant's own easing.
 */

const settle = (delay = 0, duration: number = DURATION.base) => ({
  duration,
  delay,
  ease: EASE_LUXE,
})

export type RevealVariant = "fadeUp" | "blurUp" | "settle" | "draw"

export const VARIANTS: Record<RevealVariant, Variants> = {
  /** The default: fade in while rising a few pixels. */
  fadeUp: {
    hidden: { opacity: 0, y: RISE },
    visible: (delay = 0) => ({ opacity: 1, y: 0, transition: settle(delay) }),
  },

  /** Headline only — Magic UI's BlurFade, scaled down. */
  blurUp: {
    hidden: { opacity: 0, y: RISE / 2, filter: "blur(6px)" },
    visible: (delay = 0) => ({
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: settle(delay, DURATION.slow * 0.7),
    }),
  },

  /**
   * Imagery: a slow settle from a slight zoom, **without** an opacity fade —
   * the hero photo is the page's likely LCP element, and an element held at
   * `opacity: 0` is not painted (and not counted) until it fades in.
   */
  settle: {
    hidden: { scale: 1.06 },
    visible: (delay = 0) => ({
      scale: 1,
      transition: settle(delay, DURATION.slow),
    }),
  },

  /** A hairline drawing itself out from the centre — the gold rule. */
  draw: {
    hidden: { scaleX: 0 },
    visible: (delay = 0) => ({
      scaleX: 1,
      transition: settle(delay, DURATION.slow),
    }),
  },
}

/** A container that only orchestrates: it staggers its children, nothing more. */
export function staggerContainer(
  stagger: number = STAGGER,
  delayChildren = 0
): Variants {
  return {
    hidden: {},
    visible: { transition: { staggerChildren: stagger, delayChildren } },
  }
}
