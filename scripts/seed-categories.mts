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
 * **Segment copy** (the landing page's category cards — docs/landing-page.md)
 * is the one exception, and it is still additive: each `segment*` column is
 * written only while it is `null`. That lets this script back-fill the copy
 * onto rows that existed before the columns did, without ever overwriting a
 * card an admin has since rewritten. Matching by slug happens here and only
 * here — the landing page itself never names a slug.
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

/** The landing page's card copy per founding segment, keyed by slug. */
const SEGMENT_COPY: Record<
  string,
  {
    segmentHeadline: string
    segmentDescription: string
    segmentCtaLabel: string
    segmentIconOrImage: string
  }
> = {
  youth: {
    segmentHeadline: "ريحة منعشة لكل يوم",
    segmentDescription: "حمضيات وبرغموت خفيفة، تنفع للجامعة والشغل والخروجات.",
    segmentCtaLabel: "تسوّق الشبابي",
    segmentIconOrImage: "sparkles",
  },
  women: {
    segmentHeadline: "ريحة ناعمة تفضل معاكي",
    segmentDescription: "ورد وزهور بلمسة بودرية، هادية وأنيقة طول اليوم.",
    segmentCtaLabel: "تسوّق النسائي",
    segmentIconOrImage: "flower",
  },
  men: {
    segmentHeadline: "ريحة واثقة وعميقة",
    segmentDescription: "عود وجلد بعمق دافي، حضور قوي من غير مبالغة.",
    segmentCtaLabel: "تسوّق الرجالي",
    segmentIconOrImage: "flame",
  },
}

async function main(): Promise<void> {
  for (const category of CATEGORIES) {
    const copy = SEGMENT_COPY[category.slug] ?? {}

    const result = await db.category.upsert({
      where: { slug: category.slug },
      // Empty on purpose: an existing row belongs to whoever edited it last,
      // and a seed script has no business overwriting an admin's copy.
      update: {},
      create: { ...category, ...copy },
    })

    // Back-fill only the segment columns that are still empty — and never
    // the icon on a category that already has a photo: the card falls back
    // to `imageUrl`, and a real photo beats a seeded icon.
    const missing = Object.fromEntries(
      Object.entries(copy).filter(
        ([key]) =>
          result[key as keyof typeof copy] === null &&
          !(key === "segmentIconOrImage" && result.imageUrl)
      )
    )
    if (Object.keys(missing).length > 0) {
      await db.category.update({ where: { id: result.id }, data: missing })
    }

    const filled = Object.keys(missing).length
    console.log(
      `${result.slug.padEnd(6)} ${result.name}${filled ? `  (+${filled} segment fields)` : ""}`
    )
  }

  const total = await db.category.count()
  console.log(`\n${total} categories in the database.`)
}

try {
  await main()
} finally {
  await db.$disconnect()
}
