"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { startTransition, useActionState, useEffect, useState } from "react"
import { Fieldset } from "@base-ui/react/fieldset"
import type { ProductType } from "@prisma/client"
import { toast } from "sonner"

import { saveProductAction } from "@/actions/product/save-product"
import { SectionCard } from "@/components/admin/shared"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field"
import { Form } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  PRODUCT_TYPES,
  PRODUCT_TYPE_HINT,
  PRODUCT_TYPE_LABEL,
} from "@/constants/catalog"
import { ROUTES } from "@/constants/routes"
import {
  DESCRIPTION_MAX,
  IDLE_PRODUCT_FORM_STATE,
  NAME_MAX,
  parseProductForm,
  SLUG_MAX,
  type ProductFormErrors,
} from "@/schemas/product.schema"
import type { CategoryOption } from "@/services/category.service"
import type { IngredientOption } from "@/services/ingredient.service"
import type { ProductDetail } from "@/services/product.service"

import { ProductGalleryField } from "./product-gallery-field"
import {
  ProductIngredientsField,
  type IngredientRow,
} from "./product-ingredients-field"
import { ProductVariantsField, type VariantRow } from "./product-variants-field"

type ProductFormProps = {
  /** The perfume being edited, or `null` to create a new one. */
  product: ProductDetail | null
  categories: CategoryOption[]
  ingredients: IngredientOption[]
}

/**
 * The create/edit form for one perfume.
 *
 * **A page, not a dialog** — the opposite call from
 * `docs/categories-feature.md`, and for the reason that document gives: a
 * category is six fields and fits in a dialog, while a perfume carries a
 * gallery, a list of raw materials and an open-ended collection of variants.
 * It also means an admin can link someone to a half-finished product, and
 * that the back button does the obvious thing.
 *
 * ## A rejected save never costs the admin their typing
 *
 * Two decisions make that true, and both are easy to undo by accident:
 *
 * **The action is dispatched from `onSubmit`, not from `<form action>`.**
 * React resets an uncontrolled form after an action passed to the `action`
 * prop completes — including when it completes with errors. On a form this
 * size that is twenty inputs, a gallery and every variant row wiped because
 * one price had a typo in it. Dispatching inside `startTransition` from a
 * submit handler keeps `useActionState`'s pending flag and drops the reset.
 * The cost is that the form no longer submits without JavaScript, which this
 * one could not do anyway: the variant editor *is* JavaScript.
 *
 * **Nothing is held in React state that does not have to be.** Every value is
 * an uncontrolled `defaultValue`, so a re-render after a failed save has no
 * opportunity to overwrite what is in the box. Only two things are state,
 * because only they change structurally: `productType`, which decides which
 * selects the variant editor renders, and the row lists.
 *
 * ## Validation is the Zod schema, in both directions
 *
 * There is not a single `required` attribute in this form. `parseProductForm`
 * runs here on submit — the same function, from the same module, that the
 * Server Action runs on what arrives — and its output is a map of field name
 * to message that goes straight into `<Form errors>`. The form marks those
 * fields invalid, each `<FieldError />` finds its own message, focus moves to
 * the first one, and every other value stays exactly where it was. Editing a
 * flagged field clears its message.
 *
 * That is why `docs/folder-structure.md`'s note about `react-hook-form` being
 * "the one form that should pull it in" still has not been acted on: the
 * schema was already isomorphic, so running it in the browser cost one
 * function call.
 *
 * ## It navigates away on success
 *
 * On create *and* on edit. Not cosmetic: after a save, rows the admin added
 * have real database ids that this component has never seen, and a second
 * submit from the same mounted form would send them up as new rows again.
 * Leaving the page guarantees the next edit starts from the server's version.
 *
 * See docs/products-feature.md.
 */
