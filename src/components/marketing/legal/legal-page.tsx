import Link from "next/link"
import { MailIcon, MessageCircleIcon, PhoneIcon } from "lucide-react"

import { CONTACT } from "@/constants/contact"
import {
  LEGAL_LINKS,
  LEGAL_UPDATED_AT,
  type LegalBlock,
  type LegalDoc,
} from "@/constants/legal"
import { cn } from "@/lib/utils"
import { LOCALE } from "@/utils/format"

/**
 * «6 أكتوبر 2026», not `formatDate`'s numeric «06/10/2026» — on a policy the
 * date is read on its own, and a bare d/m/y is ambiguous to anyone used to
 * m/d/y.
 */
const updatedAt = new Intl.DateTimeFormat(LOCALE, {
  dateStyle: "long",
  // The constant is a bare date, i.e. UTC midnight — format it in UTC too,
  // or a server west of Greenwich prints the day before.
  timeZone: "UTC",
}).format(new Date(LEGAL_UPDATED_AT))

const CONTACT_CHANNELS = [
  {
    icon: MessageCircleIcon,
    label: "واتساب",
    value: CONTACT.phone,
    href: CONTACT.whatsappHref,
    external: true,
  },
  {
    icon: PhoneIcon,
    label: "الهاتف",
    value: CONTACT.phone,
    href: `tel:${CONTACT.phone}`,
    external: false,
  },
  {
    icon: MailIcon,
    label: "البريد الإلكتروني",
    value: CONTACT.email,
    href: `mailto:${CONTACT.email}`,
    external: false,
  },
] as const

/**
 * One layout for `/terms`, `/privacy` and `/refunds` — the copy is data in
 * `constants/legal.ts`; this only lays it out.
 *
 * Top to bottom: the header (the page's `<h1>` and «آخر تحديث»), the key
 * facts as cards when the doc has any, then the numbered sections beside a
 * sticky contents list, then a contact block and links to the other two
 * pages. The contact block is appended here, not written into each doc, so
 * all three always point at the same channels (`constants/contact.ts`).
 *
 * Deliberately **no motion**: a policy is read, not browsed, and text that
 * fades in as you scroll is text that is briefly not there. The contents
 * list is `lg`+ only — below that it would be twelve links standing between
 * the shopper and the first section. Each section is `scroll-mt-24` so an
 * anchor jump lands below the sticky header. See docs/legal-pages.md.
 */
export function LegalPage({
  doc,
  currentHref,
}: {
  doc: LegalDoc
  /** This page's own route — left out of the "related" links. */
  currentHref: string
}) {
  return (
    <>
      <header className="brand-sheen border-b border-border">
        <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-16 text-center sm:px-6 sm:py-20">
          <p className="eyebrow">{doc.eyebrow}</p>
          <h1 className="mt-5 text-display-md sm:text-display-lg">{doc.title}</h1>
          <p className="mt-6 text-base text-muted-foreground">{doc.intro}</p>
          <p className="mt-6 text-xs text-muted-foreground">
            آخر تحديث:{" "}
            <time dateTime={LEGAL_UPDATED_AT}>{updatedAt}</time>
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-page px-4 py-12 sm:px-6 sm:py-16">
        {doc.highlights ? (
          <dl className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {doc.highlights.map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-border bg-card p-5 text-center"
              >
                <dt className="text-xs text-muted-foreground">{item.label}</dt>
                <dd className="mt-2 font-display text-lg">{item.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        <div className="grid gap-12 lg:grid-cols-[15rem_minmax(0,1fr)]">
          <nav aria-label="محتويات الصفحة" className="hidden lg:block">
            <div className="sticky top-24">
              <p className="eyebrow">في هذه الصفحة</p>
              <ol className="mt-4 flex flex-col gap-2.5 border-s border-border ps-4 text-sm">
                {doc.sections.map((section, index) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <span className="tabular-nums">{index + 1}.</span>{" "}
                      {section.heading}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </nav>

          <article className="max-w-prose">
            {doc.sections.map((section, index) => (
              <section
                key={section.id}
                id={section.id}
                aria-labelledby={`${section.id}-title`}
                className="scroll-mt-24 border-b border-border py-8 first:pt-0 last:border-b-0"
              >
                <h2
                  id={`${section.id}-title`}
                  className="flex items-baseline gap-3 text-display-xs font-bold"
                >
                  <span className="text-gold tabular-nums">{index + 1}.</span>
                  {section.heading}
                </h2>
                <div className="mt-4 flex flex-col gap-4 text-base leading-relaxed text-muted-foreground">
                  {section.blocks.map((block, blockIndex) => (
                    <Block key={blockIndex} block={block} />
                  ))}
                </div>
              </section>
            ))}

            <section
              aria-labelledby="legal-contact-title"
              className="mt-8 rounded-xl border border-border bg-card p-6"
            >
              <h2 id="legal-contact-title" className="text-display-xs font-bold">
                عندك سؤال؟
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                كلّمنا على أي قناة، وهنرد عليك بنفسنا.
              </p>
              <ul className="mt-5 grid gap-3 sm:grid-cols-3">
                {CONTACT_CHANNELS.map((channel) => (
                  <li key={channel.label}>
                    <Link
                      href={channel.href}
                      target={channel.external ? "_blank" : undefined}
                      rel={channel.external ? "noopener noreferrer" : undefined}
                      className="flex items-center gap-3 rounded-lg border border-border p-3 text-sm transition-colors hover:bg-accent/40"
                    >
                      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-gold-soft text-gold-soft-foreground">
                        <channel.icon aria-hidden="true" className="size-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs text-muted-foreground">
                          {channel.label}
                        </span>
                        <span className="block truncate font-medium" dir="ltr">
                          {channel.value}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <nav
              aria-label="سياسات أخرى"
              className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm"
            >
              {LEGAL_LINKS.filter((link) => link.href !== currentHref).map(
                (link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                  >
                    {link.label}
                  </Link>
                )
              )}
            </nav>
          </article>
        </div>
      </div>
    </>
  )
}

function Block({ block }: { block: LegalBlock }) {
  if (typeof block === "string") return <p>{block}</p>

  const List = block.ordered ? "ol" : "ul"
  return (
    <List
      className={cn(
        "flex flex-col gap-2.5 ps-5",
        block.ordered ? "list-decimal" : "list-disc marker:text-gold"
      )}
    >
      {block.list.map((item) => (
        <li key={item} className="ps-1">
          {item}
        </li>
      ))}
    </List>
  )
}
