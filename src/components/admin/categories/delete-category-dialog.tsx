"use client"

import { useTransition } from "react"
import { Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { deleteCategoryAction } from "@/actions/category/delete-category"
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
import type { CategoryRow } from "@/services/category.service"

type DeleteCategoryDialogProps = {
  category: CategoryRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Confirm-and-delete for one category.
 *
 * When perfumes are still filed under the segment the dialog says so and the
 * confirm button is disabled, rather than letting the admin press it and
 * catching the refusal on the way back. The server still refuses either way —
 * `category.service.ts` checks, and `onDelete: Restrict` is behind that — so
 * this is only about not offering a button that cannot work.
 *
 * Deliberately *not* a `useActionState` form: the outcome has to be readable
 * while the dialog is still open, since a blocked delete leaves it open with
 * an explanation. So the action is awaited in a transition instead.
 */
export function DeleteCategoryDialog({
  category,
  open,
  onOpenChange,
}: DeleteCategoryDialogProps) {
  const [pending, startTransition] = useTransition()

  if (!category) return null

  const blocked = category.productCount > 0

  function confirmDelete() {
    if (!category) return
    const { id, name } = category

    startTransition(async () => {
      const result = await deleteCategoryAction(id)

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
            <Trash2Icon
              className="text-destructive"
              aria-hidden="true"
            />
          </AlertDialogMedia>
          <AlertDialogTitle>حذف «{category.name}»؟</AlertDialogTitle>
          <AlertDialogDescription>
            {blocked
              ? `ما زال ${category.productCount} من العطور مرتبطًا بهذه الفئة، ولا يمكن حذفها قبل نقلها إلى فئة أخرى. يمكنك بدلًا من ذلك إيقاف عرضها في المتجر.`
              : "لا يمكن التراجع عن الحذف. إن كنت تريد إخفاءها مؤقتًا فقط، أوقف عرضها في المتجر بدل حذفها."}
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