export function ProductForm({
  product,
  categories,
  ingredients,
}: ProductFormProps) {
  const isEdit = product !== null
  const router = useRouter()

  const [state, formAction, pending] = useActionState(
    saveProductAction,
    IDLE_PRODUCT_FORM_STATE
  )

  /**
   * Whatever is currently wrong, keyed by field name.
   *
   * Written from two places — the submit handler when the schema refuses
   * before the network is touched, and the effect below when the server
   * refuses after — and cleared from a third, `dismissError`. It has to be
   * state this component owns rather than a value derived from `state.errors`,
   * precisely because of that third case: some errors have to be retractable
   * without a round trip. See `dismissError`.
   */
  const [errors, setErrors] = useState<ProductFormErrors>({})

  const [productType, setProductType] = useState<ProductType>(
    product?.productType ?? "ALCOHOL_BASED"
  )

  const [variantRows, setVariantRows] = useState<VariantRow[]>(() =>
    initialVariantRows(product)
  )
  const [ingredientRows, setIngredientRows] = useState<IngredientRow[]>(() =>
    initialIngredientRows(product)
  )
  const [nextKey, setNextKey] = useState(1)

  useEffect(() => {
    if (state.status === "idle") return

    if (state.status === "success") {
      toast.success(state.message)
      router.push(ROUTES.adminProducts)
      return
    }

    // Copying the action's answer into state, rather than reading it straight
    // out of `state.errors`, is what makes `dismissError` possible below.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setErrors(state.errors)

    // Field-level problems already render under the inputs that caused them.
    // Only failures with nowhere else to appear get a toast: a permission
    // refusal, a dead database, a variant blocked by an order.
    if (Object.keys(state.errors).length === 0) toast.error(state.message)

    // `router` is stable, but listing it would still re-run this on every
    // render of the App Router's context — and re-fire the toast with it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    // Always. Without an `action` prop the browser would otherwise navigate,
    // and *with* one React would reset every field the moment the action
    // returned. See the note on this component.
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const parsed = parseProductForm(formData)

    if (!parsed.success) {
      setErrors(parsed.errors)
      return
    }

    setErrors({})
    startTransition(() => formAction(formData))
  }

  /**
   * Retract one error without a round trip.
   *
   * `<Form>` refuses to submit while any field it knows about is invalid, and
   * a field normally stops being invalid when its own control fires a change
   * event — typing in the input, picking from the select. The gallery is the
   * exception: most of its edits are React state (a tile removed, a pick
   * undone) and never touch the file input, so "الحد الأقصى 8 صور" would
   * survive the admin removing one and the form would go on refusing a
   * submission that is now perfectly valid.
   */
  function dismissError(field: string) {
    setErrors((current) => {
      if (!(field in current)) return current

      const next = { ...current }
      delete next[field]
      return next
    })
  }

  function addVariantRow() {
    setVariantRows((current) => [
      ...current,
      { key: `new-${nextKey}`, variant: null },
    ])
    setNextKey((value) => value + 1)
  }

  function addIngredientRow() {
    setIngredientRows((current) => [
      ...current,
      { key: `ing-${nextKey}`, ingredient: null },
    ])
    setNextKey((value) => value + 1)
  }

  return (
    <Form errors={errors} onSubmit={handleSubmit}>
      {/* Empty for a new perfume — that emptiness is what tells the action to
          create rather than update. */}
      <input type="hidden" name="id" value={product?.id ?? ""} />

      {/* `display: contents` so the fieldset adds no box of its own — the
          section cards stay direct flex children of `<Form>`, exactly as
          they were before this wrapper existed. Base UI's `Fieldset.Root`,
          not a plain `<fieldset>`: it still renders a real `<fieldset
          disabled>` (so every native `<input>`/`<textarea>` underneath is
          inert exactly as before), but it *also* provides the
          `FieldsetRootContext` that `Select.Root` and `Switch.Root` read
          `disabled` from (via the ambient `Field.Root` each sits inside) —
          `useFieldRootContext()` → `useFieldsetRootContext()`. A native
          `<fieldset>` cascades disabled state to the raw DOM node, which is
          invisible to that context lookup, so Base UI's own controls never
          learned a save was in flight: they kept running validation and
          registering as "enabled" while every plain input around them was
          correctly locked. Swapping the element is the whole fix; nothing
          else about this wrapper changes. Before this, `name`/`slug`
          /`description`/`categoryId`/`productType`/`isActive` stayed
          editable during the request, which is what made a save in progress
          look indistinguishable from an idle form. */}
      <Fieldset.Root disabled={pending} className="contents">
        <SectionCard
          title="بيانات العطر"
          description="الاسم والوصف كما يقرأهما الزائر على صفحة المنتج."
        >
          <FieldGroup className="gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field name="name">
                <FieldLabel htmlFor="product-name">الاسم</FieldLabel>
                <Input
                  id="product-name"
                  name="name"
                  defaultValue={product?.name ?? ""}
                  maxLength={NAME_MAX}
                  placeholder="مسك الورد"
                  autoComplete="off"
                />
                <FieldError />
              </Field>

              <Field name="slug">
                <FieldLabel htmlFor="product-slug">المعرّف (الرابط)</FieldLabel>
                <Input
                  id="product-slug"
                  name="slug"
                  defaultValue={product?.slug ?? ""}
                  maxLength={SLUG_MAX}
                  placeholder="misk-rose"
                  autoComplete="off"
                  spellCheck={false}
                  dir="ltr"
                  className="font-mono text-start"
                />
                <FieldDescription>
                  يظهر في رابط الصفحة:{" "}
                  <code className="font-mono text-xs" dir="ltr">
                    /shop/…/{product?.slug || "misk-rose"}
                  </code>
                  {isEdit ? " — تغييره يكسر الروابط المنشورة." : null}
                </FieldDescription>
                <FieldError />
              </Field>
            </div>

            <Field name="description">
              <FieldLabel htmlFor="product-description">الوصف</FieldLabel>
              <Textarea
                id="product-description"
                name="description"
                defaultValue={product?.description ?? ""}
                maxLength={DESCRIPTION_MAX}
                rows={5}
                placeholder="ورد طائفي وعنبر، بقاعدة مسكية دافئة تدوم طوال اليوم."
              />
              <FieldDescription>
                النص الذي يقرأه الزائر على صفحة المنتج — عائلة الروائح، الثبات،
                ومناسبة الاستخدام.
              </FieldDescription>
              <FieldError />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field name="categoryId">
                <FieldLabel htmlFor="product-category">الفئة</FieldLabel>
                <Select
                  name="categoryId"
                  items={categoryItems(categories)}
                  defaultValue={product?.categoryId ?? null}
                >
                  <SelectTrigger id="product-category" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                        {category.isActive ? null : (
                          <span className="text-xs text-muted-foreground">
                            (مخفية)
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError />
              </Field>

              <Field name="productType">
                <FieldLabel htmlFor="product-type">النوع</FieldLabel>
                <Select
                  name="productType"
                  items={typeItems}
                  value={productType}
                  onValueChange={(value) => setProductType(value as ProductType)}
                >
                  <SelectTrigger id="product-type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {PRODUCT_TYPE_LABEL[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldDescription>
                  {PRODUCT_TYPE_HINT[productType]}
                </FieldDescription>
                <FieldError />
              </Field>
            </div>

            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>
                  <FieldLabel htmlFor="product-active">معروض في المتجر</FieldLabel>
                </FieldTitle>
                <FieldDescription>
                  أوقفه لإخفاء العطر عن الزوار دون حذفه.
                </FieldDescription>
              </FieldContent>
              <Switch
                id="product-active"
                name="isActive"
                defaultChecked={product?.isActive ?? true}
              />
            </Field>
          </FieldGroup>
        </SectionCard>

        <SectionCard
          title="الصور"
          description="أول صورة هي الغلاف — هي التي تظهر في قوائم المتجر والسلة."
        >
          <ProductGalleryField
            images={product?.images ?? []}
            onChanged={() => dismissError("images")}
            disabled={pending}
          />
        </SectionCard>

        <SectionCard
          title="الأحجام والأسعار"
          description={
            productType === "ALCOHOL_BASED"
              ? "كل حجم هو خيار شراء مستقل بسعره ومخزونه."
              : "كل وزن هو خيار شراء مستقل بسعره ومخزونه."
          }
        >
          <ProductVariantsField
            productType={productType}
            rows={variantRows}
            onAdd={addVariantRow}
            onRemove={(key) =>
              setVariantRows((current) =>
                current.filter((row) => row.key !== key)
              )
            }
            disabled={pending}
          />
        </SectionCard>

        <SectionCard
          title="المكوّنات"
          description="ما في العطر فعلًا — الزيوت ودرجاتها والكحول. اختياري، ويظهر في قسم الجودة على صفحة المنتج."
        >
          <ProductIngredientsField
            rows={ingredientRows}
            options={ingredients}
            onAdd={addIngredientRow}
            onRemove={(key) =>
              setIngredientRows((current) =>
                current.filter((row) => row.key !== key)
              )
            }
            disabled={pending}
          />
        </SectionCard>
      </Fieldset.Root>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {/* An anchor, so neither `type` nor `disabled` would do anything on
            it — and leaving during a save is what "cancel" means anyway.
            Deliberately outside the fieldset above for the same reason. */}
        <Button variant="outline" render={<Link href={ROUTES.adminProducts} />}>
          إلغاء
        </Button>
        <Button type="submit" variant="gold" disabled={pending}>
          {pending ? <Spinner /> : null}
          {pending ? "جارٍ الحفظ…" : isEdit ? "حفظ التعديلات" : "إضافة العطر"}
        </Button>
      </div>
    </Form>
  )
}

/**
 * The rows the editors open with.
 *
 * Keys are the rows' own database identities, never anything random. A
 * `crypto.randomUUID()` here would be generated once on the server and again
 * in the browser, and the two would disagree — a hydration mismatch on the
 * hidden `variantKey` input, which is exactly the field the error map uses to
 * line a message up with a row. Rows added *after* mount are safe to number,
 * because only the browser ever runs that code.
 */
function initialVariantRows(product: ProductDetail | null): VariantRow[] {
  if (!product || product.variants.length === 0) {
    return [{ key: "new-0", variant: null }]
  }

  return product.variants.map((variant) => ({ key: variant.id, variant }))
}

/** No starting row: a perfume is sellable before its oils are written up. */
function initialIngredientRows(product: ProductDetail | null): IngredientRow[] {
  if (!product) return []

  return product.ingredients.map((ingredient) => ({
    key: ingredient.ingredientId,
    ingredient,
  }))
}

/**
 * `items` is what lets `<SelectValue>` render a *label* instead of the raw
 * cuid it holds. The leading `null` entry is the placeholder — Base UI has no
 * `placeholder` prop; an unselected select simply renders the label of the
 * item whose value is `null`.
 */
function categoryItems(categories: CategoryOption[]) {
  return [
    { value: null, label: "اختر الفئة" },
    ...categories.map((category) => ({
      value: category.id,
      label: category.name,
    })),
  ]
}

const typeItems = PRODUCT_TYPES.map((type) => ({
  value: type,
  label: PRODUCT_TYPE_LABEL[type],
}))
