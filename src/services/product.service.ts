import "server-only"

import { createHash, randomBytes } from "node:crypto"

import { Prisma, type ProductType } from "@prisma/client"

import {
  BOTTLE_SIZE_LABEL,
  OIL_WEIGHT_LABEL,
  VARIANT_AXES,
} from "@/constants/catalog"
import { IMAGE_FORMATS_LABEL } from "@/constants/uploads"
import { db } from "@/lib/db"
import { deleteImage, saveImage, UnsupportedImageError } from "@/lib/uploads"
import {
  ingredientKey,
  variantCombination,
  variantFieldName,
  type ProductFormErrors,
  type ProductFormInput,
  type ProductVariantInput,
} from "@/schemas/product.schema"
import { resolveIngredientIds } from "@/services/ingredient.service"

/**
 * Product business logic — the only module that reads or writes `Product`,
 * `ProductImage`, `ProductVariant` and `ProductIngredient`, and the only one
 * that decides what a legal perfume is. (The `Ingredient` master list itself
 * belongs to `ingredient.service.ts`; this module owns the join rows that
 * point at it, not the materials.)
 *
 * It owns three rules the rest of the application depends on and can never
 * be allowed to disagree about:
 *
 *   1. **A variant's shape follows its product's type.** An `ALCOHOL_BASED`
 *      perfume is sold by bottle size × bottle style; a `RAW_OIL` by weight
 *      alone. `schemas/product.schema.ts` checks this too, so the admin sees
 *      it under the field — but the schema is skippable by a direct POST and
 *      this is not.
 *   2. **No two variants of one perfume may be the same thing.** The
 *      `uniqueVariantCombination` index cannot enforce it (see below), so
 *      this layer does.
 *   3. **A variant somebody has ordered is never deleted.** `OrderItem`
 *      points at it with `onDelete: Restrict`, and an order that cannot say
 *      what was in it is worse than a stale shelf.
 *
 * Every mutation returns a result object rather than throwing, for the reason
 * `category.service.ts` documents: a Prisma error crossing the Server Action
 * boundary reaches the browser as an opaque digest, which is right for a bug
 * and useless for "that slug is taken".
 */

/* -------------------------------------------------------------------------
 * Types
 * ---------------------------------------------------------------------- */

/** One row of the admin products table. */
export type ProductRow = {
  id: string
  name: string
  slug: string
  productType: ProductType
  isActive: boolean
  updatedAt: Date
  category: { id: string; name: string; slug: string }
  coverImageUrl: string | null
  variantCount: number
  /**
   * Cheapest and dearest *sellable* variant, or `null` when none is on sale.
   * Numbers, not `Decimal` — see `toDisplayPrice` for why that is safe here
   * and would not be at checkout.
   */
  priceFrom: number | null
  priceTo: number | null
  totalStock: number
  /**
   * Order lines pointing at any of this perfume's variants. Non-zero means
   * it can never be deleted, so the confirm dialog says why up front instead
   * of letting the admin press a button the database will refuse.
   */
  orderLineCount: number
}

/** One purchasable option, as the variant editor renders it. */
export type ProductVariantRow = {
  id: string
  bottleSize: ProductVariantInput["bottleSize"]
  bottleStyle: ProductVariantInput["bottleStyle"]
  oilWeight: ProductVariantInput["oilWeight"]
  oilGrade: string | null
  sku: string
  /**
   * A string, so the number input round-trips the stored value exactly:
   * `Decimal("1250.00")` re-renders as `1250.00`, not `1250.0000000001`.
   */
  price: string
  stock: number
  isActive: boolean
  /**
   * How many order lines point at this variant. Non-zero means the remove
   * button is disabled — the same "count first, explain, then refuse" shape
   * `deleteCategory` uses.
   */
  orderItemCount: number
}

export type ProductImageRow = {
  id: string
  url: string
  position: number
}

/** One raw material on this perfume, flattened out of the join table. */
export type ProductIngredientRow = {
  ingredientId: string
  name: string
  note: string | null
}

