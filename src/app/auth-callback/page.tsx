import Link from "next/link"
import { redirect } from "next/navigation"
import { TriangleAlertIcon } from "lucide-react"

import { syncUserAction } from "@/actions/auth/sync-user"
import { buttonVariants } from "@/components/ui/button"
import { ROUTES, safeRedirect } from "@/constants/routes"

/**
 * `/auth-callback` — the landing strip between Clerk and the app.
 *
 * Clerk finishes a sign-in or sign-up and sends the browser here instead of
 * straight to the destination. This route mirrors the Clerk user into our
 * `User` table, then forwards them on. It exists because:
 *
 *   - `Order.userId` is a foreign key to a real row, so a user who has never
 *     been mirrored cannot check out. The mirror has to happen before they
 *     can reach a page that assumes it.
 *   - The alternative — a Clerk webhook — is asynchronous and unordered. A
 *     fast user can land on `/cart` before the webhook fires. Doing it in
 *     the redirect chain makes the row's existence a precondition of ever
 *     seeing a signed-in page.
 *
 * The wait is visible rather than hidden: `loading.tsx` renders the brand
 * loader for as long as this component is awaiting the database.
 *
 * Where the user goes next comes from `?redirect_url=`, laundered through
 * `safeRedirect` — the value arrives from the address bar, so an unchecked
 * redirect here would be an open-redirect hole in the sign-in flow.
 *
 * See docs/auth-callback.md.
 */
export default async function AuthCallbackPage({
  searchParams,
}: PageProps<"/auth-callback">) {
  const { redirect_url } = await searchParams

  const result = await syncUserAction()

  if (result.ok) {
    const target = safeRedirect(
      typeof redirect_url === "string" ? redirect_url : null
    )
    redirect(target)
  }

  if (result.reason === "signed-out") {
    // No session — either the user opened this URL directly or the Clerk
    // handshake did not complete. Send them back to the front of the flow.
    redirect(ROUTES.signIn)
  }

  // The sync itself failed: they are signed in, but we have no row for them.
  // Rendering a dead end would strand a paying customer, so offer the retry
  // (this same route re-runs the sync) and a way past it. Note this is an
  // error state, not a slow one — no spinner, or it would read as "still
  // working" and the user would sit and wait for nothing.
  return (
    <div className="brand-sheen flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-destructive-soft text-destructive-soft-foreground">
        <TriangleAlertIcon className="size-6" aria-hidden="true" />
      </span>

      <div className="flex flex-col items-center gap-2">
        <h1 className="font-display text-display-xs font-bold">
          تعذّر إكمال تجهيز حسابك
        </h1>
        <p className="max-w-sm text-sm text-balance text-muted-foreground">
          تم تسجيل دخولك بنجاح، لكننا لم نتمكن من مزامنة بياناتك. حاول مرة
          أخرى — وإن تكرّر الأمر تواصل معنا.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href={ROUTES.authCallback}
          prefetch={false}
          className={buttonVariants({ variant: "gold" })}
        >
          إعادة المحاولة
        </Link>
        <Link
          href={ROUTES.home}
          className={buttonVariants({ variant: "ghost" })}
        >
          المتابعة إلى المتجر
        </Link>
      </div>
    </div>
  )
}
