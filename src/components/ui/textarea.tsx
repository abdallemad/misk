"use client"

import * as React from "react"
import { Field as FieldPrimitive } from "@base-ui/react/field"

import { cn } from "@/lib/utils"

/**
 * A `<textarea>` that registers itself with the surrounding `Field`.
 *
 * It is `Field.Control` with the element swapped, rather than a bare
 * `<textarea>`, so that it behaves like every other control in a `<Form>`:
 * it picks up `data-invalid` when the form reports an error for its field,
 * it is a candidate for "focus the first invalid control", and editing it
 * clears that error. `Input` is the same primitive; this is the same
 * component with a different tag.
 */
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <FieldPrimitive.Control
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-invalid:border-destructive data-invalid:ring-3 data-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      render={<textarea />}
      // `Field.Control`'s props are typed for an `<input>`; `render` swaps the
      // element for a `<textarea>` at runtime and everything here — `rows`
      // included — is forwarded to it verbatim. The cast is the seam between
      // those two facts, and the `render` above is what makes it true.
      {...(props as React.ComponentProps<typeof FieldPrimitive.Control>)}
    />
  )
}

export { Textarea }
