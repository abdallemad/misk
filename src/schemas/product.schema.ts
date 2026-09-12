import { z } from "zod"
import type { ProductType } from "@prisma/client"

import {
  BOTTLE_SIZES,
  OIL_WEIGHTS,
  PRODUCT_TYPES,
  VARIANT_AXES,
} from "@/constants/catalog"
import {
  ACCEPTED_IMAGE_MIME,
  IMAGE_FORMATS_LABEL,
  MAX_GALLERY_IMAGES,
  MAX_IMAGE_BYTES,
  MAX_IMAGE_MB,
} from "@/constants/uploads"
import { SLUG_PATTERN, SLUG_RULE_MESSAGE } from "@/utils/slug"

/**
 * Validation for the product form — the single definition of what a valid
 * perfume is, and the **only** one. There are no `required` attributes on the
 * inputs and no second copy of the rules in the browser: the form runs this
 * module before it dispatches, and the Server Action runs it again on what
 * arrives. Same file, same messages, two callers.
 *
 * That double-run is the point. The client pass is what makes a mistake
 * visible without a round trip; the server pass is what makes the rule true,
 * because a Server Action is a public POST endpoint and nothing stops someone
 * calling it directly.
 *
 * This schema is bigger than `category.schema.ts` because a product is not a
 * flat record. It carries a gallery, a list of ingredients, and a **collection
 * of variants whose legal shape depends on the product's own type** — an
 * alcohol-based perfume is sold by bottle size, a raw oil by weight and
 * nothing else. That last rule is not expressible field-by-field, so it lives
 * in the `superRefine` below and is re-checked in `product.service.ts`.
 *
 * Messages are Arabic because they are rendered verbatim under the field.
 */

/* -------------------------------------------------------------------------
 * Field rules
 * ---------------------------------------------------------------------- */

export const NAME_MAX = 80
export const SLUG_MAX = 60
export const DESCRIPTION_MIN = 20
export const DESCRIPTION_MAX = 2000
export const OIL_GRADE_MAX = 40
export const INGREDIENT_NAME_MAX = 60
export const INGREDIENT_NOTE_MAX = 80
export const MAX_INGREDIENTS = 20
export const MAX_STOCK = 100_000

/**
 * Money as a **string**, matched against a pattern, and never as a float.
 *
 * `price` is `Decimal(10,2)` in Postgres, and Prisma accepts a string for a
 * decimal column and stores it exactly. Parsing "19.99" into a JS number
 * first would round-trip through binary floating point for no reason — and
 * `z.number().multipleOf(0.01)` cannot even reliably *detect* three decimal
 * places, because `19.999 % 0.01` is not 0 in IEEE-754. A regex answers the
 * only question that matters here: does this look like a price?
 *
 * Seven integer digits keeps it inside `Decimal(10, 2)`.
 */
export const PRICE_PATTERN = /^\d{1,7}(?:\.\d{1,2})?$/

const name = z
  .string()
  .trim()
  .min(2, "الاسم مطلوب — حرفان على الأقل.")
  .max(NAME_MAX, `الاسم طويل — ${NAME_MAX} حرفًا كحد أقصى.`)

const slug = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "المعرّف مطلوب — حرفان على الأقل.")
  .max(SLUG_MAX, `المعرّف طويل — ${SLUG_MAX} حرفًا كحد أقصى.`)
  .regex(SLUG_PATTERN, SLUG_RULE_MESSAGE)

/**
 * Required, unlike the category's — `Product.description` is NOT NULL in the
 * schema, and it is the only copy the product page has to sell with.
 */
const description = z
  .string()
  .trim()
  .min(DESCRIPTION_MIN, `الوصف مطلوب — ${DESCRIPTION_MIN} حرفًا على الأقل.`)
  .max(DESCRIPTION_MAX, `الوصف طويل — ${DESCRIPTION_MAX} حرفًا كحد أقصى.`)

/** A cuid from the category select. Whether it exists is the service's question. */
const categoryId = z.string().trim().min(1, "اختر الفئة التي يندرج تحتها.")

