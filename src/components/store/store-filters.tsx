"use client"

import { useState } from "react"
import { SearchIcon, XIcon } from "lucide-react"

import { useListNavigation } from "@/components/shared/use-list-navigation"
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
import {
  DEFAULT_STORE_SORT,
  STORE_SORT_LABEL,
  STORE_SORTS,
} from "@/constants/store"

type StoreFiltersProps = {
  /** Current values, read from the URL by the page and echoed back in. */
  search?: string
  productType?: string
  sort?: string
}

const ANY = "__any__"

/**
 * Search + type + sort for the catalogue.
 *
 * A Client Component, but not a stateful one: it holds only the text in the
 * search box between keystrokes. Every applied change is a `router.push` to
 * `/store` with new query params through the shared `useListNavigation` hook —
 * the grid itself stays server-rendered and there is no client data cache
 * (see docs/store-feature.md).
 *
 * The selects apply on change; the search box applies on submit (Enter or the
 * button), because navigating per keystroke is a request storm. The category
 * filter is not here — it is the chip nav above, which is server-rendered.
 */
export function StoreFilters({ search, productType, sort }: StoreFiltersProps) {
  const nav = useListNavigation(ROUTES.store)
  const [term, setTerm] = useState(search ?? "")

  const active = nav.anyActive(["q", "type", "sort", "category"])

  const typeItems = [
    { value: ANY, label: "كل الأنواع" },
    ...PRODUCT_TYPES.map((type) => ({
      value: type,
      label: PRODUCT_TYPE_LABEL[type],
    })),
  ]

  const sortItems = STORE_SORTS.map((value) => ({
    value,
    label: STORE_SORT_LABEL[value],
  }))

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
          placeholder="ابحث عن عطر"
          aria-label="ابحث في المتجر"
          className="ps-8"
        />
      </form>

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
        items={sortItems}
        value={sort ?? DEFAULT_STORE_SORT}
        onValueChange={(value) =>
          nav.setParams({
            sort: value === DEFAULT_STORE_SORT ? null : String(value),
          })
        }
      >
        <SelectTrigger size="sm" aria-label="ترتيب النتائج">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {sortItems.map((item) => (
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
