import "server-only"

import { cache } from "react"

import { Prisma, type ProductType } from "@prisma/client"

import { DEFAULT_STORE_SORT, type StoreSort } from "@/constants/store"
import { db } from "@/lib/db"
import { formatVariantLabel } from "@/utils/format"

export type { StoreSort }

/**
 * The storefront's read model for the catalogue — the public counterpart to
 * the admin's `product.service.ts`.
 *
 * A separate module on purpose, exactly as `product.service.ts` predicted:
 * *"The storefront will sort by something else entirely, which is fine — that
 * is a different query in a different module."* The admin's `listProducts` is
 * a work queue: it orders by `updatedAt`, shows hidden perfumes, and carries
 * per-row order counts and delete guards. A shopper asks a different question
 * — "what can I buy, filed how, sorted how I chose" — so it gets its own
 * query here.
 *
 * Only the service layer talks to Prisma; this module and `product.service.ts`
 * both obey that, for their two different callers. See docs/store-feature.md.
 */

/* -------------------------------------------------------------------------
 * Types
 *
 * `StoreSort` and the `STORE_SORTS` list live in `constants/store.ts` — the
 * filter bar is a Client Component and cannot import this `server-only`
 * module. This file re-exports the type for callers already reaching for the
 * service.
 * ---------------------------------------------------------------------- */

/** One card in the catalogue grid. */
export type StoreProductCard = {
  id: string
  name: string
  slug: string
  description: string
  category: { name: string; slug: string }
  productType: ProductType
  /** Cover image URL, or `null` — the card falls back to `DEFAULT_PRODUCT_IMAGE`. */
  coverImageUrl: string | null
  /**
   * Cheapest / dearest *active* variant, as numbers. Safe to be numbers here
   * for the same reason `product.service.toDisplayPrice` gives: these are
   * shown and compared, never charged. A card only reaches the grid if it has
   * at least one active variant, so these are effectively never `null`.
   */
  priceFrom: number | null
  priceTo: number | null
  totalStock: number
  variantCount: number
  /**
   * The variant the card's quick-add buttons act on — the cheapest *in-stock*
   * active variant, or `null` when nothing on this card can be bought right
   * now (both buttons render disabled then). Picking a *different* size is
   * what the product page's `<select>` is for; the card can only ever quick-add
   * one option. See docs/cart-feature.md.
   */
  defaultVariantId: string | null
}

/** One chip in the category nav — an active segment with sellable perfumes. */
export type StoreCategory = {
  id: string
  name: string
  slug: string
  productCount: number
}

/** One card in the landing page's category selector. */
export type SegmentCategory = StoreCategory & {
  description: string | null
  imageUrl: string | null
  segmentHeadline: string | null
  segmentDescription: string | null
  segmentCtaLabel: string | null
  /** An icon key (`SEGMENT_ICON_KEYS`) or an image URL — see the schema. */
  segmentIconOrImage: string | null
}

/** The landing page's product row, and which heading it has earned. */
export type BestSellers = {
  products: StoreProductCard[]
  /**
   * `true` when at least one perfume on the list has real, non-cancelled
   * orders — only then may the section call itself «الأكثر طلبًا».
   */
  ranked: boolean
}

/** Every field optional; combined with AND. `sort` defaults to `newest`. */
export type CatalogFilters = {
  search?: string
  categorySlug?: string
  productType?: ProductType
  sort?: StoreSort
  page?: number
}

export type CatalogResult = {
  products: StoreProductCard[]
  /** Perfumes matching the filters — what the pager counts, not the page. */
  total: number
  page: number
  pageCount: number
}

/**
 * A grid page. 8 fills the 2-column grid in even rows (the 3-column one ends
 * on a row of 2), and it was picked over 12 so a catalogue of a dozen-odd
 * perfumes already pages instead of being one long scroll.
 */
export const STORE_PAGE_SIZE = 8

/** One purchasable option on the product page, flattened for display. */
export type StoreVariant = {
  id: string
  /** "100ml" or "8g" — `formatVariantLabel`. */
  label: string
  oilGrade: string | null
  price: number
  stock: number
}

