import type { Metadata } from "next"

import { LegalPage } from "@/components/marketing/legal"
import { SiteFooter } from "@/components/marketing/site-footer"
import { StoreHeader } from "@/components/store"
import { TERMS } from "@/constants/legal"
import { ROUTES } from "@/constants/routes"

export const metadata: Metadata = {
  title: "الشروط والأحكام",
  description: TERMS.description,
}

/**
 * `/terms` — the copy is `TERMS` in `constants/legal.ts`; the layout is the
 * shared `LegalPage`. Same chrome as `/about` and `/contact`. See
 * docs/legal-pages.md.
 */
export default function TermsPage() {
  return (
    <>
      <StoreHeader />
      <main className="flex-1">
        <LegalPage doc={TERMS} currentHref={ROUTES.terms} />
      </main>
      <SiteFooter />
    </>
  )
}
