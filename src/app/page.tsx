import Link from "next/link"
import {
  FlaskConicalIcon,
  LeafIcon,
  SearchIcon,
  ShoppingBagIcon,
  SparklesIcon,
} from "lucide-react"

import { SiteFooter } from "@/components/marketing/site-footer"
import { StoreHeader, StoreProductCard } from "@/components/store"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CATEGORY_ACCENT, type CategorySlug } from "@/constants/design-system"
import { ROUTES } from "@/constants/routes"
import { cn } from "@/lib/utils"
import { listCatalog } from "@/services/catalog.service"

/** The built catalogue lives at `/store`; `/store?category=<slug>` filters it. */
const storeCategoryHref = (slug: CategorySlug) =>
  `${ROUTES.store}?category=${slug}`

/**
 * `/` — the landing page.
 *
 * A Server Component now — the "latest products" section reads
 * `catalog.service.listCatalog` for real, the same read `/store` itself
 * uses, rather than the hard-coded `FEATURED` array this file carried before
 * the catalog existed (see docs/store-feature.md, docs/landing-page.md).
 * The header is the shared `StoreHeader` (`components/store`), not a
 * bespoke one — so the same «المتجر» / «حسابي» hover dropdowns `/store`,
 * `/cart` and `/checkout` already have are here too. `CategoryStrip`'s three
 * segments stay hard-coded — Youth / Women / Men are the shop's founding
 * categories (docs/categories-feature.md), not placeholder data. The footer
 * is `components/marketing/site-footer.tsx`, shared with `/about` and
 * `/contact` — the first thing under `components/marketing/`.
 *
 * The hero's search box is a plain `<form action={ROUTES.store}>` — no
 * `"use client"`, no `onSubmit`. A native GET form submission already does
 * exactly what is wanted: navigate to `/store?q=<value>`, which
 * `store-filters.tsx` already reads back out via its own `search` prop. See
 * docs/landing-page.md.
 */

const CATEGORIES: CategorySlug[] = ["youth", "women", "men"]

/** Two full rows at `lg:grid-cols-3` — enough to read as a real selection
 *  without turning the landing page into a second `/store`. */
const LATEST_COUNT = 6

const CRAFT = [
  {
    icon: FlaskConicalIcon,
    title: "كحول طبي نقي",
    body: "نستخدم إيثانول بدرجة صيدلانية كقاعدة لكل عطر كحولي — لا بدائل صناعية ولا مخفّفات.",
  },
  {
    icon: LeafIcon,
    title: "زيوت مختارة بدرجات",
    body: "نشتري الزيت العطري بدرجات مختلفة، ونختار الدرجة التي تناسب كل مزيج بدل أن نساوي بينها.",
  },
  {
    icon: SparklesIcon,
    title: "يُمزَج عند الطلب",
    body: "لا نخزّن قوارير جاهزة. يُمزَج العطر ويُعبّأ بالحجم والعبوة اللذين تختارهما أنت.",
  },
]

function Hero() {
  return (
    <section className="brand-sheen border-b border-border">
      <div className="mx-auto max-w-page px-6 py-24 sm:py-32">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <p className="eyebrow">مِسك · دار عطور</p>
          <h1 className="mt-5 text-display-md sm:text-display-lg lg:text-display-xl">
            عطرٌ نمزجه بأيدينا،
            <br />
            ونعبّئه كما تحب.
          </h1>
          <p className="mt-6 max-w-prose text-base text-muted-foreground">
            نبدأ من الزيت العطري والكحول الطبي، ونصل إلى قارورة تختار أنت حجمها
            وشكلها. أو تأخذه دهنًا خالصًا، بلا كحول، يُباع بالجرام.
          </p>

          <form action={ROUTES.store} role="search" className="relative mt-8 w-full max-w-md">
            <SearchIcon
              aria-hidden="true"
              className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              name="q"
              placeholder="ابحث عن عطرك — مسك، عود، ورد…"
              aria-label="ابحث في المتجر"
              className="h-12 rounded-full bg-background ps-10 pe-28"
            />
            <Button
              type="submit"
              variant="gold"
              size="sm"
              className="absolute end-1.5 top-1/2 -translate-y-1/2 rounded-full"
            >
              بحث
            </Button>
          </form>

          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link
              href={ROUTES.store}
              className={buttonVariants({ variant: "gold", size: "xl" })}
            >
              <ShoppingBagIcon data-icon="inline-start" />
              تسوّق المجموعة
            </Link>
            <Link
              href={ROUTES.about}
              className={buttonVariants({ variant: "outline", size: "xl" })}
            >
              حكاية الصناعة
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

function CategoryStrip() {
  return (
    <section className="mx-auto max-w-page px-6 py-16">
      <div className="mx-auto max-w-prose text-center">
        <p className="eyebrow">الفئات</p>
        <h2 className="mt-3 text-display-sm sm:text-display-md">
          تسوّق حسب الفئة
        </h2>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {CATEGORIES.map((slug) => {
          const accent = CATEGORY_ACCENT[slug]
          return (
            <Link
              key={slug}
              href={storeCategoryHref(slug)}
              className="group rounded-xl border border-border bg-card p-6 text-center transition-colors duration-300 ease-luxe outline-none hover:bg-accent/40 focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span
                className={cn(
                  "mx-auto block h-0.5 w-10 rounded-full transition-[width] duration-500 ease-luxe group-hover:w-16",
                  accent.bg
                )}
              />
              <h3 className="mt-4 text-display-xs font-bold">{accent.label}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{accent.note}</p>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

function Latest({
  products,
}: {
  products: Awaited<ReturnType<typeof listCatalog>>["products"]
}) {
  if (products.length === 0) return null

  return (
    <section className="mx-auto max-w-page px-6 pb-20">
      <div className="mx-auto max-w-prose text-center">
        <p className="eyebrow">وصل حديثًا</p>
        <h2 className="mt-3 text-display-sm sm:text-display-md">
          أحدث العطور
        </h2>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <StoreProductCard key={product.id} product={product} />
        ))}
      </div>

      <div className="mt-10 flex justify-center">
        <Link href={ROUTES.store} className={buttonVariants({ variant: "outline", size: "lg" })}>
          كل العطور
        </Link>
      </div>
    </section>
  )
}

function Craft() {
  return (
    <section className="border-y border-border bg-secondary/40">
      <div className="mx-auto max-w-page px-6 py-20">
        <div className="mx-auto max-w-prose text-center">
          <hr className="rule-gold" />
          <p className="eyebrow mt-6">الجودة والمكوّنات</p>
          <h2 className="mt-3 text-display-sm sm:text-display-md">
            نعرف ما بداخل كل قارورة، لأننا صنعناها.
          </h2>
        </div>

        <div className="mt-14 grid gap-8 sm:grid-cols-3">
          {CRAFT.map(({ icon: Icon, title, body }) => (
            <div key={title} className="text-center">
              <span className="mx-auto inline-flex size-10 items-center justify-center rounded-lg bg-gold-soft text-gold-soft-foreground">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-4 text-display-xs font-bold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default async function Home() {
  const { products } = await listCatalog({ sort: "newest" })

  return (
    <>
      <StoreHeader />
      <main className="flex-1">
        <Hero />
        <CategoryStrip />
        <Latest products={products.slice(0, LATEST_COUNT)} />
        <Craft />
      </main>
      <SiteFooter />
    </>
  )
}
