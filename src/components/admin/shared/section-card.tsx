import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

type SectionCardProps = {
  title: string
  description?: string
  /** Trailing control for the section — a link, a small toggle. */
  action?: React.ReactNode
  children: React.ReactNode
  /**
   * Drop the content padding so a table can bleed to the card's edges. The
   * header keeps its own padding either way.
   */
  flush?: boolean
  className?: string
}

/**
 * One titled block inside an admin page.
 *
 * Thin on purpose: it is `Card` with the header shape the console repeats
 * (title, optional description, optional trailing action) so that a form
 * section, a stats panel and a table wrapper all sit on the same grid. When
 * a section needs something else entirely, reach for `Card` directly rather
 * than growing this.
 *
 * Spacing is left to the card's own `--card-spacing` token and its
 * `[.border-b]:pb-*` rule — adding `border-b` to the header is what makes it
 * pad itself. Hard-coding padding here would put admin cards on a different
 * rhythm from storefront ones.
 */
function SectionCard({
  title,
  description,
  action,
  children,
  flush = false,
  className,
}: SectionCardProps) {
  return (
    <Card data-slot="section-card" className={className}>
      <CardHeader className="border-b border-border">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
        {action ? <CardAction>{action}</CardAction> : null}
      </CardHeader>

      {/* `-mb-*` cancels the card's bottom padding so a flush table's last
          row sits flat on the card's edge. */}
      <CardContent
        className={cn(flush && "px-0 -mb-(--card-spacing) [&>*]:rounded-b-xl")}
      >
        {children}
      </CardContent>
    </Card>
  )
}

export { SectionCard }
