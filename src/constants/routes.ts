/**
 * Every path the app links to, in one place.
 *
 * Two rules keep this file honest:
 *   1. Nothing outside this file writes a route string literal. A rename
 *      then costs one edit, not a grep.
 *   2. The values here must stay in sync with the Clerk env vars in `.env`
 *      (`NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `..._FALLBACK_REDIRECT_URL`), since
 *      Clerk reads those directly and never sees this module.
 */

export const ROUTES = {
  home: "/",
  shop: "/shop",
  cart: "/cart",
  search: "/search",

  /* Auth ---------------------------------------------------------------- */
  signIn: "/sign-in",
  signUp: "/sign-up",
  /** Where Clerk drops the browser after sign-in/up — see auth-callback.md */
  authCallback: "/auth-callback",

  /* Account ------------------------------------------------------------- */
  account: "/account/profile",
  accountOrders: "/account/orders",

  /* Admin --------------------------------------------------------------- */
  admin: "/admin",
  adminProducts: "/admin/products",
  adminCategories: "/admin/categories",
  adminOrders: "/admin/orders",
  adminCustomers: "/admin/customers",
  adminSettings: "/admin/settings",
} as const

export type Route = (typeof ROUTES)[keyof typeof ROUTES]

/**
 * The default landing spot after a successful sync, and the only value
 * `safeRedirect` falls back to.
 */
export const DEFAULT_AFTER_AUTH_REDIRECT = ROUTES.home

/**
 * Reduce an arbitrary redirect target to a safe path on **our** origin.
 *
 * The value reaches us from the address bar — Clerk appends
 * `?redirect_url=http://localhost:3000/admin` when its proxy guard bounces a
 * signed-out visitor — so an unchecked hand-off here would be an
 * open-redirect hole in the sign-in flow: a link that signs a user in and
 * drops them on a lookalike site with a real session in hand.
 *
 * The trick is that only the *path* of the input survives. The origin is
 * discarded rather than validated, so a hostile absolute URL cannot escape
 * this origin at all — the worst it can do is name a page on our own site.
 *
 *   "/admin"                       -> "/admin"
 *   "http://localhost:3000/admin"  -> "/admin"   (the Clerk case)
 *   "https://evil.com/admin"       -> "/admin"   (origin dropped)
 *   "//evil.com/x"                 -> "/x"       (protocol-relative)
 *   "/\\evil.com"                  -> "/"        (backslash normalised, host dropped)
 *   "javascript:alert(1)"          -> "/"        (not path-shaped)
 */
export function safeRedirect(
  target: string | null | undefined,
  fallback: string = DEFAULT_AFTER_AUTH_REDIRECT
): string {
  if (!target) return fallback

  // Browsers read a backslash in a URL as a forward slash, so "/\evil.com"
  // navigates to "//evil.com". Normalise before parsing, or the check below
  // sees a harmless-looking path that the browser will read as an origin.
  const normalised = target.replace(/\\/g, "/")

  let path: string
  try {
    // The base is a throwaway: it lets one call handle both absolute and
    // relative input, and nothing about it survives into the result.
    const url = new URL(normalised, "http://redirect.invalid")
    path = `${url.pathname}${url.search}${url.hash}`
  } catch {
    return fallback
  }

  // `new URL` always yields a path starting with "/", but a scheme like
  // `javascript:` parses into an opaque path that does not — reject it.
  if (!path.startsWith("/") || path.startsWith("//")) return fallback

  return path
}

/**
 * Build the `/auth-callback?redirect_url=…` URL to hand Clerk as its
 * `forceRedirectUrl`.
 *
 * `next` is whatever Clerk put in the current page's `?redirect_url=` — the
 * page the user was trying to reach when they got bounced to sign-in. It is
 * laundered through `safeRedirect` here, at the point it enters our URLs,
 * rather than only when it is finally consumed: `/auth-callback` re-checks
 * it anyway, but a link containing a hostile origin should never exist in
 * the page in the first place.
 *
 * A `searchParams` value can legitimately be `string[]` when the parameter
 * is repeated (`?redirect_url=/a&redirect_url=/b`). There is no sane way to
 * honour two destinations, so anything that is not a single string falls
 * through to the default.
 */
export function authCallbackUrl(next: string | string[] | undefined): string {
  const target = safeRedirect(typeof next === "string" ? next : null)

  if (target === DEFAULT_AFTER_AUTH_REDIRECT) return ROUTES.authCallback

  return `${ROUTES.authCallback}?redirect_url=${encodeURIComponent(target)}`
}
