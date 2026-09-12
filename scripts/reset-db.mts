/**
 * Empty the database — every row, every table, nothing else touched.
 *
 *   npm run reset-db
 *
 * Run through Node's own TypeScript stripping and `--env-file`, exactly like
 * `grant-admin.mts`, `seed-categories.mts` and `seed-dev.mts` — no extra
 * dependency, no build step, no `ts-node`.
 *
 * This deletes rows through Prisma Client, in an order that never trips a
 * foreign-key constraint regardless of that relation's own `onDelete` —
 * every child table is cleared before the parent it points at:
 *
 *   OrderItem → Order → ProductIngredient → ProductVariant → ProductImage
 *   → Product → Ingredient → Category → User
 *
 * The schema itself is untouched — every table, column and enum stays
 * exactly as `prisma/schema.prisma` defines it, just with zero rows in each.
 * That is the difference from `npx prisma db push --force-reset`
 * (docs/database-seeding.md, "Resetting"): the `--force-reset` path drops
 * and recreates every table from the schema, which also requires
 * `prisma generate` afterward and DDL privileges on the database; this script
 * only issues `DELETE`s a normal application connection can already run, so
 * it works anywhere `seed-dev` does, no schema drift possible, and nothing to
 * regenerate afterward.
 *
 * Run `npm run seed-dev` afterward to refill it with the mock catalog, or
 * leave it empty for a truly blank slate.
 */

import { PrismaClient } from "@prisma/client"

const db = new PrismaClient()

async function main(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    console.error(
      "Refusing to run with NODE_ENV=production. This script deletes every\n" +
        "row in the database. Unset NODE_ENV or point DATABASE_URL at a\n" +
        "development database."
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

  console.log(`Resetting database → ${dbHost}\n`)

  // Children before parents — see the module doc for why this order is safe
  // no matter what each relation's own `onDelete` says.
  const deletes: [string, () => Promise<{ count: number }>][] = [
    ["orderItems", () => db.orderItem.deleteMany()],
    ["orders", () => db.order.deleteMany()],
    ["productIngredients", () => db.productIngredient.deleteMany()],
    ["productVariants", () => db.productVariant.deleteMany()],
    ["productImages", () => db.productImage.deleteMany()],
    ["products", () => db.product.deleteMany()],
    ["ingredients", () => db.ingredient.deleteMany()],
    ["categories", () => db.category.deleteMany()],
    ["users", () => db.user.deleteMany()],
  ]

  for (const [label, run] of deletes) {
    const { count } = await run()
    console.log(`  ${label.padEnd(18)} ${count}`)
  }

  console.log("\nDone. Database is empty.")
}

try {
  await main()
} finally {
  await db.$disconnect()
}
