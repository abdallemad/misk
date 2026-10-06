import type { Metadata } from "next"

import { LegalPage } from "@/components/marketing/legal"
import { SiteFooter } from "@/components/marketing/site-footer"
import { StoreHeader } from "@/components/store"
import { PRIVACY } from "@/constants/legal"
import { ROUTES } from "@/constants/routes"

export const metadata: Metadata = {
  title: "سياسة الخصوصية",
  description: PRIVACY.description,
}

/**
 * `/privacy` — the copy is `PRIVACY` in `constants/legal.ts`; the layout is the
 * shared `LegalPage`. Same chrome as `/about` and `/contact`. See
 * docs/legal-pages.md.
 */
export default function PrivacyPage() {
  return (
    <>
      <StoreHeader />
      <main className="flex-1">
        <LegalPage doc={PRIVACY} currentHref={ROUTES.privacy} />
      </main>
      <SiteFooter />
    </>
  )
}
