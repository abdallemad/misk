"use server"

import { revalidatePath } from "next/cache"

import { ROUTES } from "@/constants/routes"
import { isAdmin } from "@/services/auth.service"
import { deleteCategory } from "@/services/category.service"

/**
 * Delete a category.
 *
 * Called from an event handler rather than a form `action`, because the
 * confirmation dialog needs the answer — "12 perfumes still use this one" has
 * to be shown *in place of* the dialog closing. So this one returns a plain
 * result object and the caller awaits it, instead of feeding `useActionState`.
 *
 * Whether the delete is allowed at all is the service's decision, not this
 * layer's. See docs/categories-feature.md.
 */
export async function deleteCategoryAction(
  id: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  // Repeated here for the same reason as in `save-category.ts`: the layout
  // guard does not run for a Server Action POST.
  if (!(await isAdmin())) {
    return { ok: false, message: "ليست لديك صلاحية لحذف الفئات." }
  }

  // `id` arrives from the client, so it is a string and nothing more until the
  // service looks it up. A missing row is a normal answer there, not a throw.
  if (typeof id !== "string" || id === "") {
    return { ok: false, message: "طلب غير صالح." }
  }

  const result = await deleteCategory(id)

  if (!result.ok) return result

  revalidatePath(ROUTES.adminCategories)

  return { ok: true }
}
