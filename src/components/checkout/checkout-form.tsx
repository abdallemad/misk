"use client"

import { useRouter } from "next/navigation"
import { startTransition, useActionState, useEffect, useState } from "react"
import { toast } from "sonner"

import { placeOrderAction } from "@/actions/checkout/place-order"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Form } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { accountOrderRoute } from "@/constants/routes"
import {
  CITY_MAX,
  IDLE_CHECKOUT_FORM_STATE,
  parseCheckoutForm,
  STREET_MAX,
  type CheckoutFormErrors,
} from "@/schemas/checkout.schema"

/**
 * The information collector between `/cart` and a placed order: the two
 * contact numbers and the address, then one submit.
 *
 * Same shape as `product-form.tsx`, scaled down to four fields:
 *
 *   - **Dispatched from `onSubmit`, not `<form action>`.** React resets an
 *     uncontrolled form after a `<form action>` completes, including with
 *     errors — a shopper who mistyped their phone number should not have to
 *     retype their street too. So this runs `parseCheckoutForm` itself first
 *     (the client pass — visible without a round trip), and only calls the
 *     Server Action inside `startTransition` once that passes (the server
 *     pass — the one that is actually the gate, since the action is a public
 *     POST endpoint).
 *   - **Navigates away on success**, to the new order — the effect below
 *     watches `state.status`.
 */
export function CheckoutForm() {
  const router = useRouter()

  const [state, formAction, pending] = useActionState(
    placeOrderAction,
    IDLE_CHECKOUT_FORM_STATE
  )

  const [errors, setErrors] = useState<CheckoutFormErrors>({})

  useEffect(() => {
    if (state.status === "idle") return

    if (state.status === "success" && state.orderId) {
      toast.success(state.message)
      router.push(accountOrderRoute(state.orderId))
      return
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setErrors(state.errors)

    if (Object.keys(state.errors).length === 0) toast.error(state.message)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const parsed = parseCheckoutForm(formData)

    if (!parsed.success) {
      setErrors(parsed.errors)
      return
    }

    setErrors({})
    startTransition(() => formAction(formData))
  }

  return (
    <Form errors={errors} onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="phone">
          <FieldLabel htmlFor="checkout-phone">رقم الهاتف</FieldLabel>
          <Input
            id="checkout-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            dir="ltr"
            className="text-end"
            placeholder="01012345678"
            autoComplete="tel"
          />
          <FieldError />
        </Field>

        <Field name="phone2">
          <FieldLabel htmlFor="checkout-phone2">
            رقم هاتف إضافي <span className="text-muted-foreground">(اختياري)</span>
          </FieldLabel>
          <Input
            id="checkout-phone2"
            name="phone2"
            type="tel"
            inputMode="tel"
            dir="ltr"
            className="text-end"
            placeholder="01098765432"
            autoComplete="tel"
          />
          <FieldError />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="city">
          <FieldLabel htmlFor="checkout-city">المدينة</FieldLabel>
          <Input
            id="checkout-city"
            name="city"
            maxLength={CITY_MAX}
            placeholder="القاهرة"
            autoComplete="address-level2"
          />
          <FieldError />
        </Field>

        <Field name="street">
          <FieldLabel htmlFor="checkout-street">العنوان</FieldLabel>
          <Input
            id="checkout-street"
            name="street"
            maxLength={STREET_MAX}
            placeholder="اسم الشارع ورقم المبنى"
            autoComplete="street-address"
          />
          <FieldError />
        </Field>
      </div>

      <Button type="submit" variant="gold" size="xl" className="w-full" disabled={pending}>
        {pending ? <Spinner /> : null}
        تأكيد الطلب — الدفع عند الاستلام
      </Button>
    </Form>
  )
}
