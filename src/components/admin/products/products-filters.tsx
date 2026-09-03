"use client"

import { useState } from "react"
import { SearchIcon, XIcon } from "lucide-react"

import { useListNavigation } from "@/components/admin/shared/list-controls"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PRODUCT_TYPES, PRODUCT_TYPE_LABEL } from "@/constants/catalog"
import { ROUTES } from "@/constants/routes"
import type { CategoryOption } from "@/services/category.service"

type ProductsFiltersProps = {
  categories: CategoryOption[]
  /** Current values, read from the URL by the page and echoed back in. */
  search?: string
  categoryId?: string
  productType?: string
  status?: string
}

const ANY = "__any__"

/**
 * Search + category + type + status for the products list.
 *
 * A Client Component, but not a stateful one: it holds only the text in the
 * search box between keystrokes. Every applied change is a `router.push` to
 * the same page with new query params — the list itself stays server-rendered
 * and there is no client data cache (see `list-controls.tsx` and the note in
 * docs/folder-structure.md).
 *
 * The selects apply immediately on change; the search box applies on submit
 * (Enter or the button), because navigating on every keystroke is a request
 * storm and a focus-losing re-render.
 */
export function ProductsFilters({
  categories,
  search,
  categoryId,
  productType,
  status,
}: ProductsFiltersProps) {
  const nav = useListNavigation(ROUTES.adminProducts)
  const [term, setTerm] = useState(search ?? "")

  const active = nav.anyActive(["q", "category", "type", "status"])

  const categoryItems = [
    { value: ANY, label: "كل الفئات" },
    ...categories.map((category) => ({
      value: category.id,
      label: category.isActive ? category.name : `${category.name} (مخفية)`,
    })),
  ]
  const typeItems = [
    { value: ANY, label: "كل الأنواع" },
    ...PRODUCT_TYPES.map((type) => ({
      value: type,
      label: PRODUCT_TYPE_LABEL[type],
    })),
  ]
  const statusItems = [
    { value: ANY, label: "كل الحالات" },
    { value: "active", label: "معروض" },
    { value: "hidden", label: "مخفي" },
  ]

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault()
          nav.setParams({ q: term.trim() || null })
        }}
        className="relative w-full max-w-xs"
      >
        <SearchIcon
          aria-hidden="true"
          className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          name="q"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="ابحث بالاسم أو المُعرّف"
          aria-label="ابحث في العطور"
          className="ps-8"
        />
      </form>

      <Select
        items={categoryItems}
        value={categoryId ?? ANY}
        onValueChange={(value) =>
          nav.setParams({ category: value === ANY ? null : String(value) })
        }
      >
        <SelectTrigger size="sm" aria-label="تصفية حسب الفئة">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {categoryItems.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        items={typeItems}
        value={productType ?? ANY}
        onValueChange={(value) =>
          nav.setParams({ type: value === ANY ? null : String(value) })
        }
      >
        <SelectTrigger size="sm" aria-label="تصفية حسب النوع">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {typeItems.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        items={statusItems}
        value={status ?? ANY}
        onValueChange={(value) =>
          nav.setParams({ status: value === ANY ? null : String(value) })
        }
      >
        <SelectTrigger size="sm" aria-label="تصفية حسب الحالة">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {statusItems.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {active ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setTerm("")
            nav.clearAll()
          }}
        >
          <XIcon aria-hidden="true" />
          مسح
        </Button>
      ) : null}
    </div>
  )
}
