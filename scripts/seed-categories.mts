/**
 * Seed the three founding categories.
 *
 *   npm run seed-categories
 *
 * These three used to be the `Category` enum's members (`YOUTH`, `WOMEN`,
 * `MEN`). Turning the enum into a table made them data instead of schema, so
 * something has to put them back — this is that something. It exists mainly
 * so a fresh clone or a reset database opens `/admin/categories` on a
 * populated table rather than an empty one that looks broken.
 *
 * The copy matches `CATEGORY_ACCENT` in `src/constants/design-system.ts`,
 * which is keyed by these exact slugs. Change a slug here and the storefront
 * quietly loses that segment's accent colour — see the note there.
 *
 * Idempotent: it upserts on `slug`, so running it twice changes nothing and
 * running it against a live database will not clobber an edited name or an
 * uploaded image (only the fields listed in `update` are touched, and there
 * are none — an existing row is left exactly as the admin left it).
 *
 * Run through Node's own TypeScript stripping and `--env-file`, same as
 * `grant-admin.mts`. See docs/categories-feature.md.
 */

import { PrismaClient } from "@prisma/client"

const db = new PrismaClient()

const CATEGORIES = [
  {
    slug: "youth",
    name: "شبابي",
    description: "برغموت وحمضيات، نفَس منعش",
    position: 0,
  },
  {
    slug: "women",
    name: "نسائي",
    description: "ورد وزهور، لمسة بودرية",
    position: 1,
  },
  {
    slug: "men",
    name: "رجالي",
    description: "عود وجلد، عمق راتنجي",
    position: 2,
  },
]

async function main(): Promise<void> {
  for (const category of CATEGORIES) {
    const result = await db.category.upsert({
      where: { slug: category.slug },
      // Empty on purpose: an existing row belongs to whoever edited it last,
      // and a seed script has no business overwriting an admin's copy.
      update: {},
      create: category,
    })

    console.log(`${result.slug.padEnd(6)} ${result.name}`)
  }

  const total = await db.category.count()
  console.log(`\n${total} categories in the database.`)
}

try {
  await main()
} finally {
  await db.$disconnect()
}
