"use server"

import { revalidatePath } from "next/cache"

import { adminProductRoute, ROUTES } from "@/constants/routes"
import {
  parseProductForm,
  type ProductFormState,
} from "@/schemas/product.schema"
import { isAdmin } from "@/services/auth.service"
import { createProduct, updateProduct } from "@/services/product.service"

/**
 * Create or update a perfume, with its gallery and its variants.
 *
 * One action for both, and one action for all three *entities*, which is a
 * deliberate departure from the `createVariant` / `updateVariant` split
 * sketched in `docs/folder-structure.md`. The reason is that the variant
 * editor is inline: the admin adds a 50ml row, deletes the 30ml one and
 * changes a price, then presses save once. Splitting that into per-variant
 * calls would mean a half-saved product whenever the third of five calls
 * failed, and would put the "a product must have at least one variant" rule
 * somewhere no single call could enforce it.
 *
 * Shaped for `useActionState`: takes the previous state, returns the next,
 * never throws. The client half is
 * `components/admin/products/product-form.tsx`.
 *
 * `ProductFormState` and its idle value are imported from the schema rather
 * than declared here — a `"use server"` module may export only async
 * functions. See docs/products-feature.md.
 */
export async function saveProductAction(
  _previous: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  // The `/admin` layout guard protects *pages*. A Server Action is a POST
  // endpoint reachable without ever rendering that layout, so the check is
  // repeated here — see docs/admin-access-control.md.
  if (!(await isAdmin())) {
    return {
      status: "error",
      message: "ليست لديك صلاحية لتعديل العطور.",
      errors: {},
      productId: null,
    }
  }

  const parsed = parseProductForm(formData)

  if (!parsed.success) {
    return {
      status: "error",
      message: "راجع الحقول المميّزة بالأحمر.",
      errors: parsed.errors,
      productId: null,
    }
  }

  const rawId = formData.get("id")
  const id = typeof rawId === "string" && rawId !== "" ? rawId : null

  const result = id
    ? await updateProduct(id, parsed.data)
    : await createProduct(parsed.data)

  if (!result.ok) {
    return {
      status: "error",
      message: result.message,
      errors: result.errors ?? {},
      productId: null,
    }
  }

  // The list, because a row was added or changed on it — and the edit page
  // itself, so that reopening it does not serve the pre-save version out of
  // the client Router Cache.
  revalidatePath(ROUTES.adminProducts)
  revalidatePath(adminProductRoute(result.product.id))

  return {
    status: "success",
    message: id
      ? `تم تحديث «${result.product.name}».`
      : `تمت إضافة «${result.product.name}».`,
    errors: {},
    productId: result.product.id,
  }
}
