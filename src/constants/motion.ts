/**
 * Motion tokens — the TypeScript half of the brand's motion language, the
 * way `design-system.ts` is the TypeScript half of its colour.
 *
 * `globals.css` owns `--ease-luxe` ("slow in, settled out. Perfume, not
 * software."); `EASE_LUXE` below is the same curve as a number array, for
 * `motion`, which cannot read a CSS custom property. Change one, change both.
 *
 * The whole pattern is documented in docs/landing-page.md, "Motion".
 */

/** `cubic-bezier(0.22, 1, 0.36, 1)` — `--ease-luxe` in globals.css. */
export const EASE_LUXE = [0.22, 1, 0.36, 1] as const

/** Seconds. `base` is almost everything; `slow` is reserved for imagery. */
export const DURATION = {
  fast: 0.35,
  base: 0.6,
  slow: 1.1,
} as const

/** How far an element rises as it appears, in px. Small on purpose. */
export const RISE = 16

/** The gap between siblings in a staggered group, in seconds. */
export const STAGGER = 0.08

/**
 * When a scroll reveal fires: once (the observer disconnects afterwards — no
 * re-animating on every scroll past), as soon as **any** part of the element
 * crosses a line 8% above the bottom of the viewport.
 *
 * `"some"`, not a fraction, on purpose: a staggered grid is one observed
 * element, and on a phone the one-column best-seller grid is ~3000px tall. A
 * fractional `amount` (say 0.2 → 600px) can exceed the whole viewport on a
 * short or landscape screen, and the grid would then never reveal at all.
 */
export const REVEAL_VIEWPORT = {
  once: true,
  amount: "some",
  margin: "0px 0px -8% 0px",
} as const
