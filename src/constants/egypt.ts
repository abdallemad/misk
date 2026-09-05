/**
 * Egypt's 27 governorates (محافظات) — the fixed list `/checkout`'s
 * governorate select offers, in the order they are commonly listed (Greater
 * Cairo first, then the rest roughly north to south).
 *
 * A literal array rather than a lookup table for the same reason
 * `constants/catalog.ts` writes the Prisma enums out by hand: a governorate
 * is a fact about the country the shop ships to, not something an admin
 * screen ever adds to — the day that changes is a rare one, and worth the
 * friction of a code change.
 */
export const EGYPT_GOVERNORATES = [
  "القاهرة",
  "الجيزة",
  "القليوبية",
  "الإسكندرية",
  "البحيرة",
  "مطروح",
  "كفر الشيخ",
  "الدقهلية",
  "دمياط",
  "الشرقية",
  "الغربية",
  "المنوفية",
  "الإسماعيلية",
  "بورسعيد",
  "السويس",
  "شمال سيناء",
  "جنوب سيناء",
  "الفيوم",
  "بني سويف",
  "المنيا",
  "أسيوط",
  "الوادي الجديد",
  "سوهاج",
  "قنا",
  "الأقصر",
  "أسوان",
  "البحر الأحمر",
] as const

export type EgyptGovernorate = (typeof EGYPT_GOVERNORATES)[number]
