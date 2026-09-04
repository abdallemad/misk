import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

/**
 * Proxy — Next.js 16's replacement for `middleware.ts`, running on every
 * matched request before a route renders. The Clerk helper is still named
 * `clerkMiddleware`; only the Next.js file convention and the exported
 * function name changed.
 *
 * Runtime is `nodejs` and is not configurable in `proxy` (the `edge` runtime
 * is not supported here).
 *
 * Its job is narrow on purpose — decide whether a request is allowed to
 * reach the renderer at all:
 *
 *   /admin/*     signed in, or bounce to sign-in
 *   /account/*   signed in, or bounce to sign-in
 *   /checkout/*  signed in, or bounce to sign-in — an Order needs a User row
 *   everything else public
 *
 * The **role** check is not here. Reading a role means either a Clerk API
 * call or a customised session token, and a proxy runs on every request
 * including prefetches; it is also the wrong place to fail, because a
 * redirect cannot explain itself. `/admin/layout.tsx` does the admin check
 * instead — see docs/admin-access-control.md.
 *
 * This gate also covers Server Action POSTs bound to a page under one of
 * these paths — the proxy's matcher is nearly universal, so it runs before
 * the action does. It is not a substitute for checking inside the action,
 * though: `placeOrderAction` re-checks `getCurrentUser()` itself, the same
 * belt-and-braces every admin action takes with `isAdmin()`. See
 * docs/checkout-orders-feature.md.
 */

const isProtectedRoute = createRouteMatcher([
  "/admin(.*)",
  "/account(.*)",
  "/checkout(.*)",
])

export default clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
}
