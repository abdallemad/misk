import { BrandLoader } from "@/components/shared/brand-loader"

/**
 * The loader the user actually sees at `/auth-callback`.
 *
 * `page.tsx` is an async Server Component that never returns markup on the
 * happy path — it syncs and then redirects — so this Suspense fallback is
 * the entire visible life of the route. Next.js streams it as soon as the
 * request starts and swaps it out when the redirect lands.
 *
 * Keep it dependency-free and instant: anything that awaits in here would
 * delay the very frame it exists to show.
 */
export default function AuthCallbackLoading() {
  return (
    <BrandLoader
      title="جارٍ تجهيز حسابك…"
      description="نُطابق بياناتك مع سجلاتنا. لن يستغرق الأمر سوى لحظات."
    />
  )
}
