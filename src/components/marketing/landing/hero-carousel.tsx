"use client"

import Image from "next/image"
import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import useEmblaCarousel from "embla-carousel-react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { HERO_AUTOPLAY_MS } from "@/constants/landing"
import { cn } from "@/lib/utils"

export type HeroSlide = {
  src: string
  alt: string
  /** The perfume's page, or `null` for the placeholder slide. */
  href: string | null
  /** Caption over the bottom of the photo — the perfume's name. */
  name: string | null
  /** Small line above the name — its category. */
  eyebrow: string | null
}

/**
 * The hero's photo, as a carousel of the best-sellers that have real photos.
 *
 * Built straight on `embla-carousel-react` rather than on
 * `components/ui/carousel.tsx`: that shadcn wrapper positions its arrows and
 * reads the arrow keys for a left-to-right page, and this site is RTL —
 * embla itself needs `direction: "rtl"` to scroll the right way here.
 *
 * - **Performance.** Slide one is the page's likely LCP element: it loads
 *   eagerly with `fetchPriority="high"`; every other slide keeps
 *   `next/image`'s lazy default. Embla moves the track with a `transform`, so
 *   sliding is compositor work.
 * - **Autoplay** every `HERO_AUTOPLAY_MS`, paused while the pointer or focus
 *   is inside, while the tab is hidden, and never started at all under
 *   `prefers-reduced-motion: reduce`.
 * - **A11y.** A labelled `region` with `aria-roledescription="carousel"`,
 *   each slide a `group` labelled "n من N", dots with `aria-current`, and
 *   ← / → mapped to next / previous the RTL way round.
 *
 * With a single slide it renders just the photo — no controls, no autoplay.
 */
export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [emblaRef, api] = useEmblaCarousel({ loop: true, direction: "rtl" })
  const [selected, setSelected] = useState(0)
  const paused = useRef(false)
  const multiple = slides.length > 1

  useEffect(() => {
    if (!api) return
    const onSelect = () => setSelected(api.selectedScrollSnap())
    api.on("select", onSelect)
    return () => {
      api.off("select", onSelect)
    }
  }, [api])

  useEffect(() => {
    if (!api || !multiple) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const id = window.setInterval(() => {
      if (!paused.current && !document.hidden) api.scrollNext()
    }, HERO_AUTOPLAY_MS)
    return () => window.clearInterval(id)
  }, [api, multiple])

  const pause = useCallback(() => {
    paused.current = true
  }, [])
  const resume = useCallback(() => {
    paused.current = false
  }, [])

  const onKeyDown = (event: React.KeyboardEvent) => {
    // RTL: the next slide enters from the left.
    if (event.key === "ArrowLeft") {
      event.preventDefault()
      api?.scrollNext()
    } else if (event.key === "ArrowRight") {
      event.preventDefault()
      api?.scrollPrev()
    }
  }

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="عطور مختارة"
      className="relative size-full"
      onPointerEnter={pause}
      onPointerLeave={resume}
      onFocusCapture={pause}
      onBlurCapture={resume}
      onKeyDown={multiple ? onKeyDown : undefined}
    >
      <div ref={emblaRef} className="size-full overflow-hidden">
        <div className="flex h-full">
          {slides.map((slide, index) => {
            const photo = (
              <>
                <Image
                  src={slide.src}
                  alt={slide.alt}
                  fill
                  sizes="(min-width: 1024px) 448px, 90vw"
                  className="object-cover"
                  {...(index === 0
                    ? { loading: "eager", fetchPriority: "high" }
                    : {})}
                />
                {slide.name ? (
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent px-5 pt-16 pb-12 text-start text-white">
                    {slide.eyebrow ? (
                      <span className="block text-xs text-white/75">
                        {slide.eyebrow}
                      </span>
                    ) : null}
                    <span className="mt-1 block font-display text-display-xs">
                      {slide.name}
                    </span>
                  </span>
                ) : null}
              </>
            )

            return (
              <div
                key={slide.src + index}
                role="group"
                aria-roledescription="slide"
                aria-label={`${index + 1} من ${slides.length}`}
                className="relative h-full min-w-0 shrink-0 grow-0 basis-full"
              >
                {slide.href ? (
                  <Link
                    href={slide.href}
                    className="block size-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
                  >
                    {photo}
                  </Link>
                ) : (
                  photo
                )}
              </div>
            )
          })}
        </div>
      </div>

      {multiple ? (
        <>
          <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
            {slides.map((slide, index) => (
              <button
                key={slide.src + index}
                type="button"
                aria-label={`الصورة ${index + 1}`}
                aria-current={index === selected}
                onClick={() => api?.scrollTo(index)}
                className={cn(
                  "h-1.5 rounded-full bg-white/60 transition-[width,background-color] duration-300 ease-luxe outline-none hover:bg-white focus-visible:ring-2 focus-visible:ring-white",
                  index === selected ? "w-6 bg-white" : "w-1.5"
                )}
              />
            ))}
          </div>

          <button
            type="button"
            aria-label="الصورة السابقة"
            onClick={() => api?.scrollPrev()}
            className="absolute start-3 top-1/2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm backdrop-blur-sm transition-colors outline-none hover:bg-background focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <ChevronRightIcon aria-hidden="true" className="size-4" />
          </button>
          <button
            type="button"
            aria-label="الصورة التالية"
            onClick={() => api?.scrollNext()}
            className="absolute end-3 top-1/2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm backdrop-blur-sm transition-colors outline-none hover:bg-background focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <ChevronLeftIcon aria-hidden="true" className="size-4" />
          </button>
        </>
      ) : null}
    </div>
  )
}
