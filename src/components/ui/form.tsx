"use client"

import { Form as FormPrimitive } from "@base-ui/react/form"

import { cn } from "@/lib/utils"

/**
 * A `<form>` that knows which of its fields are invalid.
 *
 * The one prop that matters is `errors`: a flat map of **field name →
 * message**. Hand it the output of a Zod parse and three things happen with
 * no further wiring —
 *
 *   1. every `<Field name="…">` whose name is in the map goes invalid, which
 *      is what turns its input red and its label destructive-coloured;
 *   2. the matching `<FieldError />` renders the message, with no `children`
 *      and no conditional at the call site;
 *   3. focus moves to the first invalid control, in document order, so a
 *      long form does not leave the admin hunting for the red box.
 *
 * An error also **clears itself the moment its field is edited**, because
 * `Field.Control` calls back into this component's context on change. That is
 * the behaviour that makes server-returned errors feel like validation rather
 * than like a stale report.
 *
 * It also renders `noValidate`. That is deliberate and is the point of using
 * this over a bare `<form>`: the browser's own bubbles say "Please fill out
 * this field" in the user's *browser* language, in a tooltip nobody can
 * style, and they enforce rules that live in HTML attributes rather than in
 * the Zod schema. Turning them off makes the schema the only thing that
 * decides what is valid — which is the rule `docs/folder-structure.md` sets
 * for this project.
 */
function Form({ className, ...props }: FormPrimitive.Props) {
  return (
    <FormPrimitive
      data-slot="form"
      className={cn("flex w-full flex-col gap-6", className)}
      {...props}
    />
  )
}

export { Form }
