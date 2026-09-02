import { ConstructionIcon } from "lucide-react"

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

type ComingSoonProps = {
  /** The section this stands in for — "العطور". */
  section: string
  /** Which doc describes the real thing, e.g. `products-feature.md`. */
  doc: string
}

/**
 * Scaffold body for an admin section whose feature is not built yet.
 *
 * It exists so the sidebar is honest: every nav item routes to a real page
 * that says what belongs there and where the spec lives, instead of a 404
 * that looks like a bug. Each of these is deleted by the pull request that
 * builds its section — if one survives to production, that is the mistake,
 * not the placeholder.
 */
function ComingSoon({ section, doc }: ComingSoonProps) {
  return (
    <Empty className="rounded-xl border border-dashed border-border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ConstructionIcon />
        </EmptyMedia>
        <EmptyTitle>{section} — قيد الإنشاء</EmptyTitle>
        <EmptyDescription>
          الهيكل والتنقّل جاهزان. محتوى هذا القسم يُبنى تاليًا وفق{" "}
          <code className="font-mono text-xs" dir="ltr">
            docs/{doc}
          </code>
          .
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

export { ComingSoon }
