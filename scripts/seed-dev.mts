/**
 * Fill a development database with a believable catalog, a roster of
 * customers, and a history of orders — enough that every admin screen and
 * every storefront page has something real to render.
 *
 *   npm run seed-dev
 *
 * Run through Node's own TypeScript stripping and `--env-file`, exactly like
 * `grant-admin.mts` and `seed-categories.mts` — no extra dependency, no build
 * step, no `ts-node`. See docs/database-seeding.md.
 *
 * ------------------------------------------------------------------------
 * Two properties this script is built around
 * ------------------------------------------------------------------------
 *
 * 1. **Idempotent.** Every row it owns is written through an `upsert` keyed on
 *    a natural unique column (`Category.slug`, `Ingredient.name`,
 *    `Product.slug`, `ProductVariant.sku`, `User.clerkId`). Running it twice
 *    changes nothing the second time. The one exception is orders: those are
 *    deleted and rebuilt on every run, but *only* for the users this script
 *    created — a real order placed by a real signed-in account is never
 *    touched.
 *
 * 2. **Deterministic.** All "randomness" comes from a seeded PRNG, so the
 *    fourth product has the same variants and the seventh customer the same
 *    order history on every machine and every run. A bug that only shows up
 *    on one particular shape of data is reproducible.
 *
 * ------------------------------------------------------------------------
 * What it will not do
 * ------------------------------------------------------------------------
 *
 * - **It refuses to run with `NODE_ENV=production`.** The fake customers have
 *   `clerkId`s that no Clerk instance will ever issue, so they can never sign
 *   in — but they would still pollute the admin customers list and every
 *   dashboard count, and their orders would skew real reporting.
 * - **It creates no image files.** `public/uploads` is per-environment and
 *   not in git (see docs/categories-feature.md), and on a serverless deploy
 *   it is not writable at all. Seeded products and categories therefore have
 *   `imageUrl = null` / no gallery rows; the admin tables already render a
 *   placeholder for that, and it keeps this script from depending on
 *   `lib/uploads.ts` (which is `server-only`).
 * - **It does not grant anyone admin.** That still goes through
 *   `npm run grant-admin` and Clerk — see docs/admin-access-control.md.
 */

import { PrismaClient } from "@prisma/client"

const db = new PrismaClient()

/** The prefix every fake account's `clerkId` carries — the handle this script
 *  uses to find and rebuild only its own data. Real Clerk ids look like
 *  `user_2abc…`, so this can never collide with one. */
const SEED_CLERK_PREFIX = "seed_dev_"

/* =========================================================================
 * Determinism
 * ====================================================================== */

/**
 * mulberry32 — a tiny, well-distributed 32-bit PRNG. Seeded with a constant
 * so the whole dataset is a pure function of this file: same products, same
 * variants, same order history on every machine and every run.
 */
function makeRng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rng = makeRng(20260903)

/** Integer in `[min, max]`, inclusive. */
function randInt(min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1))
}

/** One element of `list`. */
function pick<T>(list: readonly T[]): T {
  return list[Math.floor(rng() * list.length)]!
}

/** `count` distinct elements of `list`, or all of them if `count` is larger. */
function sample<T>(list: readonly T[], count: number): T[] {
  const pool = [...list]
  const out: T[] = []
  while (out.length < count && pool.length > 0) {
    out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]!)
  }
  return out
}

/** A `Date` `daysAgo` days before now, jittered by a few hours for realism. */
function daysAgo(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(randInt(6, 22), randInt(0, 59), 0, 0)
  return d
}

/* =========================================================================
 * Source data
 * ====================================================================== */

/** The three founding segments — same copy as `seed-categories.mts`, kept in
 *  sync by hand because that script is the canonical one and this is a
 *  superset of it. */
const CATEGORIES = [
  { slug: "youth", name: "شبابي", description: "برغموت وحمضيات، نفَس منعش", position: 0 },
  { slug: "women", name: "نسائي", description: "ورد وزهور، لمسة بودرية", position: 1 },
  { slug: "men", name: "رجالي", description: "عود وجلد، عمق راتنجي", position: 2 },
] as const