/** Everything the edit form needs, and nothing the table does not. */
export type ProductDetail = {
  id: string
  name: string
  slug: string
  description: string
  categoryId: string
  productType: ProductType
  isActive: boolean
  images: ProductImageRow[]
  variants: ProductVariantRow[]
  ingredients: ProductIngredientRow[]
}

export type ProductMutationResult =
  | { ok: true; product: { id: string; name: string } }
  | { ok: false; message: string; errors?: ProductFormErrors }

export type ProductDeleteResult = { ok: true } | { ok: false; message: string }

/** Which perfumes the admin list should show — every field optional, all
 *  combined with AND. `status` narrows on `isActive`. */
export type ProductListFilters = {
  search?: string
  page?: number
  categoryId?: string
  productType?: ProductType
  status?: "active" | "hidden"
}

export type ProductListResult = {
  products: ProductRow[]
  /** Perfumes matching the filters — what the pager counts, not the page. */
  total: number
  page: number
  pageCount: number
}

/** One page of the admin products table. Tuned like the customers list: one
 *  screen, and a shop with tens of perfumes fits without paging at all. */
export const PRODUCTS_PAGE_SIZE = 20

/* -------------------------------------------------------------------------
 * Reads
 * ---------------------------------------------------------------------- */

/**
 * One page of perfumes, newest edit first, narrowed by whatever filters the
 * admin has set.
 *
 * `updatedAt` rather than name: the admin table is a work queue, not a
 * catalogue, and the row someone just touched is the one they are most
 * likely to come back to. The storefront will sort by something else
 * entirely, which is fine — that is a different query in a different module.
 *
 * The count and the page go out as one `$transaction`, so the "N perfumes"
 * line and the rows below it agree even if a save lands between them — the
 * same shape `customer.service.listCustomers` and `admin.service` use.
 *
 * Variants and the cover image come back in the same query rather than one
 * round trip per row. The price range and stock total are then computed here
 * instead of in SQL, because the numbers are per-product and the whole page
 * is already in memory; a `groupBy` would be a second query to answer a
 * question the first one already carries the data for.
 */
export async function listProducts(
  filters: ProductListFilters = {}
): Promise<ProductListResult> {
  const search = filters.search?.trim() ?? ""
  const page = Math.max(1, Math.floor(filters.page ?? 1))

  const where: Prisma.ProductWhereInput = {
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { slug: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.productType ? { productType: filters.productType } : {}),
    ...(filters.status ? { isActive: filters.status === "active" } : {}),
  }

  const [total, rows] = await db.$transaction([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PRODUCTS_PAGE_SIZE,
      take: PRODUCTS_PAGE_SIZE,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images: { orderBy: { position: "asc" }, take: 1, select: { url: true } },
        variants: {
          select: {
            price: true,
            stock: true,
            isActive: true,
            _count: { select: { orderItems: true } },
          },
        },
      },
    }),
  ])

  const products = rows.map((product) => {
    // The price a shopper would actually be quoted, so a retired variant with
    // a stale price cannot drag the "from" figure below anything on sale.
    const sellable = product.variants.filter((variant) => variant.isActive)
    const prices = sellable.map((variant) => toDisplayPrice(variant.price))

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      productType: product.productType,
      isActive: product.isActive,
      updatedAt: product.updatedAt,
      category: product.category,
      coverImageUrl: product.images[0]?.url ?? null,
      variantCount: product.variants.length,
      priceFrom: prices.length > 0 ? Math.min(...prices) : null,
      priceTo: prices.length > 0 ? Math.max(...prices) : null,
      totalStock: sellable.reduce((total, variant) => total + variant.stock, 0),
      orderLineCount: product.variants.reduce(
        (total, variant) => total + variant._count.orderItems,
        0
      ),
    }
  })

  return {
    products,
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / PRODUCTS_PAGE_SIZE)),
  }
}

