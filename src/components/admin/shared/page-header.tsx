import { cn } from "@/lib/utils"

type PageHeaderProps = {
  title: string
  description?: string
  /** Primary action(s) for the page — "New product", a filter, an export. */
  actions?: React.ReactNode
  className?: string
}

/**
 * Title, one line of context, and the page's actions.
 *
 * The `<h1>` lives here and nowhere else in the console, so every admin page
 * has exactly one — the layout supplies the chrome, the page supplies the
 * heading. Actions wrap below the title on narrow screens rather than
 * squeezing it.
 */
function PageHeader({
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      data-slot="page-header"
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-display-sm font-bold tracking-tight">
          {title}
        </h1>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>

      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </div>
  )
}

export { PageHeader }