/** The raw-material master list. `note` is what lands on the join row. */
const INGREDIENTS = [
  { name: "كحول طبي نقي", description: "إيثانول صيدلي يُستخدم مذيبًا للعطور الكحولية." },
  { name: "زيت عود كلمنتان", description: "عود متوسّط الكثافة، نفَس خشبي دافئ." },
  { name: "زيت عود - درجة أولى", description: "أجود درجات العود، يُستخدم في الدهن المركّز." },
  { name: "زيت ورد طائفي", description: "ورد جبلي، افتتاحية زهرية كثيفة." },
  { name: "مسك أبيض", description: "قاعدة نظيفة ناعمة تُطيل ثبات المزيج." },
  { name: "عنبر رمادي", description: "قاعدة راتنجية مالحة، عمق وثبات." },
  { name: "خشب الصندل", description: "صندل كريمي يوازن الحدّة في القلب." },
  { name: "برغموت كالابريا", description: "حمضيات مشرقة في المقدمة." },
  { name: "ياسمين سامباك", description: "زهرة ليلية غنية، قلب أنثوي." },
  { name: "فانيليا بوربون", description: "حلاوة دافئة في القاعدة." },
  { name: "باتشولي", description: "ترابي داكن يثبّت العطر." },
  { name: "زعفران", description: "لمسة جلدية توابلية في القلب." },
] as const

type ProductSeed = {
  slug: string
  name: string
  categorySlug: (typeof CATEGORIES)[number]["slug"]
  productType: "ALCOHOL_BASED" | "RAW_OIL"
  description: string
  ingredients: { name: string; note: string }[]
  /** Base price for the cheapest variant, in whole EGP. Larger sizes / the
   *  luxury bottle / more grams scale up from here. */
  basePrice: number
  /** A few products are pulled from the storefront so "hidden" has a row. */
  isActive?: boolean
}