const productType = z.enum(PRODUCT_TYPES, { error: "اختر نوع المنتج." })

const galleryImage = z
  .file()
  .max(MAX_IMAGE_BYTES, `حجم الصورة كبير — ${MAX_IMAGE_MB} ميجابايت كحد أقصى.`)
  .mime([...ACCEPTED_IMAGE_MIME], `الصيغ المدعومة: ${IMAGE_FORMATS_LABEL}.`)

/* -------------------------------------------------------------------------
 * Rows
 *
 * Both repeatable sections — variants and ingredients — carry a `key` that
 * belongs to the browser, not the database. The editor mints one per row so
 * that deleting a row in the middle of the list does not renumber the rows
 * below it and silently move an error message onto a different row. `id` is
 * the database id, and is empty for a row the admin has only just added.
 * ---------------------------------------------------------------------- */

/**
 * One purchasable option, before the type rule is applied.
 *
 * Both discriminator columns are nullable here even though a valid variant
 * always fills exactly one of them. Which one is legal is a fact about the
 * product, not about the row, so this cannot be a discriminated union at this
 * level — see `enforceVariantShape` below.
 */
const variantSchema = z.object({
  key: z.string().min(1),
  id: z.string().nullable(),
  bottleSize: z.enum(BOTTLE_SIZES).nullable(),
  oilWeight: z.enum(OIL_WEIGHTS).nullable(),
  oilGrade: z
    .string()
    .trim()
    .max(OIL_GRADE_MAX, `الدرجة طويلة — ${OIL_GRADE_MAX} حرفًا كحد أقصى.`)
    .nullable(),
  price: z
    .string()
    .trim()
    .min(1, "السعر مطلوب.")
    .regex(PRICE_PATTERN, "سعر غير صالح — رقم بمنزلتين عشريتين كحد أقصى.")
    .refine((value) => Number(value) > 0, "السعر يجب أن يكون أكبر من صفر."),
  // A string with a pattern, not `z.coerce.number()`. `Number("")` is `0`,
  // so a coerced empty box would save "out of stock" silently instead of
  // saying the field is required — and `Number(" 12 ")` is 12 while
  // `Number("12ml")` is NaN, two different kinds of wrong from one input.
  // Same treatment as `price`, and for the same reason.
  stock: z
    .string()
    .trim()
    .min(1, "المخزون مطلوب — اكتب 0 إن كان غير متوفر.")
    .regex(/^\d{1,6}$/, "المخزون يجب أن يكون رقمًا صحيحًا غير سالب.")
    .transform(Number)
    .refine(
      (value) => value <= MAX_STOCK,
      `المخزون كبير — ${MAX_STOCK} كحد أقصى.`
    ),
  isActive: z.boolean(),
})

export type ProductVariantInput = z.infer<typeof variantSchema>

/**
 * One raw material on the perfume's "Quality & Ingredients" panel.
 *
 * Identified **by name, not by id**, even though `Ingredient` is a table with
 * its own primary key. The admin types "Oud Oil — Grade A" and the service
 * decides whether that is a row that already exists or a new one; a hidden id
 * in the form would only be trustworthy while the datalist was in sync with
 * the database, and it would be wrong the moment two admins added the same
 * material in two tabs. See `ingredient.service.ts`.
 */
const ingredientSchema = z.object({
  key: z.string().min(1),
  name: z
    .string()
    .trim()
    .min(2, "اسم المكوّن مطلوب — حرفان على الأقل.")
    .max(INGREDIENT_NAME_MAX, `الاسم طويل — ${INGREDIENT_NAME_MAX} حرفًا كحد أقصى.`),
  note: z
    .string()
    .trim()
    .max(INGREDIENT_NOTE_MAX, `الوصف طويل — ${INGREDIENT_NOTE_MAX} حرفًا كحد أقصى.`)
    .nullable(),
})

export type ProductIngredientInput = z.infer<typeof ingredientSchema>

/** The columns a variant is identified by, flattened into one comparable string. */
export function variantCombination(variant: ProductVariantInput): string {
  return [
    variant.bottleSize ?? "",
    variant.oilWeight ?? "",
    variant.oilGrade?.trim().toLowerCase() ?? "",
  ].join("|")
}

