import { ComingSoon, PageContainer, PageHeader } from "@/components/admin/shared"

export const metadata = { title: "الطلبات" }

/** `/admin/orders` — scaffold. See docs/orders-feature.md. */
export default function AdminOrdersPage() {
  return (
    <PageContainer>
      <PageHeader title="الطلبات" description="متابعة حالة الطلبات من الدفع حتى التسليم." />
      <ComingSoon section="الطلبات" doc="orders-feature.md" />
    </PageContainer>
  )
}
