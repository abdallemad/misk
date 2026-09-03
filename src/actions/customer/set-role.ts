"use server"

import { revalidatePath } from "next/cache"

import { ROUTES, adminCustomerRoute } from "@/constants/routes"
import { getCurrentUser, isAdmin } from "@/services/auth.service"
import { setCustomerRole } from "@/services/customer.service"

type SetRoleResult = { ok: true } | { ok: false; message: string }

/**
 * Promote a customer to admin, or demote them back.
 *
 * The `/admin` layout guard protects **pages**; a Server Action is a POST
 * endpoint that never renders it, so `isAdmin()` is re-checked here — see
 * docs/admin-access-control.md.
 *
 * Two rules this layer owns, on top of "must be an admin":
 *
 *  - **You cannot change your own role.** Self-service escalation is exactly
 *    what `grant-admin` exists to keep out of the app, and a lone admin
 *    demoting themselves would lock the console. Use another admin account or
 *    the CLI.
 *  - The target and the new role are validated before the service is called —
 *    `id` is an opaque string from the client, `role` must be one of two
 *    literals.
 *
 * The Clerk write itself, and the "no such Clerk user" case, are the
 * service's job.
 */
export async function setCustomerRoleAction(
  id: string,
  role: "USER" | "ADMIN"
): Promise<SetRoleResult> {
  if (!(await isAdmin())) {
    return { ok: false, message: "ليست لديك صلاحية لتغيير الأدوار." }
  }

  if (typeof id !== "string" || id === "") {
    return { ok: false, message: "طلب غير صالح." }
  }

  if (role !== "USER" && role !== "ADMIN") {
    return { ok: false, message: "دور غير معروف." }
  }

  const me = await getCurrentUser()
  if (me?.id === id) {
    return {
      ok: false,
      message:
        "لا يمكنك تغيير دورك من هنا. استخدم حسابًا آخر، أو الأمر grant-admin.",
    }
  }

  const result = await setCustomerRole(id, role)
  if (!result.ok) return { ok: false, message: result.message }

  revalidatePath(ROUTES.adminCustomers)
  revalidatePath(adminCustomerRoute(id))

  return { ok: true }
}
