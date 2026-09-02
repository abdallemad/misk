"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { ImageIcon, PackageIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"

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
import { PRODUCT_TYPE_LABEL } from "@/constants/catalog"
import { stockLevel, STOCK_TONE } from "@/constants/design-system"
import { adminProductRoute, ROUTES } from "@/constants/routes"
import { formatNumber, formatPrice } from "@/utils/format"
import type { ProductRow } from "@/services/product.service"

import { DeleteProductDialog } from "./delete-product-dialog"

type ProductsTableProps = {
  products: ProductRow[]
}

/**
 * The products table, and the delete dialog it drives.
 *
 * A Client Component for one reason — the confirm dialog needs open state.
 * Edit and create are **links**, not dialogs, so they need nothing from the
 * client at all: the form lives on its own route (see `product-form.tsx` for
 * why a perfume gets routes where a category did not).
 *
 * The data is fetched on the server and handed down as a prop. After a
 * delete, the action calls `revalidatePath`, the page re-renders on the
 * server, and a new `products` array arrives here — there is no client-side
 * cache to keep in sync.
 *
 * There is one dialog for the whole table rather than one per row, and the
 * target is left set when it closes so the exit animation does not play
 * against a blanked dialog. Same reasoning as `categories-table.tsx`.
 *
 * See docs/products-feature.md.
 */
export function ProductsTable({ products }: ProductsTableProps) {
  const [target, setTarget] = useState<ProductRow | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  function openDelete(product: ProductRow) {
    setTarget(product)
    setDeleteOpen(true)
  }

  if (products.length === 0) {
    return (
      <Empty className="border-0">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <PackageIcon />
          </EmptyMedia>
          <EmptyTitle>لا توجد عطور بعد</EmptyTitle>
          <EmptyDescription>
            أضف أول عطر بأحجامه وأسعاره ليظهر في المتجر. كل عطر يندرج تحت فئة
            واحدة، ويُباع بحجم وعبوة أو بالوزن حسب نوعه.
          </EmptyDescription>
        </EmptyHeader>
        <Button variant="gold" render={<Link href={ROUTES.adminProductNew} />}>
          <PlusIcon aria-hidden="true" />
          أضف أول عطر
        </Button>
      </Empty>
    )
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-14">
              <span className="sr-only">الصورة</span>
            </TableHead>
            <TableHead>العطر</TableHead>
            <TableHead className="hidden md:table-cell">الفئة</TableHead>
            <TableHead className="hidden lg:table-cell">النوع</TableHead>
            <TableHead className="text-center">الخيارات</TableHead>
            <TableHead>السعر</TableHead>
            <TableHead className="hidden sm:table-cell">المخزون</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead className="w-24">
              <span className="sr-only">إجراءات</span>
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell>
                <div className="relative size-10 overflow-hidden rounded-md border border-border bg-muted">
                  {product.coverImageUrl ? (
                    <Image
                      src={product.coverImageUrl}
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
                  <Link
                    href={adminProductRoute(product.id)}
                    className="font-medium underline-offset-4 hover:underline"
                  >
                    {product.name}
                  </Link>
                  <code
                    className="font-mono text-xs text-muted-foreground"
                    dir="ltr"
                  >
                    /{product.slug}
                  </code>
                </div>
              </TableCell>

              <TableCell className="hidden md:table-cell">
                <span className="text-muted-foreground">
                  {product.category.name}
                </span>
              </TableCell>

              <TableCell className="hidden lg:table-cell">
                <span className="text-muted-foreground">
                  {PRODUCT_TYPE_LABEL[product.productType]}
                </span>
              </TableCell>

              <TableCell className="text-center">
                <span data-numeric className="tabular-nums">
                  {formatNumber(product.variantCount)}
                </span>
              </TableCell>

              <TableCell>
                <PriceRange from={product.priceFrom} to={product.priceTo} />
              </TableCell>

              <TableCell className="hidden sm:table-cell">
                {/* The tone comes from the design system, never from this
                    call site, so a low-stock perfume here and one on the
                    storefront are the same colour. */}
                <StatusBadge tone={STOCK_TONE[stockLevel(product.totalStock)]}>
                  <span data-numeric className="tabular-nums">
                    {formatNumber(product.totalStock)}
                  </span>
                </StatusBadge>
              </TableCell>

              <TableCell>
                <StatusBadge tone={product.isActive ? "success" : "neutral"}>
                  {product.isActive ? "معروض" : "مخفي"}
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
                          render={<Link href={adminProductRoute(product.id)} />}
                        />
                      }
                    >
                      <PencilIcon aria-hidden="true" />
                      <span className="sr-only">تعديل {product.name}</span>
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
                          onClick={() => openDelete(product)}
                        />
                      }
                    >
                      <Trash2Icon aria-hidden="true" />
                      <span className="sr-only">حذف {product.name}</span>
                    </TooltipTrigger>
                    <TooltipContent>حذف</TooltipContent>
                  </Tooltip>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <DeleteProductDialog
        product={target}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  )
}

/**
 * "من 250 ج.م." when the variants disagree on price, one figure when they
 * agree, and an em dash when nothing is on sale — a perfume whose every
 * variant is hidden has no price a shopper could be quoted, and inventing one
 * from a retired row would be a lie the storefront would repeat.
 */
function PriceRange({ from, to }: { from: number | null; to: number | null }) {
  if (from === null || to === null) {
    return <span className="text-muted-foreground">—</span>
  }

  return (
    <span data-numeric className="tabular-nums whitespace-nowrap">
      {from === to ? formatPrice(from) : `من ${formatPrice(from)}`}
    </span>
  )
}