/** Everything the `/store/[slug]` page renders. */
export type StoreProductDetail = {
  id: string
  name: string
  slug: string
  description: string
  category: { name: string; slug: string }
  productType: ProductType
  /** Gallery URLs in order. Empty means "no photo" — the page shows the default. */
  images: string[]
  ingredients: { name: string; note: string | null }[]
  variants: StoreVariant[]
  priceFrom: number | null
  priceTo: number | null
  totalStock: number
}

/* -------------------------------------------------------------------------
 * Reads
 * ---------------------------------------------------------------------- */

/**
 * The category chips: active segments that have at least one sellable perfume,
 * in storefront order, each with its count.
 *
 * A hidden segment, or one whose every perfume is hidden or has no active
 * variant, is left out — a chip that leads to an empty grid is a dead end.
 */
export async function listCatalogCategories(): Promise<StoreCategory[]> {
  const rows = await db.category.findMany({
    where: { isActive: true, products: { some: SELLABLE_IN_CATEGORY } },
    orderBy: [{ position: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      _count: { select: { products: { where: SELLABLE_IN_CATEGORY } } },
    },
  })

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    productCount: row._count.products,
  }))
}

/**
 * The landing page's category selector — the same set, order and gate as
 * `listCatalogCategories` (active, with at least one sellable perfume, so no
 * card leads to an empty grid), plus the card copy.
 *
 * A separate read rather than widening `listCatalogCategories`, because that
 * one is also serialised into the header's client-side nav on every
 * storefront page, and four columns of landing-page copy would ride along
 * for nobody. The `segment*` columns are returned raw — `null` means "not
 * written yet", and the fallback to name / description / a generic line is
 * the card's decision, not the query's. See docs/landing-page.md.
 */
