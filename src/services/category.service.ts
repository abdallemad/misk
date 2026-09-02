import "server-only"

import { Prisma, type Category } from "@prisma/client"

import { IMAGE_FORMATS_LABEL } from "@/constants/uploads"
import { db } from "@/lib/db"
import { deleteImage, saveImage, UnsupportedImageError } from "@/lib/uploads"
import type {
  CategoryFieldErrors,
  CategoryFormInput,
} from "@/schemas/category.schema"

/**
 * Category business logic — the only module that reads or writes the
 * `Category` table, and the only one that decides what the rules are.
 *
 * Everything the feature *knows* lives here rather than in the actions: the
 * ordering of the list, what makes a delete legal, what happens to the old
 * JPEG when an image is replaced, and how a database constraint becomes a
 * sentence an admin can act on. The action layer above is a thin shell that
 * authenticates, delegates and revalidates — see docs/categories-feature.md.
 *
 * Every mutation returns a result object instead of throwing. A thrown Prisma
 * error crossing the Server Action boundary reaches the browser as an opaque
 * digest, which is the correct treatment for a bug and useless treatment for
 * "that name is taken".
 */

/* -------------------------------------------------------------------------
 * Types
 * ---------------------------------------------------------------------- */

/** A category as the admin table renders it — the row plus its usage count. */
export type CategoryRow = Category & { productCount: number }

export type CategoryMutationResult =
  | { ok: true; category: Category }
  | { ok: false; message: string; fieldErrors?: CategoryFieldErrors }

export type CategoryDeleteResult = { ok: true } | { ok: false; message: string }

/* -------------------------------------------------------------------------
 * Reads
 * ---------------------------------------------------------------------- */

/**
 * Every category, in storefront order, each with the number of perfumes filed
 * under it.
 *
 * `position` then `name`: position is the admin's explicit ordering and
 * duplicates are allowed, so without the second key two segments sharing a
 * position would swap places between renders and the table would look
 * unstable for no reason.
 *
 * The count comes back in the same query rather than one `count()` per row —
 * the table needs it on every row, and it is also the number the delete guard
 * is about, so both read the same figure.
 */
export async function listCategories(): Promise<CategoryRow[]> {
  const categories = await db.category.findMany({
    orderBy: [{ position: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  })

  return categories.map(({ _count, ...category }) => ({
    ...category,
    productCount: _count.products,
  }))
}

/** Just enough of a category to fill a `<select>`. */
export type CategoryOption = {
  id: string
  name: string
  slug: string
  isActive: boolean
}

/**
 * The categories a perfume can be filed under, in storefront order.
 *
 * A separate query from `listCategories()` rather than a `.map()` over it,
 * because the caller is the **product form** — a Client Component — and
 * `listCategories` carries a per-row product count that would be serialised
 * into the page for no one to read. Inactive segments are included and
 * labelled by the form: hiding them would make an existing product's own
 * category vanish out of its select the moment someone retires it.
 */
export async function listCategoryOptions(): Promise<CategoryOption[]> {
  return db.category.findMany({
    orderBy: [{ position: "asc" }, { name: "asc" }],
    select: { id: true, name: true, slug: true, isActive: true },
  })
}

/** One category by id, or `null`. */
export async function getCategory(id: string): Promise<Category | null> {
  return db.category.findUnique({ where: { id } })
}

/* -------------------------------------------------------------------------
 * Writes
 * ---------------------------------------------------------------------- */

/**
 * Create a segment.
 *
 * The image is written to disk *before* the row, because a row pointing at a
 * file that failed to save would render a broken image on the storefront. The
 * reverse orphan — a file whose row was rejected — is cheaper, and is cleaned
 * up explicitly below.
 */
export async function createCategory(
  input: CategoryFormInput
): Promise<CategoryMutationResult> {
  let imageUrl: string | null = null

  try {
    imageUrl = await storeImage(input.image)
  } catch (error) {
    return imageFailure(error)
  }

  try {
    const category = await db.category.create({
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description,
        imageUrl,
        isActive: input.isActive,
        position: input.position ?? (await nextPosition()),
      },
    })

    return { ok: true, category }
  } catch (error) {
    // The row was rejected, so the file it would have pointed at is garbage.
    await deleteImage(imageUrl)

    const duplicate = duplicateFieldError(error)
    if (duplicate) return duplicate

    console.error("[category.service] create failed", error)
    return { ok: false, message: "تعذّر حفظ الفئة. حاول مرة أخرى." }
  }
}

/**
 * Update a segment.
 *
 * The old image file is deleted only *after* the row commits, and only when it
 * was genuinely replaced or cleared. Unlinking first would destroy the live
 * image on a rollback; unlinking unconditionally would delete the picture of a
 * category whose name was the only thing that changed.
 */
export async function updateCategory(
  id: string,
  input: CategoryFormInput
): Promise<CategoryMutationResult> {
  const existing = await db.category.findUnique({ where: { id } })
  if (!existing) {
    return { ok: false, message: "هذه الفئة لم تعد موجودة." }
  }

  let uploaded: string | null = null

  try {
    uploaded = await storeImage(input.image)
  } catch (error) {
    return imageFailure(error)
  }

  // Three cases, in precedence order: a new file wins; an explicit "remove"
  // clears the column; otherwise the current image is left exactly as it is.
  const imageUrl = uploaded ?? (input.removeImage ? null : existing.imageUrl)

  try {
    const category = await db.category.update({
      where: { id },
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description,
        imageUrl,
        isActive: input.isActive,
        position: input.position ?? existing.position,
      },
    })

    if (existing.imageUrl && existing.imageUrl !== imageUrl) {
      await deleteImage(existing.imageUrl)
    }

    return { ok: true, category }
  } catch (error) {
    await deleteImage(uploaded)

    const duplicate = duplicateFieldError(error)
    if (duplicate) return duplicate

    console.error("[category.service] update failed", error)
    return { ok: false, message: "تعذّر تحديث الفئة. حاول مرة أخرى." }
  }
}