/**
 * The form key an ingredient is compared and stored under.
 *
 * Case- and whitespace-insensitive, because "Oud Oil" and "oud  oil" are the
 * same jar. `Ingredient.name` is `@unique` in Postgres and Postgres is
 * case-sensitive, so without this the master list would grow a near-duplicate
 * every time someone typed with a different shift key.
 */
export function ingredientKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ")
}

/* -------------------------------------------------------------------------
 * The form
 * ---------------------------------------------------------------------- */

export const productFormSchema = z
  .object({
    name,
    slug,
    description,
    categoryId,
    productType,
    isActive: z.boolean(),
    /**
     * Ids of the already-stored gallery images the admin kept, **in the
     * order they should appear**. Anything on the row and missing from this
     * list has been removed. Position is the list index, so ordering and
     * deleting are one field rather than two that can contradict each other.
     */
    keepImageIds: z.array(z.string()),
    /** Newly picked files, appended after the kept ones. */
    images: z.array(galleryImage),
    variants: z
      .array(variantSchema)
      .min(1, "أضف خيار شراء واحدًا على الأقل — بدونه لا يمكن شراء العطر."),
    /** Optional: a perfume is sellable before anyone has written up its oils. */
    ingredients: z
      .array(ingredientSchema)
      .max(MAX_INGREDIENTS, `الحد الأقصى ${MAX_INGREDIENTS} مكوّنًا للعطر الواحد.`),
  })
  .superRefine((form, ctx) => {
    if (form.keepImageIds.length + form.images.length > MAX_GALLERY_IMAGES) {
      ctx.addIssue({
        code: "custom",
        path: ["images"],
        message: `الحد الأقصى ${MAX_GALLERY_IMAGES} صور للعطر الواحد.`,
      })
    }

    const seenVariants = new Set<string>()

    form.variants.forEach((variant, index) => {
      enforceVariantShape(form.productType, variant, index, ctx)

      // Postgres treats NULLs as distinct, so the `uniqueVariantCombination`
      // index in `schema.prisma` does **not** catch two raw-oil rows that are
      // both `(null, null, G_8, null)`. The database cannot be the guard
      // here, so this is — and `product.service.ts` repeats it, because a
      // direct POST to the action never reaches this file.
      const combination = variantCombination(variant)

      if (seenVariants.has(combination)) {
        ctx.addIssue({
          code: "custom",
          path: ["variants", index, "row"],
          message: "هذا التكوين مكرر — غيّره أو احذف أحد الصفّين.",
        })
        return
      }

      seenVariants.add(combination)
    })

    const seenIngredients = new Set<string>()

    form.ingredients.forEach((ingredient, index) => {
      const key = ingredientKey(ingredient.name)

      if (seenIngredients.has(key)) {
        ctx.addIssue({
          code: "custom",
          path: ["ingredients", index, "name"],
          message: "هذا المكوّن مذكور مرتين.",
        })
        return
      }

      seenIngredients.add(key)
    })
  })

export type ProductFormInput = z.infer<typeof productFormSchema>

/**
 * The rule that runs through the whole application, applied to one row.
 *
 * `VARIANT_AXES` says which columns the type is sold by; everything not on
 * that list must be empty. Checking *both* directions matters: a missing size
 * is an obviously incomplete row, but a leftover `oilWeight` on an alcohol
 * variant is a row that would sort, filter and price wrongly on the
 * storefront while looking perfectly fine in the admin table.
 */
function enforceVariantShape(
  type: ProductType,
  variant: ProductVariantInput,
  index: number,
  ctx: z.RefinementCtx
) {
  const required = VARIANT_AXES[type]

  const missingMessage = {
    bottleSize: "اختر الحجم.",
    oilWeight: "اختر الوزن.",
  } as const

  for (const axis of ["bottleSize", "oilWeight"] as const) {
    const isRequired = required.includes(axis)
    const value = variant[axis]

    if (isRequired && value === null) {
      ctx.addIssue({
        code: "custom",
        path: ["variants", index, axis],
        message: missingMessage[axis],
      })
    }

    if (!isRequired && value !== null) {
      ctx.addIssue({
        code: "custom",
        path: ["variants", index, "row"],
        message: "هذا الصف لا يطابق نوع المنتج — احذفه وأضِف صفًا جديدًا.",
      })
    }
  }
}

