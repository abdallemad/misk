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

/** A grid page. 12 divides cleanly into 2 / 3 / 4 columns. */
export const STORE_PAGE_SIZE = 12

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
  const sellable: Prisma.ProductWhereInput = {
    isActive: true,
    variants: { some: { isActive: true } },
  }

  const rows = await db.category.findMany({
    where: { isActive: true, products: { some: sellable } },
    orderBy: [{ position: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      _count: { select: { products: { where: sellable } } },
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
  const page = Math.max(1, Math.floor(filters.page ?? 1))
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

  const cards = rows.map((product) => {
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
  const start = (page - 1) * STORE_PAGE_SIZE

  return {
    products: cards.slice(start, start + STORE_PAGE_SIZE).map((row) => row.card),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / STORE_PAGE_SIZE)),
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
