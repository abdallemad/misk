"use client"

import type { ProductType } from "@prisma/client"
import { PlusIcon, Trash2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  BOTTLE_SIZES,
  BOTTLE_SIZE_LABEL,
  BOTTLE_STYLES,
  BOTTLE_STYLE_LABEL,
  OIL_WEIGHTS,
  OIL_WEIGHT_LABEL,
} from "@/constants/catalog"
import { OIL_GRADE_MAX, type ProductVariantErrors } from "@/schemas/product.schema"
import type { ProductVariantRow } from "@/services/product.service"

/**
 * One row of the editor: a client-side identity, plus the stored variant it
 * was seeded from (`null` for a row the admin just added).
 *
 * The values themselves are **not** held in state. Every input is an
 * uncontrolled `defaultValue`, exactly as in the category form, and the
 * browser's own `FormData` is what the action reads. Only the *set of rows*
 * is state, because only that changes structurally.
 */
export type VariantRow = {
  key: string
  variant: ProductVariantRow | null
}

type ProductVariantsFieldProps = {
  /** Which axes the rows are sold by. Changing it reshapes every row. */
  productType: ProductType
  rows: VariantRow[]
  onAdd: () => void
  onRemove: (key: string) => void
  /** Per-row messages from the server, keyed by row key. */
  errors: ProductVariantErrors
  /** A problem with the collection rather than a row — "add at least one". */
  collectionError?: string
  disabled?: boolean
}

/** `null` first so the trigger has something to say before a choice is made. */
const SIZE_ITEMS = [
  { value: null, label: "اختر الحجم" },
  ...BOTTLE_SIZES.map((size) => ({
    value: size,
    label: BOTTLE_SIZE_LABEL[size],
  })),
]

const STYLE_ITEMS = [
  { value: null, label: "اختر العبوة" },
  ...BOTTLE_STYLES.map((style) => ({
    value: style,
    label: BOTTLE_STYLE_LABEL[style],
  })),
]

const WEIGHT_ITEMS = [
  { value: null, label: "اختر الوزن" },
  ...OIL_WEIGHTS.map((weight) => ({
    value: weight,
    label: OIL_WEIGHT_LABEL[weight],
  })),
]

/**
 * The inline variant-collection editor — the one part of this console that
 * branches on `productType`.
 *
 * An `ALCOHOL_BASED` perfume is sold by **size × bottle style**; a `RAW_OIL`
 * by **weight** and nothing else. Switching the type at the top of the form
 * swaps the selects here immediately, before the product has been saved,
 * which is the whole reason this is a Client Component: the shape of the
 * form depends on a value inside the form.
 *
 * Price and stock survive that switch — they are the same inputs either side
 * of the branch, so React keeps them mounted and the admin does not retype a
 * price because they picked the wrong type first.
 *
 * **Removal is blocked, not attempted, when a variant has been ordered.**
 * `OrderItem` points at it with `onDelete: Restrict`, so the server refuses
 * either way; disabling the button here is only about not offering one that
 * cannot work — the same shape `DeleteCategoryDialog` uses for a segment that
 * still has perfumes in it.
 */