/* -------------------------------------------------------------------------
 * Field names
 *
 * Every input's `name`, every `<Field name>`, and every key in the error map
 * come from the three helpers below, so a rename cannot leave an error
 * message pointing at a field that no longer exists. This is what lets
 * `<FieldError />` render with no arguments: the field knows its own name,
 * and the name is the key.
 * ---------------------------------------------------------------------- */

export const PRODUCT_FIELDS = [
  "name",
  "slug",
  "description",
  "categoryId",
  "productType",
  "images",
  "variants",
  "ingredients",
] as const

export type ProductField = (typeof PRODUCT_FIELDS)[number]

export type VariantField =
  | "bottleSize"
  | "oilWeight"
  | "oilGrade"
  | "price"
  | "stock"
  /** Something wrong with the row as a whole — a duplicate, a shape clash. */
  | "row"

export type IngredientField = "name" | "note"

/**
 * Everything a variant row submits, which is the error-carrying fields plus
 * two that can never be wrong: the database `id` the row was seeded from, and
 * its `isActive` switch. Keeping them in the same helper means every name in
 * the form is built in one place; keeping them out of `VariantField` means
 * the error map cannot accidentally address an input with nowhere to show a
 * message.
 */
type VariantFormField = VariantField | "id" | "isActive"

export function variantFieldName(key: string, field: VariantFormField): string {
  return `v.${key}.${field}`
}

export function ingredientFieldName(key: string, field: IngredientField): string {
  return `ing.${key}.${field}`
}

/**
 * Field name → one message. Flat, on purpose.
 *
 * This is the shape `<Form errors>` takes, so a parse result can be handed
 * straight to the form with no adapter in between: the form marks the matching
 * fields invalid, renders each message under its own input, and focuses the
 * first one. A nested `{ fields, variants, ingredients }` shape would have to
 * be flattened at the call site anyway, and every place that did the
 * flattening would be a place it could be done differently.
 */
export type ProductFormErrors = Record<string, string>

/* -------------------------------------------------------------------------
 * FormData adapter
 * ---------------------------------------------------------------------- */

/**
 * Pull a product out of a `FormData` and validate it.
 *
 * Runs in **both** environments: the form calls it on submit against its own
 * `new FormData(form)`, and the Server Action calls it on what actually
 * arrived. Nothing in this module touches the database or the filesystem, so
 * there is one implementation rather than a browser copy and a server copy
 * that can disagree.
 *
 * The repeatable sections arrive **keyed rather than indexed** — a repeated
 * `variantKey` / `ingredientKey` input carries the row order, and every field
 * of a row is named `v.<key>.<field>` / `ing.<key>.<field>`. Indexed names
 * (`variants[2].price`) would have to be renumbered in the browser every time
 * a row in the middle is deleted, and a renumbering bug there silently moves
 * one row's price onto another row.
 *
 * Three `FormData` quirks the normalisation above the parse absorbs, the same
 * three `category.schema.ts` documents: an untouched file input still submits
 * a zero-byte `File`, an unchecked switch submits nothing at all (so every
 * `isActive`, including one per variant row, is read by *presence*), and an
 * empty text box submits `""` rather than nothing. A fourth is Base UI's
 * `Select`, which submits `""` when nothing is chosen — read here as `null`.
 */
