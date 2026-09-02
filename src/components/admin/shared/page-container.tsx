import { cn } from "@/lib/utils"

/**
 * The padded, width-capped column every admin page renders into.
 *
 * One component owns the console's page rhythm so twelve feature pages
 * cannot each invent their own padding. The cap is wide (`7xl`) because
 * admin work is tables and forms, not prose — but it is a cap, so a data
 * table on a 32" monitor does not stretch a row to arm's length.
 */
function PageContainer({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="page-container"
      className={cn(
        "mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 md:p-6",
        className
      )}
      {...props}
    />
  )
}

export { PageContainer }