/** One perfume with its gallery, variants and ingredients, or `null`. */
export async function getProduct(id: string): Promise<ProductDetail | null> {
  const product = await db.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { position: "asc" } },
      variants: {
        // Postgres orders an enum column by the order its members were
        // declared in, so this is 30ml → 50ml → 100ml and 5g → 8g → 12g,
        // not alphabetical. That is only true while `schema.prisma` lists
        // them smallest-first, which it does deliberately.
        orderBy: [
          { bottleSize: "asc" },
          { bottleStyle: "asc" },
          { oilWeight: "asc" },
          { oilGrade: "asc" },
        ],
        include: { _count: { select: { orderItems: true } } },
      },
      ingredients: {
        orderBy: { ingredient: { name: "asc" } },
        include: { ingredient: { select: { id: true, name: true } } },
      },
    },
  })

  if (!product) return null

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    categoryId: product.categoryId,
    productType: product.productType,
    isActive: product.isActive,
    images: product.images.map((image) => ({
      id: image.id,
      url: image.url,
      position: image.position,
    })),
    variants: product.variants.map((variant) => ({
      id: variant.id,
      bottleSize: variant.bottleSize,
      bottleStyle: variant.bottleStyle,
      oilWeight: variant.oilWeight,
      oilGrade: variant.oilGrade,
      sku: variant.sku,
      price: variant.price.toFixed(2),
      stock: variant.stock,
      isActive: variant.isActive,
      orderItemCount: variant._count.orderItems,
    })),
    ingredients: product.ingredients.map((row) => ({
      ingredientId: row.ingredient.id,
      name: row.ingredient.name,
      note: row.note,
    })),
  }
}

/* -------------------------------------------------------------------------
 * Writes
 * ---------------------------------------------------------------------- */

/**
 * Create a perfume, its gallery, its variants and its ingredient links.
 *
 * The gallery files are written to disk *before* any row, for the reason
 * `docs/categories-feature.md` sets out: a row pointing at a file that failed
 * to save renders a broken image on the storefront, while a file whose row
 * was rejected is an orphan that costs disk and nothing else — and is deleted
 * explicitly below anyway.
 *
 * The rows themselves go in one interactive transaction, because the
 * ingredient master list may need rows of its own before the join rows can
 * point at them. A product with no variants cannot be bought, and an
 * ingredient created for a product that then failed to save is a material
 * nobody chose to add — neither is a state worth being able to reach.
 */
export async function createProduct(
  input: ProductFormInput
): Promise<ProductMutationResult> {
  const invalid = checkVariants(input)
  if (invalid) return invalid

  let urls: string[] = []

  try {
    urls = await storeGallery(input.images)
  } catch (error) {
    return imageFailure(error)
  }

  try {
    const skus = await mintSkus(input.slug, input.productType, input.variants)

    const product = await db.$transaction(async (tx) => {
      const ingredientIds = await resolveIngredientIds(tx, input.ingredients)

      return tx.product.create({
        data: {
          name: input.name,
          slug: input.slug,
          description: input.description,
          categoryId: input.categoryId,
          productType: input.productType,
          isActive: input.isActive,
          images: {
            create: urls.map((url, position) => ({ url, position })),
          },
          variants: {
            create: input.variants.map((variant) => ({
              ...variantColumns(input.productType, variant),
              sku: skus.get(variant.key)!,
            })),
          },
          ingredients: {
            create: input.ingredients.map((ingredient) => ({
              ingredientId: ingredientIds.get(ingredientKey(ingredient.name))!,
              note: ingredient.note,
            })),
          },
        },
        select: { id: true, name: true },
      })
    })

    return { ok: true, product }
  } catch (error) {
    // The rows were rejected, so the files they would have pointed at are
    // garbage. Cleanup is best-effort and never masks the real failure.
    await Promise.all(urls.map(deleteImage))

    return writeFailure(error, "تعذّر حفظ العطر. حاول مرة أخرى.")
  }
}

