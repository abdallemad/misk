"use client"

import { startTransition, useActionState, useEffect, useState } from "react"
import { toast } from "sonner"

import { placeOrderAction } from "@/actions/checkout/place-order"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Form } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { EGYPT_GOVERNORATES } from "@/constants/egypt"
import {
  BUILDING_MAX,
  CENTER_MAX,
  CITY_MAX,
  IDLE_CHECKOUT_FORM_STATE,
  parseCheckoutForm,
  STREET_MAX,
  type CheckoutFormErrors,
} from "@/schemas/checkout.schema"

/**
 * The information collector between `/cart` and a placed order: the two
 * contact numbers and the Egyptian address, then one submit.
 *
 * Same shape as `product-form.tsx`, scaled down:
 *
 *   - **Dispatched from `onSubmit`, not `<form action>`.** React resets an
 *     uncontrolled form after a `<form action>` completes, including with
 *     errors — a shopper who mistyped their phone number should not have to
 *     retype their street too. So this runs `parseCheckoutForm` itself first
 *     (the client pass — visible without a round trip), and only calls the
 *     Server Action inside `startTransition` once that passes (the server
 *     pass — the one that is actually the gate, since the action is a public
 *     POST endpoint).
 *   - **The governorate `<Select>` is uncontrolled**, the same
 *     `name` + `items` + `defaultValue={null}` shape `product-form.tsx` uses
 *     for its category select — Base UI's Select carries its own hidden
 *     input, so it reaches `FormData` exactly like a plain `<Input>` would.
 *   - **Never navigates on success — `placeOrderAction` does, itself**, via
 *     `redirect()`. There is no `"success"` status to watch here at all; see
 *     `place-order.ts`'s doc comment for why a client-side `router.push` used
 *     to live here and why it raced `/checkout/page.tsx`'s empty-cart guard.
 *     This effect only ever has an error to show.
 */
export function CheckoutForm() {
  const [state, formAction, pending] = useActionState(
    placeOrderAction,
    IDLE_CHECKOUT_FORM_STATE
  )

  const [errors, setErrors] = useState<CheckoutFormErrors>({})

  useEffect(() => {
    if (state.status === "idle") return

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setErrors(state.errors)

    if (Object.keys(state.errors).length === 0) toast.error(state.message)
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
        <Field name="governorate">
          <FieldLabel htmlFor="checkout-governorate">المحافظة</FieldLabel>
          <Select name="governorate" items={governorateItems} defaultValue={null}>
            <SelectTrigger id="checkout-governorate" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EGYPT_GOVERNORATES.map((governorate) => (
                <SelectItem key={governorate} value={governorate}>
                  {governorate}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError />
        </Field>

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
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="center">
          <FieldLabel htmlFor="checkout-center">المركز</FieldLabel>
          <Input id="checkout-center" name="center" maxLength={CENTER_MAX} placeholder="مركز نصر" />
          <FieldError />
        </Field>

        <Field name="street">
          <FieldLabel htmlFor="checkout-street">الشارع</FieldLabel>
          <Input
            id="checkout-street"
            name="street"
            maxLength={STREET_MAX}
            placeholder="اسم الشارع"
            autoComplete="street-address"
          />
          <FieldError />
        </Field>
      </div>

      <Field name="building">
        <FieldLabel htmlFor="checkout-building">العمارة</FieldLabel>
        <Input
          id="checkout-building"
          name="building"
          maxLength={BUILDING_MAX}
          placeholder="رقم العمارة"
        />
        <FieldError />
      </Field>

      <Button type="submit" variant="gold" size="xl" className="w-full" disabled={pending}>
        {pending ? <Spinner /> : null}
        تأكيد الطلب — الدفع عند الاستلام
      </Button>
    </Form>
  )
}

/**
 * `items` is what lets `<SelectValue>` render a label instead of `null` before
 * anything is picked — same reasoning as `product-form.tsx`'s `categoryItems`.
 * The leading `null` entry is the placeholder.
 */
const governorateItems = [
  { value: null, label: "اختر المحافظة" },
  ...EGYPT_GOVERNORATES.map((governorate) => ({
    value: governorate,
    label: governorate,
  })),
]