export function parseProductForm(
  formData: FormData
):
  | { success: true; data: ProductFormInput }
  | { success: false; errors: ProductFormErrors } {
  const text = (key: string) => {
    const value = formData.get(key)
    return typeof value === "string" ? value.trim() : ""
  }

  const orNull = (value: string) => (value === "" ? null : value)

  const keys = (field: string) =>
    formData
      .getAll(field)
      .filter(
        (value): value is string => typeof value === "string" && value !== ""
      )

  const variantKeys = keys("variantKey")
  const ingredientKeys = keys("ingredientKey")

  const variants = variantKeys.map((key) => ({
    key,
    id: orNull(text(variantFieldName(key, "id"))),
    bottleSize: orNull(text(variantFieldName(key, "bottleSize"))),
    oilWeight: orNull(text(variantFieldName(key, "oilWeight"))),
    oilGrade: orNull(text(variantFieldName(key, "oilGrade"))),
    price: text(variantFieldName(key, "price")),
    stock: text(variantFieldName(key, "stock")),
    isActive: formData.get(variantFieldName(key, "isActive")) !== null,
  }))

  const ingredients = ingredientKeys.map((key) => ({
    key,
    name: text(ingredientFieldName(key, "name")),
    note: orNull(text(ingredientFieldName(key, "note"))),
  }))

  const result = productFormSchema.safeParse({
    name: text("name"),
    slug: text("slug"),
    description: text("description"),
    categoryId: text("categoryId"),
    productType: text("productType"),
    isActive: formData.get("isActive") !== null,
    keepImageIds: keys("keepImage"),
    images: formData
      .getAll("images")
      .filter((value): value is File => value instanceof File && value.size > 0),
    variants,
    ingredients,
  })

  if (result.success) return { success: true, data: result.data }

  return {
    success: false,
    errors: collectErrors(result.error, variantKeys, ingredientKeys),
  }
}

/**
 * Route zod's issues to the input that has room for them.
 *
 * `z.flattenError` is no use here: it collapses everything under `variants`
 * into a single list, and this form has six inputs *per row* that each need
 * their own message. So the paths are walked instead — `["variants", 2,
 * "price"]` becomes the key `v.<the third row's key>.price`, which is
 * literally the `name` of the input that caused it.
 *
 * First message wins, per field. Each input has room for exactly one line,
 * and the first issue is the one the admin can act on.
 */
function collectErrors(
  error: z.ZodError,
  variantKeys: string[],
  ingredientKeys: string[]
): ProductFormErrors {
  const errors: ProductFormErrors = {}

  const put = (key: string, message: string) => {
    if (!(key in errors)) errors[key] = message
  }

  for (const issue of error.issues) {
    const [head, index, leaf] = issue.path

    if (head === "variants" && typeof index === "number") {
      const key = variantKeys[index]
      if (!key) continue
      // A row-level issue carries no leaf, so it falls through to the row's
      // own banner rather than being dropped.
      const field = (typeof leaf === "string" ? leaf : "row") as VariantField
      put(variantFieldName(key, field), issue.message)
      continue
    }

    if (head === "ingredients" && typeof index === "number") {
      const key = ingredientKeys[index]
      if (!key) continue
      const field = (typeof leaf === "string" ? leaf : "name") as IngredientField
      put(ingredientFieldName(key, field), issue.message)
      continue
    }

    // `variants` with no index is the array itself — "add at least one row".
    if (typeof head === "string") put(head, issue.message)
  }

  return errors
}

/* -------------------------------------------------------------------------
 * Form state
 * ---------------------------------------------------------------------- */

/**
 * What the save action hands back to `useActionState`.
 *
 * Lives here rather than beside the action for the reason
 * `category.schema.ts` spells out at length: a `"use server"` module may
 * export only async functions, so the idle constant below would reach the
 * client as a server-reference stub if it were declared there.
 */
export type ProductFormState = {
  status: "idle" | "success" | "error"
  /** One line for the toast. `null` while idle. */
  message: string | null
  /** Ready to hand straight to `<Form errors>`. */
  errors: ProductFormErrors
  /**
   * The saved row's id. The form leaves for the list on success, and on a
   * *create* this is the only place the new id is ever known — the client
   * invented the row keys, not the ids.
   */
  productId: string | null
}

export const IDLE_PRODUCT_FORM_STATE: ProductFormState = {
  status: "idle",
  message: null,
  errors: {},
  productId: null,
}