/**
 * Update a perfume in place.
 *
 * Four sub-problems, in the order they have to be solved:
 *
 *   - **Variants that disappeared from the form.** Deleted, unless an order
 *     points at one, in which case the whole save is refused with an
 *     explanation. Counting first is what turns a foreign-key violation into
 *     a sentence; the `P2003` catch below stays as the backstop for the race
 *     where an order lands between the count and the delete.
 *   - **The gallery.** `keepImageIds` is both the survivors *and* their
 *     order, so a removal and a reorder are one field. Files are unlinked
 *     only after the rows commit — unlinking first would destroy the live
 *     image if the transaction rolled back.
 *   - **The ingredient links**, which are replaced wholesale: they carry no
 *     identity of their own beyond `(product, ingredient)`, and a note is
 *     cheap to rewrite. The *materials* they point at are never deleted here
 *     — dropping an ingredient from one perfume must not remove it from the
 *     shop's master list, where other perfumes and the trust panel still use
 *     it.
 *   - **The rest**, which is an ordinary update.
 */
export async function updateProduct(
  id: string,
  input: ProductFormInput
): Promise<ProductMutationResult> {
  const invalid = checkVariants(input)
  if (invalid) return invalid

  const existing = await db.product.findUnique({
    where: { id },
    include: {
      images: true,
      variants: { include: { _count: { select: { orderItems: true } } } },
    },
  })

  if (!existing) return { ok: false, message: "هذا العطر لم يعد موجودًا." }

  const existingVariants = new Map(existing.variants.map((v) => [v.id, v]))

  // An id is a string from the browser like any other. One that does not
  // belong to *this* product is treated as a new row rather than trusted —
  // which is what stops a hand-edited POST from editing another perfume's
  // variant through this product's form.
  const rows = input.variants.map((variant) => ({
    ...variant,
    id: variant.id && existingVariants.has(variant.id) ? variant.id : null,
  }))

  const keptVariantIds = new Set(rows.map((row) => row.id).filter(Boolean))
  const removedVariants = existing.variants.filter(
    (variant) => !keptVariantIds.has(variant.id)
  )

  const ordered = removedVariants.filter(
    (variant) => variant._count.orderItems > 0
  )

  if (ordered.length > 0) {
    return {
      ok: false,
      message: `${ordered.length === 1 ? "أحد الخيارات المحذوفة مرتبط" : `${ordered.length} من الخيارات المحذوفة مرتبطة`} بطلبات سابقة، ولا يمكن حذفه. أعِده وأوقف عرضه بدل حذفه.`,
    }
  }

  const keptImageIds = input.keepImageIds.filter((imageId) =>
    existing.images.some((image) => image.id === imageId)
  )
  const removedImages = existing.images.filter(
    (image) => !keptImageIds.includes(image.id)
  )

  let urls: string[] = []

  try {
    urls = await storeGallery(input.images)
  } catch (error) {
    return imageFailure(error)
  }

  try {
    const newRows = rows.filter((row) => row.id === null)
    const skus = await mintSkus(input.slug, input.productType, newRows)

    const product = await db.$transaction(async (tx) => {
      await tx.productImage.deleteMany({
        where: { id: { in: removedImages.map((image) => image.id) } },
      })

      // Position is the index in the submitted order, so a reorder is a
      // rewrite of this one column and nothing else.
      await Promise.all(
        keptImageIds.map((imageId, position) =>
          tx.productImage.update({ where: { id: imageId }, data: { position } })
        )
      )

      await tx.productImage.createMany({
        data: urls.map((url, index) => ({
          productId: id,
          url,
          position: keptImageIds.length + index,
        })),
      })

      await tx.productVariant.deleteMany({
        where: { id: { in: removedVariants.map((variant) => variant.id) } },
      })

      for (const row of rows) {
        const columns = variantColumns(input.productType, row)

        if (row.id) {
          // `sku` is deliberately absent: it is printed on labels and quoted
          // in messages to customers, so it is minted once and never
          // regenerated — not even when the slug it was built from changes.
          await tx.productVariant.update({ where: { id: row.id }, data: columns })
          continue
        }

        await tx.productVariant.create({
          data: { ...columns, productId: id, sku: skus.get(row.key)! },
        })
      }

      const ingredientIds = await resolveIngredientIds(tx, input.ingredients)

      await tx.productIngredient.deleteMany({ where: { productId: id } })
      await tx.productIngredient.createMany({
        data: input.ingredients.map((ingredient) => ({
          productId: id,
          ingredientId: ingredientIds.get(ingredientKey(ingredient.name))!,
          note: ingredient.note,
        })),
      })

      return tx.product.update({
        where: { id },
        data: {
          name: input.name,
          slug: input.slug,
          description: input.description,
          categoryId: input.categoryId,
          productType: input.productType,
          isActive: input.isActive,
        },
        select: { id: true, name: true },
      })
    })

    // Only now that the rows are committed. An image file removed before this
    // point would be gone even if the transaction rolled back.
    await Promise.all(removedImages.map((image) => deleteImage(image.url)))

    return { ok: true, product }
  } catch (error) {
    await Promise.all(urls.map(deleteImage))

    return writeFailure(error, "تعذّر تحديث العطر. حاول مرة أخرى.")
  }
}

