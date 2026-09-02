"use client"

import { useTransition } from "react"
import { Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { deleteProductAction } from "@/actions/product/delete-product"
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
import { Spinner } from "@/components/ui/spinner"
import { formatNumber } from "@/utils/format"
import type { ProductRow } from "@/services/product.service"

type DeleteProductDialogProps = {
  product: ProductRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Confirm-and-delete for one perfume.
 *
 * A perfume that has ever been ordered cannot be deleted — `OrderItem` points
 * at its variants with `onDelete: Restrict`, and an order has to keep being
 * able to say what was in it. When that is the case the dialog says so and
 * the confirm button is disabled, rather than letting the admin press it and
 * catching the refusal on the way back. The server refuses either way; this
 * is only about not offering a button that cannot work.
 *
 * Deliberately *not* a `useActionState` form, for the reason
 * `DeleteCategoryDialog` documents: a blocked delete has to leave the dialog
 * open with its explanation, so the action is awaited in a transition.
 */
export function DeleteProductDialog({
  product,
  open,
  onOpenChange,
}: DeleteProductDialogProps) {
  const [pending, startTransition] = useTransition()

  if (!product) return null

  const blocked = product.orderLineCount > 0

  function confirmDelete() {
    if (!product) return
    const { id, name } = product

    startTransition(async () => {
      const result = await deleteProductAction(id)

      if (result.ok) {
        toast.success(`تم حذف «${name}».`)
        onOpenChange(false)
        return
      }

      // Left open on purpose — the message explains what to do instead, and
      // closing would take it away before it could be read.
      toast.error(result.message)
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <Trash2Icon className="text-destructive" aria-hidden="true" />
          </AlertDialogMedia>
          <AlertDialogTitle>حذف «{product.name}»؟</AlertDialogTitle>
          <AlertDialogDescription>
            {blocked
              ? `هذا العطر مرتبط بـ ${formatNumber(product.orderLineCount)} من بنود الطلبات، ولا يمكن حذفه حتى يظل سجلّ الطلبات مقروءًا. أوقف عرضه في المتجر بدلًا من ذلك.`
              : "سيُحذف العطر بصوره وكل أحجامه وأسعاره، ولا يمكن التراجع. إن كنت تريد إخفاءه مؤقتًا فقط، أوقف عرضه في المتجر بدل حذفه."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>إلغاء</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={confirmDelete}
            disabled={pending || blocked}
          >
            {pending ? <Spinner /> : null}
            حذف نهائيًا
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
