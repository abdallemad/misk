/**
 * The landing page's fixed copy — everything on `/` that is *not* read from
 * the database, in one file, so a copy change is one edit here rather than a
 * hunt through section components. See docs/landing-page.md.
 *
 * **What is deliberately not in here: categories.** The category selector,
 * the footer's category links and the "starting from" prices all come from
 * the database (`catalog.service.ts`). Nothing below names a category, a
 * slug or a count — adding or retiring a category in `/admin/categories`
 * changes `/` with no edit to this file.
 *
 * The three `AUDIENCES` are the marketing research's audience segments —
 * gift buyers, luxury lovers on a budget, people out of the house all day —
 * and each gets a full section of its own on `/`. They are *needs*, not
 * shelves: a perfume is not filed under one the way it is filed under a
 * category, so they live here as copy and each points at a store view that
 * answers that need, rather than being modelled as rows. Their `headline`s
 * are the research's key messages, verbatim.
 *
 * Tone: warm, simple, Egyptian-friendly Arabic. Short sentences, one idea
 * per block.
 */

import { ROUTES } from "@/constants/routes"

/* -------------------------------------------------------------------------
 * SEO
 *
 * PLACEHOLDER keywords — picked from the audience research, to be replaced
 * once keyword research is done. `title` is absolute (it skips the root
 * layout's "%s · مِسك" template, which would otherwise print the brand twice).
 * ---------------------------------------------------------------------- */

export const LANDING_SEO = {
  /** Primary keyword: "عطور مركزة". Secondary: "هدايا عطور". */
  title: "مِسك | عطور مركّزة بثبات طول اليوم وهدايا عطور بسعر مناسب",
  description:
    "عطور بريحة البراندات اللي بتحبها، بزيت مركّز وثبات قوي وسعر يناسبك. اختار حجمك أو خدها دهن خالص بالجرام، وهادي حبايبك بعطر فاخر. الدفع عند الاستلام.",
} as const

/* -------------------------------------------------------------------------
 * Hero
 * ---------------------------------------------------------------------- */

export const HERO_COPY = {
  eyebrow: "مِسك · دار عطور",
  /** The brand promise — max 8 words. Built from all three key messages:
   *  luxury, lasting, affordable. */
  headline: "ريحة فاخرة تدوم معاك، بسعر يناسبك",
  body: "عطور بزيت مركّز وثبات قوي، بنمزجها بإيدينا. اختار الحجم اللي يناسبك، أو خدها دهن خالص بالجرام من غير كحول.",
  /** Every item here must stay literally true — see docs/landing-page.md,
   *  "Claims the page makes". */
  trust: ["يُمزَج عند الطلب", "اختار حجمك", "الدفع عند الاستلام"],
} as const

/** Most photos the hero carousel shows — the best-sellers that have one. */
export const HERO_SLIDES_MAX = 5

/** How long each hero slide stays before the next, in ms. */
export const HERO_AUTOPLAY_MS = 5000

/* -------------------------------------------------------------------------
 * Audience segments — the research's three segments and key messages
 * ---------------------------------------------------------------------- */

export type AudienceIcon = "gift" | "gem" | "sun"

/**
 * One audience segment = one full section on `/` (docs/landing-page.md,
 * "One section per audience"). Its key message is that section's `<h2>`.
 */
export type Audience = {
  id: string
  icon: AudienceIcon
  /** Who this section is talking to, as a question they'd answer "yes" to. */
  eyebrow: string
  /** The key message, verbatim from the research — the section's `<h2>`. */
  headline: string
  body: string
  /** Three short reasons, each one the research's own solution, restated. */
  points: readonly [string, string, string]
  /** The visual panel's caption — one line, in the segment's own words. */
  panel: string
  /**
   * Show the catalogue's live lowest price in the panel. Only on the
   * segment whose whole promise *is* the price — and only when the database
   * has one to show.
   */
  showPriceFrom?: boolean
  cta: { label: string; href: string }
}

