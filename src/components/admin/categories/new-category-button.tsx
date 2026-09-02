"use client"

import { useState } from "react"
import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

import { CategoryFormDialog } from "./category-form-dialog"

/**
 * The page header's "new category" button, with the form it opens.
 *
 * It is its own component because `PageHeader` takes its `actions` as a prop
 * from the page, and the page is a Server Component — so the button that
 * needs open state has to be the client island, not the header around it.
 *
 * It owns a second `CategoryFormDialog` instance rather than reaching into
 * the table's: sharing one would mean lifting the state above both into
 * another client wrapper, which would drag the whole page across the server
 * boundary to save one unmounted dialog.
 */
export function NewCategoryButton() {
  const [open, setOpen] = useState(false)
  const [formKey, setFormKey] = useState(0)

  return (
    <>
      <Button
        variant="gold"
        onClick={() => {
          // Same reason as in the table: a fresh key drops the previous
          // submission's errors so the form opens clean every time.
          setFormKey((key) => key + 1)
          setOpen(true)
        }}
      >
        <PlusIcon aria-hidden="true" />
        فئة جديدة
      </Button>

      <CategoryFormDialog
        key={formKey}
        category={null}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  )
}
