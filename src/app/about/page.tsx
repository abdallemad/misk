import Link from "next/link"
import {
  DropletIcon,
  FlaskConicalIcon,
  LeafIcon,
  SparklesIcon,
} from "lucide-react"

import { SiteFooter } from "@/components/marketing/site-footer"
import { StoreHeader } from "@/components/store"
import { buttonVariants } from "@/components/ui/button"
import { CATEGORY_ACCENT, type CategorySlug } from "@/constants/design-system"
import { ROUTES } from "@/constants/routes"

export const metadata = { title: "حكايتنا" }

/**
 * `/about` — the manufacturing story: who makes مِسك, what goes into a
 * bottle, and the two ways a perfume leaves the workshop. A translation of
 * `docs/misk_business_analysis.md` — an internal planning document, English,
 * written for building the catalog — into the Arabic customer-facing copy
 * this page actually needed. Nothing here is copied verbatim from that
 * document; its numbered sections (§2 business model, §4 product types, §6
 * raw materials) are the *source of the claims*, restated as brand copy.
 *
 * A plain Server Component sharing `StoreHeader` / `SiteFooter` with `/` and
 * `/contact` — no data fetching, so no reason to be `async`. See
 * docs/landing-page.md.
 */

const CATEGORIES: CategorySlug[] = ["youth", "women", "men"]

const CRAFT = [
  {
    icon: FlaskConicalIcon,
    title: "كحول طبي نقي",
    body: "قاعدة كل عطر كحولي عندنا هي إيثانول بدرجة صيدلانية — لا بدائل صناعية، ولا مخفّفات رخيصة تُضعف الرائحة بعد ساعات.",
  },
  {
    icon: LeafIcon,
    title: "زيوت عطرية بدرجات",
    body: "نشتري الزيت الخام بدرجات جودة مختلفة، ونختار الدرجة التي تناسب كل خلطة على حدة — بدل أن نساوي بين عطر وآخر بنفس المكوّن.",
  },
  {
    icon: SparklesIcon,
    title: "يُمزَج عند الطلب",
    body: "لا نُخزّن قوارير جاهزة على الرفّ. كل طلب يُمزَج ويُعبّأ من جديد، بالحجم الذي تختاره وقت الشراء.",
  },
]

const LINES = [
  {
    icon: FlaskConicalIcon,
    title: "العطر الكحولي",
    specs: ["30 مل / 50 مل / 100 مل", "السعر حسب الحجم ودرجة الزيت"],
    note: "خلطة زيت عطري مُذابة في كحول طبي — الخط الكلاسيكي، بثبات ونفحة تتطوّران على مدار اليوم.",
  },
  {
    icon: DropletIcon,
    title: "الدهن العطري (دهن مركّز)",
    specs: ["5 جم / 8 جم / 12 جم", "بلا كحول إطلاقًا", "يُباع بالوزن لا بالحجم"],
    note: "زيت خام غير مخفّف، مُقطَّر ببطء — خط أكثر تركيزًا، لمن يفضّل الدهن الشرقي الخالص على العطر الكحولي.",
  },
]

function Intro() {
  return (
    <section className="brand-sheen border-b border-border">
      <div className="mx-auto max-w-page px-6 py-20 sm:py-28">
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <p className="eyebrow">حكايتنا</p>
          <h1 className="mt-5 text-display-md sm:text-display-lg">
            مِسك ليست مصنعًا، بل ورشة عطّار واحد.
          </h1>
          <p className="mt-6 text-base text-muted-foreground">
            كل قارورة تخرج من مِسك صنعناها بأيدينا — من الزيت العطري الخام
            والكحول الطبي، إلى الخلطة النهائية التي تختار أنت حجمها.
            لا خط إنتاج ضخم، ولا دفعات جاهزة مسبقًا تنتظر من يشتريها — كل طلب
            مناسبة لخلطة جديدة.
          </p>
        </div>
      </div>
    </section>
  )
}

function Craft() {
  return (
    <section className="mx-auto max-w-page px-6 py-20">
      <div className="mx-auto max-w-prose text-center">
        <p className="eyebrow">الجودة والمكوّنات</p>
        <h2 className="mt-3 text-display-sm sm:text-display-md">
          نعرف ما بداخل كل قارورة، لأننا صنعناها
        </h2>
      </div>

      <div className="mt-14 grid gap-8 sm:grid-cols-3">
        {CRAFT.map(({ icon: Icon, title, body }) => (
          <div key={title} className="text-center">
            <span className="mx-auto inline-flex size-10 items-center justify-center rounded-lg bg-gold-soft text-gold-soft-foreground">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-display-xs font-bold">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function Lines() {
  return (
    <section className="border-y border-border bg-secondary/40">
      <div className="mx-auto max-w-page px-6 py-20">
        <div className="mx-auto max-w-prose text-center">
          <p className="eyebrow">خطّان لكل ذوق</p>
          <h2 className="mt-3 text-display-sm sm:text-display-md">
            عطر كحولي، أو دهن مركّز بلا كحول
          </h2>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {LINES.map(({ icon: Icon, title, specs, note }) => (
            <div
              key={title}
              className="rounded-xl border border-border bg-card p-8 text-center"
            >
              <span className="mx-auto inline-flex size-12 items-center justify-center rounded-lg bg-gold-soft text-gold-soft-foreground">
                <Icon className="size-6" aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-display-xs font-bold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{note}</p>
              <ul className="mt-5 flex flex-col gap-2 text-sm">
                {specs.map((spec) => (
                  <li key={spec} className="text-muted-foreground">
                    {spec}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Categories() {
  return (
    <section className="mx-auto max-w-page px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow">لكل فئة عطرها</p>
        <h2 className="mt-3 text-display-sm sm:text-display-md">
          شبابي، نسائي، رجالي
        </h2>
        <p className="mt-6 text-base text-muted-foreground">
          نقسّم المجموعة حسب الفئة العمرية والذوق، لا حسب نوع العبوة —
          فكل فئة تحمل نفسها الخاصة، سواء اخترتها عطرًا كحوليًا أو دهنًا
          مركّزًا.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {CATEGORIES.map((slug) => {
            const accent = CATEGORY_ACCENT[slug]
            return (
              <Link
                key={slug}
                href={`${ROUTES.store}?category=${slug}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-1.5 text-sm transition-colors hover:bg-accent/40"
              >
                <span aria-hidden="true" className={`size-1.5 rounded-full ${accent.bg}`} />
                {accent.label}
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function Cta() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-page px-6 py-16">
        <div className="mx-auto flex max-w-xl flex-col items-center gap-6 text-center">
          <h2 className="text-display-sm sm:text-display-md">
            جاهز تجرّب عطرك؟
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href={ROUTES.store} className={buttonVariants({ variant: "gold", size: "xl" })}>
              تسوّق المجموعة
            </Link>
            <Link
              href={ROUTES.contact}
              className={buttonVariants({ variant: "outline", size: "xl" })}
            >
              تواصل معنا
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function AboutPage() {
  return (
    <>
      <StoreHeader />
      <main className="flex-1">
        <Intro />
        <Craft />
        <Lines />
        <Categories />
        <Cta />
      </main>
      <SiteFooter />
    </>
  )
}