const PRODUCTS: ProductSeed[] = [
  {
    slug: "misk-rose",
    name: "مسك الورد",
    categorySlug: "women",
    productType: "ALCOHOL_BASED",
    description:
      "ورد طائفي في المقدمة يهدأ إلى مسك أبيض ناعم — عطر يومي أنثوي بثبات معتدل.",
    ingredients: [
      { name: "كحول طبي نقي", note: "مذيب أساسي" },
      { name: "زيت ورد طائفي", note: "نوتة المقدمة" },
      { name: "مسك أبيض", note: "قاعدة" },
    ],
    basePrice: 320,
  },
  {
    slug: "layl-oud",
    name: "ليل العود",
    categorySlug: "men",
    productType: "ALCOHOL_BASED",
    description:
      "عود كلمنتان وجلد وزعفران — افتتاحية داكنة تلائم السهرات الباردة.",
    ingredients: [
      { name: "كحول طبي نقي", note: "مذيب أساسي" },
      { name: "زيت عود كلمنتان", note: "قلب" },
      { name: "زعفران", note: "قلب توابلي" },
      { name: "عنبر رمادي", note: "قاعدة" },
    ],
    basePrice: 460,
  },
  {
    slug: "sabah-bergamot",
    name: "صباح البرغموت",
    categorySlug: "youth",
    productType: "ALCOHOL_BASED",
    description: "برغموت كالابريا وحمضيات مشرقة على قاعدة مسك خفيفة — نفَس منعش لكل يوم.",
    ingredients: [
      { name: "كحول طبي نقي", note: "مذيب أساسي" },
      { name: "برغموت كالابريا", note: "مقدمة" },
      { name: "مسك أبيض", note: "قاعدة" },
    ],
    basePrice: 260,
  },
  {
    slug: "sandal-warm",
    name: "صندل دافئ",
    categorySlug: "men",
    productType: "ALCOHOL_BASED",
    description: "خشب صندل كريمي مع فانيليا بوربون وباتشولي — دفء خشبي هادئ.",
    ingredients: [
      { name: "كحول طبي نقي", note: "مذيب أساسي" },
      { name: "خشب الصندل", note: "قلب" },
      { name: "فانيليا بوربون", note: "قاعدة" },
      { name: "باتشولي", note: "قاعدة" },
    ],
    basePrice: 380,
  },
  {
    slug: "yasmin-night",
    name: "ياسمين الليل",
    categorySlug: "women",
    productType: "ALCOHOL_BASED",
    description: "ياسمين سامباك غني على قاعدة صندل وفانيليا — عطر مسائي أنثوي.",
    ingredients: [
      { name: "كحول طبي نقي", note: "مذيب أساسي" },
      { name: "ياسمين سامباك", note: "قلب" },
      { name: "خشب الصندل", note: "قاعدة" },
      { name: "فانيليا بوربون", note: "قاعدة" },
    ],
    basePrice: 400,
  },
  {
    slug: "citrus-spark",
    name: "شرارة الحمضيات",
    categorySlug: "youth",
    productType: "ALCOHOL_BASED",
    description: "برغموت وحمضيات فوّارة مع باتشولي خفيف — عطر رياضي نهاري.",
    ingredients: [
      { name: "كحول طبي نقي", note: "مذيب أساسي" },
      { name: "برغموت كالابريا", note: "مقدمة" },
      { name: "باتشولي", note: "قاعدة" },
    ],
    basePrice: 240,
  },
  {
    slug: "amber-veil",
    name: "ستارة العنبر",
    categorySlug: "women",
    productType: "ALCOHOL_BASED",
    description: "عنبر رمادي ومسك على لمسة ورد — قاعدة راتنجية دافئة تدوم طويلًا.",
    ingredients: [
      { name: "كحول طبي نقي", note: "مذيب أساسي" },
      { name: "عنبر رمادي", note: "قاعدة" },
      { name: "مسك أبيض", note: "قاعدة" },
      { name: "زيت ورد طائفي", note: "لمسة قلب" },
    ],
    basePrice: 420,
  },
  {
    slug: "green-youth",
    name: "أخضر الشباب",
    categorySlug: "youth",
    productType: "ALCOHOL_BASED",
    description: "افتتاحية خضراء عشبية مع برغموت ومسك — خفيف وعصري.",
    ingredients: [
      { name: "كحول طبي نقي", note: "مذيب أساسي" },
      { name: "برغموت كالابريا", note: "مقدمة" },
      { name: "مسك أبيض", note: "قاعدة" },
    ],
    basePrice: 250,
    isActive: false,
  },
  {
    slug: "leather-noir",
    name: "جلد أسود",
    categorySlug: "men",
    productType: "ALCOHOL_BASED",
    description: "جلد وزعفران وعود — عطر توقيعي ثقيل للمناسبات.",
    ingredients: [
      { name: "كحول طبي نقي", note: "مذيب أساسي" },
      { name: "زعفران", note: "قلب" },
      { name: "زيت عود كلمنتان", note: "قاعدة" },
      { name: "عنبر رمادي", note: "قاعدة" },
    ],
    basePrice: 520,
  },
  {
    slug: "white-musk-soft",
    name: "مسك أبيض ناعم",
    categorySlug: "women",
    productType: "ALCOHOL_BASED",
    description: "مسك أبيض نظيف مع لمسة فانيليا — عطر هادئ قريب من الجلد.",
    ingredients: [
      { name: "كحول طبي نقي", note: "مذيب أساسي" },
      { name: "مسك أبيض", note: "قاعدة رئيسية" },
      { name: "فانيليا بوربون", note: "لمسة قاعدة" },
    ],
    basePrice: 300,
  },
  {
    slug: "duhn-oud-first",
    name: "دهن عود درجة أولى",
    categorySlug: "men",
    productType: "RAW_OIL",
    description:
      "دهن عود خالص من أجود الدرجات، بلا كحول — يُباع بالوزن للاستخدام المركّز.",
    ingredients: [
      { name: "زيت عود - درجة أولى", note: "المكوّن الوحيد" },
    ],
    basePrice: 900,
  },
  {
    slug: "duhn-rose-attar",
    name: "دهن الورد",
    categorySlug: "women",
    productType: "RAW_OIL",
    description: "دهن ورد طائفي مركّز على قاعدة صندل خفيفة — عطر زيتي يدوم طويلًا.",
    ingredients: [
      { name: "زيت ورد طائفي", note: "أساس" },
      { name: "خشب الصندل", note: "قاعدة" },
    ],
    basePrice: 650,
  },
  {
    slug: "duhn-musk-amber",
    name: "دهن المسك والعنبر",
    categorySlug: "youth",
    productType: "RAW_OIL",
    description: "مزيج دهني من المسك الأبيض والعنبر — دافئ وناعم على البشرة.",
    ingredients: [
      { name: "مسك أبيض", note: "أساس" },
      { name: "عنبر رمادي", note: "قاعدة" },
    ],
    basePrice: 500,
  },
  {
    slug: "duhn-sandal-pure",
    name: "دهن الصندل الخالص",
    categorySlug: "men",
    productType: "RAW_OIL",
    description: "دهن صندل هندي خالص — كريمي خشبي، للاستخدام المباشر بكميات صغيرة.",
    ingredients: [{ name: "خشب الصندل", note: "المكوّن الوحيد" }],
    basePrice: 700,
    isActive: false,
  },
]

