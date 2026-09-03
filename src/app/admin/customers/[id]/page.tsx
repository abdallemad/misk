import { notFound } from "next/navigation"
import {
  CalendarDaysIcon,
  MailIcon,
  PhoneIcon,
  ReceiptTextIcon,
  WalletIcon,
} from "lucide-react"

import { BreadcrumbTitle } from "@/components/admin/layout"
import {
  CustomerOrdersTable,
  CustomerRoleControl,
} from "@/components/admin/customers"
import {
  PageContainer,
  PageHeader,
  SectionCard,
  StatTile,
} from "@/components/admin/shared"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getCurrentUser } from "@/services/auth.service"
import { getCustomer } from "@/services/customer.service"
import { formatDate, formatNumber, formatPrice } from "@/utils/format"

export const metadata = { title: "ملف العميل" }

/**
 * `/admin/customers/[id]` — one customer, with their order history.
 *
 * A real route rather than a dialog for the reason a product gets one: an
 * order history is more than a popup should hold, and a URL is something an
 * admin can send to a colleague ("look at this account").
 *
 * `params` is a promise in this version of Next.js and is awaited;
 * `PageProps<'/admin/customers/[id]'>` is the generated helper that types it
 * from the route literal, so the key is `id` because the folder is `[id]`.
 *
 * `notFound()` on a missing row — a stale bookmark to a deleted account is a
 * 404, not an error, and the `/admin` layout keeps the sidebar standing
 * around it.
 */
export default async function CustomerDetailPage(
  props: PageProps<"/admin/customers/[id]">
) {
  const { id } = await props.params
  const [customer, me] = await Promise.all([getCustomer(id), getCurrentUser()])

  if (!customer) notFound()

  const displayName = customer.name || "عميل بدون اسم"
  const isSelf = me?.id === customer.id

  return (
    <PageContainer>
      <BreadcrumbTitle title={displayName} />
      <PageHeader
        title={displayName}
        description="حساب مُزامَن من Clerk. الطلبات للعرض فقط؛ الدور قابل للتغيير أدناه."
      />

      <SectionCard title="بيانات الحساب">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
          <Avatar size="lg">
            {customer.imageUrl ? (
              <AvatarImage src={customer.imageUrl} alt="" />
            ) : null}
            <AvatarFallback>
              {(customer.name?.trim() || customer.email).charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <dl className="grid flex-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            <Detail icon={MailIcon} label="البريد الإلكتروني">
              <span dir="ltr">{customer.email}</span>
            </Detail>

            <Detail icon={PhoneIcon} label="الهاتف">
              {customer.phone ? (
                <span dir="ltr">{customer.phone}</span>
              ) : (
                <span className="text-muted-foreground">غير مُسجّل</span>
              )}
            </Detail>

            <Detail icon={CalendarDaysIcon} label="تاريخ الانضمام">
              {formatDate(customer.createdAt)}
            </Detail>

            <Detail icon={ReceiptTextIcon} label="آخر طلب">
              {customer.lastOrderAt ? (
                formatDate(customer.lastOrderAt)
              ) : (
                <span className="text-muted-foreground">لا يوجد</span>
              )}
            </Detail>

            <div className="flex items-center gap-2 sm:col-span-2">
              <span className="text-xs text-muted-foreground">مُعرّف Clerk:</span>
              <code
                className="font-mono text-xs text-muted-foreground"
                dir="ltr"
              >
                {customer.clerkId}
              </code>
            </div>
          </dl>
        </div>
      </SectionCard>

      <SectionCard
        title="الدور والصلاحيات"
        description="المشرف يملك وصولًا كاملًا للوحة التحكم. المصدر الأساسي للدور هو Clerk."
      >
        <CustomerRoleControl
          customerId={customer.id}
          customerName={displayName}
          currentRole={customer.role}
          isSelf={isSelf}
        />
      </SectionCard>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatTile
          label="عدد الطلبات"
          value={formatNumber(customer.orderCount)}
          icon={ReceiptTextIcon}
        />
        <StatTile
          label="إجمالي الإنفاق"
          value={customer.orderCount === 0 ? "—" : formatPrice(customer.totalSpent)}
          hint="عدا الطلبات الملغاة"
          icon={WalletIcon}
          tone={customer.totalSpent > 0 ? "success" : "neutral"}
        />
      </div>

      <SectionCard
        title="سِجل الطلبات"
        description={
          customer.orderCount === 0
            ? "لا توجد طلبات."
            : `${formatNumber(customer.orderCount)} طلبًا، الأحدث أولًا.`
        }
        flush
      >
        <CustomerOrdersTable orders={customer.orders} />
      </SectionCard>
    </PageContainer>
  )
}

/** One labelled line in the account card. */
function Detail({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5" aria-hidden={true} />
        {label}
      </dt>
      <dd className="text-sm">{children}</dd>
    </div>
  )
}
