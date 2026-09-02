import { ComingSoon, PageContainer, PageHeader } from "@/components/admin/shared"

export const metadata = { title: "إعدادات المتجر" }

/** `/admin/settings` — scaffold. See docs/admin-dashboard.md. */
export default function AdminSettingsPage() {
  return (
    <PageContainer>
      <PageHeader title="إعدادات المتجر" description="بيانات المتجر، العملة، وتفضيلات الشحن." />
      <ComingSoon section="إعدادات المتجر" doc="admin-dashboard.md" />
    </PageContainer>
  )
}
