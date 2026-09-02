import { ComingSoon, PageContainer, PageHeader } from "@/components/admin/shared"

export const metadata = { title: "العطور" }

/** `/admin/products` — scaffold. See docs/products-feature.md. */
export default function AdminProductsPage() {
  return (
    <PageContainer>
      <PageHeader title="العطور" description="إضافة وتعديل العطور وأحجامها وأسعارها." />
      <ComingSoon section="العطور" doc="products-feature.md" />
    </PageContainer>
  )
}
