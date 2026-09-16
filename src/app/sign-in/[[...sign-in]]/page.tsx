import { SignIn } from "@clerk/nextjs"

import { authCallbackUrl } from "@/constants/routes"

export const metadata = { title: "تسجيل الدخول" }

/**
 * `/sign-in` — Clerk's hosted form, on our page.
 *
 * The catch-all segment (`[[...sign-in]]`) is Clerk's requirement: the
 * component owns sub-routes like `/sign-in/factor-two` and needs them to
 * resolve to this same page.
 *
 * `forceRedirectUrl` is the important part. When `admin/layout.tsx`'s
 * `auth.protect()` bounces a signed-out visitor off `/admin`, Clerk arrives here with
 * `?redirect_url=http://localhost:3000/admin` and would otherwise send them
 * straight back there after sign-in — skipping `/auth-callback`, and so
 * skipping the database sync. Forcing the callback URL puts the sync back in
 * the path, and hands it the original destination to forward to afterwards.
 */
export default async function SignInPage({
  searchParams,
}: PageProps<"/sign-in/[[...sign-in]]">) {
  const { redirect_url } = await searchParams

  return (
    <div className="brand-sheen flex min-h-screen items-center justify-center px-6">
      <SignIn forceRedirectUrl={authCallbackUrl(redirect_url)} />
    </div>
  )
}
