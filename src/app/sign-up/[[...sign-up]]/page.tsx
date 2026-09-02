import { SignUp } from "@clerk/nextjs"

import { authCallbackUrl } from "@/constants/routes"

export const metadata = { title: "إنشاء حساب" }

/**
 * `/sign-up` — the same shape as `/sign-in`, and for the same reason.
 *
 * The sync matters more here than anywhere: a brand-new user has no row in
 * the `User` table at all, so routing them through `/auth-callback` is what
 * creates it. See docs/auth-callback.md.
 */
export default async function SignUpPage({
  searchParams,
}: PageProps<"/sign-up/[[...sign-up]]">) {
  const { redirect_url } = await searchParams

  return (
    <div className="brand-sheen flex min-h-screen items-center justify-center px-6">
      <SignUp forceRedirectUrl={authCallbackUrl(redirect_url)} />
    </div>
  )
}
