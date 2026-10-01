"use client"

import { LazyMotion, MotionConfig, domAnimation } from "motion/react"
import type { ReactNode } from "react"

/**
 * The motion runtime, loaded lean.
 *
 * `LazyMotion` + `domAnimation` + the `m.*` components (see `reveal.tsx`)
 * ship only the animation features actually used — animate, variants,
 * in-view, hover/tap — instead of the full `motion.*` bundle, which also
 * carries layout animation and drag. `strict` makes a stray `motion.div`
 * (the heavy import) throw in development instead of silently undoing that.
 *
 * `reducedMotion="user"` honours the OS "reduce motion" setting: transforms
 * are dropped and only the opacity fades remain, so nothing moves across
 * the screen for someone who asked it not to.
 *
 * Wraps only the pages that animate (today, `/`), so every other page's
 * bundle stays motion-free.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  )
}
