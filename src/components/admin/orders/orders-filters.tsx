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
import { ORDER_STATUSES, ORDER_STATUS_LABEL } from "@/constants/design-system"
import { ROUTES } from "@/constants/routes"

type OrdersFiltersProps = {
  search?: string
  status?: string
}

const ANY = "__any__"

/**
 * Search + status filter for the orders list.
 *
 * Same shape as the products and customers filter bars: a Client Component
 * that turns a change into a `router.push` with new query params, over a
 * server-rendered list with no client cache (see `list-controls.tsx`). The
 * text box applies on submit; the status select applies on change.
 */
export function OrdersFilters({ search, status }: OrdersFiltersProps) {
  const nav = useListNavigation(ROUTES.adminOrders)
  const [term, setTerm] = useState(search ?? "")

  const active = nav.anyActive(["q", "status"])

  const statusItems = [
    { value: ANY, label: "كل الحالات" },
    ...ORDER_STATUSES.map((value) => ({
      value,
      label: ORDER_STATUS_LABEL[value],
    })),
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
          placeholder="ابحث برقم الطلب أو اسم العميل"
          aria-label="ابحث في الطلبات"
          className="ps-8"
        />
      </form>

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
