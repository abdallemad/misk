/**
 * The brand's own story — the founder's words — and every fixed string on
 * `/about`, in one file, the same way `constants/landing.ts` holds `/`.
 *
 * `BRAND_ABOUT` is the owner's text, **verbatim** (2026-10-06), split at its
 * sentence breaks into the pieces the pages need. Two places read it: the
 * footer prints `BRAND_ABOUT.full` on every marketing page, and `/about`
 * lays the same sentences out across its hero and story sections. One
 * source, so the footer and the page cannot drift apart — edit the
 * sentences here, never a copy of them in a component.
 *
 * The rest of `/about` (the values) restates that text's own claims —
 * handmade, chosen materials in balanced measures, you pay for the perfume
 * not the brand name — and nothing it doesn't. The manufacturing claims
 * (`Quality`) and the two formats (`FormatComparison`) are the landing
 * page's own sections, reused rather than rewritten. See
 * docs/landing-page.md, "`/about`".
 */

/* -------------------------------------------------------------------------
 * The founder's text
 * ---------------------------------------------------------------------- */

const ORIGIN =
  "في مسك، بدأت الحكاية مع محمد يونس بفكرة بسيطة: العطر الجيد مش لازم يكلفك ثروة."
const CRAFT =
  "إحنا بنصنع عطورنا يدويًا بعناية، من خامات مختارة ومقادير متوازنة، عشان نوصلك لرائحة فخمة وثابتة تفضل معاك طول اليوم، من غير ما تدفع ثمن اسم براند كبير أو إعلانات ضخمة."
const BELIEF =
  "إيماننا إن الجودة حق للجميع، ولذلك بنقدم لك عطور بتفرّق معاك في الإحساس والحضور، وبسعر مناسب يخليك تتميز كل يوم."
const SIGN_OFF = "مسك... عطر يشبهك، بسعر يريّحك."

export const BRAND_ABOUT = {
  founder: "محمد يونس",
  origin: ORIGIN,
  craft: CRAFT,
  belief: BELIEF,
  /** The closing line — `/about`'s `<h1>` and the story panel's quote. */
  signOff: SIGN_OFF,
  /** The whole text as one paragraph — the footer's «عن مِسك». */
  full: [ORIGIN, CRAFT, BELIEF, SIGN_OFF].join(" "),
} as const

/* -------------------------------------------------------------------------
 * /about
 * ---------------------------------------------------------------------- */

export const ABOUT_SEO = {
  title: "حكايتنا",
  description:
    "مِسك بدأت مع محمد يونس بفكرة بسيطة: العطر الجيد مش لازم يكلفك ثروة. عطور مصنوعة يدويًا من خامات مختارة، بثبات طول اليوم وسعر مناسب.",
} as const

export const ABOUT_HERO = {
  eyebrow: "حكايتنا",
  /** The sign-off, minus its leading «مسك...» — the eyebrow already names the brand. */
  headline: "عطر يشبهك، بسعر يريّحك.",
} as const

export const ABOUT_STORY = {
  eyebrow: "البداية",
  title: "العطر الجيد مش لازم يكلفك ثروة.",
  /** Caption under the quote in the story panel. */
  attribution: "محمد يونس، مؤسس مِسك",
} as const

export type AboutValueIcon = "hand" | "scale" | "wallet"

/** Three values, each one sentence of the founder's text, unpacked. */
export const ABOUT_VALUES = {
  eyebrow: "اللي بنآمن بيه",
  title: "فخامة وثبات، من غير تمن الاسم",
  blocks: [
    {
      icon: "hand",
      title: "بنصنعه بإيدينا",
      body: "كل عطر بيتعمل يدويًا وبعناية — مش خط إنتاج، ومش إزازات جاهزة مستنية على الرف.",
    },
    {
      icon: "scale",
      title: "خامات مختارة ومقادير متوازنة",
      body: "بنختار الزيت والخامات بنفسنا، ونوزن كل خلطة عشان الريحة تطلع فخمة وتفضل ثابتة طول اليوم.",
    },
    {
      icon: "wallet",
      title: "الجودة حق للجميع",
      body: "بتدفع تمن العطر نفسه، مش تمن اسم براند كبير أو إعلانات ضخمة.",
    },
  ],
} as const satisfies {
  eyebrow: string
  title: string
  blocks: readonly { icon: AboutValueIcon; title: string; body: string }[]
}

export const ABOUT_CTA = {
  title: "جاهز تلاقي العطر اللي يشبهك؟",
  primary: "تسوّق المجموعة",
  secondary: "تواصل معنا",
} as const
