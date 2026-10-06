import type { Metadata } from "next"

import { LegalPage } from "@/components/marketing/legal"
import { SiteFooter } from "@/components/marketing/site-footer"
import { StoreHeader } from "@/components/store"
import { REFUNDS } from "@/constants/legal"
import { ROUTES } from "@/constants/routes"

export const metadata: Metadata = {
  title: "الاسترجاع والاسترداد",
  description: REFUNDS.description,
}

/**
 * `/refunds` — the copy is `REFUNDS` in `constants/legal.ts`; the layout is the
 * shared `LegalPage`. Same chrome as `/about` and `/contact`. See
 * docs/legal-pages.md.
 */
export default function RefundsPage() {
  return (
    <>
      <StoreHeader />
      <main className="flex-1">
        <LegalPage doc={REFUNDS} currentHref={ROUTES.refunds} />
      </main>
      <SiteFooter />
    </>
  )
}