export async function listSegmentCategories(): Promise<SegmentCategory[]> {
  const rows = await db.category.findMany({
    where: { isActive: true, products: { some: SELLABLE_IN_CATEGORY } },
    orderBy: [{ position: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      imageUrl: true,
      segmentHeadline: true,
      segmentDescription: true,
      segmentCtaLabel: true,
      segmentIconOrImage: true,
      _count: { select: { products: { where: SELLABLE_IN_CATEGORY } } },
    },
  })

  return rows.map(({ _count, ...row }) => ({
    ...row,
    productCount: _count.products,
  }))
}

/**
 * One page of the catalogue, filtered and sorted.
 *
 * The catalogue is **bounded** — a perfume house carries dozens of products,
 * not thousands — so every match is pulled in one query and the price sort,
 * the pagination and the total are all taken off that single result. That
 * keeps the "the header total and the rows cannot disagree" guarantee the
 * admin lists get from a `$transaction` (here it is one query, so there is
 * nothing to race), and it is the same in-memory-aggregate trade
 * `product.service.listProducts` and `customer.service.listCustomers` already
 * make. If the catalogue ever grows past a few hundred perfumes, this is the
 * function to move the sort and the paging back into SQL.
 *
 * Only `isActive` perfumes under an `isActive` category, and only those with
 * at least one active variant — a shopper is never shown something they
 * cannot buy.
 */
export async function listCatalog(
  filters: CatalogFilters = {}
): Promise<CatalogResult> {
  const search = filters.search?.trim() ?? ""
  const requestedPage = Math.max(1, Math.floor(filters.page ?? 1))
  const sort: StoreSort = filters.sort ?? DEFAULT_STORE_SORT

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    category: {
      isActive: true,
      ...(filters.categorySlug ? { slug: filters.categorySlug } : {}),
    },
    variants: { some: { isActive: true } },
    ...(filters.productType ? { productType: filters.productType } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  }

  const cards = await loadCards(where)

  cards.sort((a, b) => {
    switch (sort) {
      case "name":
        return a.card.name.localeCompare(b.card.name, "ar")
      case "price-asc":
        return (a.card.priceFrom ?? Infinity) - (b.card.priceFrom ?? Infinity)
      case "price-desc":
        return (b.card.priceFrom ?? -Infinity) - (a.card.priceFrom ?? -Infinity)
      case "newest":
      default:
        return b.createdAt.getTime() - a.createdAt.getTime()
    }
  })

  const total = cards.length
  const pageCount = Math.max(1, Math.ceil(total / STORE_PAGE_SIZE))
  // Clamped: a stale `?page=5` (the catalogue shrank, or a filter narrowed
  // it) lands on the last page rather than an empty grid that claims "no
  // matches" while the total above it says otherwise.
  const page = Math.min(requestedPage, pageCount)
  const start = (page - 1) * STORE_PAGE_SIZE

  return {
    products: cards.slice(start, start + STORE_PAGE_SIZE).map((row) => row.card),
    total,
    page,
    pageCount,
  }
}

/**
 * The landing page's product row — the perfumes shoppers actually order most.
 *
 * "Most ordered" is read from real order lines: units summed per perfume
 * across every order that was not cancelled. Perfumes nobody has ordered yet
 * still fill the row after the ranked ones, newest first, so a young shop
 * shows a full row rather than two cards. `ranked` tells the caller whether
 * the top of the list has earned the «الأكثر طلبًا» heading — on a shop
 * with no orders at all it is `false`, and the section says «أحدث العطور»
 * instead of claiming a popularity nobody measured.
 *
 * Same sellability gate as `listCatalog`: nothing a shopper cannot buy.
 */
export async function listBestSellers(limit: number): Promise<BestSellers> {
  const [cards, sales] = await Promise.all([
    loadCards(SELLABLE_PRODUCT),
    db.orderItem.groupBy({
      by: ["variantId"],
      where: { order: { status: { not: "CANCELLED" } } },
      _sum: { quantity: true },
    }),
  ])

  // Order lines point at variants; the ranking is per perfume.
  const variants = await db.productVariant.findMany({
    where: { id: { in: sales.map((row) => row.variantId) } },
    select: { id: true, productId: true },
  })
  const productOf = new Map(variants.map((v) => [v.id, v.productId]))

  const unitsSold = new Map<string, number>()
  for (const row of sales) {
    const productId = productOf.get(row.variantId)
    if (!productId) continue
    unitsSold.set(
      productId,
      (unitsSold.get(productId) ?? 0) + (row._sum.quantity ?? 0)
    )
  }

  const units = (id: string) => unitsSold.get(id) ?? 0

  cards.sort(
    (a, b) =>
      units(b.card.id) - units(a.card.id) ||
      b.createdAt.getTime() - a.createdAt.getTime()
  )

  const products = cards.slice(0, limit).map((row) => row.card)

  return {
    products,
    ranked: products.length > 0 && units(products[0].id) > 0,
  }
}

/**
 * The cheapest active option in each product line, for the landing page's
 * "كحولي ولا دهن خالص؟" comparison — `null` for a line with nothing on sale,
 * so the page never prints a "from" price it cannot honour.
 *
 * Two `aggregate`s rather than one query: the product type lives on the
 * parent `Product`, and `groupBy` cannot group by a relation's column.
 */
export async function getFormatPriceFloors(): Promise<
  Record<ProductType, number | null>
> {
  const floor = (productType: ProductType) =>
    db.productVariant.aggregate({
      where: {
        isActive: true,
        product: { ...SELLABLE_PRODUCT, productType },
      },
      _min: { price: true },
    })

  const [alcohol, oil] = await Promise.all([
    floor("ALCOHOL_BASED"),
    floor("RAW_OIL"),
  ])

  return {
    ALCOHOL_BASED: alcohol._min.price?.toNumber() ?? null,
    RAW_OIL: oil._min.price?.toNumber() ?? null,
  }
}

/**
 * One perfume by slug, for `/store/[slug]` — or `null` (→ `notFound()`).
 *
 * The same sellability gate as `listCatalog`: the perfume and its category
 * must both be `isActive`, and it must have at least one active variant. A
 * stale link to a retired perfume is a 404, not a broken page.
 *
 * Wrapped in React's `cache()` so `generateMetadata` and the page component
 * share one query per request rather than issuing it twice — Prisma calls are
 * not request-deduplicated the way `fetch` is.
 */
export const getStoreProduct = cache(
  async (slug: string): Promise<StoreProductDetail | null> => {
    const product = await db.product.findFirst({
      where: { slug, isActive: true, category: { isActive: true } },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        productType: true,
        category: { select: { name: true, slug: true } },
        images: { orderBy: { position: "asc" }, select: { url: true } },
        ingredients: {
          orderBy: { ingredient: { name: "asc" } },
          select: { note: true, ingredient: { select: { name: true } } },
        },
        variants: {
          where: { isActive: true },
          // Enum columns sort by declaration order — 30ml→100ml, 5g→12g — the
          // same ordering `product.service.getProduct` relies on.
          orderBy: [
            { bottleSize: "asc" },
            { oilWeight: "asc" },
            { oilGrade: "asc" },
          ],
          select: {
            id: true,
            bottleSize: true,
            oilWeight: true,
            oilGrade: true,
            price: true,
            stock: true,
          },
        },
      },
    })

    if (!product || product.variants.length === 0) return null

    const variants: StoreVariant[] = product.variants.map((variant) => ({
      id: variant.id,
      label: formatVariantLabel({
        productType: product.productType,
        bottleSize: variant.bottleSize,
        oilWeight: variant.oilWeight,
      }),
      oilGrade: variant.oilGrade,
      price: variant.price.toNumber(),
      stock: variant.stock,
    }))

    const prices = variants.map((variant) => variant.price)

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      category: product.category,
      productType: product.productType,
      images: product.images.map((image) => image.url),
      ingredients: product.ingredients.map((row) => ({
        name: row.ingredient.name,
        note: row.note,
      })),
      variants,
      priceFrom: prices.length > 0 ? Math.min(...prices) : null,
      priceTo: prices.length > 0 ? Math.max(...prices) : null,
      totalStock: variants.reduce((total, variant) => total + variant.stock, 0),
    }
  }
)

