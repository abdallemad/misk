import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import type { Metadata } from "next";
import { Amiri, Geist_Mono, IBM_Plex_Sans_Arabic } from "next/font/google";

import { ThemeProvider } from "@/components/shared/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import "./globals.css";

/**
 * Amiri — a Naskh serif cut from the Būlāq press tradition. Headings, the
 * wordmark and pull quotes only. It covers Latin too, so an Arabic heading
 * with a Latin perfume name in it stays in one voice.
 */
const display = Amiri({
  variable: "--font-misk-display",
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  display: "swap",
});

/** Interface workhorse — body copy, controls, admin tables. Arabic + Latin. */
const sans = IBM_Plex_Sans_Arabic({
  variable: "--font-misk-sans",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

/** Order numbers, SKUs, batch references — Latin and digits only. */
const mono = Geist_Mono({
  variable: "--font-misk-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "مِسك — عطور مصنوعة يدويًا",
    template: "%s · مِسك",
  },
  description:
    "عطور نُحضّرها بأنفسنا من كحول طبي نقي وزيوت عطرية فاخرة. اختر الحجم، واختر العبوة، أو خذها دهن عود خالص.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className={`${sans.variable} ${display.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ClerkProvider appearance={{ theme: shadcn }}>
          <ThemeProvider>
            <TooltipProvider>{children}</TooltipProvider>
            <Toaster />
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}