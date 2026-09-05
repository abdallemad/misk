import Link from "next/link"
import { MailIcon, MessageCircleIcon, PhoneIcon } from "lucide-react"

import { SiteFooter } from "@/components/marketing/site-footer"
import { FacebookIcon, InstagramIcon } from "@/components/shared/social-icons"
import { StoreHeader } from "@/components/store"
import { CONTACT } from "@/constants/contact"

export const metadata = { title: "تواصل معنا" }

/**
 * `/contact` — every channel to reach the shop, one card each: WhatsApp,
 * Instagram, Facebook, email, phone. `constants/contact.ts` holds the
 * values (all placeholders — مِسك is a fictional demo brand, see
 * docs/misk_business_analysis.md); this page only lays them out.
 *
 * A plain Server Component, same reasoning as `/about` — nothing here reads
 * from the database or needs the client, so it isn't `async` and isn't
 * `"use client"`. See docs/landing-page.md.
 */

const CHANNELS = [
  {
    icon: MessageCircleIcon,
    label: "واتساب",
    note: "أسرع رد — راسلنا وقت ما يناسبك.",
    value: CONTACT.phone,
    href: CONTACT.whatsappHref,
    external: true,
  },
  {
    icon: InstagramIcon,
    label: "إنستغرام",
    note: "أحدث الخلطات وخلف الكواليس أول بأول.",
    value: `@${CONTACT.instagramHandle}`,
    href: CONTACT.instagramHref,
    external: true,
  },
  {
    icon: FacebookIcon,
    label: "فيسبوك",
    note: "صفحتنا للعروض والمنتجات الجديدة.",
    value: CONTACT.facebookHandle,
    href: CONTACT.facebookHref,
    external: true,
  },
  {
    icon: MailIcon,
    label: "البريد الإلكتروني",
    note: "لأي استفسار تفصيلي أو تعاون تجاري.",
    value: CONTACT.email,
    href: `mailto:${CONTACT.email}`,
    external: false,
  },
  {
    icon: PhoneIcon,
    label: "الهاتف",
    note: "اتصال مباشر خلال أوقات العمل.",
    value: CONTACT.phone,
    href: `tel:${CONTACT.phone}`,
    external: false,
  },
] as const

function Intro() {
  return (
    <section className="brand-sheen border-b border-border">
      <div className="mx-auto max-w-page px-6 py-20 sm:py-24">
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <p className="eyebrow">تواصل معنا</p>
          <h1 className="mt-5 text-display-md sm:text-display-lg">
            سؤال عن عطر، أو طلب خاص؟
          </h1>
          <p className="mt-6 text-base text-muted-foreground">
            اختر القناة الأقرب لك — كلها توصل لنفس الفريق الصغير الذي يصنع
            عطورك.
          </p>
        </div>
      </div>
    </section>
  )
}

function Channels() {
  return (
    <section className="mx-auto max-w-page px-6 py-16">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {CHANNELS.map((channel) => (
          <Link
            key={channel.label}
            href={channel.href}
            target={channel.external ? "_blank" : undefined}
            rel={channel.external ? "noopener noreferrer" : undefined}
            className="group rounded-xl border border-border bg-card p-6 text-center transition-colors duration-300 ease-luxe outline-none hover:bg-accent/40 focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <span className="mx-auto inline-flex size-10 items-center justify-center rounded-lg bg-gold-soft text-gold-soft-foreground">
              <channel.icon className="size-5" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-display-xs font-bold">{channel.label}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{channel.note}</p>
            <p className="mt-3 text-sm font-medium group-hover:underline" dir="ltr">
              {channel.value}
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default function ContactPage() {
  return (
    <>
      <StoreHeader />
      <main className="flex-1">
        <Intro />
        <Channels />
      </main>
      <SiteFooter />
    </>
  )
}
