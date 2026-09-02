"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useActionState, useEffect, useState } from "react"
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
  SLUG_MAX,
} from "@/schemas/product.schema"
import type { CategoryOption } from "@/services/category.service"
import type { ProductDetail } from "@/services/product.service"

import { ProductGalleryField } from "./product-gallery-field"
import { ProductVariantsField, type VariantRow } from "./product-variants-field"

type ProductFormProps = {
  /** The perfume being edited, or `null` to create a new one. */
  product: ProductDetail | null
  categories: CategoryOption[]
}

/**
 * The create/edit form for one perfume.
 *
 * **A page, not a dialog** — the opposite call from
 * `docs/categories-feature.md`, and for the reason that document gives:
 * a category is six fields and fits in a dialog without scrolling, while a
 * perfume carries a gallery and an open-ended collection of variants. It also
 * means an admin can link someone to a half-finished product, and that the
 * back button does the obvious thing.
 *
 * **Two pieces of real client state, and only two.** `productType` decides
 * which selects the variant editor renders, and `rows` is the set of variants
 * that exist. Everything else is an uncontrolled `defaultValue` read out of
 * the browser's own `FormData` — the same trade the category form makes,
 * which is why `docs/folder-structure.md`'s note about `react-hook-form`
 * being "the one form that should pull it in" has not been acted on yet:
 * dependent *fields* turned out to be dependent *structure*, and structure is
 * cheap to hold in `useState`.
 *
 * **It navigates away on success**, both on create and on edit. That is not
 * cosmetic: after a save, rows the admin added have real database ids that
 * this component has never seen, and a second submit from the same mounted
 * form would send them up as new rows again. Leaving the page is what
 * guarantees the next edit starts from the server's version.
 *
 * See docs/products-feature.md.
 */
