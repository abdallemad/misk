import Link from "next/link"
import { EyeIcon, UsersIcon } from "lucide-react"

import { StatusBadge } from "@/components/admin/shared"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { adminCustomerRoute } from "@/constants/routes"
import { formatDate, formatNumber, formatPrice } from "@/utils/format"
import type { CustomerRow } from "@/services/customer.service"

type CustomersTableProps = {
  customers: CustomerRow[]
  /** The active search term, so an empty result can name what was searched
   *  for rather than claiming the shop has no customers. */
  search?: string
  /** Any filter (search or role) is in effect — an empty result then reads as
   *  "nothing matched", not "no customers yet". */
  filtered?: boolean
}

/**
 * The customers table.
 *
 * A Server Component — there is nothing interactive here. Customers are not
 * created, edited or deleted from the console (see `customer.service.ts` for
 * why), so there is no dialog and no client state; the name links through to
 * the detail page and that is the whole of the interaction.
 *
 * The data is read on the server and handed down as a prop, the same shape
 * the categories and products tables take.
 *
 * See docs/customers-feature.md.
 */
export function CustomersTable({
  customers,
  search,
  filtered = false,
}: CustomersTableProps) {
  if (customers.length === 0) {
    const noMatch = filtered || Boolean(search)
    return (
      <Empty className="border-0">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <UsersIcon />
          </EmptyMedia>
          <EmptyTitle>
            {search
              ? `لا نتائج لـ «${search}»`
              : noMatch
                ? "لا عملاء مطابقين"
                : "لا يوجد عملاء بعد"}
          </EmptyTitle>
          <EmptyDescription>
            {noMatch
              ? "غيّر كلمة البحث أو أزِل التصفية."
              : "تظهر الحسابات هنا تلقائيًا بمجرد أن يسجّل زائر دخوله لأول مرة."}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>العميل</TableHead>
          <TableHead className="hidden sm:table-cell">الدور</TableHead>
          <TableHead className="text-center">الطلبات</TableHead>
          <TableHead>إجمالي الإنفاق</TableHead>
          <TableHead className="hidden lg:table-cell">آخر طلب</TableHead>
          <TableHead className="hidden md:table-cell">انضمّ</TableHead>
          <TableHead className="w-16">
            <span className="sr-only">إجراءات</span>
          </TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {customers.map((customer) => (
          <TableRow key={customer.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar size="sm">
                  {customer.imageUrl ? (
                    <AvatarImage src={customer.imageUrl} alt="" />
                  ) : null}
                  <AvatarFallback>{initial(customer)}</AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <Link
                    href={adminCustomerRoute(customer.id)}
                    className="font-medium underline-offset-4 hover:underline"
                  >
                    {customer.name || "بدون اسم"}
                  </Link>
                  <span
                    className="truncate text-xs text-muted-foreground"
                    dir="ltr"
                  >
                    {customer.email}
                  </span>
                </div>
              </div>
            </TableCell>

            <TableCell className="hidden sm:table-cell">
              {customer.role === "ADMIN" ? (
                <StatusBadge tone="gold">مشرف</StatusBadge>
              ) : (
                <span className="text-muted-foreground">عميل</span>
              )}
            </TableCell>

            <TableCell className="text-center">
              <span data-numeric className="tabular-nums">
                {formatNumber(customer.orderCount)}
              </span>
            </TableCell>

            <TableCell>
              {customer.orderCount === 0 ? (
                <span className="text-muted-foreground">—</span>
              ) : (
                <span data-numeric className="tabular-nums whitespace-nowrap">
                  {formatPrice(customer.totalSpent)}
                </span>
              )}
            </TableCell>

            <TableCell className="hidden lg:table-cell">
              <span className="text-muted-foreground">
                {customer.lastOrderAt ? formatDate(customer.lastOrderAt) : "—"}
              </span>
            </TableCell>

            <TableCell className="hidden md:table-cell">
              <span className="text-muted-foreground">
                {formatDate(customer.createdAt)}
              </span>
            </TableCell>

            <TableCell>
              <div className="flex items-center justify-end">
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        render={<Link href={adminCustomerRoute(customer.id)} />}
                      />
                    }
                  >
                    <EyeIcon aria-hidden="true" />
                    <span className="sr-only">
                      عرض ملف {customer.name || customer.email}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>عرض الملف</TooltipContent>
                </Tooltip>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

/** First letter of the name, or of the email, for the avatar fallback. */
function initial(customer: CustomerRow): string {
  const source = customer.name?.trim() || customer.email
  return source.charAt(0).toUpperCase()
}
