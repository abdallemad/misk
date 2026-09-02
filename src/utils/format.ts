import type { ProductType } from "@/constants/design-system"

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
 * "100ml · فاخرة" for the alcohol line, "8g" for raw oil. Order line items
 * snapshot this string at purchase time.
 * ---------------------------------------------------------------------- */

export const SIZE_LABEL = {
  ML_30: "30ml",
  ML_50: "50ml",
  ML_100: "100ml",
} as const

export const WEIGHT_LABEL = {
  G_5: "5g",
  G_8: "8g",
  G_12: "12g",
} as const

export const BOTTLE_STYLE_LABEL = {
  LUXURY: "عبوة فاخرة",
  REGULAR: "عبوة عادية",
} as const

type VariantShape =
  | {
      type: Extract<ProductType, "ALCOHOL">
      size: keyof typeof SIZE_LABEL
      bottleStyle: keyof typeof BOTTLE_STYLE_LABEL
    }
  | { type: Extract<ProductType, "RAW_OIL">; weight: keyof typeof WEIGHT_LABEL }

export function formatVariantLabel(variant: VariantShape): string {
  if (variant.type === "RAW_OIL") return WEIGHT_LABEL[variant.weight]

  return `${SIZE_LABEL[variant.size]} · ${BOTTLE_STYLE_LABEL[variant.bottleStyle]}`
}
