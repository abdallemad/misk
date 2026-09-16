import { clerkMiddleware } from "@clerk/nextjs/server"

/**
 * Proxy — Next.js 16's replacement for `middleware.ts`, running on every
 * matched request before a route renders. The Clerk helper is still named
 * `clerkMiddleware`; only the Next.js file convention and the exported
 * function name changed.
 *
 * Runtime is `nodejs` and is not configurable in `proxy` (the `edge` runtime
 * is not supported here).
 *
 * Carries no auth logic of its own. Clerk deprecated gating routes here with
 * `createRouteMatcher` + `auth.protect()`: a proxy decides access by
 * path-matching, which can diverge from how Next.js actually resolves a
 * request and leave a resource reachable — see
 * https://clerk.com/docs/guides/development/upgrading/upgrade-guides/migrate-from-create-route-matcher.
 * `clerkMiddleware()` still has to run with no matcher condition, though —
 * it is what makes `auth()` / `auth.protect()` work at all downstream — so
 * this file is kept rather than deleted.
 *
 * The actual gates are resource-based, one per protected subtree:
 *
 *   /admin/*     `auth.protect()` + `isAdmin()` in `/admin/layout.tsx`
 *   /account/*   `auth.protect()` in `/account/layout.tsx`
 *   /checkout/*  `auth.protect()` in `/checkout/layout.tsx`
 *
 * None of that protects a Server Action bound to a page under those paths —
 * an action POST is a separate endpoint that never renders the layout
 * guarding its page. Every admin action re-checks `isAdmin()` and
 * `placeOrderAction` re-checks `getCurrentUser()` for exactly that reason.
 * See docs/admin-access-control.md and docs/checkout-orders-feature.md.
 */
export default clerkMiddleware()

export const config = {
  matcher: [
    "/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
}
