/**
 * The business's own contact channels — `/contact` and the footer link to
 * it. مِسك is a fictional demo brand (see docs/misk_business_analysis.md),
 * so every value below is a placeholder: an Egyptian mobile format matching
 * the one `scripts/seed-dev.mts` and `checkout.schema.ts`'s `PHONE_PATTERN`
 * already assume, and an `.example` email domain (reserved for exactly this
 * by RFC 2606 — it can never resolve to a real inbox). Swap these for the
 * shop's real accounts before this ever ships.
 *
 * One WhatsApp number doubles as the phone number — a small shop with one
 * owner answering both, which is exactly what
 * docs/misk_business_analysis.md describes.
 */
export const CONTACT = {
  phone: "+201001234567",
  whatsappHref: "https://wa.me/201001234567",
  instagramHandle: "misk.perfumes",
  instagramHref: "https://instagram.com/misk.perfumes",
  facebookHandle: "مِسك للعطور",
  facebookHref: "https://facebook.com/miskperfumes",
  email: "hello@misk.example",
} as const
