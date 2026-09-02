"use client"

import Image from "next/image"
import { useState } from "react"
import { ImageIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"

import { StatusBadge } from "@/components/admin/shared"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { formatNumber } from "@/utils/format"
import type { CategoryRow } from "@/services/category.service"

import { CategoryFormDialog } from "./category-form-dialog"
import { DeleteCategoryDialog } from "./delete-category-dialog"

type CategoriesTableProps = {
  categories: CategoryRow[]
}

/**
 * The categories table, and the two dialogs it drives.
 *
 * A Client Component because create, edit and delete are all dialogs, and a
 * dialog needs open state. The **data** is still fetched on the server and
 * passed down as a prop — this component never calls a service, and it never
 * refetches: after a successful mutation the action calls `revalidatePath`,
 * the page re-renders on the server, and a new `categories` array arrives
 * here. That is why there is no client-side cache to keep in sync.
 *
 * There is exactly one form dialog and one delete dialog for the whole table,
 * not one pair per row — thirty rows would otherwise mount sixty dialogs to
 * show at most one. `formKey` remounts the form on every open so the previous
 * submission's state and field errors never bleed into the next.
 *
 * See docs/categories-feature.md.
 */
export function CategoriesTable({ categories }: CategoriesTableProps) {
  const [target, setTarget] = useState<CategoryRow | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [formKey, setFormKey] = useState(0)

  const [deleteTarget, setDeleteTarget] = useState<CategoryRow | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  /**
   * `target` is deliberately left set when the dialog closes — clearing it
   * would blank the dialog's contents mid-exit-animation. The bumped key is
   * what guarantees a clean form on the next open.
   */
  function openForm(category: CategoryRow | null) {
    setTarget(category)
    setFormKey((key) => key + 1)
    setFormOpen(true)
  }

  function openDelete(category: CategoryRow) {
    setDeleteTarget(category)
    setDeleteOpen(true)
  }

  return (
    <>
      {categories.length === 0 ? (
        <Empty className="border-0">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ImageIcon />
            </EmptyMedia>
            <EmptyTitle>لا توجد فئات بعد</EmptyTitle>
            <EmptyDescription>
              الفئة هي القسم الذي يتصفّحه الزائر في المتجر. أضف أول فئة —
              «شبابي» مثلًا — لتتمكن من ربط العطور بها.
            </EmptyDescription>
          </EmptyHeader>
          <Button variant="gold" onClick={() => openForm(null)}>
            <PlusIcon aria-hidden="true" />
            أضف أول فئة
          </Button>
        </Empty>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14">
                <span className="sr-only">الصورة</span>
              </TableHead>
              <TableHead>الفئة</TableHead>
              <TableHead className="hidden md:table-cell">الوصف</TableHead>
              <TableHead className="text-center">العطور</TableHead>
              <TableHead className="hidden sm:table-cell text-center">
                الترتيب
              </TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead className="w-24">
                <span className="sr-only">إجراءات</span>
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>
                  <div className="relative size-10 overflow-hidden rounded-md border border-border bg-muted">
                    {category.imageUrl ? (
                      <Image
                        src={category.imageUrl}
                        alt=""
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="flex size-full items-center justify-center text-muted-foreground">
                        <ImageIcon className="size-4" aria-hidden="true" />
                      </span>
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">{category.name}</span>
                    <code
                      className="font-mono text-xs text-muted-foreground"
                      dir="ltr"
                    >
                      /{category.slug}
                    </code>
                  </div>
                </TableCell>

                <TableCell className="hidden max-w-xs md:table-cell">
                  <span className="block truncate text-muted-foreground">
                    {category.description || "—"}
                  </span>
                </TableCell>

                <TableCell className="text-center">
                  <span data-numeric className="tabular-nums">
                    {formatNumber(category.productCount)}
                  </span>
                </TableCell>

                <TableCell className="hidden text-center sm:table-cell">
                  <span
                    data-numeric
                    className="tabular-nums text-muted-foreground"
                  >
                    {formatNumber(category.position)}
                  </span>
                </TableCell>

                <TableCell>
                  <StatusBadge tone={category.isActive ? "success" : "neutral"}>
                    {category.isActive ? "معروضة" : "مخفية"}
                  </StatusBadge>
                </TableCell>

                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => openForm(category)}
                          />
                        }
                      >
                        <PencilIcon aria-hidden="true" />
                        <span className="sr-only">
                          تعديل {category.name}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>تعديل</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => openDelete(category)}
                          />
                        }
                      >
                        <Trash2Icon aria-hidden="true" />
                        <span className="sr-only">حذف {category.name}</span>
                      </TooltipTrigger>
                      <TooltipContent>حذف</TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <CategoryFormDialog
        key={formKey}
        category={target}
        open={formOpen}
        onOpenChange={setFormOpen}
      />

      <DeleteCategoryDialog
        category={deleteTarget}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  )
}