/**
 * Delete a perfume, its gallery, its variants and its ingredient links.
 *
 * `ProductImage`, `ProductVariant` and `ProductIngredient` all cascade from
 * `Product`, so the database removes them — but `OrderItem.variantId` is
 * `Restrict`, which means a perfume anybody has ever bought cannot be deleted
 * at all. That is the right refusal: an order has to keep being able to say
 * what was in it. `isActive` is the reversible way to take a perfume off the
 * storefront, which is what lets this delete stay honest about being
 * permanent.
 *
 * The `Ingredient` rows themselves survive. They belong to the shop, not to
 * this perfume.
 */
export async function deleteProduct(id: string): Promise<ProductDeleteResult> {
  const product = await db.product.findUnique({
    where: { id },
    include: {
      images: { select: { url: true } },
      variants: { select: { _count: { select: { orderItems: true } } } },
    },
  })

  if (!product) return { ok: false, message: "هذا العطر لم يعد موجودًا." }

  const orderLines = product.variants.reduce(
    (total, variant) => total + variant._count.orderItems,
    0
  )

  if (orderLines > 0) return { ok: false, message: blockedByOrders(orderLines) }

  try {
    await db.product.delete({ where: { id } })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") return { ok: false, message: blockedByOrders() }
      if (error.code === "P2025") {
        return { ok: false, message: "هذا العطر لم يعد موجودًا." }
      }
    }

    console.error("[product.service] delete failed", error)
    return { ok: false, message: "تعذّر حذف العطر. حاول مرة أخرى." }
  }

  // Only once the rows are gone — images with no product are dead weight.
  await Promise.all(product.images.map((image) => deleteImage(image.url)))

  return { ok: true }
}

/* -------------------------------------------------------------------------
 * Internals — variants
 * ---------------------------------------------------------------------- */

/**
 * Re-check the two rules the schema already checked, because the schema is
 * not the gate.
 *
 * `parseProductForm` runs in the browser *and* in the Server Action, and
 * catches both of these with better messages. This runs in the service, which
 * is the layer that a caller bypassing the action — a future seed script, a
 * background job, a second action written in a hurry — still has to go
 * through. Duplicated validation is the cheapest thing in this file; a
 * raw-oil variant with a bottle style is not.
 *
 * The keys it returns are the form's own field names, so the result drops
 * straight into `<Form errors>` beside anything the schema produced.
 */
