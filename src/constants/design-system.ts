/**
 * Design system — the TypeScript half.
 *
 * `src/app/globals.css` owns the colour values. This file owns the *meaning*:
 * which domain concept (an order status, a category, a product type) maps to
 * which semantic tone. Keeping the mapping here means a badge in the admin
 * orders table and a badge on the storefront can never disagree.
 *
 * Every class string below is written out in full — Tailwind scans source
 * text, so `bg-${tone}-soft` would compile to nothing.
 */

/* -------------------------------------------------------------------------
 * Tones
 * ---------------------------------------------------------------------- */

/** The six semantic tones. Everything visual resolves down to one of these. */
export const TONES = [
  "neutral",
  "gold",
  "success",
  "warning",
  "info",
  "danger",
] as const

export type Tone = (typeof TONES)[number]

/** Soft fill + readable text — the default for badges and pills. */
export const TONE_SOFT_CLASS: Record<Tone, string> = {
  neutral: "bg-neutral-soft text-neutral-soft-foreground",
  gold: "bg-gold-soft text-gold-soft-foreground",
  success: "bg-success-soft text-success-soft-foreground",
  warning: "bg-warning-soft text-warning-soft-foreground",
  info: "bg-info-soft text-info-soft-foreground",
  danger: "bg-destructive-soft text-destructive-soft-foreground",
}

/** Full-strength fill — reserve for one element per view. */
export const TONE_SOLID_CLASS: Record<Tone, string> = {
  neutral: "bg-primary text-primary-foreground",
  gold: "bg-gold text-gold-foreground",
  success: "bg-success text-success-foreground",
  warning: "bg-warning text-warning-foreground",
  info: "bg-info text-info-foreground",
  danger: "bg-destructive text-destructive-foreground",
}

/** Just the ink — for a status dot or an inline icon. */
export const TONE_TEXT_CLASS: Record<Tone, string> = {
  neutral: "text-muted-foreground",
  gold: "text-gold",
  success: "text-success",
  warning: "text-warning",
  info: "text-info",
  danger: "text-destructive",
}

/* -------------------------------------------------------------------------
 * Order status
 * ---------------------------------------------------------------------- */

export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED"

export const ORDER_STATUS_TONE: Record<OrderStatus, Tone> = {
  PENDING: "warning",
  PAID: "info",
  PROCESSING: "info",
  SHIPPED: "gold",
  DELIVERED: "success",
  CANCELLED: "danger",
  REFUNDED: "neutral",
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "بانتظار الدفع",
  PAID: "مدفوع",
  PROCESSING: "قيد التحضير",
  SHIPPED: "تم الشحن",
  DELIVERED: "تم التسليم",
  CANCELLED: "ملغي",
  REFUNDED: "مسترد",
}

/* -------------------------------------------------------------------------
 * Stock
 *
 * Misk blends to order, so "out of stock" is rarer than "low" — the tone
 * scale is tuned to nudge rather than alarm.
 * ---------------------------------------------------------------------- */

export const LOW_STOCK_THRESHOLD = 5

export type StockLevel = "in-stock" | "low-stock" | "out-of-stock"

export function stockLevel(stock: number): StockLevel {
  if (stock <= 0) return "out-of-stock"
  if (stock <= LOW_STOCK_THRESHOLD) return "low-stock"
  return "in-stock"
}

export const STOCK_TONE: Record<StockLevel, Tone> = {
  "in-stock": "success",
  "low-stock": "warning",
  "out-of-stock": "neutral",
}

export const STOCK_LABEL: Record<StockLevel, string> = {
  "in-stock": "متوفر",
  "low-stock": "كمية محدودة",
  "out-of-stock": "يُحضَّر عند الطلب",
}

/* -------------------------------------------------------------------------
 * Catalog accents
 *
 * Youth / Women / Men each carry a hue drawn from the scent family that
 * defines the line. Used as a hairline, a dot or a nav underline — never as
 * a background fill, which would fight the ivory ground.
 * ---------------------------------------------------------------------- */

export type CategorySlug = "youth" | "women" | "men"

export const CATEGORY_ACCENT: Record<
  CategorySlug,
  { label: string; note: string; text: string; bg: string; border: string }
> = {
  youth: {
    label: "شبابي",
    note: "برغموت وحمضيات، نفَس منعش",
    text: "text-category-youth",
    bg: "bg-category-youth",
    border: "border-category-youth",
  },
  women: {
    label: "نسائي",
    note: "ورد وزهور، لمسة بودرية",
    text: "text-category-women",
    bg: "bg-category-women",
    border: "border-category-women",
  },
  men: {
    label: "رجالي",
    note: "عود وجلد، عمق راتنجي",
    text: "text-category-men",
    bg: "bg-category-men",
    border: "border-category-men",
  },
}

/* -------------------------------------------------------------------------
 * Product type
 *
 * The one branch that runs through the whole app: an ALCOHOL product is sold
 * by volume with a bottle style, a RAW_OIL product by weight with none.
 * Giving each an accent lets a shopper tell the two lines apart at a glance
 * in a mixed grid.
 * ---------------------------------------------------------------------- */

export type ProductType = "ALCOHOL" | "RAW_OIL"

export const PRODUCT_TYPE_ACCENT: Record<
  ProductType,
  { label: string; short: string; unit: string; text: string; bg: string }
> = {
  ALCOHOL: {
    label: "عطر كحولي",
    short: "EDP",
    unit: "ml",
    text: "text-type-alcohol",
    bg: "bg-type-alcohol",
  },
  RAW_OIL: {
    label: "دهن عطري مركّز",
    short: "Duhn",
    unit: "g",
    text: "text-type-oil",
    bg: "bg-type-oil",
  },
}

/* -------------------------------------------------------------------------
 * Data viz
 *
 * Ordered so that adjacent series stay distinguishable. Pass straight to
 * Recharts `fill` / `stroke`.
 * ---------------------------------------------------------------------- */

export const CHART_SERIES = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const