export function ProductForm({ product, categories }: ProductFormProps) {
  const isEdit = product !== null
  const router = useRouter()

  const [state, formAction, pending] = useActionState(
    saveProductAction,
    IDLE_PRODUCT_FORM_STATE
  )

  const [productType, setProductType] = useState<ProductType>(
    product?.productType ?? "ALCOHOL_BASED"
  )

  const [rows, setRows] = useState<VariantRow[]>(() => initialRows(product))
  const [nextKey, setNextKey] = useState(1)

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message)
      router.push(ROUTES.adminProducts)
      return
    }

    // Field-level problems already render under the inputs that caused them.
    // Only failures with nowhere else to appear get a toast: a permission
    // refusal, a dead database, a variant blocked by an order.
    if (
      state.status === "error" &&
      Object.keys(state.fieldErrors).length === 0 &&
      Object.keys(state.variantErrors).length === 0
    ) {
      toast.error(state.message)
    }
    // `router` is stable, but listing it would still re-run this on every
    // render of the App Router's context — and re-fire the toast with it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  const fieldErrors = state.fieldErrors

  function addRow() {
    setRows((current) => [...current, { key: `new-${nextKey}`, variant: null }])
    setNextKey((value) => value + 1)
  }

  function removeRow(key: string) {
    setRows((current) => current.filter((row) => row.key !== key))
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {/* Empty for a new perfume — that emptiness is what tells the action to
          create rather than update. */}
      <input type="hidden" name="id" value={product?.id ?? ""} />

      <SectionCard
        title="بيانات العطر"
        description="الاسم والوصف كما يقرأهما الزائر على صفحة المنتج."
      >
        <FieldGroup className="gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="product-name">الاسم</FieldLabel>
              <Input
                id="product-name"
                name="name"
                defaultValue={product?.name ?? ""}
                maxLength={NAME_MAX}
                placeholder="مسك الورد"
                autoComplete="off"
                aria-invalid={Boolean(fieldErrors.name)}
                required
              />
              {fieldErrors.name ? (
                <FieldError>{fieldErrors.name}</FieldError>
              ) : null}
            </Field>

            <Field>
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
                aria-invalid={Boolean(fieldErrors.slug)}
                required
              />
              <FieldDescription>
                يظهر في رابط الصفحة:{" "}
                <code className="font-mono text-xs" dir="ltr">
                  /shop/…/{product?.slug || "misk-rose"}
                </code>
                {isEdit ? " — تغييره يكسر الروابط المنشورة." : null}
              </FieldDescription>
              {fieldErrors.slug ? (
                <FieldError>{fieldErrors.slug}</FieldError>
              ) : null}
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="product-description">الوصف</FieldLabel>
            <Textarea
              id="product-description"
              name="description"
              defaultValue={product?.description ?? ""}
              maxLength={DESCRIPTION_MAX}
              rows={5}
              placeholder="ورد طائفي وعنبر، بقاعدة مسكية دافئة تدوم طوال اليوم."
              aria-invalid={Boolean(fieldErrors.description)}
              required
            />
            <FieldDescription>
              النص الذي يقرأه الزائر على صفحة المنتج — عائلة الروائح، الثبات،
              ومناسبة الاستخدام.
            </FieldDescription>
            {fieldErrors.description ? (
              <FieldError>{fieldErrors.description}</FieldError>
            ) : null}
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="product-category">الفئة</FieldLabel>
              <Select
                name="categoryId"
                items={categoryItems(categories)}
                defaultValue={product?.categoryId ?? null}
              >
                <SelectTrigger
                  id="product-category"
                  className="w-full"
                  aria-invalid={Boolean(fieldErrors.categoryId)}
                >
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
              {fieldErrors.categoryId ? (
                <FieldError>{fieldErrors.categoryId}</FieldError>
              ) : null}
            </Field>

            <Field>
              <FieldLabel htmlFor="product-type">النوع</FieldLabel>
              <Select
                name="productType"
                items={typeItems}
                value={productType}
                onValueChange={(value) => setProductType(value as ProductType)}
              >
                <SelectTrigger
                  id="product-type"
                  className="w-full"
                  aria-invalid={Boolean(fieldErrors.productType)}
                >
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
              {fieldErrors.productType ? (
                <FieldError>{fieldErrors.productType}</FieldError>
              ) : null}
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
          error={fieldErrors.images}
          disabled={pending}
        />
      </SectionCard>

      <SectionCard
        title="الأحجام والأسعار"
        description={
          productType === "ALCOHOL_BASED"
            ? "كل حجم × نوع عبوة هو خيار شراء مستقل بسعره ومخزونه."
            : "كل وزن هو خيار شراء مستقل بسعره ومخزونه."
        }
      >
        <ProductVariantsField
          productType={productType}
          rows={rows}
          onAdd={addRow}
          onRemove={removeRow}
          errors={state.variantErrors}
          collectionError={fieldErrors.variants}
          disabled={pending}
        />
      </SectionCard>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {/* An anchor, so neither `type` nor `disabled` would do anything on
            it — and leaving during a save is what "cancel" means anyway. */}
        <Button variant="outline" render={<Link href={ROUTES.adminProducts} />}>
          إلغاء
        </Button>
        <Button type="submit" variant="gold" disabled={pending}>
          {pending ? <Spinner /> : null}
          {isEdit ? "حفظ التعديلات" : "إضافة العطر"}
        </Button>
      </div>
    </form>
  )
}

/**
 * The rows the editor opens with.
 *
 * Keys are the variants' own database ids, never anything random. A
 * `crypto.randomUUID()` here would be generated once on the server and again
 * in the browser, and the two would disagree — a hydration mismatch on the
 * hidden `variantKey` inputs, which is exactly the field the server uses to
 * line an error message up with a row. Rows added *after* mount are safe to
 * number, because only the browser ever runs that code.
 */
function initialRows(product: ProductDetail | null): VariantRow[] {
  if (!product || product.variants.length === 0) {
    return [{ key: "new-0", variant: null }]
  }

  return product.variants.map((variant) => ({ key: variant.id, variant }))
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