function checkVariants(input: ProductFormInput): ProductMutationResult | null {
  const required = VARIANT_AXES[input.productType]
  const errors: ProductFormErrors = {}
  const seen = new Set<string>()

  const put = (key: string, message: string) => {
    if (!(key in errors)) errors[key] = message
  }

  for (const variant of input.variants) {
    for (const axis of ["bottleSize", "bottleStyle", "oilWeight"] as const) {
      const isRequired = required.includes(axis)

      if (isRequired && variant[axis] === null) {
        put(variantFieldName(variant.key, axis), "مطلوب لهذا النوع.")
      }

      if (!isRequired && variant[axis] !== null) {
        put(variantFieldName(variant.key, "row"), "هذا الصف لا يطابق نوع المنتج.")
      }
    }

    const combination = variantCombination(variant)
    if (seen.has(combination)) {
      put(variantFieldName(variant.key, "row"), "هذا التكوين مكرر.")
    }
    seen.add(combination)
  }

  if (Object.keys(errors).length === 0) return null

  return { ok: false, message: "راجع الخيارات المميّزة بالأحمر.", errors }
}

/**
 * The columns one variant row writes, with everything its product type does
 * not use forced back to `null`.
 *
 * Explicit nulls rather than omitted keys, because this is also used on
 * *update*: switching a perfume from alcohol to raw oil has to clear the
 * bottle columns, and an omitted key in a Prisma `update` leaves the old
 * value exactly where it was.
 */
function variantColumns(type: ProductType, variant: ProductVariantInput) {
  const alcohol = type === "ALCOHOL_BASED"

  return {
    bottleSize: alcohol ? variant.bottleSize : null,
    bottleStyle: alcohol ? variant.bottleStyle : null,
    oilWeight: alcohol ? null : variant.oilWeight,
    oilGrade: variant.oilGrade,
    // A string reaches `Decimal(10,2)` unrounded; a float would not.
    price: variant.price,
    stock: variant.stock,
    isActive: variant.isActive,
  }
}

/* -------------------------------------------------------------------------
 * Internals — SKUs
 * ---------------------------------------------------------------------- */

/**
 * Build a stock code for each *new* variant.
 *
 * Generated rather than typed, because the admin form already asks for six
 * things per row and a hand-typed code is one more thing to get wrong in a
 * way the database reports as `Unique constraint failed on sku`. The shape is
 * readable on a label — `MISK-ROSE-100ML-LUX`, `MISK-ROSE-8G` — and derived
 * from the values that make the variant what it is.
 *
 * Two properties are load-bearing:
 *
 *   - **Minted once.** An existing variant keeps its code through a rename, a
 *     re-slug and a price change, because the code is on a bottle somewhere
 *     and in somebody's order confirmation.
 *   - **Checked before insert, not after.** Codes are unique across the whole
 *     table, so a perfume re-slugged onto a name another one used to hold can
 *     collide. One query settles it for the batch, and a colliding code gets
 *     a short random suffix rather than a retry loop.
 */
async function mintSkus(
  slug: string,
  type: ProductType,
  variants: ProductVariantInput[]
): Promise<Map<string, string>> {
  const candidates = new Map<string, string>()
  for (const variant of variants) {
    candidates.set(variant.key, buildSku(slug, type, variant))
  }

  const taken = new Set(
    (
      await db.productVariant.findMany({
        where: { sku: { in: [...candidates.values()] } },
        select: { sku: true },
      })
    ).map((row) => row.sku)
  )

  const skus = new Map<string, string>()

  for (const [key, candidate] of candidates) {
    // `taken` grows as we go, so two rows of *this* batch that produce the
    // same code — possible only when two grades differ by characters the
    // code drops — cannot both claim it.
    const sku = taken.has(candidate)
      ? `${candidate}-${randomBytes(2).toString("hex").toUpperCase()}`
      : candidate

    taken.add(sku)
    skus.set(key, sku)
  }

  return skus
}

function buildSku(
  slug: string,
  type: ProductType,
  variant: ProductVariantInput
): string {
  const parts = [slug.toUpperCase().replace(/[^A-Z0-9]+/g, "-")]

  if (type === "RAW_OIL") {
    if (variant.oilWeight) parts.push(OIL_WEIGHT_LABEL[variant.oilWeight].toUpperCase())
  } else {
    if (variant.bottleSize) parts.push(BOTTLE_SIZE_LABEL[variant.bottleSize].toUpperCase())
    if (variant.bottleStyle) parts.push(variant.bottleStyle === "LUXURY" ? "LUX" : "REG")
  }

  if (variant.oilGrade) parts.push(gradeCode(variant.oilGrade))

  return parts.join("-")
}

