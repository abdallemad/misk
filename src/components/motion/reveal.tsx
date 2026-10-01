"use client"

import * as m from "motion/react-m"
import type { ReactNode } from "react"

import { REVEAL_VIEWPORT } from "@/constants/motion"

import { staggerContainer, VARIANTS, type RevealVariant } from "./variants"

/**
 * The storefront's two animation primitives.
 *
 * - `Reveal` — one element appears (on scroll, or on mount).
 * - `Stagger` + `StaggerItem` — a group appears one after another; the
 *   container orchestrates, each item carries the variant.
 *
 * Both are Client Components that take **server-rendered children**: the
 * section around them stays a Server Component, its markup stays in the
 * first HTML (crawlable), and only this thin wrapper hydrates. Every element
 * is tagged `data-motion`, which the page's `<noscript>` rule uses to show
 * content that would otherwise stay at its hidden starting state without JS.
 *
 * `as` keeps list semantics intact — a staggered `<ul>` is still a `<ul>`
 * of `<li>`s, not a `<div>` soup.
 */

const TAGS = {
  div: m.div,
  h1: m.h1,
  p: m.p,
  ul: m.ul,
  ol: m.ol,
  li: m.li,
  article: m.article,
  span: m.span,
} as const

type Tag = keyof typeof TAGS

/** `view` — when scrolled into view, once. `mount` — right away (above the fold). */
type Trigger = "view" | "mount"

function triggerProps(trigger: Trigger) {
  return trigger === "mount"
    ? { initial: "hidden", animate: "visible" }
    : { initial: "hidden", whileInView: "visible", viewport: REVEAL_VIEWPORT }
}

type RevealProps = {
  as?: Tag
  variant?: RevealVariant
  trigger?: Trigger
  /** Seconds. */
  delay?: number
  className?: string
  children?: ReactNode
}

export function Reveal({
  as = "div",
  variant = "fadeUp",
  trigger = "view",
  delay = 0,
  className,
  children,
}: RevealProps) {
  const Component = TAGS[as] as typeof m.div
  return (
    <Component
      data-motion=""
      className={className}
      variants={VARIANTS[variant]}
      custom={delay}
      {...triggerProps(trigger)}
    >
      {children}
    </Component>
  )
}

type StaggerProps = {
  as?: Tag
  trigger?: Trigger
  /** Seconds between children. Defaults to the `STAGGER` token. */
  stagger?: number
  /** Seconds before the first child. */
  delay?: number
  className?: string
  children?: ReactNode
}

export function Stagger({
  as = "div",
  trigger = "view",
  stagger,
  delay,
  className,
  children,
}: StaggerProps) {
  const Component = TAGS[as] as typeof m.div
  return (
    <Component
      className={className}
      variants={staggerContainer(stagger, delay)}
      {...triggerProps(trigger)}
    >
      {children}
    </Component>
  )
}

type StaggerItemProps = {
  as?: Tag
  variant?: RevealVariant
  className?: string
  children?: ReactNode
}

/** A child of `Stagger` — no trigger of its own; the container decides when. */
export function StaggerItem({
  as = "div",
  variant = "fadeUp",
  className,
  children,
}: StaggerItemProps) {
  const Component = TAGS[as] as typeof m.div
  return (
    <Component
      data-motion=""
      className={className}
      variants={VARIANTS[variant]}
    >
      {children}
    </Component>
  )
}
