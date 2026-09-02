"use server"

import { revalidatePath } from "next/cache"

import { ROUTES } from "@/constants/routes"
import { isAdmin } from "@/services/auth.service"
import { deleteProduct } from "@/services/product.service"

/**
 * Delete a perfume.
 *
 * Called from an event handler rather than a form `action`, for the same
 * reason `delete-category.ts` is: the confirmation dialog needs the answer.
 * "There are still order lines pointing at this one" has to appear *instead
 * of* the dialog closing, so this returns a plain result object the caller
 * awaits rather than feeding `useActionState`.
 *
 * Whether the delete is allowed at all is the service's decision, not this
 * layer's. See docs/products-feature.md.
 */
export async function deleteProductAction(
  id: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  // Repeated here for the same reason as in `save-product.ts`: the layout
  // guard does not run for a Server Action POST.
  if (!(await isAdmin())) {
    return { ok: false, message: "ليست لديك صلاحية لحذف العطور." }
  }

  // `id` arrives from the client, so it is a string and nothing more until
  // the service looks it up. A missing row is a normal answer there.
  if (typeof id !== "string" || id === "") {
    return { ok: false, message: "طلب غير صالح." }
  }

  const result = await deleteProduct(id)

  if (!result.ok) return result

  revalidatePath(ROUTES.adminProducts)

  return { ok: true }
}
