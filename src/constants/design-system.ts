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

import type { OrderStatus, ProductType } from "@prisma/client"

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

/**
 * Re-exported from Prisma rather than re-declared, for the same reason
 * `ProductType` is below: this file owns the *meaning* (which status is which
 * tone), and the schema owns the *set*. It used to be a hand-written union
 * with members the `OrderStatus` enum never had (`PAID`, `PROCESSING`,
 * `REFUNDED`) and missing ones it does (`CONFIRMED`, `IN_PRODUCTION`) — two
 * vocabularies for one concept, which is the drift this file exists to
 * prevent. `import type` keeps the query engine out of the client bundle.
 */
export type { OrderStatus }

export const ORDER_STATUS_TONE: Record<OrderStatus, Tone> = {
  PENDING: "warning",
  CONFIRMED: "info",
  IN_PRODUCTION: "gold",
  SHIPPED: "info",
  DELIVERED: "success",
  CANCELLED: "danger",
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "بانتظار التأكيد",
  CONFIRMED: "مؤكّد",
  IN_PRODUCTION: "قيد التحضير",
  SHIPPED: "تم الشحن",
  DELIVERED: "تم التسليم",
  CANCELLED: "ملغي",
}

/**
 * The six statuses in fulfilment order — for a status `<select>` and for
 * validating one that arrives from the client. Written out as literals and
 * checked with `satisfies` (the same pattern `constants/catalog.ts` uses for
 * the product enums) so a new `OrderStatus` member is a compile error here
 * until it is placed in the sequence deliberately.
 */
export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "IN_PRODUCTION",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const satisfies readonly OrderStatus[]

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
 *
 * **Categories are database rows now**, not an enum (see
 * docs/categories-feature.md), so an admin can create a fourth segment this
 * map has never heard of. That makes this a map of *known* slugs rather than
 * an exhaustive one — always read it through `categoryAccent()` below, which
 * has an answer for a slug that is not here. The three keys survive because
 * the brand's founding segments are designed, not generated; a new segment
 * gets the neutral accent until someone draws it one.
 *
 * `label` and `note` are the seed copy for those three. Once the row exists,
 * the *row* is the source of truth for its name and description — this is
 * only where the colour lives.
 * ---------------------------------------------------------------------- */

export type CategorySlug = "youth" | "women" | "men"

export type CategoryAccent = {
  label: string
  note: string
  text: string
  bg: string
  border: string
}

export const CATEGORY_ACCENT: Record<CategorySlug, CategoryAccent> = {
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

/**
 * What an admin-created segment looks like until it is given a hue of its
 * own — deliberately the neutral ink rather than a colour picked at random,
 * so an unstyled segment reads as "no accent yet" and not as a fourth brand
 * colour nobody chose.
 */
const NEUTRAL_CATEGORY_ACCENT: CategoryAccent = {
  label: "",
  note: "",
  text: "text-muted-foreground",
  bg: "bg-muted",
  border: "border-border",
}

/**
 * The accent for a category slug, for any slug.
 *
 * Never index `CATEGORY_ACCENT` directly with a value that came out of the
 * database: TypeScript will type the result as present, and a segment the
 * admin invented would hand `undefined` to a `className`, which renders as
 * the literal string "undefined" in the class list rather than failing
 * loudly.
 */
export function categoryAccent(slug: string): CategoryAccent {
  return CATEGORY_ACCENT[slug as CategorySlug] ?? NEUTRAL_CATEGORY_ACCENT
}

/* -------------------------------------------------------------------------
 * Product type
 *
 * The one branch that runs through the whole app: an ALCOHOL product is sold
 * by volume, a RAW_OIL product by weight. Giving each an accent lets a
 * shopper tell the two lines apart at a glance in a mixed grid.
 * ---------------------------------------------------------------------- */

/**
 * Re-exported from Prisma rather than re-declared, because this used to be a
 * hand-written `"ALCOHOL" | "RAW_OIL"` and the schema calls the first member
 * `ALCOHOL_BASED` — two vocabularies for one concept, which is exactly the
 * drift this file exists to prevent. `import type` keeps the query engine out
 * of the client bundle; the values themselves live in `constants/catalog.ts`.
 */
export type { ProductType }

export const PRODUCT_TYPE_ACCENT: Record<
  ProductType,
  { label: string; short: string; unit: string; text: string; bg: string }
> = {
  ALCOHOL_BASED: {
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
