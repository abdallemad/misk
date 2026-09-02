"use client"

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
  ingredientFieldName,
  INGREDIENT_NAME_MAX,
  INGREDIENT_NOTE_MAX,
  MAX_INGREDIENTS,
} from "@/schemas/product.schema"
import type { IngredientOption } from "@/services/ingredient.service"
import type { ProductIngredientRow } from "@/services/product.service"

/**
 * One row of the ingredients editor: a client-side identity, plus the stored
 * link it was seeded from (`null` for a row the admin just added).
 */
export type IngredientRow = {
  key: string
  ingredient: ProductIngredientRow | null
}

type ProductIngredientsFieldProps = {
  rows: IngredientRow[]
  /** The shop's whole master list, for the datalist behind the name input. */
  options: IngredientOption[]
  onAdd: () => void
  onRemove: (key: string) => void
  disabled?: boolean
}

/** One `<datalist>` for every row, since they all suggest the same list. */
const INGREDIENT_LIST_ID = "ingredient-suggestions"

/**
 * What is actually in the bottle — the raw materials behind the "Quality &
 * Ingredients" panel on the product page.
 *
 * **Typed by name, not picked by id.** `Ingredient` is a table, but the form
 * submits the name and `ingredient.service.ts` decides whether that is a row
 * that already exists or a new one, matching case- and whitespace-
 * insensitively. A hidden id would only be trustworthy while the suggestion
 * list matched the database, and would be wrong the moment two admins added
 * the same material in two tabs.
 *
 * The suggestions come through a native `<datalist>` rather than a combobox.
 * A datalist filters as you type, is announced by screen readers, mirrors
 * correctly in RTL and costs nothing — and, unlike a combobox, it does not
 * *stop* the admin entering a material that is not on the list yet, which is
 * the whole point of a growing master list. A combobox becomes worth it when
 * the list is long enough to need grouping or descriptions beside each name.
 *
 * The section is optional: a perfume is sellable before anyone has written up
 * its oils, so there is no minimum and no starting row.
 *
 * See docs/products-feature.md.
 */
export function ProductIngredientsField({
  rows,
  options,
  onAdd,
  onRemove,
  disabled,
}: ProductIngredientsFieldProps) {
  const full = rows.length >= MAX_INGREDIENTS

  return (
    <div className="flex flex-col gap-4">
      <datalist id={INGREDIENT_LIST_ID}>
        {options.map((option) => (
          <option key={option.id} value={option.name} />
        ))}
      </datalist>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
          لم تُضف مكوّنات بعد. المكوّنات تظهر للزائر في قسم «الجودة والمكوّنات»،
          وتُعاد الاستفادة منها في بقية العطور.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((row, index) => {
            const { key, ingredient } = row

            return (
              <li
                key={key}
                className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3"
              >
                {/* The row's identity travels as its own field, so deleting a
                    row in the middle never renumbers the ones below it. */}
                <input type="hidden" name="ingredientKey" value={key} />

                <div className="flex items-start gap-3">
                  <div className="grid flex-1 gap-3 sm:grid-cols-2">
                    <Field name={ingredientFieldName(key, "name")}>
                      <FieldLabel htmlFor={`${key}-ingredient-name`}>
                        المكوّن
                      </FieldLabel>
                      <Input
                        id={`${key}-ingredient-name`}
                        name={ingredientFieldName(key, "name")}
                        defaultValue={ingredient?.name ?? ""}
                        list={INGREDIENT_LIST_ID}
                        maxLength={INGREDIENT_NAME_MAX}
                        placeholder="زيت العود — درجة أولى"
                        autoComplete="off"
                        disabled={disabled}
                      />
                      <FieldError />
                    </Field>

                    <Field name={ingredientFieldName(key, "note")}>
                      <FieldLabel htmlFor={`${key}-ingredient-note`}>
                        دوره في التركيبة
                      </FieldLabel>
                      <Input
                        id={`${key}-ingredient-note`}
                        name={ingredientFieldName(key, "note")}
                        defaultValue={ingredient?.note ?? ""}
                        maxLength={INGREDIENT_NOTE_MAX}
                        placeholder="نفحة القلب"
                        autoComplete="off"
                        disabled={disabled}
                      />
                      <FieldError />
                    </Field>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="mt-6 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => onRemove(key)}
                    disabled={disabled}
                  >
                    <Trash2Icon aria-hidden="true" />
                    <span className="sr-only">حذف المكوّن {index + 1}</span>
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          className="self-start"
          onClick={onAdd}
          disabled={disabled || full}
        >
          <PlusIcon aria-hidden="true" />
          أضف مكوّنًا
        </Button>

        <FieldDescription>
          اكتب الاسم واختر من الاقتراحات إن كان مستخدَمًا في عطر آخر — المكوّن
          الواحد يُسجَّل مرة واحدة ويُعاد استخدامه. حتى {MAX_INGREDIENTS}{" "}
          مكوّنًا.
        </FieldDescription>
      </div>
    </div>
  )
}