/** Fake customers. Latin handle → email + a readable Arabic display name. */
const CUSTOMERS = [
  { handle: "sara-ahmed", name: "سارة أحمد", phone: "+201000000001" },
  { handle: "mohamed-ali", name: "محمد علي", phone: "+201000000002" },
  { handle: "nour-hassan", name: "نور حسن", phone: null },
  { handle: "youssef-ibrahim", name: "يوسف إبراهيم", phone: "+201000000004" },
  { handle: "mariam-adel", name: "مريم عادل", phone: "+201000000005" },
  { handle: "omar-khaled", name: "عمر خالد", phone: null },
  { handle: "hana-mostafa", name: "هنا مصطفى", phone: "+201000000007" },
  { handle: "ahmed-tarek", name: "أحمد طارق", phone: "+201000000008" },
  { handle: "laila-samir", name: "ليلى سمير", phone: null },
  { handle: "karim-fouad", name: "كريم فؤاد", phone: "+201000000010" },
  { handle: "dina-magdy", name: "دينا مجدي", phone: null },
  { handle: "tamer-said", name: "تامر سعيد", phone: "+201000000012" },
  { handle: "rana-ashraf", name: "رنا أشرف", phone: "+201000000013" },
  { handle: "khaled-nabil", name: "خالد نبيل", phone: null },
  { handle: "salma-hesham", name: "سلمى هشام", phone: "+201000000015" },
  { handle: "amir-gamal", name: "أمير جمال", phone: "+201000000016" },
  { handle: "farida-yasser", name: "فريدة ياسر", phone: null },
  { handle: "hassan-lotfy", name: "حسن لطفي", phone: "+201000000018" },
] as const

/** Egyptian shipping targets — one governorate, a couple of its areas, and a
 *  street, combined per order into a snapshot on `Order.shipping*`. */
const SHIPPING_AREAS = [
  { governorate: "القاهرة", cities: ["مدينة نصر", "المعادي", "مصر الجديدة", "المقطم"] },
  { governorate: "الجيزة", cities: ["الدقي", "المهندسين", "6 أكتوبر", "الشيخ زايد"] },
  { governorate: "الإسكندرية", cities: ["سموحة", "سيدي جابر", "العجمي", "المنتزه"] },
  { governorate: "الدقهلية", cities: ["المنصورة", "طلخا", "ميت غمر"] },
  { governorate: "الشرقية", cities: ["الزقازيق", "بلبيس", "العاشر من رمضان"] },
]

const STREETS = [
  "شارع التسعين الشمالي",
  "شارع مصطفى النحاس",
  "شارع جامعة الدول العربية",
  "شارع الهرم",
  "شارع فوزي معاذ",
  "شارع النصر",
  "شارع 9",
  "طريق النصر",
]

