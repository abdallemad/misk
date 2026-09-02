"use client"

import * as React from "react"
import { RotateCcwIcon, TriangleAlertIcon } from "lucide-react"

import { PageContainer } from "@/components/admin/shared"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

/**
 * Error boundary for every route under `/admin`.
 *
 * It sits *inside* the layout, so a failed query takes out the content area
 * and leaves the sidebar and header standing — the admin can navigate to
 * another section instead of being dropped on a blank page.
 *
 * `error.message` is deliberately not rendered: in production React replaces
 * it with a generic string anyway, and in development the overlay already
 * shows the real one. The digest is shown because it is the only handle on a
 * specific production failure in the server logs.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    console.error("[admin] route error", error)
  }, [error])

  return (
    <PageContainer>
      <Empty className="rounded-xl border border-border">
        <EmptyHeader>
          <EmptyMedia
            variant="icon"
            className="bg-destructive-soft text-destructive-soft-foreground"
          >
            <TriangleAlertIcon />
          </EmptyMedia>
          <EmptyTitle>تعذّر تحميل هذا القسم</EmptyTitle>
          <EmptyDescription>
            حدث خطأ أثناء جلب البيانات. حاول مرة أخرى — القائمة الجانبية ما
            زالت تعمل إن أردت الانتقال إلى قسم آخر.
          </EmptyDescription>
        </EmptyHeader>

        <EmptyContent>
          <Button onClick={reset} variant="outline">
            <RotateCcwIcon aria-hidden="true" />
            إعادة المحاولة
          </Button>
          {error.digest ? (
            <p className="mt-3 font-mono text-xs text-muted-foreground" dir="ltr">
              {error.digest}
            </p>
          ) : null}
        </EmptyContent>
      </Empty>
    </PageContainer>
  )
}
