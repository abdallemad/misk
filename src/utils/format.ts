import type { BottleSize, OilWeight, ProductType } from "@prisma/client"

import { BOTTLE_SIZE_LABEL, OIL_WEIGHT_LABEL } from "@/constants/catalog"

/**
 * Formatting — the numeric half of an Arabic design system.
 *
 * Arabic can be set with Arabic-Indic digits (٠١٢٣) or Latin ones (0123).
 * Egyptian commerce overwhelmingly prints prices in Latin digits, and Latin
 * digits also survive being copied into a bank app or a courier form — so
 * that is the house default, pinned here with the `-u-nu-latn` extension
 * rather than left to whatever the runtime's `ar-EG` happens to prefer.
 *
 * Change `LOCALE` and every price in the app follows.
 */
export const LOCALE = "ar-EG-u-nu-latn"
export const CURRENCY = "EGP"

const currencyFormatter = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: CURRENCY,
  maximumFractionDigits: 0,
})

const numberFormatter = new Intl.NumberFormat(LOCALE)

/**
 * Wrap the result in an element carrying `data-numeric` — the base layer
 * gives that `direction: ltr` and bidi isolation, without which
 * "1,250 ج.م." reorders inside an RTL sentence.
 */
export function formatPrice(amount: number): string {
  return currencyFormatter.format(amount)
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    dateStyle: "medium",
  }).format(typeof date === "string" ? new Date(date) : date)
}

/* -------------------------------------------------------------------------
 * Variant labels
 *
 * The one string that has to say what a shopper actually bought, and the one
 * place the two variant shapes are flattened into a single line of text:
 * "100ml" for the alcohol line, "8g" for raw oil. Order line items snapshot
 * this string at purchase time.
 *
 * The vocabulary itself lives in `constants/catalog.ts` — this module owns
 * the *sentence*, not the words, the same split `constants/design-system.ts`
 * and `components/shared/status-badge.tsx` already use.
 * ---------------------------------------------------------------------- */

/**
 * The three columns of a `ProductVariant` that decide its label, shaped
 * exactly as Prisma returns them.
 *
 * Nullable on purpose, even though a well-formed variant always has the
 * field its product type calls for: `product.service.ts` is what guarantees
 * that, and a formatter that re-states the guarantee in its types just moves
 * the cast to the call site. Here a violation renders as "—" instead of
 * crashing a page.
 */
export type VariantShape = {
  productType: ProductType
  bottleSize: BottleSize | null
  oilWeight: OilWeight | null
}

export function formatVariantLabel(variant: VariantShape): string {
  if (variant.productType === "RAW_OIL") {
    return variant.oilWeight ? OIL_WEIGHT_LABEL[variant.oilWeight] : "—"
  }

  return variant.bottleSize ? BOTTLE_SIZE_LABEL[variant.bottleSize] : "—"
}