export const AUDIENCES: readonly Audience[] = [
  {
    id: "gift-buyers",
    icon: "gift",
    eyebrow: "بتدوّر على هدية؟",
    headline: "هدية فاخرة بتغليف أنيق، وسعر يخليك تهادي الكل.",
    body: "عطر يبان غالي ويفرّح اللي هتهاديه — وبسعر يسمحلك تجيب لأكتر من حد.",
    points: [
      "تغليف أنيق جاهز للإهداء",
      "ريحة مطابقة لبراندات معروفة",
      "سعر يخليك تهادي أكتر من شخص",
    ],
    panel: "هدية لكل حبايبك، من غير ما تحسبها كتير.",
    cta: { label: "اختار هديتك", href: ROUTES.store },
  },
  {
    id: "luxury-on-a-budget",
    icon: "gem",
    eyebrow: "بتحب ريحة البراندات العالمية؟",
    headline: "ريحة البراند اللي بتحبها، بجودة عالية وسعر يناسبك.",
    body: "نفس الريحة اللي بتحبها، من غير ما تدفع تمن الإزازة الأصلية.",
    points: [
      "ريحة مطابقة للبراند",
      "زيت مركّز وثبات قوي",
      "سعر مناسب جدًا لميزانيتك",
    ],
    panel: "فخامة البراند، بسعر على قدّك.",
    showPriceFrom: true,
    cta: { label: "ابدأ بالأوفر", href: `${ROUTES.store}?sort=price-asc` },
  },
  {
    id: "long-day-out",
    icon: "sun",
    eyebrow: "يومك طويل بره البيت؟",
    headline: "رش مرة الصبح، وريحتك تفضل معاك طول اليوم.",
    body: "من الشغل للجامعة للمواصلات — ريحتك تكمّل معاك لحد آخر اليوم.",
    points: [
      "زيت مركّز وثابت",
      "رشة واحدة الصبح تكفي",
      "كحول طبي مناسب للاستخدام اليومي",
    ],
    panel: "من أول اليوم لآخره، بريحة واحدة.",
    cta: { label: "شوف العطور الكحولية", href: `${ROUTES.store}?type=ALCOHOL_BASED` },
  },
]

/* -------------------------------------------------------------------------
 * Category selector — the frame around the DB-driven cards
 * ---------------------------------------------------------------------- */

export const CATEGORY_SECTION = {
  eyebrow: "الفئات",
  title: "أي عطر يشبهك؟",
  intro: "اختار الستايل اللي بتحبه، وشوف العطور اللي معمولة له.",
} as const

/**
 * The icon keys `Category.segmentIconOrImage` may hold. Anything else in
 * that column is treated as an image URL / public path. The icons themselves
 * are mapped in `components/marketing/landing/category-segments.tsx` — this
 * file stays plain data so the admin form (a Client Component) can list the
 * keys without importing an icon set.
 */
export const SEGMENT_ICON_KEYS = [
  "sparkles",
  "flower",
  "flame",
  "gift",
  "gem",
  "sun",
  "moon",
  "leaf",
  "droplet",
  "heart",
] as const

export type SegmentIconKey = (typeof SEGMENT_ICON_KEYS)[number]

export function isSegmentIconKey(value: string): value is SegmentIconKey {
  return (SEGMENT_ICON_KEYS as readonly string[]).includes(value)
}

/**
 * Whether `segmentIconOrImage` holds an image `next/image` can actually
 * load: a public path (`/segments/gift.png`) or one of our own Cloudinary
 * URLs — the only remote host `next.config.ts` allows. Anything else would
 * throw at render, so the admin schema rejects it and the card ignores it.
 */
export function isSegmentImageSrc(value: string): boolean {
  return (
    (value.startsWith("/") && !value.startsWith("//")) ||
    value.startsWith("https://res.cloudinary.com/")
  )
}

/** The generic line a category with no segment copy and no description gets. */
export const SEGMENT_FALLBACK_DESCRIPTION =
  "تشكيلة عطور مختارة بعناية، بزيت مركّز وثبات قوي."

/** "تسوّق <name>" — the button a category with no `segmentCtaLabel` gets. */
export const segmentFallbackCta = (name: string) => `تسوّق ${name}`

/* -------------------------------------------------------------------------
 * Best sellers
 * ---------------------------------------------------------------------- */

/** Two full rows at `lg:grid-cols-3`. */
export const BEST_SELLERS_COUNT = 6

