"use server"

import { revalidatePath } from "next/cache"

import { ORDER_STATUSES, type OrderStatus } from "@/constants/design-system"
import { ROUTES, adminOrderRoute } from "@/constants/routes"
import { isAdmin } from "@/services/auth.service"
import { updateOrderStatus } from "@/services/order.service"

type UpdateStatusResult = { ok: true } | { ok: false; message: string }

/**
 * Move an order to another status from the order detail page.
 *
 * `isAdmin()` is re-checked here because the `/admin` layout guard does not
 * run for a Server Action POST — see docs/admin-access-control.md.
 *
 * The status is validated against `ORDER_STATUSES` before the service is
 * touched: it arrives as a bare string from a `<select>`, and everything the
 * service does downstream assumes it is a real enum member.
 *
 * Which transitions make sense is left to the admin — see the note on
 * `updateOrderStatus` in the service.
 */
export async function updateOrderStatusAction(
  id: string,
  status: OrderStatus
): Promise<UpdateStatusResult> {
  if (!(await isAdmin())) {
    return { ok: false, message: "ليست لديك صلاحية لتعديل الطلبات." }
  }

  if (typeof id !== "string" || id === "") {
    return { ok: false, message: "طلب غير صالح." }
  }

  if (!(ORDER_STATUSES as readonly string[]).includes(status)) {
    return { ok: false, message: "حالة غير معروفة." }
  }

  const result = await updateOrderStatus(id, status)
  if (!result.ok) return { ok: false, message: result.message }

  revalidatePath(ROUTES.adminOrders)
  revalidatePath(adminOrderRoute(id))

  return { ok: true }
}
