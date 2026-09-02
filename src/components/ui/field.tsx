"use client"

import { Field as FieldPrimitive } from "@base-ui/react/field"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

function FieldSet({ className, ...props }: React.ComponentProps<"fieldset">) {
  return (
    <fieldset
      data-slot="field-set"
      className={cn(
        "flex flex-col gap-4 has-[>[data-slot=checkbox-group]]:gap-3 has-[>[data-slot=radio-group]]:gap-3",
        className
      )}
      {...props}
    />
  )
}

function FieldLegend({
  className,
  variant = "legend",
  ...props
}: React.ComponentProps<"legend"> & { variant?: "legend" | "label" }) {
  return (
    <legend
      data-slot="field-legend"
      data-variant={variant}
      className={cn(
        "mb-1.5 font-medium data-[variant=label]:text-sm data-[variant=legend]:text-base",
        className
      )}
      {...props}
    />
  )
}

function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-group"
      className={cn(
        "group/field-group @container/field-group flex w-full flex-col gap-5 data-[slot=checkbox-group]:gap-3 *:data-[slot=field-group]:gap-4",
        className
      )}
      {...props}
    />
  )
}

const fieldVariants = cva(
  // Both spellings on purpose: `data-[invalid=true]` is what shadcn's own
  // markup writes, and a bare `data-invalid` is what Base UI's Field.Root
  // sets when the form reports an error for this field's name.
  "group/field flex w-full gap-2 data-[invalid=true]:text-destructive data-invalid:text-destructive",
  {
    variants: {
      orientation: {
        vertical: "flex-col *:w-full [&>.sr-only]:w-auto",
        horizontal:
          "flex-row items-center has-[>[data-slot=field-content]]:items-start *:data-[slot=field-label]:flex-auto has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
        responsive:
          "flex-col *:w-full @md/field-group:flex-row @md/field-group:items-center @md/field-group:*:w-auto @md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:*:data-[slot=field-label]:flex-auto [&>.sr-only]:w-auto @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
      },
    },
    defaultVariants: {
      orientation: "vertical",
    },
  }
)

/**
 * One labelled field.
 *
 * This is Base UI's `Field.Root` rather than a plain `<div>`, which buys the
 * thing a `<div>` cannot: a **name**. Give it one and the field joins the
 * surrounding `<Form>`'s error map — it goes `data-invalid` when the form
 * reports an error under that name, its `<FieldError />` renders the message
 * without being told what it is, and the error clears when the control is
 * edited. See `components/ui/form.tsx`.
 *
 * Without a `name` it behaves exactly as the plain wrapper did, which is why
 * every existing call site kept working when this changed.
 */
function Field({
  className,
  orientation = "vertical",
  ...props
}: FieldPrimitive.Root.Props & VariantProps<typeof fieldVariants>) {
  return (
    <FieldPrimitive.Root
      role="group"
      data-slot="field"
      data-orientation={orientation}
      className={cn(fieldVariants({ orientation }), className)}
      {...props}
    />
  )
}

function FieldContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-content"
      className={cn(
        "group/field-content flex flex-1 flex-col gap-0.5 leading-snug",
        className
      )}
      {...props}
    />
  )
}

function FieldLabel({
  className,
  ...props
}: React.ComponentProps<typeof Label>) {
  return (
    <Label
      data-slot="field-label"
      className={cn(
        "group/field-label peer/field-label flex w-fit gap-2 leading-snug group-data-[disabled=true]/field:opacity-50 has-data-checked:border-primary/30 has-data-checked:bg-primary/5 has-[>[data-slot=field]]:rounded-lg has-[>[data-slot=field]]:border has-[>[data-slot=field]]:not-has-[:disabled,[data-disabled]]:hover:bg-muted/50 has-[>[data-slot=field]]:has-[:focus-visible]:border-ring has-[>[data-slot=field]]:has-[:focus-visible]:ring-3 has-[>[data-slot=field]]:has-[:focus-visible]:ring-ring/50 *:data-[slot=field]:p-2.5 dark:has-data-checked:border-primary/20 dark:has-data-checked:bg-primary/10",
        "has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col",
        className
      )}
      {...props}
    />
  )
}

function FieldTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-label"
      className={cn(
        "flex w-fit items-center gap-2 text-sm font-medium group-data-[disabled=true]/field:opacity-50",
        className
      )}
      {...props}
    />
  )
}

function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="field-description"
      className={cn(
        "text-start text-sm leading-normal font-normal text-muted-foreground group-has-data-horizontal/field:text-balance [[data-variant=legend]+&]:-mt-1.5",
        "last:mt-0 nth-last-2:-mt-1",
        "[&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary",
        className
      )}
      {...props}
    />
  )
}

function FieldSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  children?: React.ReactNode
}) {
  return (
    <div
      data-slot="field-separator"
      data-content={!!children}
      className={cn(
        "relative -my-2 h-5 text-sm group-data-[variant=outline]/field-group:-mb-2",
        className
      )}
      {...props}
    >
      <Separator className="absolute inset-0 top-1/2" />
      {children && (
        <span
          className="relative mx-auto block w-fit bg-background px-2 text-muted-foreground"
          data-slot="field-separator-content"
        >
          {children}
        </span>
      )}
    </div>
  )
}

/**
 * The message under an invalid field.
 *
 * Two modes, and the difference is whether it was handed `children`:
 *
 *   - **`<FieldError />`** — reads the message out of the surrounding
 *     `<Form errors>` for this field's `name`, and renders nothing when there
 *     is no error. This is the one to reach for: the call site stops
 *     repeating `{errors.x ? … : null}` around every field, and it cannot
 *     drift from what the form thinks is invalid.
 *   - **`<FieldError>message</FieldError>`** — always renders, for a message
 *     that is not part of the form's error map at all. `match` is forced on
 *     for this case, because Base UI otherwise hides children on a field it
 *     considers valid.
 *
 * shadcn's `errors={[{message}]}` array prop is gone. Nothing in this project
 * used it — it exists upstream for `react-hook-form`, which is not a
 * dependency here (see docs/folder-structure.md).
 */
function FieldError({
  className,
  children,
  ...props
}: FieldPrimitive.Error.Props) {
  const errorClass = cn("text-sm font-normal text-destructive", className)

  // Two returns rather than a computed `match`, so that `children` is never
  // passed as `undefined` — that would win the prop merge and blank out the
  // message Base UI was about to render.
  if (children != null) {
    return (
      <FieldPrimitive.Error
        match
        data-slot="field-error"
        className={errorClass}
        {...props}
      >
        {children}
      </FieldPrimitive.Error>
    )
  }

  return (
    <FieldPrimitive.Error
      data-slot="field-error"
      className={errorClass}
      {...props}
    />
  )
}

export {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldContent,
  FieldTitle,
}
