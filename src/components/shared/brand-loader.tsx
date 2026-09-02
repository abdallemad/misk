import { MiskMark } from "@/components/shared/brand-lockup"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

type BrandLoaderProps = {
  /** The one line that says what is happening. Keep it a sentence, not a word. */
  title: string
  /** Optional second line — why it is worth waiting for. */
  description?: string
  /**
   * `screen` fills the viewport (a full-page interstitial like
   * `/auth-callback`); `section` fills its container (a panel inside an
   * existing layout, like the admin content area under its sidebar).
   */
  variant?: "screen" | "section"
  className?: string
}

/**
 * The app's one waiting state.
 *
 * Deliberately not a bare spinner: this renders where the user has just
 * handed over credentials and is watching an unfamiliar screen, so it says
 * the brand's name and what the wait is for. The mark breathes rather than
 * spins — the flacon ring is radially symmetric, so a rotation would read as
 * nothing moving at all.
 *
 * `role="status"` + `aria-live="polite"` means a screen reader announces the
 * message once when it appears, without stealing focus.
 */
function BrandLoader({
  title,
  description,
  variant = "screen",
  className,
}: BrandLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "brand-sheen flex flex-col items-center justify-center gap-6 px-6 text-center",
        variant === "screen" ? "min-h-screen" : "min-h-[60vh] w-full",
        className
      )}
    >
      <MiskMark className="size-12 motion-safe:animate-pulse" />

      <div className="flex flex-col items-center gap-2">
        <p className="font-display text-display-xs font-bold text-foreground">
          {title}
        </p>
        {description ? (
          <p className="max-w-sm text-sm text-balance text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>

      <Spinner className="size-5 text-gold" />
    </div>
  )
}

export { BrandLoader }
