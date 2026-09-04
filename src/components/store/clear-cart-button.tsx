"use client"

import { useTransition } from "react"
import { toast } from "sonner"

import { clearCartAction } from "@/actions/cart/clear-cart"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

/** "إفراغ السلة" — no confirm dialog, unlike a permanent admin delete: this
 *  only ever removes what a shopper put there themselves, and can be undone
 *  by adding it all back in a few clicks. */
export function ClearCartButton() {
  const [pending, startTransition] = useTransition()

  function clear() {
    startTransition(async () => {
      const result = await clearCartAction()
      if (result.ok) toast.success("تم إفراغ السلة.")
    })
  }

  return (
    <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={clear}>
      {pending ? <Spinner /> : null}
      إفراغ السلة
    </Button>
  )
}
