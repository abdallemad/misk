import Link from "next/link"

import { cn } from "@/lib/utils"

/**
 * The Misk mark — a drop of oil held inside a ring.
 * The drop is the attar; the ring is the flacon around it.
 *
 * Radially symmetric on purpose: it needs no mirrored variant for RTL.
 *
 * The drop paints in `--gold`, the ring in `currentColor`, so the mark
 * inherits whatever text colour it sits in (musk on ivory in the header,
 * ivory on musk in the footer) while the gold stays constant.
 */
function MiskMark({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn("size-7", className)}
      {...props}
    >
      <circle
        cx="16"
        cy="16"
        r="14.25"
        stroke="currentColor"
        strokeOpacity="0.35"
        strokeWidth="1.5"
      />
      <path
        d="M16 7c0 0 6.4 7.02 6.4 11.35A6.4 6.4 0 0 1 9.6 18.35C9.6 14.02 16 7 16 7Z"
        fill="var(--gold)"
      />
      <path
        d="M13.15 18.6a2.85 2.85 0 0 0 2.85 2.85"
        stroke="var(--gold-foreground)"
        strokeOpacity="0.45"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  )
}

type BrandLockupProps = {
  /** `full` shows mark + wordmark, `mark` shows the glyph alone. */
  variant?: "full" | "mark"
  size?: "sm" | "md" | "lg"
  /**
   * Which wordmark to set. `ar` (مِسك) is the primary brand form; `en`
   * (MISK) exists for Latin contexts — invoices, shipping labels, the
   * favicon — and is the only one that carries letter-spacing.
   */
  script?: "ar" | "en"
  /** Small line under the wordmark, e.g. «دار عطور». */
  tagline?: string
  /** Renders as a link to `/` unless `false`. */
  href?: string | false
  className?: string
}

const wordmarkSize = {
  sm: "text-display-xs",
  md: "text-display-sm",
  lg: "text-display-md",
} as const

const markSize = {
  sm: "size-6",
  md: "size-8",
  lg: "size-10",
} as const

/**
 * The single brand lockup, shared by the marketing header, the shop header,
 * the admin sidebar, the footer and transactional emails. Nothing else in the
 * app should re-typeset the word «مِسك».
 */
function BrandLockup({
  variant = "full",
  size = "md",
  script = "ar",
  tagline,
  href = "/",
  className,
}: BrandLockupProps) {
  const content = (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <MiskMark className={markSize[size]} />
      {variant === "full" ? (
        <span className="inline-flex flex-col justify-center">
          {script === "ar" ? (
            // No tracking: Naskh is joined, and letter-spacing tears it apart.
            <span
              lang="ar"
              className={cn(
                "font-display leading-none font-bold",
                wordmarkSize[size]
              )}
            >
              مِسك
            </span>
          ) : (
            <span
              lang="en"
              dir="ltr"
              className={cn(
                "font-display leading-none font-bold tracking-[0.14em] uppercase",
                wordmarkSize[size]
              )}
            >
              Misk
            </span>
          )}
          {tagline ? (
            <span className="eyebrow mt-1.5 leading-none">{tagline}</span>
          ) : null}
        </span>
      ) : null}
    </span>
  )

  if (href === false) return content

  return (
    <Link
      href={href}
      aria-label="مِسك — الرئيسية"
      className="inline-flex rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {content}
    </Link>
  )
}

export { BrandLockup, MiskMark }