export const BEST_SELLERS_COPY = {
  /** Used when at least one perfume has real (non-cancelled) orders. */
  ranked: { eyebrow: "اختيارات عملائنا", title: "الأكثر طلبًا" },
  /** Used on a shop with no orders yet — never claim "most ordered" then. */
  newest: { eyebrow: "وصل حديثًا", title: "أحدث العطور" },
  cta: "كل العطور",
} as const

/* -------------------------------------------------------------------------
 * How it works
 * ---------------------------------------------------------------------- */

export const HOW_IT_WORKS = {
  eyebrow: "بسيطة",
  title: "إزاي عطرك بيوصلك",
  steps: [
    {
      icon: "search",
      title: "اختار ريحتك",
      body: "دوّر في المجموعة على الريحة اللي بتحبها، أو ابحث باسمها.",
    },
    {
      icon: "ruler",
      title: "اختار الحجم أو الدهن الخالص",
      body: "إزازة 30 أو 50 أو 100 مل، أو دهن خالص بالجرام من غير كحول.",
    },
    {
      icon: "flask",
      title: "بنمزجه ونعبّيه ليك",
      body: "بنحضّر عطرك بعد ما تطلبه، ونوصّله لحد باب البيت. والدفع عند الاستلام.",
    },
  ],
} as const

/* -------------------------------------------------------------------------
 * Quality & ingredients
 * ---------------------------------------------------------------------- */

export const QUALITY = {
  eyebrow: "الجودة والمكوّنات",
  title: "عارفين إيه اللي جوه كل إزازة، لأننا اللي عاملينها.",
  blocks: [
    {
      icon: "flask",
      title: "كحول طبي نقي",
      body: "إيثانول بدرجة صيدلانية هو أساس كل عطر كحولي عندنا — من غير بدائل صناعية ولا مخفّفات.",
    },
    {
      icon: "leaf",
      title: "زيوت مختارة بدرجات",
      body: "بنشتري الزيت العطري بدرجات مختلفة، ونختار الدرجة اللي تناسب كل خلطة.",
    },
    {
      icon: "sparkles",
      title: "يُمزَج عند الطلب",
      body: "مفيش إزازات مستنية على الرف. كل طلب بيتمزج ويتعبّى من جديد، بالحجم اللي تختاره.",
    },
  ],
} as const

/* -------------------------------------------------------------------------
 * Choose your format — the "from" prices are read from the database
 * ---------------------------------------------------------------------- */

export const FORMAT_SECTION = {
  eyebrow: "اختار طريقتك",
  title: "كحولي ولا دهن خالص؟",
  intro: "نفس الريحة، بطريقتين. اختار اللي يناسب يومك.",
} as const

export const FORMAT_COPY = {
  ALCOHOL_BASED: {
    title: "عطر كحولي",
    unitNote: "بالحجم — 30 / 50 / 100 مل",
    suits: "للي بيحب يرش وريحته تبان حواليه — للشغل والخروج والاستخدام اليومي.",
    lasts: "زيت مركّز في كحول طبي. رشة الصبح بتكمّل معاك يومك.",
    cta: "تسوّق العطور الكحولية",
  },
  RAW_OIL: {
    title: "دهن خالص",
    unitNote: "بالوزن — 5 / 8 / 12 جرام",
    suits: "للي عايز عطر من غير كحول، وبيحب الريحة قريبة منه.",
    lasts: "زيت عطري خالص ومركّز — نقطة صغيرة بتكفي.",
    cta: "تسوّق الدهن الخالص",
  },
} as const

/* -------------------------------------------------------------------------
 * Brand story teaser + closing band
 * ---------------------------------------------------------------------- */

export const BRAND_STORY = {
  eyebrow: "حكايتنا",
  title: "من الزيت للإزازة، بإيدينا",
  body: "مِسك بدأت بفكرة بسيطة: ريحة فاخرة ماينفعش تكون حكر على اللي يقدر يدفع تمن البراند. عشان كده بنمزج كل عطر بنفسنا، من زيت مركّز وكحول طبي، ونعبّيه بالحجم اللي تختاره.",
  cta: "اعرف حكايتنا",
} as const

export const FINAL_CTA = {
  /** Built from the two strongest key messages — lasting + gift-able price. */
  title: "ريحتك تفضل معاك طول اليوم، وسعرها يخليك تهادي الكل.",
  cta: "تسوّق المجموعة",
} as const
