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
import { ROUTES } from "@/constants/routes"

type CustomersFiltersProps = {
  search?: string
  role?: string
}

const ANY = "__any__"

/**
 * Search + role filter for the customers list.
 *
 * Same shape as the products filter bar: a Client Component that turns a
 * change into a `router.push` with new query params, over a server-rendered
 * list with no client cache (see `list-controls.tsx`). The text box applies
 * on submit; the role select applies on change.
 */
export function CustomersFilters({ search, role }: CustomersFiltersProps) {
  const nav = useListNavigation(ROUTES.adminCustomers)
  const [term, setTerm] = useState(search ?? "")

  const active = nav.anyActive(["q", "role"])

  const roleItems = [
    { value: ANY, label: "كل الأدوار" },
    { value: "ADMIN", label: "مشرف" },
    { value: "USER", label: "عميل" },
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
          placeholder="ابحث بالاسم أو البريد الإلكتروني"
          aria-label="ابحث في العملاء"
          className="ps-8"
        />
      </form>

      <Select
        items={roleItems}
        value={role ?? ANY}
        onValueChange={(value) =>
          nav.setParams({ role: value === ANY ? null : String(value) })
        }
      >
        <SelectTrigger size="sm" aria-label="تصفية حسب الدور">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {roleItems.map((item) => (
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
