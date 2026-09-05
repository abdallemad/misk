import { z } from "zod"

import { EGYPT_GOVERNORATES } from "@/constants/egypt"

/**
 * Validation for the checkout form — the phone numbers and the Egyptian
 * address a cash-on-delivery order needs, and nothing else. The single
 * definition of what a valid checkout submission is, enforced in the browser
 * (a courtesy — see below) and again in the Server Action (the actual gate),
 * the same split every other form in this project follows.
 *
 * Messages are Arabic because they are rendered verbatim under the field.
 */

/* -------------------------------------------------------------------------
 * Field rules
 * ---------------------------------------------------------------------- */

export const CITY_MAX = 60
export const CENTER_MAX = 60
export const STREET_MAX = 120
export const BUILDING_MAX = 20

/**
 * An Egyptian mobile number, loosely — optional `+20` / `20` country code,
 * optional leading `0`, then `1` and one of the four carrier digits
 * (`010` / `011` / `012` / `015`), then eight more digits.
 *
 * The shop ships inside Egypt today (`Order.shippingCountry` defaults to
 * `"EG"`, the same assumption `utils/format.ts`'s `LOCALE`/`CURRENCY` make),
 * so the pattern is specific to that rather than a generic "looks like a
 * phone number" check that would accept far more than a courier could
 * actually call.
 *
 *   "01012345678"    ✓
 *   "1012345678"     ✓ (leading 0 optional)
 *   "+201012345678"  ✓
 *   "0101234567"     ✗ (nine digits after the carrier code, not ten)
 */
export const PHONE_PATTERN = /^(?:\+?20)?0?1[0125]\d{8}$/

const phone = z
  .string()
  .trim()
  .min(1, "رقم الهاتف مطلوب.")
  .regex(PHONE_PATTERN, "رقم هاتف مصري غير صالح — مثال: 01012345678.")

/** The second contact number is optional — an alternate to reach the shopper. */
const phone2 = z
  .string()
  .trim()
  .regex(PHONE_PATTERN, "رقم هاتف مصري غير صالح — مثال: 01012345678.")
  .nullable()

/**
 * The governorate select — one of `EGYPT_GOVERNORATES`, the same
 * "written-out list, checked at the boundary" pattern
 * `product.schema.ts`'s `productType` uses for a Prisma enum. This one is
 * not a database enum (an admin never adds a 28th governorate), but the rule
 * is identical: whatever arrives in the `FormData` must be one of the fixed
 * options the `<select>` actually offered.
 */
const governorate = z.enum(EGYPT_GOVERNORATES, { error: "اختر المحافظة." })

const city = z
  .string()
  .trim()
  .min(2, "المدينة مطلوبة.")
  .max(CITY_MAX, `اسم المدينة طويل — ${CITY_MAX} حرفًا كحد أقصى.`)

/** المركز — the administrative division under the governorate. */
const center = z
  .string()
  .trim()
  .min(2, "المركز مطلوب.")
  .max(CENTER_MAX, `اسم المركز طويل — ${CENTER_MAX} حرفًا كحد أقصى.`)

const street = z
  .string()
  .trim()
  .min(2, "الشارع مطلوب.")
  .max(STREET_MAX, `اسم الشارع طويل — ${STREET_MAX} حرفًا كحد أقصى.`)

/** العمارة — the building number or name, kept apart from the street name
 *  itself so each renders as its own line on the order detail pages. */
const building = z
  .string()
  .trim()
  .min(1, "رقم العمارة مطلوب.")
  .max(BUILDING_MAX, `رقم العمارة طويل — ${BUILDING_MAX} حرفًا كحد أقصى.`)

/* -------------------------------------------------------------------------
 * The form
 * ---------------------------------------------------------------------- */

export const checkoutFormSchema = z.object({
  phone,
  phone2,
  governorate,
  city,
  center,
  street,
  building,
})

export type CheckoutFormInput = z.infer<typeof checkoutFormSchema>

export type CheckoutFormErrors = Record<string, string>

/* -------------------------------------------------------------------------
 * FormData adapter
 * ---------------------------------------------------------------------- */

/**
 * Pull a checkout submission out of a `FormData` and validate it.
 *
 * Runs in both the browser (on submit, before the Server Action is touched —
 * so a mistake is visible without a round trip) and the Server Action itself
 * (on what actually arrived), the same double-run `parseProductForm` does and
 * for the identical reason: a Server Action is a public POST endpoint, and
 * nothing stops a direct call to it.
 *
 * An empty `phone2` box is `null`, not `""` — the second contact number is
 * optional, and `""` is not a value the schema should try to pattern-match.
 */
export function parseCheckoutForm(
  formData: FormData
):
  | { success: true; data: CheckoutFormInput }
  | { success: false; errors: CheckoutFormErrors } {
  const text = (key: string) => {
    const value = formData.get(key)
    return typeof value === "string" ? value.trim() : ""
  }

  const phone2Raw = text("phone2")

  const result = checkoutFormSchema.safeParse({
    phone: text("phone"),
    phone2: phone2Raw === "" ? null : phone2Raw,
    governorate: text("governorate"),
    city: text("city"),
    center: text("center"),
    street: text("street"),
    building: text("building"),
  })

  if (result.success) return { success: true, data: result.data }

  const { fieldErrors } = z.flattenError(result.error)

  const errors: CheckoutFormErrors = {}
  for (const [field, messages] of Object.entries(fieldErrors)) {
    if (messages?.[0]) errors[field] = messages[0]
  }

  return { success: false, errors }
}

/* -------------------------------------------------------------------------
 * Form state
 * ---------------------------------------------------------------------- */

/**
 * What `placeOrderAction` hands back to `useActionState`.
 *
 * Lives here rather than beside the action for the reason every other schema
 * in this project gives: a `"use server"` module may export only async
 * functions, so a plain object exported from `place-order.ts` would reach the
 * client as a broken server-reference stub.
 *
 * **No `"success"` status, and no `orderId`.** `placeOrderAction` used to
 * return one and let the client `router.push` to the new order — see
 * `place-order.ts`'s doc comment for why that raced `/checkout/page.tsx`'s own
 * empty-cart redirect and sent the shopper to `/cart` instead. The action now
 * calls `redirect()` itself on success, so this state is only ever read on
 * the error path; a successful submission never returns here at all.
 */
export type CheckoutFormState = {
  status: "idle" | "error"
  /** One line for the toast. `null` while idle. */
  message: string | null
  errors: CheckoutFormErrors
}

export const IDLE_CHECKOUT_FORM_STATE: CheckoutFormState = {
  status: "idle",
  message: null,
  errors: {},
}