const BOTTLE_SIZES = ["ML_30", "ML_50", "ML_100"] as const
const BOTTLE_STYLES = ["LUXURY", "REGULAR"] as const
const OIL_WEIGHTS = ["G_5", "G_8", "G_12"] as const

/** The columns one seeded variant writes — `null` on every axis its product
 *  type does not use, exactly as `product.service.variantColumns` does. */
type VariantData = {
  bottleSize: (typeof BOTTLE_SIZES)[number] | null
  bottleStyle: (typeof BOTTLE_STYLES)[number] | null
  oilWeight: (typeof OIL_WEIGHTS)[number] | null
  oilGrade: string | null
  price: string
}

/** Prisma `OrderStatus`, spelled out so the weighted picker is type-safe
 *  without a value import of `@prisma/client`. */
type SeedOrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "IN_PRODUCTION"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"

/** Prisma `OrderStatus`, weighted so most seeded orders are already resolved
 *  and only a handful sit in the "needs action" states the dashboard counts. */
const ORDER_STATUS_WEIGHTS: { status: SeedOrderStatus; weight: number }[] = [
  { status: "DELIVERED", weight: 10 },
  { status: "SHIPPED", weight: 4 },
  { status: "IN_PRODUCTION", weight: 3 },
  { status: "CONFIRMED", weight: 2 },
  { status: "PENDING", weight: 2 },
  { status: "CANCELLED", weight: 1 },
]

function pickStatus(): SeedOrderStatus {
  const total = ORDER_STATUS_WEIGHTS.reduce((sum, s) => sum + s.weight, 0)
  let roll = rng() * total
  for (const { status, weight } of ORDER_STATUS_WEIGHTS) {
    if (roll < weight) return status
    roll -= weight
  }
  return "DELIVERED"
}

/* =========================================================================
 * Price + SKU helpers — a trimmed-down echo of product.service.ts
 * ====================================================================== */

const SIZE_MULTIPLIER: Record<string, number> = { ML_30: 1, ML_50: 1.6, ML_100: 2.7 }
const STYLE_MULTIPLIER: Record<string, number> = { LUXURY: 1.35, REGULAR: 1 }
const WEIGHT_MULTIPLIER: Record<string, number> = { G_5: 1, G_8: 1.5, G_12: 2.1 }

const SIZE_CODE: Record<string, string> = { ML_30: "30ML", ML_50: "50ML", ML_100: "100ML" }
const STYLE_CODE: Record<string, string> = { LUXURY: "LUX", REGULAR: "REG" }
const WEIGHT_CODE: Record<string, string> = { G_5: "5G", G_8: "8G", G_12: "12G" }

/** A price string with exactly two decimals — Prisma writes a string into a
 *  `Decimal(10,2)` column verbatim, the way the product form does. */
function price(base: number, multiplier: number): string {
  // Round to the nearest 10 EGP so the catalog reads like a real price list.
  const raw = Math.round((base * multiplier) / 10) * 10
  return raw.toFixed(2)
}

function skuFor(slug: string, parts: string[]): string {
  const head = slug.toUpperCase().replace(/[^A-Z0-9]+/g, "-")
  return ["MISK", head, ...parts].join("-")
}

/* =========================================================================
 * Steps
 * ====================================================================== */

async function seedCategories(): Promise<Map<string, string>> {
  const ids = new Map<string, string>()
  for (const category of CATEGORIES) {
    const row = await db.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    })
    ids.set(category.slug, row.id)
  }
  console.log(`  categories   ${ids.size}`)
  return ids
}

async function seedIngredients(): Promise<Map<string, string>> {
  const ids = new Map<string, string>()
  for (const ingredient of INGREDIENTS) {
    const row = await db.ingredient.upsert({
      where: { name: ingredient.name },
      update: { description: ingredient.description },
      create: ingredient,
    })
    ids.set(ingredient.name, row.id)
  }
  console.log(`  ingredients  ${ids.size}`)
  return ids
}

/** Upsert one product, its ingredient links, and its full variant grid.
 *  Returns the ids of the product's *active* variants — the pool orders draw
 *  from. */
