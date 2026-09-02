import "server-only"

import type { Prisma } from "@prisma/client"

import { db } from "@/lib/db"
import {
  ingredientKey,
  type ProductIngredientInput,
} from "@/schemas/product.schema"

/**
 * The raw-material master list — the only module that reads or writes the
 * `Ingredient` table.
 *
 * It is a table rather than a text column on `Product` for the reason
 * `schema.prisma` gives: the same material ("Oud Oil — Grade A",
 * "Medical-Grade Ethanol") appears on many perfumes, the shop wants to
 * describe it once, and section 6 of the business analysis wants to *report*
 * on it. A comma-separated string on each product would make "which perfumes
 * use grade A oud?" a `LIKE` query and a rename a find-and-replace.
 *
 * Its own service rather than a corner of `product.service.ts`, because the
 * table has a life beyond products: an `/admin/ingredients` console is the
 * natural next step, and it will want listing, renaming and a delete guard —
 * none of which is a product's business.
 */

/** Just enough of an ingredient to autocomplete a name. */
export type IngredientOption = {
  id: string
  name: string
}

/**
 * The master list, alphabetically.
 *
 * Feeds the `<datalist>` behind the ingredient rows on the product form, so
 * an admin who has already typed "Medical-Grade Ethanol" once picks it the
 * second time instead of inventing "Medical Grade Ethanol".
 */
export async function listIngredients(): Promise<IngredientOption[]> {
  return db.ingredient.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  })
}

/**
 * Turn the names the admin typed into ingredient ids, creating what does not
 * exist yet.
 *
 * **Matching is case- and whitespace-insensitive**, which the database cannot
 * do on its own: `Ingredient.name` is `@unique`, and Postgres compares that
 * byte-for-byte, so "Oud Oil" and "oud  oil" would both be accepted and the
 * master list would grow a near-duplicate every time someone typed with a
 * different shift key. Existing rows are therefore fetched and matched on the
 * normalised form; the row that already exists always wins, and the spelling
 * already in the table is the one that stays.
 *
 * Takes a transaction client so the ingredient rows and the product that
 * refers to them commit together. Creating an ingredient for a product whose
 * save then fails would leave the master list carrying a material nothing
 * uses and nobody chose to add.
 *
 * `skipDuplicates` covers the race where two admins add the same new material
 * at the same moment: one insert wins, the other is dropped rather than
 * throwing, and the second pass below picks up whichever row won.
 */
export async function resolveIngredientIds(
  tx: Prisma.TransactionClient,
  ingredients: ProductIngredientInput[]
): Promise<Map<string, string>> {
  const wanted = new Map<string, string>()
  for (const ingredient of ingredients) {
    // First spelling wins — the schema has already rejected two rows that
    // normalise to the same key, so this only ever collapses a duplicate the
    // service was handed directly.
    wanted.set(ingredientKey(ingredient.name), ingredient.name.trim())
  }

  if (wanted.size === 0) return new Map()

  const existing = await tx.ingredient.findMany({
    where: { name: { in: [...wanted.values()], mode: "insensitive" } },
    select: { id: true, name: true },
  })

  const byKey = new Map(
    existing.map((row) => [ingredientKey(row.name), row.id])
  )

  const missing = [...wanted.entries()].filter(([key]) => !byKey.has(key))

  if (missing.length > 0) {
    await tx.ingredient.createMany({
      data: missing.map(([, name]) => ({ name })),
      skipDuplicates: true,
    })

    const created = await tx.ingredient.findMany({
      where: { name: { in: missing.map(([, name]) => name), mode: "insensitive" } },
      select: { id: true, name: true },
    })

    for (const row of created) byKey.set(ingredientKey(row.name), row.id)
  }

  return byKey
}
