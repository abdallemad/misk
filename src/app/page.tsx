import Link from "next/link"
import {
  DropletIcon,
  FlaskConicalIcon,
  LeafIcon,
  ShoppingBagIcon,
  SparklesIcon,
} from "lucide-react"

import { AuthNav } from "@/components/shared/auth-nav"
import { BrandLockup } from "@/components/shared/brand-lockup"
import { StockBadge } from "@/components/shared/status-badge"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  CATEGORY_ACCENT,
  PRODUCT_TYPE_ACCENT,
  type CategorySlug,
  type ProductType,
} from "@/constants/design-system"
import { cn } from "@/lib/utils"
import { formatPrice } from "@/utils/format"

/**
 * `/` — the landing page.
 *
 * Placeholder copy and hard-coded products for now: the point of this file
 * today is to exercise the design system end to end. Once the catalog is
 * wired up, the sections here move into `components/marketing/` and the
 * products come from `product.service.ts`. See docs/design-system.md.
 */

const CATEGORIES: CategorySlug[] = ["youth", "women", "men"]

type FeaturedProduct = {
  name: string
  category: CategorySlug
  type: ProductType
  from: number
  stock: number
  note: string
}

const FEATURED: FeaturedProduct[] = [
  {
    name: "عنبر الورد",
    category: "women",
    type: "ALCOHOL",
    from: 690,
    stock: 24,
    note: "ورد دمشقي فوق قاعدة عنبر دافئة، تثبت طويلًا على البشرة.",
  },
  {
    name: "دهن عود ملكي",
    category: "men",
    type: "RAW_OIL",
    from: 1450,
    stock: 3,
    note: "دهن خالص غير مخفّف، يُقطَّر ببطء ويُباع بالجرام.",
  },
  {
    name: "برغموت أزرق",
    category: "youth",
    type: "ALCOHOL",
    from: 540,
    stock: 12,
    note: "حمضيات منعشة مع نفَس بحري خفيف، لنهار طويل.",
  },
]

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

function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-page items-center justify-between gap-6 px-6">
        <BrandLockup size="sm" />

        {/* A link that looks like a button is still a link: style it with
            `buttonVariants` rather than rendering <Button> as an anchor,
            which strips the native button semantics Base UI expects. */}
        <nav className="hidden items-center gap-1 md:flex">
          {CATEGORIES.map((slug) => (
            <Link
              key={slug}
              href={`/shop/${slug}`}
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              {CATEGORY_ACCENT[slug].label}
            </Link>
          ))}
          <Link
            href="/about"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            حكايتنا
          </Link>
        </nav>

        <div className="flex items-center gap-1">
          <AuthNav />
          <ThemeToggle />
          <Link
            href="/cart"
            aria-label="السلة"
            className={buttonVariants({ variant: "ghost", size: "icon" })}
          >
            <ShoppingBagIcon />
          </Link>
        </div>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section className="brand-sheen border-b border-border">
      <div className="mx-auto max-w-page px-6 py-24 sm:py-32">
        <p className="eyebrow">مِسك · دار عطور</p>
        <h1 className="mt-5 max-w-3xl text-display-md sm:text-display-lg lg:text-display-xl">
          عطرٌ نمزجه بأيدينا،
          <br />
          ونعبّئه كما تحب.
        </h1>
        <p className="mt-6 max-w-prose text-base text-muted-foreground">
          نبدأ من الزيت العطري والكحول الطبي، ونصل إلى قارورة تختار أنت حجمها
          وشكلها. أو تأخذه دهنًا خالصًا، بلا كحول، يُباع بالجرام.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link
            href="/shop"
            className={buttonVariants({ variant: "gold", size: "xl" })}
          >
            <ShoppingBagIcon data-icon="inline-start" />
            تسوّق المجموعة
          </Link>
          <Link
            href="/about"
            className={buttonVariants({ variant: "outline", size: "xl" })}
          >
            حكاية الصناعة
          </Link>
        </div>
      </div>
    </section>
  )
}

function CategoryStrip() {
  return (
    <section className="mx-auto max-w-page px-6 py-16">
      <div className="grid gap-4 sm:grid-cols-3">
        {CATEGORIES.map((slug) => {
          const accent = CATEGORY_ACCENT[slug]
          return (
            <Link
              key={slug}
              href={`/shop/${slug}`}
              className="group rounded-xl border border-border bg-card p-6 transition-colors duration-300 ease-luxe outline-none hover:bg-accent/40 focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span
                className={cn(
                  "block h-0.5 w-10 rounded-full transition-[width] duration-500 ease-luxe group-hover:w-16",
                  accent.bg
                )}
              />
              <h2 className="mt-4 text-display-xs font-bold">{accent.label}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{accent.note}</p>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

function Featured() {
  return (
    <section className="mx-auto max-w-page px-6 pb-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">مختارات</p>
          <h2 className="mt-3 text-display-sm sm:text-display-md">
            عطور تبدأ بها
          </h2>
        </div>
        <Link href="/shop" className={buttonVariants({ variant: "outline" })}>
          كل العطور
        </Link>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURED.map((product) => {
          const type = PRODUCT_TYPE_ACCENT[product.type]
          return (
            <Card key={product.name} className="overflow-hidden pt-0">
              <div className="flacon-plate flex h-48 items-center justify-center">
                <DropletIcon className={cn("size-12", type.text)} />
              </div>
              <CardHeader>
                <p className="eyebrow">
                  {CATEGORY_ACCENT[product.category].label} · {type.label}
                </p>
                <CardTitle className="mt-1.5 font-display text-display-xs font-bold">
                  {product.name}
                </CardTitle>
                <CardDescription className="mt-1">
                  {product.note}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  يبدأ من{" "}
                  <span
                    className="text-base font-medium text-foreground"
                    data-numeric
                  >
                    {formatPrice(product.from)}
                  </span>
                </p>
                <StockBadge stock={product.stock} />
              </CardContent>
              <CardFooter>
                <Button variant="gold" className="w-full">
                  اختر الخيارات
                </Button>
              </CardFooter>
            </Card>
          )
        })}
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
            <div key={title}>
              <span className="inline-flex size-10 items-center justify-center rounded-lg bg-gold-soft text-gold-soft-foreground">
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

function SiteFooter() {
  return (
    <footer className="mx-auto w-full max-w-page px-6 py-14">
      <div className="flex flex-wrap items-start justify-between gap-8">
        <BrandLockup tagline="دار عطور" />
        <nav className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
          {CATEGORIES.map((slug) => (
            <Link
              key={slug}
              href={`/shop/${slug}`}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {CATEGORY_ACCENT[slug].label}
            </Link>
          ))}
          <Link
            href="/about"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            حكايتنا
          </Link>
          <Link
            href="/design-system"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            نظام التصميم
          </Link>
        </nav>
      </div>

      <Separator className="my-8" />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          © <span data-numeric>{new Date().getFullYear()}</span> مِسك. كل الحقوق
          محفوظة.
        </p>
        <Badge variant="neutral">يُمزَج عند الطلب</Badge>
      </div>
    </footer>
  )
}

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <CategoryStrip />
        <Featured />
        <Craft />
      </main>
      <SiteFooter />
    </>
  )
}
