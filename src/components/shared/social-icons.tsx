/**
 * Simple line-art glyphs for the two networks lucide-react does not ship a
 * brand icon for (it dropped brand icons some versions back to stay a
 * generic set — see docs/landing-page.md). Drawn at the same 24×24 /
 * stroke-width-2 / round-cap convention as every lucide icon in this
 * project, so they sit next to `<PhoneIcon>` or `<MailIcon>` without looking
 * like a different icon set. WhatsApp needs no such stand-in —
 * `MessageCircleIcon` from lucide-react already reads as "chat" and the
 * visible «واتساب» label next to it does the rest.
 */

export function FacebookIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M15 3h-2a5 5 0 0 0-5 5v3H6v4h2v6h4v-6h3l1-4h-4V8a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}

export function InstagramIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width={20} height={20} x={2} y={2} rx={5} ry={5} />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1={17.5} x2={17.51} y1={6.5} y2={6.5} />
    </svg>
  )
}
