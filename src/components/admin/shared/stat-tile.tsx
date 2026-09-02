import type { LucideIcon } from "lucide-react"

import { Card } from "@/components/ui/card"
import { TONE_SOFT_CLASS, TONE_TEXT_CLASS, type Tone } from "@/constants/design-system"
import { cn } from "@/lib/utils"

type StatTileProps = {
  label: string
  value: number | string
  /** Small qualifier under the number — "منها ٣ نشِطة". */
  hint?: string
  icon: LucideIcon
  /** Defaults to `neutral`. Reserve `warning`/`danger` for numbers that need action. */
  tone?: Tone
  className?: string
}

/**
 * One number on the admin overview.
 *
 * The number is the loudest thing in the tile and the label sits above it,
 * so a row of tiles scans as a row of figures rather than a row of captions.
 * Digits are `tabular-nums` — otherwise the tiles jitter as counts change
 * width, which reads as the page still loading.
 *
 * `tone` is the design system's, not a colour: passing `warning` is how a
 * low-stock tile says "look at me" without this component knowing what
 * stock is.
 */
function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
  className,
}: StatTileProps) {
  return (
    <Card className={cn("flex-row items-start justify-between gap-4 px-(--card-spacing)", className)}>
      <div className="flex min-w-0 flex-col gap-1">
        <p className="eyebrow">{label}</p>
        <p className="font-display text-display-sm font-bold tabular-nums">
          {value}
        </p>
        {hint ? (
          <p className={cn("text-xs", tone === "neutral" ? "text-muted-foreground" : TONE_TEXT_CLASS[tone])}>
            {hint}
          </p>
        ) : null}
      </div>

      <span
        aria-hidden="true"
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg",
          TONE_SOFT_CLASS[tone]
        )}
      >
        <Icon className="size-4.5" />
      </span>
    </Card>
  )
}

export { StatTile }