async function seedProduct(
  product: ProductSeed,
  categoryIds: Map<string, string>,
  ingredientIds: Map<string, string>
): Promise<string[]> {
  const isActive = product.isActive ?? true

  const row = await db.product.upsert({
    where: { slug: product.slug },
    update: {
      name: product.name,
      description: product.description,
      categoryId: categoryIds.get(product.categorySlug)!,
      productType: product.productType,
      isActive,
    },
    create: {
      slug: product.slug,
      name: product.name,
      description: product.description,
      categoryId: categoryIds.get(product.categorySlug)!,
      productType: product.productType,
      isActive,
    },
  })

  // Ingredient join rows — keyed on (productId, ingredientId), so re-runs
  // just rewrite the note.
  for (const link of product.ingredients) {
    const ingredientId = ingredientIds.get(link.name)
    if (!ingredientId) continue
    await db.productIngredient.upsert({
      where: {
        productId_ingredientId: { productId: row.id, ingredientId },
      },
      update: { note: link.note },
      create: { productId: row.id, ingredientId, note: link.note },
    })
  }

  // Variant grid. Alcohol → every size × style; raw oil → every weight. Each
  // is upserted on its generated SKU, so the set is stable across runs.
  const activeVariantIds: string[] = []
  const combos: { data: VariantData; sku: string }[] = []

  if (product.productType === "ALCOHOL_BASED") {
    for (const size of BOTTLE_SIZES) {
      for (const style of BOTTLE_STYLES) {
        combos.push({
          sku: skuFor(product.slug, [SIZE_CODE[size]!, STYLE_CODE[style]!]),
          data: {
            bottleSize: size,
            bottleStyle: style,
            oilWeight: null,
            oilGrade: null,
            price: price(
              product.basePrice,
              SIZE_MULTIPLIER[size]! * STYLE_MULTIPLIER[style]!
            ),
          },
        })
      }
    }
  } else {
    for (const weight of OIL_WEIGHTS) {
      combos.push({
        sku: skuFor(product.slug, [WEIGHT_CODE[weight]!]),
        data: {
          bottleSize: null,
          bottleStyle: null,
          oilWeight: weight,
          oilGrade: "درجة أولى",
          price: price(product.basePrice, WEIGHT_MULTIPLIER[weight]!),
        },
      })
    }
  }

  for (const combo of combos) {
    // A handful of variants are out of / low on stock so the "low stock"
    // dashboard tile and the stock badges have something to show.
    const stock = pick([0, 2, 4, 8, 15, 25, 40, 60])
    // On an active product, retire roughly one variant in twelve so the
    // "hidden" state is represented at the variant level too.
    const variantActive = isActive && rng() > 0.08

    const variant = await db.productVariant.upsert({
      where: { sku: combo.sku },
      update: { ...combo.data, stock, isActive: variantActive },
      create: {
        ...combo.data,
        sku: combo.sku,
        stock,
        isActive: variantActive,
        productId: row.id,
      },
    })

    if (variantActive) activeVariantIds.push(variant.id)
  }

  return activeVariantIds
}

type SeededUser = { id: string; name: string; phone: string | null }

async function seedCustomers(): Promise<SeededUser[]> {
  const users: SeededUser[] = []
  let index = 0

  for (const customer of CUSTOMERS) {
    index += 1
    const clerkId = `${SEED_CLERK_PREFIX}${String(index).padStart(2, "0")}`
    // Spread sign-up dates across the last ~10 months so "joined" is varied.
    const createdAt = daysAgo(randInt(20, 300))

    const row = await db.user.upsert({
      where: { clerkId },
      update: {
        name: customer.name,
        phone: customer.phone,
      },
      create: {
        clerkId,
        email: `${customer.handle}@example.com`,
        name: customer.name,
        phone: customer.phone,
        imageUrl: null,
        role: "USER",
        createdAt,
      },
    })
    users.push({ id: row.id, name: customer.name, phone: customer.phone })
  }

  console.log(`  customers    ${users.length}  (clerkId ${SEED_CLERK_PREFIX}*)`)
  return users
}

