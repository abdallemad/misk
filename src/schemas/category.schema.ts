import { z } from "zod"

import {
  ACCEPTED_IMAGE_MIME,
  IMAGE_FORMATS_LABEL,
  MAX_IMAGE_BYTES,
  MAX_IMAGE_MB,
} from "@/constants/uploads"
import { SLUG_PATTERN, SLUG_RULE_MESSAGE } from "@/utils/slug"

/**
 * Validation for the category form — the single definition both the form and
 * the Server Action enforce.
 *
 * The architecture rule is that validation lives here and nowhere else
 * (`docs/folder-structure.md`). It matters more than usual for this feature:
 * a Server Action is a public POST endpoint, so the browser-side checks are a
 * courtesy and *this* file is the actual gate.
 *
 * Messages are Arabic because they are rendered verbatim under the field.
 */

/* -------------------------------------------------------------------------
 * Field rules
 * ---------------------------------------------------------------------- */

/**
 * The slug rule lives in `utils/slug.ts` because products answer to the same
 * one, and a second copy of the regex is a second chance for the two forms to
 * disagree about what a valid URL segment is. Why the admin types it rather
 * than having it derived from the Arabic name is documented there.
 */

/** Longest name the table column renders without wrapping awkwardly. */
export const NAME_MAX = 40
export const SLUG_MAX = 40
export const DESCRIPTION_MAX = 200

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

const description = z
  .string()
  .trim()
  .max(DESCRIPTION_MAX, `الوصف طويل — ${DESCRIPTION_MAX} حرفًا كحد أقصى.`)
  .nullable()

/**
 * Optional on purpose. An empty box means "put it last", which the service
 * resolves to `max(position) + 1` — coercing it to `0` here would silently
 * send every new segment to the front of the storefront nav.
 */
const position = z.coerce
  .number({ error: "الترتيب يجب أن يكون رقمًا." })
  .int("الترتيب يجب أن يكون رقمًا صحيحًا.")
  .min(0, "الترتيب لا يكون سالبًا.")
  .max(999, "الترتيب كبير — 999 كحد أقصى.")
  .optional()

const image = z
  .file()
  .max(MAX_IMAGE_BYTES, `حجم الصورة كبير — ${MAX_IMAGE_MB} ميجابايت كحد أقصى.`)
  .mime([...ACCEPTED_IMAGE_MIME], `الصيغ المدعومة: ${IMAGE_FORMATS_LABEL}.`)
  .nullable()

/* -------------------------------------------------------------------------
 * The form
 * ---------------------------------------------------------------------- */

export const categoryFormSchema = z.object({
  name,
  slug,
  description,
  position,
  isActive: z.boolean(),
  /** A newly chosen file, or `null` when the admin left the picker alone. */
  image,
  /** Ticked "remove the current image" — only meaningful when editing. */
  removeImage: z.boolean(),
})

export type CategoryFormInput = z.infer<typeof categoryFormSchema>

/** The form's field names, so error maps cannot drift from the inputs. */
export type CategoryField = keyof CategoryFormInput

export type CategoryFieldErrors = Partial<Record<CategoryField, string>>

/* -------------------------------------------------------------------------
 * FormData adapter
 * ---------------------------------------------------------------------- */

/**
 * Pull a category out of a `FormData` and validate it.
 *
 * The normalisation above the parse is all about the gap between what HTML
 * forms send and what the schema wants to reason about:
 *
 *   - An untouched `<input type="file">` still submits a `File` — an empty
 *     one, named `""`. Left alone it would fail the MIME check on every edit
 *     where the admin did not change the picture, so a zero-byte file is
 *     read as "no file".
 *   - An unchecked checkbox sends *nothing at all*, so `isActive` has to be
 *     derived from presence rather than value.
 *   - An empty text box sends `""`, which is not the same as "unset" for
 *     `description` (→ `null`, clear the column) or `position` (→ leave it
 *     to the service).
 *
 * Returns the flat, one-message-per-field shape the form renders, rather than
 * zod's array-per-field, because each input has room for exactly one line.
 */
export function parseCategoryForm(
  formData: FormData
):
  | { success: true; data: CategoryFormInput }
  | { success: false; fieldErrors: CategoryFieldErrors } {
  const text = (key: string) => {
    const value = formData.get(key)
    return typeof value === "string" ? value : ""
  }

  const file = formData.get("image")
  const positionRaw = text("position").trim()

  const result = categoryFormSchema.safeParse({
    name: text("name"),
    slug: text("slug"),
    description: text("description").trim() === "" ? null : text("description"),
    position: positionRaw === "" ? undefined : positionRaw,
    isActive: formData.get("isActive") !== null,
    image: file instanceof File && file.size > 0 ? file : null,
    removeImage: formData.get("removeImage") !== null,
  })

  if (result.success) return { success: true, data: result.data }

  const { fieldErrors } = z.flattenError(result.error)

  const flattened: CategoryFieldErrors = {}
  for (const [field, messages] of Object.entries(fieldErrors)) {
    if (messages?.[0]) flattened[field as CategoryField] = messages[0]
  }

  return { success: false, fieldErrors: flattened }
}

/* -------------------------------------------------------------------------
 * Form state
 * ---------------------------------------------------------------------- */

/**
 * What the save action hands back to `useActionState`.
 *
 * This lives here, next to the rules it reports on, and **not** in the action
 * module — a `"use server"` file may only export async functions. Every export
 * of such a module becomes a server reference, so exporting the constant below
 * from there hands the client a stub instead of an object, and the form breaks
 * at render with an error that names neither the file nor the cause.
 */
export type CategoryFormState = {
  status: "idle" | "success" | "error"
  /** One line for the toast. `null` while idle. */
  message: string | null
  /** At most one message per input, keyed by field name. */
  fieldErrors: CategoryFieldErrors
}

export const IDLE_CATEGORY_FORM_STATE: CategoryFormState = {
  status: "idle",
  message: null,
  fieldErrors: {},
}
