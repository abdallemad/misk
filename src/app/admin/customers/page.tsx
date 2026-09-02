import { ComingSoon, PageContainer, PageHeader } from "@/components/admin/shared"

export const metadata = { title: "العملاء" }

/** `/admin/customers` — scaffold. See docs/customers-feature.md. */
export default function AdminCustomersPage() {
  return (
    <PageContainer>
      <PageHeader title="العملاء" description="الحسابات المُزامَنة من Clerk وسجل طلباتها." />
      <ComingSoon section="العملاء" doc="customers-feature.md" />
    </PageContainer>
  )
}
