"use client"

import Image from "next/image"
import { useState } from "react"

import { DEFAULT_PRODUCT_IMAGE } from "@/constants/uploads"
import { cn } from "@/lib/utils"

type StoreProductGalleryProps = {
  /** Gallery URLs in order. Empty → the default placeholder. */
  images: string[]
  /** The product name, for alt text. */
  name: string
}

/**
 * The product page gallery: a large square, and a thumbnail strip when there
 * is more than one photo.
 *
 * A Client Component only for the thumbnail swap (`useState`) — a real
 * carousel with swipe would be `embla-carousel-react`, which is installed but
 * not needed until a product carries enough photos to swipe through. A perfume
 * with no gallery shows `DEFAULT_PRODUCT_IMAGE` and no strip.
 */
export function StoreProductGallery({ images, name }: StoreProductGalleryProps) {
  const gallery = images.length > 0 ? images : [DEFAULT_PRODUCT_IMAGE]
  const [active, setActive] = useState(0)
  const current = gallery[Math.min(active, gallery.length - 1)]

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-secondary ring-1 ring-foreground/10">
        <Image
          src={current}
          alt={name}
          fill
          priority
          sizes="(min-width: 1024px) 45vw, 100vw"
          className="object-cover"
        />
      </div>

      {gallery.length > 1 ? (
        <ul className="flex flex-wrap gap-2">
          {gallery.map((url, index) => (
            <li key={url}>
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-label={`صورة ${index + 1}`}
                aria-current={index === active ? "true" : undefined}
                className={cn(
                  "relative size-16 overflow-hidden rounded-lg border bg-secondary outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  index === active ? "border-gold" : "border-border"
                )}
              >
                <Image
                  src={url}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
