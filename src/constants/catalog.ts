import type {
  BottleSize,
  BottleStyle,
  OilWeight,
  ProductType,
} from "@prisma/client"

/**
 * The catalog's fixed vocabulary — the four Prisma enums, in the order they
 * are offered, with the Arabic each one is written as.
 *
 * These are enums rather than tables (unlike `Category`, which had to stop
 * being one — see docs/categories-feature.md) because they are facts about
 * the bottles and the fills the workshop actually owns. A fifth bottle size
 * is a purchase order and a photoshoot, not a Tuesday-afternoon merchandising
 * decision, so putting it behind a migration is the right amount of friction.
 *
 * **Types are imported, never the runtime enum objects.** `import type` is
 * erased at compile time; a value import of `@prisma/client` would drag the
 * query engine into any Client Component that touches a label. That is why
 * the arrays below are written out as literals and then *checked* against the
 * enum instead of derived from it.
 *
 * The two guards keep that honest in both directions:
 *   - `satisfies readonly X[]` — nothing invented, every entry is a real
 *     member;
 *   - `Exhaustive<…>` — nothing forgotten, adding a member to the schema
 *     without adding it here is a type error rather than an option that
 *     silently never appears in the admin form.
 */

/**
 * Fails to resolve — and so fails the build — when `Listed` does not cover
 * every member of `All`. The `never` is the point: it makes an omission a
 * compile error at the line that omitted it.
 */
type Exhaustive<All extends string, Listed extends All> = [
  Exclude<All, Listed>,
] extends [never]
  ? true
  : never

/* -------------------------------------------------------------------------
 * Product type
 * ---------------------------------------------------------------------- */

/** Cheapest first is wrong here; this is the order the shop thinks in. */
export const PRODUCT_TYPES = [
  "ALCOHOL_BASED",
  "RAW_OIL",
] as const satisfies readonly ProductType[]

export type _ProductTypesExhaustive = Exhaustive<
  ProductType,
  (typeof PRODUCT_TYPES)[number]
>

export const PRODUCT_TYPE_LABEL: Record<ProductType, string> = {
  ALCOHOL_BASED: "عطر كحولي",
  RAW_OIL: "دهن عطري مركّز",
}

/** One line explaining what choosing this type commits the product to. */
export const PRODUCT_TYPE_HINT: Record<ProductType, string> = {
  ALCOHOL_BASED: "يُباع بالحجم ونوع العبوة — 30/50/100 مل، فاخرة أو عادية.",
  RAW_OIL: "يُباع بالوزن فقط — 5/8/12 جرام، بلا نوع عبوة.",
}

/* -------------------------------------------------------------------------
 * Alcohol-based line — bottle size × bottle style
 * ---------------------------------------------------------------------- */

export const BOTTLE_SIZES = [
  "ML_30",
  "ML_50",
  "ML_100",
] as const satisfies readonly BottleSize[]

export type _BottleSizesExhaustive = Exhaustive<
  BottleSize,
  (typeof BOTTLE_SIZES)[number]
>

/**
 * Latin digits and the Latin unit, deliberately — the same call
 * `utils/format.ts` documents for prices. "30ml" survives being read aloud,
 * copied into a courier form, and printed on a label.
 */
export const BOTTLE_SIZE_LABEL: Record<BottleSize, string> = {
  ML_30: "30ml",
  ML_50: "50ml",
  ML_100: "100ml",
}

export const BOTTLE_STYLES = [
  "LUXURY",
  "REGULAR",
] as const satisfies readonly BottleStyle[]

export type _BottleStylesExhaustive = Exhaustive<
  BottleStyle,
  (typeof BOTTLE_STYLES)[number]
>

export const BOTTLE_STYLE_LABEL: Record<BottleStyle, string> = {
  LUXURY: "عبوة فاخرة",
  REGULAR: "عبوة عادية",
}

/* -------------------------------------------------------------------------
 * Raw oil line — weight only
 * ---------------------------------------------------------------------- */

export const OIL_WEIGHTS = [
  "G_5",
  "G_8",
  "G_12",
] as const satisfies readonly OilWeight[]

export type _OilWeightsExhaustive = Exhaustive<
  OilWeight,
  (typeof OIL_WEIGHTS)[number]
>

export const OIL_WEIGHT_LABEL: Record<OilWeight, string> = {
  G_5: "5g",
  G_8: "8g",
  G_12: "12g",
}

/* -------------------------------------------------------------------------
 * Guards
 * ---------------------------------------------------------------------- */

/**
 * Narrow a raw `FormData` string to a member of one of the lists above.
 *
 * Written once and reused for all four enums, because every one of them
 * arrives from the browser as an untrusted string and none of them may be
 * cast. `Array.includes` on a `readonly T[]` refuses a `string` argument in
 * TypeScript, hence the widening cast on the *array* rather than the value —
 * the value is what we are trying to prove something about.
 */
export function isMember<T extends string>(
  members: readonly T[],
  value: unknown
): value is T {
  return typeof value === "string" && (members as readonly string[]).includes(value)
}

/** The variant fields a product of this type is sold by. */
export const VARIANT_AXES: Record<
  ProductType,
  readonly ("bottleSize" | "bottleStyle" | "oilWeight")[]
> = {
  ALCOHOL_BASED: ["bottleSize", "bottleStyle"],
  RAW_OIL: ["oilWeight"],
}
