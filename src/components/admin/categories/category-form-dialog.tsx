"use client"

import { useActionState, useEffect } from "react"
import { toast } from "sonner"

import { saveCategoryAction } from "@/actions/category/save-category"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  DESCRIPTION_MAX,
  IDLE_CATEGORY_FORM_STATE,
  NAME_MAX,
  SLUG_MAX,
} from "@/schemas/category.schema"
import type { CategoryRow } from "@/services/category.service"

import { CategoryImageField } from "./category-image-field"

type CategoryFormDialogProps = {
  /** The row being edited, or `null` to create a new one. */
  category: CategoryRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * The create/edit form, in a dialog.
 *
 * One component for both jobs, because the fields are identical and the only
 * difference reaches the server as a hidden `id`. Splitting it would mean two
 * copies of six inputs that have to be kept in step.
 *
 * **Uncontrolled inputs on purpose.** Every field is a plain `defaultValue`
 * with a `name`, and the browser's own `FormData` is what the action reads.
 * There is no `useState` per field and no controlled-input churn — which is
 * also why the caller remounts this with a changing `key` (see
 * `categories-table.tsx`): remounting is how the defaults are reapplied when
 * a different row is opened.
 *
 * Errors come back from the server, not from a parallel client-side copy of
 * the rules. The Zod schema in `schemas/category.schema.ts` is the only
 * definition of what is valid, so the form cannot accept something the action
 * would reject, or vice versa. The cost is a round trip to see a message; the
 * benefit is that the two can never disagree.
 *
 * See docs/categories-feature.md.
 */
export function CategoryFormDialog({
  category,
  open,
  onOpenChange,
}: CategoryFormDialogProps) {
  const isEdit = category !== null

  const [state, formAction, pending] = useActionState(
    saveCategoryAction,
    IDLE_CATEGORY_FORM_STATE
  )

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message)
      onOpenChange(false)
      return
    }

    // Field-level problems are already shown under the inputs that caused
    // them; a toast on top would say the same thing twice. Only failures with
    // nowhere else to appear — a permission refusal, a dead database, a
    // duplicate the form has no input for — get one.
    if (state.status === "error" && Object.keys(state.fieldErrors).length === 0) {
      toast.error(state.message)
    }
    // `onOpenChange` is intentionally omitted: it is a fresh closure on every
    // parent render, and including it would re-fire the toast on each one.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  const fieldErrors = state.fieldErrors

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* The popup is capped at 80% of the viewport and laid out as three
          rows — header, scrolling body, footer — so «حفظ التعديلات» stays on
          screen no matter how tall the form gets. See `DialogBody`. */}
      <DialogContent className="grid-rows-[auto_minmax(0,1fr)_auto] max-h-[80svh] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "تعديل الفئة" : "فئة جديدة"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "التعديلات تظهر في المتجر فور الحفظ."
              : "الفئة هي القسم الذي يتصفّحه الزائر — شبابي، نسائي، رجالي."}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="contents">
          {/* Empty for a new category — that emptiness is what tells the
              action to create rather than update. */}
          <input type="hidden" name="id" value={category?.id ?? ""} />

          <DialogBody>
            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel htmlFor="category-name">الاسم</FieldLabel>
                <Input
                  id="category-name"
                  name="name"
                  defaultValue={category?.name ?? ""}
                  maxLength={NAME_MAX}
                  placeholder="شبابي"
                  autoComplete="off"
                  aria-invalid={Boolean(fieldErrors.name)}
                  required
                />
                <FieldDescription>الاسم كما يظهر للزائر.</FieldDescription>
                {fieldErrors.name ? (
                  <FieldError>{fieldErrors.name}</FieldError>
                ) : null}
              </Field>

              <Field>
                <FieldLabel htmlFor="category-slug">المعرّف (الرابط)</FieldLabel>
                <Input
                  id="category-slug"
                  name="slug"
                  defaultValue={category?.slug ?? ""}
                  maxLength={SLUG_MAX}
                  placeholder="youth"
                  autoComplete="off"
                  spellCheck={false}
                  dir="ltr"
                  className="font-mono text-start"
                  aria-invalid={Boolean(fieldErrors.slug)}
                  required
                />
                <FieldDescription>
                  يظهر في رابط الصفحة:{" "}
                  <code className="font-mono text-xs" dir="ltr">
                    /shop/{category?.slug || "youth"}
                  </code>
                  {isEdit ? " — تغييره يكسر الروابط المنشورة." : null}
                </FieldDescription>
                {fieldErrors.slug ? (
                  <FieldError>{fieldErrors.slug}</FieldError>
                ) : null}
              </Field>

              <Field>
                <FieldLabel htmlFor="category-description">الوصف</FieldLabel>
                <Textarea
                  id="category-description"
                  name="description"
                  defaultValue={category?.description ?? ""}
                  maxLength={DESCRIPTION_MAX}
                  rows={2}
                  placeholder="برغموت وحمضيات، نفَس منعش"
                  aria-invalid={Boolean(fieldErrors.description)}
                />
                <FieldDescription>
                  سطر واحد يصف عائلة الروائح. اختياري.
                </FieldDescription>
                {fieldErrors.description ? (
                  <FieldError>{fieldErrors.description}</FieldError>
                ) : null}
              </Field>

              <CategoryImageField
                currentImageUrl={category?.imageUrl ?? null}
                error={fieldErrors.image}
                disabled={pending}
              />

              <Field>
                <FieldLabel htmlFor="category-position">الترتيب</FieldLabel>
                <Input
                  id="category-position"
                  name="position"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={999}
                  step={1}
                  defaultValue={category?.position ?? ""}
                  placeholder="تلقائي"
                  dir="ltr"
                  className="text-start"
                  aria-invalid={Boolean(fieldErrors.position)}
                />
                <FieldDescription>
                  ترتيب الظهور في قائمة المتجر — الأصغر أولًا. اتركه فارغًا
                  ليُضاف في النهاية.
                </FieldDescription>
                {fieldErrors.position ? (
                  <FieldError>{fieldErrors.position}</FieldError>
                ) : null}
              </Field>

              <Field orientation="horizontal">
                <FieldContent>
                  <FieldTitle>
                    <FieldLabel htmlFor="category-active">
                      معروضة في المتجر
                    </FieldLabel>
                  </FieldTitle>
                  <FieldDescription>
                    أوقفها لإخفاء الفئة عن الزوار دون حذفها.
                  </FieldDescription>
                </FieldContent>
                {/* Base UI's Switch renders its own hidden checkbox input, so
                    `name` is all it needs to reach `FormData` — and it submits
                    "on" when checked and nothing when not, which is exactly the
                    presence check the schema does. */}
                <Switch
                  id="category-active"
                  name="isActive"
                  defaultChecked={category?.isActive ?? true}
                />
              </Field>
            </FieldGroup>
          </DialogBody>

          <DialogFooter>
            <DialogClose
              render={<Button variant="outline" type="button" />}
              disabled={pending}
            >
              إلغاء
            </DialogClose>
            <Button type="submit" variant="gold" disabled={pending}>
              {pending ? <Spinner /> : null}
              {isEdit ? "حفظ التعديلات" : "إضافة الفئة"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
