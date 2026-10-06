/**
 * Without JavaScript, every `motion` element would stay at its hidden
 * starting state (opacity 0, shifted). This rule, only parsed when scripting
 * is off, puts them all back — the content is in the HTML either way.
 *
 * Rendered once by every page that wraps itself in `MotionProvider` (`/`,
 * `/about`). Moved out of `app/page.tsx` the day a second page animated.
 */
const NO_JS_MOTION_RESET =
  "[data-motion]{opacity:1!important;transform:none!important;filter:none!important}"

export function NoJsMotionReset() {
  return (
    <noscript>
      <style>{NO_JS_MOTION_RESET}</style>
    </noscript>
  )
}
