"use server"

import { revalidatePath } from "next/cache"

import { ROUTES } from "@/constants/routes"
import {
  parseCategoryForm,
  type CategoryFormState,
} from "@/schemas/category.schema"
import { isAdmin } from "@/services/auth.service"
import { createCategory, updateCategory } from "@/services/category.service"

/**
 * Create or update a category.
 *
 * One action for both, because there is one form. The dialog renders the same
 * fields either way and submits a hidden `id` — empty for a new segment,
 * populated when editing — so splitting this in two would mean two actions
 * whose bodies differ by a single call, and a form component that has to pick
 * between them.
 *
 * Shaped for `useActionState`: it takes the previous state, returns the next,
 * and never throws. The client half is
 * `components/admin/categories/category-form-dialog.tsx`.
 *
 * `CategoryFormState` and its idle value are imported from the schema rather
 * than declared here, because a `"use server"` module may export **only async
 * functions** — every export becomes a server reference, so a plain object
 * exported from this file would reach the client as a stub.
 *
 * See docs/categories-feature.md.
 */
export async function saveCategoryAction(
  _previous: CategoryFormState,
  formData: FormData
): Promise<CategoryFormState> {
  // The `/admin` layout guard protects *pages*. A Server Action is a POST
  // endpoint reachable without ever rendering that layout, so the check is
  // repeated here — see docs/admin-access-control.md.
  if (!(await isAdmin())) {
    return {
      status: "error",
      message: "ليست لديك صلاحية لتعديل الفئات.",
      fieldErrors: {},
    }
  }

  const parsed = parseCategoryForm(formData)

  if (!parsed.success) {
    return {
      status: "error",
      message: "راجع الحقول المميّزة بالأحمر.",
      fieldErrors: parsed.fieldErrors,
    }
  }

  const rawId = formData.get("id")
  const id = typeof rawId === "string" && rawId !== "" ? rawId : null

  const result = id
    ? await updateCategory(id, parsed.data)
    : await createCategory(parsed.data)

  if (!result.ok) {
    return {
      status: "error",
      message: result.message,
      fieldErrors: result.fieldErrors ?? {},
    }
  }

  // Expires the cached entry *and* the client Router Cache for the list, so
  // the table behind the dialog shows the new row the moment it closes.
  revalidatePath(ROUTES.adminCategories)

  return {
    status: "success",
    message: id
      ? `تم تحديث «${result.category.name}».`
      : `تمت إضافة «${result.category.name}».`,
    fieldErrors: {},
  }
}