/**
 * Delete a segment — only when nothing is filed under it.
 *
 * `Product.categoryId` is `onDelete: Restrict`, so the database would refuse
 * this anyway. The count is read first so the admin gets "12 perfumes still
 * use this one" instead of a foreign-key violation, and the `P2003` catch
 * stays as the backstop for the race where a product is filed under it between
 * the count and the delete.
 *
 * There is no cascade and no soft delete here on purpose: `isActive` is
 * already the reversible way to take a segment off the storefront, so a hard
 * delete can stay honest about being permanent.
 */
export async function deleteCategory(
  id: string
): Promise<CategoryDeleteResult> {
  const category = await db.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  })

  if (!category) return { ok: false, message: "هذه الفئة لم تعد موجودة." }

  if (category._count.products > 0) {
    return { ok: false, message: blockedByProducts(category._count.products) }
  }

  try {
    await db.category.delete({ where: { id } })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") {
        return { ok: false, message: blockedByProducts() }
      }
      if (error.code === "P2025") {
        return { ok: false, message: "هذه الفئة لم تعد موجودة." }
      }
    }

    console.error("[category.service] delete failed", error)
    return { ok: false, message: "تعذّر حذف الفئة. حاول مرة أخرى." }
  }

  // Only once the row is gone — an image with no row is dead weight.
  await deleteImage(category.imageUrl)

  return { ok: true }
}

/* -------------------------------------------------------------------------
 * Internals
 * ---------------------------------------------------------------------- */

/** Append to the end of the storefront nav. */
async function nextPosition(): Promise<number> {
  const last = await db.category.aggregate({ _max: { position: true } })
  return (last._max.position ?? -1) + 1
}

function storeImage(file: File | null): Promise<string | null> {
  return file ? saveImage(file) : Promise.resolve(null)
}

/** Turn an upload rejection into a message under the file input. */
function imageFailure(error: unknown): CategoryMutationResult {
  if (error instanceof UnsupportedImageError) {
    return {
      ok: false,
      message: "تعذّر رفع الصورة.",
      fieldErrors: {
        image: `الملف ليس صورة صالحة (${IMAGE_FORMATS_LABEL}).`,
      },
    }
  }

  console.error("[category.service] image upload failed", error)
  return {
    ok: false,
    message: "تعذّر رفع الصورة.",
    fieldErrors: { image: "تعذّر حفظ الصورة على الخادم. حاول مرة أخرى." },
  }
}

/**
 * Map a unique-constraint violation onto the field that caused it.
 *
 * Prisma reports the *constraint* name on PostgreSQL (`Category_slug_key`),
 * not the column, so the field is recovered by substring. Checking `slug`
 * first matters: both constraint names contain the table name, and only the
 * distinguishing half is trustworthy.
 */
function duplicateFieldError(error: unknown): CategoryMutationResult | null {
  if (
    !(error instanceof Prisma.PrismaClientKnownRequestError) ||
    error.code !== "P2002"
  ) {
    return null
  }

  const target = String(error.meta?.target ?? "")

  if (target.includes("slug")) {
    return {
      ok: false,
      message: "المعرّف مستخدم بالفعل.",
      fieldErrors: { slug: "هذا المعرّف مستخدم في فئة أخرى — اختر غيره." },
    }
  }

  if (target.includes("name")) {
    return {
      ok: false,
      message: "الاسم مستخدم بالفعل.",
      fieldErrors: { name: "توجد فئة بهذا الاسم بالفعل." },
    }
  }

  return { ok: false, message: "توجد فئة بنفس البيانات بالفعل." }
}

function blockedByProducts(count?: number): string {
  const tail =
    count === undefined
      ? "ما زالت هناك عطور مرتبطة بها"
      : `ما زال ${count} من العطور مرتبطًا بها`

  return `لا يمكن حذف الفئة: ${tail}. انقل العطور إلى فئة أخرى، أو أوقف عرض الفئة بدل حذفها.`
}