/**
 * A short code for a free-text grade.
 *
 * "Grade A" becomes `GRADEA`. An Arabic grade — «درجة أولى» — has no Latin
 * characters at all and would otherwise collapse to an empty segment, so it
 * falls back to a hash: still deterministic, still stable across saves, and
 * still distinct from every other grade.
 */
function gradeCode(grade: string): string {
  const latin = grade.toUpperCase().replace(/[^A-Z0-9]+/g, "").slice(0, 8)
  if (latin) return latin

  return createHash("sha1").update(grade).digest("hex").slice(0, 4).toUpperCase()
}

/* -------------------------------------------------------------------------
 * Internals — images and errors
 * ---------------------------------------------------------------------- */

/**
 * Write the whole gallery, or none of it.
 *
 * Sequential rather than `Promise.all`: on the fourth file failing, the three
 * already on disk have to be removed, and awaiting them in order is what
 * makes "what has been written so far" a knowable list.
 */
async function storeGallery(files: File[]): Promise<string[]> {
  const urls: string[] = []

  try {
    for (const file of files) {
      urls.push(await saveImage(file))
    }
  } catch (error) {
    await Promise.all(urls.map(deleteImage))
    throw error
  }

  return urls
}

/** Turn an upload rejection into a message under the gallery field. */
function imageFailure(error: unknown): ProductMutationResult {
  if (error instanceof UnsupportedImageError) {
    return {
      ok: false,
      message: "تعذّر رفع الصور.",
      errors: {
        images: `أحد الملفات ليس صورة صالحة (${IMAGE_FORMATS_LABEL}).`,
      },
    }
  }

  console.error("[product.service] gallery upload failed", error)
  return {
    ok: false,
    message: "تعذّر رفع الصور.",
    errors: { images: "تعذّر حفظ الصور على الخادم. حاول مرة أخرى." },
  }
}

/**
 * Map a write failure onto the field that caused it.
 *
 * Only three are worth naming. `P2002` on `slug` is the one an admin hits
 * routinely; `P2002` on `sku` means `mintSkus` lost a race with a concurrent
 * save and is worth its own sentence rather than "check the red fields";
 * `P2003` on the category is a segment deleted in another tab.
 */
function writeFailure(error: unknown, fallback: string): ProductMutationResult {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const target = String(error.meta?.target ?? "")

    if (error.code === "P2002" && target.includes("slug")) {
      return {
        ok: false,
        message: "المعرّف مستخدم بالفعل.",
        errors: { slug: "هذا المعرّف مستخدم في عطر آخر — اختر غيره." },
      }
    }

    if (error.code === "P2002" && target.includes("sku")) {
      return { ok: false, message: "تعارض في رمز المنتج. أعد المحاولة." }
    }

    if (error.code === "P2003") {
      return {
        ok: false,
        message: "الفئة المختارة لم تعد موجودة.",
        errors: { categoryId: "اختر فئة أخرى." },
      }
    }
  }

  console.error("[product.service] write failed", error)
  return { ok: false, message: fallback }
}

function blockedByOrders(count?: number): string {
  const tail =
    count === undefined
      ? "هناك طلبات مرتبطة به"
      : `هناك ${count} من بنود الطلبات مرتبطة به`

  return `لا يمكن حذف العطر: ${tail}. أوقف عرضه في المتجر بدل حذفه، حتى يظل سجلّ الطلبات مقروءًا.`
}

/**
 * `Decimal` → `number`, for display only.
 *
 * Safe here because these figures are rendered and compared, never summed
 * into a total anybody is charged: `Decimal(10,2)` fits inside a double with
 * room to spare, so the min/max and the formatted price are exact. Money that
 * is actually *charged* stays a `Decimal` all the way to Stripe — see
 * `docs/payments-feature.md`.
 */
function toDisplayPrice(price: Prisma.Decimal): number {
  return price.toNumber()
}