/* -------------------------------------------------------------------------
 * Internals
 * ---------------------------------------------------------------------- */

/**
 * "Sellable", seen from a category: an active perfume with at least one
 * active variant. The category's own `isActive` is checked by the caller.
 */
const SELLABLE_IN_CATEGORY: Prisma.ProductWhereInput = {
  isActive: true,
  variants: { some: { isActive: true } },
}

/** "Sellable", seen from the whole catalogue — the category must be live too. */
const SELLABLE_PRODUCT: Prisma.ProductWhereInput = {
  ...SELLABLE_IN_CATEGORY,
  category: { isActive: true },
}

/**
 * Every perfume matching `where`, shaped as a grid card — plus `createdAt`,
 * which the sorts need and the card does not carry.
 *
 * Shared by `listCatalog` and `listBestSellers` so the card a shopper sees on
 * `/` and on `/store` is built by one mapping, not two that can drift.
 */
async function loadCards(
  where: Prisma.ProductWhereInput
): Promise<{ card: StoreProductCard; createdAt: Date }[]> {
  const rows = await db.product.findMany({
    where,
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      productType: true,
      createdAt: true,
      category: { select: { name: true, slug: true } },
      images: { orderBy: { position: "asc" }, take: 1, select: { url: true } },
      variants: {
        where: { isActive: true },
        // Cheapest first, so the first in-stock row is the card's quick-add
        // default — see `StoreProductCard.defaultVariantId`.
        orderBy: { price: "asc" },
        select: { id: true, price: true, stock: true },
      },
    },
  })

  return rows.map((product) => {
    const prices = product.variants.map((variant) => variant.price.toNumber())
    // `null` (not "the first variant regardless of stock") when nothing on
    // this card can actually be bought — the quick-add buttons disable then,
    // rather than silently offering to add something with zero stock.
    const defaultVariantId =
      product.variants.find((variant) => variant.stock > 0)?.id ?? null

    return {
      card: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        category: product.category,
        productType: product.productType,
        coverImageUrl: product.images[0]?.url ?? null,
        defaultVariantId,
        priceFrom: prices.length > 0 ? Math.min(...prices) : null,
        priceTo: prices.length > 0 ? Math.max(...prices) : null,
        totalStock: product.variants.reduce(
          (total, variant) => total + variant.stock,
          0
        ),
        variantCount: product.variants.length,
      } satisfies StoreProductCard,
      createdAt: product.createdAt,
    }
  })
}