/** A shipping snapshot for one order — the same shape checkout will write. */
function shippingFor(user: SeededUser) {
  const area = pick(SHIPPING_AREAS)
  return {
    shippingName: user.name,
    shippingPhone: user.phone ?? `+2010${randInt(10_000_000, 99_999_999)}`,
    shippingLine1: `${pick(STREETS)}، عمارة ${randInt(1, 120)}`,
    shippingLine2: rng() > 0.5 ? `الدور ${randInt(1, 9)}، شقة ${randInt(1, 40)}` : null,
    shippingCity: pick(area.cities),
    shippingGovernorate: area.governorate,
    shippingCountry: "EG",
  }
}

/**
 * Rebuild order history for the seeded customers only.
 *
 * Deleting first — scoped to `userId in seededUserIds` — is what keeps this
 * idempotent without leaving last run's orders behind. `OrderItem` cascades
 * from `Order`, so one `deleteMany` clears both. Real orders from real
 * accounts are never in this set.
 */
async function seedOrders(
  seededUsers: SeededUser[],
  variantPool: string[]
): Promise<number> {
  const seededUserIds = seededUsers.map((user) => user.id)
  await db.order.deleteMany({ where: { userId: { in: seededUserIds } } })

  if (variantPool.length === 0) {
    console.log("  orders       0  (no active variants to reference)")
    return 0
  }

  // Prices are needed to snapshot `unitPrice` and total the order.
  const variants = await db.productVariant.findMany({
    where: { id: { in: variantPool } },
    select: { id: true, price: true },
  })
  const priceById = new Map(variants.map((v) => [v.id, v.price]))

  let created = 0

  for (const user of seededUsers) {
    const orderCount = pick([0, 0, 1, 1, 2, 2, 3, 4, 5])

    for (let n = 0; n < orderCount; n += 1) {
      const lineCount = randInt(1, 3)
      const chosen = sample(variantPool, lineCount)

      const items = chosen.map((variantId) => {
        const quantity = randInt(1, 3)
        const unitPrice = priceById.get(variantId)!
        return { variantId, quantity, unitPrice }
      })

      const total = items.reduce(
        (sum, item) => sum + Number(item.unitPrice) * item.quantity,
        0
      )

      await db.order.create({
        data: {
          userId: user.id,
          status: pickStatus(),
          totalPrice: total.toFixed(2),
          createdAt: daysAgo(randInt(1, 120)),
          ...shippingFor(user),
          items: {
            create: items.map((item) => ({
              variantId: item.variantId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            })),
          },
        },
      })
      created += 1
    }
  }

  console.log(`  orders       ${created}`)
  return created
}

/* =========================================================================
 * Entry point
 * ====================================================================== */

async function main(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    console.error(
      "Refusing to run with NODE_ENV=production. This script inserts fake\n" +
        "customers and orders that would corrupt real reporting. Unset\n" +
        "NODE_ENV or point DATABASE_URL at a development database."
    )
    process.exitCode = 1
    return
  }

  const dbHost = (() => {
    try {
      return new URL(process.env.DATABASE_URL ?? "").host || "(unknown)"
    } catch {
      return "(unparseable DATABASE_URL)"
    }
  })()

  console.log(`Seeding development data → ${dbHost}\n`)

  const categoryIds = await seedCategories()
  const ingredientIds = await seedIngredients()

  const variantPool: string[] = []
  for (const product of PRODUCTS) {
    const active = await seedProduct(product, categoryIds, ingredientIds)
    variantPool.push(...active)
  }
  console.log(
    `  products     ${PRODUCTS.length}  (${variantPool.length} active variants)`
  )

  const seededUsers = await seedCustomers()
  await seedOrders(seededUsers, variantPool)

  const [products, variants, users, orders] = await Promise.all([
    db.product.count(),
    db.productVariant.count(),
    db.user.count(),
    db.order.count(),
  ])

  console.log(
    `\nDone. Database now holds ${products} products, ${variants} variants, ` +
      `${users} users, ${orders} orders.`
  )
}

try {
  await main()
} finally {
  await db.$disconnect()
}