export function ProductVariantsField({
  productType,
  rows,
  onAdd,
  onRemove,
  errors,
  collectionError,
  disabled,
}: ProductVariantsFieldProps) {
  const alcohol = productType === "ALCOHOL_BASED"

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-3">
        {rows.map((row, index) => {
          const { key, variant } = row
          const rowErrors = errors[key] ?? {}
          const ordered = (variant?.orderItemCount ?? 0) > 0

          return (
            <li
              key={key}
              className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3"
            >
              {/* The row's identity travels as its own field, so deleting a
                  row in the middle never renumbers the ones below it. */}
              <input type="hidden" name="variantKey" value={key} />
              <input
                type="hidden"
                name={`v.${key}.id`}
                value={variant?.id ?? ""}
              />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="text-sm font-medium">
                    الخيار {index + 1}
                  </span>
                  {variant ? (
                    <code
                      className="truncate font-mono text-xs text-muted-foreground"
                      dir="ltr"
                    >
                      {variant.sku}
                    </code>
                  ) : null}
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Switch
                      name={`v.${key}.isActive`}
                      defaultChecked={variant?.isActive ?? true}
                      disabled={disabled}
                    />
                    معروض
                  </label>

                  {ordered ? (
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            disabled
                          />
                        }
                      >
                        <Trash2Icon aria-hidden="true" />
                        <span className="sr-only">لا يمكن حذف هذا الخيار</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        مرتبط بطلبات سابقة — أوقف عرضه بدل حذفه
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => onRemove(key)}
                      disabled={disabled || rows.length === 1}
                    >
                      <Trash2Icon aria-hidden="true" />
                      <span className="sr-only">حذف الخيار {index + 1}</span>
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {alcohol ? (
                  <>
                    <Field>
                      <FieldLabel htmlFor={`${key}-size`}>الحجم</FieldLabel>
                      <Select
                        name={`v.${key}.bottleSize`}
                        items={SIZE_ITEMS}
                        defaultValue={variant?.bottleSize ?? null}
                        disabled={disabled}
                      >
                        <SelectTrigger
                          id={`${key}-size`}
                          className="w-full"
                          aria-invalid={Boolean(rowErrors.bottleSize)}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {BOTTLE_SIZES.map((size) => (
                            <SelectItem key={size} value={size}>
                              {BOTTLE_SIZE_LABEL[size]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {rowErrors.bottleSize ? (
                        <FieldError>{rowErrors.bottleSize}</FieldError>
                      ) : null}
                    </Field>

                    <Field>
                      <FieldLabel htmlFor={`${key}-style`}>العبوة</FieldLabel>
                      <Select
                        name={`v.${key}.bottleStyle`}
                        items={STYLE_ITEMS}
                        defaultValue={variant?.bottleStyle ?? null}
                        disabled={disabled}
                      >
                        <SelectTrigger
                          id={`${key}-style`}
                          className="w-full"
                          aria-invalid={Boolean(rowErrors.bottleStyle)}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {BOTTLE_STYLES.map((style) => (
                            <SelectItem key={style} value={style}>
                              {BOTTLE_STYLE_LABEL[style]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {rowErrors.bottleStyle ? (
                        <FieldError>{rowErrors.bottleStyle}</FieldError>
                      ) : null}
                    </Field>
                  </>
                ) : (
                  <Field>
                    <FieldLabel htmlFor={`${key}-weight`}>الوزن</FieldLabel>
                    <Select
                      name={`v.${key}.oilWeight`}
                      items={WEIGHT_ITEMS}
                      defaultValue={variant?.oilWeight ?? null}
                      disabled={disabled}
                    >
                      <SelectTrigger
                        id={`${key}-weight`}
                        className="w-full"
                        aria-invalid={Boolean(rowErrors.oilWeight)}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OIL_WEIGHTS.map((weight) => (
                          <SelectItem key={weight} value={weight}>
                            {OIL_WEIGHT_LABEL[weight]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {rowErrors.oilWeight ? (
                      <FieldError>{rowErrors.oilWeight}</FieldError>
                    ) : null}
                  </Field>
                )}

                <Field>
                  <FieldLabel htmlFor={`${key}-grade`}>الدرجة</FieldLabel>
                  <Input
                    id={`${key}-grade`}
                    name={`v.${key}.oilGrade`}
                    defaultValue={variant?.oilGrade ?? ""}
                    maxLength={OIL_GRADE_MAX}
                    placeholder="Grade A"
                    autoComplete="off"
                    disabled={disabled}
                    aria-invalid={Boolean(rowErrors.oilGrade)}
                  />
                  {rowErrors.oilGrade ? (
                    <FieldError>{rowErrors.oilGrade}</FieldError>
                  ) : null}
                </Field>

                <Field>
                  <FieldLabel htmlFor={`${key}-price`}>السعر</FieldLabel>
                  {/* `type="text"` with a numeric keypad, not
                      `type="number"`: a number input silently discards what
                      it cannot parse, so a stray character turns into an
                      empty price rather than the message the schema wrote. */}
                  <Input
                    id={`${key}-price`}
                    name={`v.${key}.price`}
                    defaultValue={variant?.price ?? ""}
                    inputMode="decimal"
                    placeholder="0.00"
                    autoComplete="off"
                    dir="ltr"
                    className="text-start"
                    disabled={disabled}
                    aria-invalid={Boolean(rowErrors.price)}
                    required
                  />
                  {rowErrors.price ? (
                    <FieldError>{rowErrors.price}</FieldError>
                  ) : null}
                </Field>

                <Field>
                  <FieldLabel htmlFor={`${key}-stock`}>المخزون</FieldLabel>
                  <Input
                    id={`${key}-stock`}
                    name={`v.${key}.stock`}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={1}
                    defaultValue={variant?.stock ?? 0}
                    dir="ltr"
                    className="text-start"
                    disabled={disabled}
                    aria-invalid={Boolean(rowErrors.stock)}
                    required
                  />
                  {rowErrors.stock ? (
                    <FieldError>{rowErrors.stock}</FieldError>
                  ) : null}
                </Field>
              </div>

              {rowErrors.row ? <FieldError>{rowErrors.row}</FieldError> : null}
            </li>
          )
        })}
      </ul>

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          className="self-start"
          onClick={onAdd}
          disabled={disabled}
        >
          <PlusIcon aria-hidden="true" />
          {alcohol ? "أضف حجمًا" : "أضف وزنًا"}
        </Button>

        <FieldDescription>
          {alcohol
            ? "لكل حجم ونوع عبوة سعرٌ ومخزونٌ مستقل. رمز المنتج (SKU) يُولَّد تلقائيًا عند الحفظ."
            : "الدهن يُباع بالوزن فقط. لكل وزن سعرٌ ومخزونٌ مستقل."}
        </FieldDescription>

        {collectionError ? <FieldError>{collectionError}</FieldError> : null}
      </div>
    </div>
  )
}
