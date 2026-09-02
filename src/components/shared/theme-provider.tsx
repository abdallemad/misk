"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"

/**
 * Misk ships two themes: "Ivory & Musk" (light, default) and "Midnight Oud"
 * (dark, applied via the `.dark` class on <html>). Both are defined as token
 * sets in `src/app/globals.css` — never hard-code a colour past this point.
 */
function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}

export { ThemeProvider }
