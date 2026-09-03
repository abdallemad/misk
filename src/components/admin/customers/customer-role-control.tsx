"use client"

import { useState, useTransition } from "react"
import { ShieldCheckIcon, ShieldMinusIcon } from "lucide-react"
import { toast } from "sonner"

import { setCustomerRoleAction } from "@/actions/customer/set-role"
import { StatusBadge } from "@/components/admin/shared"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import type { Role } from "@/services/customer.service"

type CustomerRoleControlProps = {
  customerId: string
  customerName: string
  currentRole: Role
  /** True when the row is the signed-in admin's own account — the one case
   *  the action refuses, surfaced here as a disabled control with a reason. */
  isSelf: boolean
}

/**
 * Promote a customer to admin, or demote them — the console's one write on a
 * `User` row.
 *
 * Deliberately behind an `AlertDialog`, not a bare toggle: granting admin is
 * handing someone the whole console, and it should take a confirming click
 * that names what is about to happen. The action is awaited inside a
 * transition (not `useActionState`) because the outcome — including a refusal
 * like "no matching Clerk account" — has to be readable without the dialog
 * navigating away.
 *
 * On success the page is revalidated by the action, so the badge here and the
 * role column in the list both refresh on the next paint.
 */
export function CustomerRoleControl({
  customerId,
  customerName,
  currentRole,
  isSelf,
}: CustomerRoleControlProps) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const isAdmin = currentRole === "ADMIN"
  const nextRole: Role = isAdmin ? "USER" : "ADMIN"

  function confirm() {
    startTransition(async () => {
      const result = await setCustomerRoleAction(customerId, nextRole)

      if (result.ok) {
        toast.success(
          nextRole === "ADMIN"
            ? `«${customerName}» أصبح مشرفًا.`
            : `«${customerName}» عاد عميلًا عاديًا.`
        )
        setOpen(false)
        return
      }

      toast.error(result.message)
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">الدور الحالي:</span>
        {isAdmin ? (
          <StatusBadge tone="gold">مشرف</StatusBadge>
        ) : (
          <StatusBadge tone="neutral">عميل</StatusBadge>
        )}
      </div>

      {isSelf ? (
        <p className="text-xs text-muted-foreground">
          لا يمكنك تغيير دور حسابك — استخدم حسابًا آخر أو الأمر{" "}
          <code dir="ltr">grant-admin</code>.
        </p>
      ) : (
        <Button
          variant={isAdmin ? "outline" : "gold"}
          size="sm"
          onClick={() => setOpen(true)}
        >
          {isAdmin ? (
            <ShieldMinusIcon aria-hidden="true" />
          ) : (
            <ShieldCheckIcon aria-hidden="true" />
          )}
          {isAdmin ? "خفض إلى عميل" : "ترقية إلى مشرف"}
        </Button>
      )}

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              {isAdmin ? (
                <ShieldMinusIcon
                  className="text-muted-foreground"
                  aria-hidden="true"
                />
              ) : (
                <ShieldCheckIcon className="text-gold" aria-hidden="true" />
              )}
            </AlertDialogMedia>
            <AlertDialogTitle>
              {isAdmin
                ? `خفض «${customerName}» إلى عميل؟`
                : `ترقية «${customerName}» إلى مشرف؟`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isAdmin
                ? "سيفقد صلاحية الوصول إلى لوحة التحكم عند طلبه التالي."
                : "سيحصل على صلاحية كاملة للوحة التحكم — إدارة العطور والفئات والطلبات والعملاء — عند طلبه التالي."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              variant={isAdmin ? "destructive" : "default"}
              onClick={confirm}
              disabled={pending}
            >
              {pending ? <Spinner /> : null}
              {isAdmin ? "خفض إلى عميل" : "ترقية إلى مشرف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
