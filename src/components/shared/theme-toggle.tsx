"use client"

import { MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const next = resolvedTheme === "dark" ? "light" : "dark"

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className={className}
            aria-label={next === "dark" ? "التبديل إلى الوضع الداكن" : "التبديل إلى الوضع الفاتح"}
            onClick={() => setTheme(next)}
          >
            <SunIcon className="hidden dark:block" />
            <MoonIcon className="block dark:hidden" />
          </Button>
        }
      />
      <TooltipContent>
        {next === "dark" ? "ليل العود" : "عاج ومسك"}
      </TooltipContent>
    </Tooltip>
  )
}

export { ThemeToggle }
