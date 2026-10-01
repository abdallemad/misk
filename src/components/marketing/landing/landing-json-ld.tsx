import { CONTACT } from "@/constants/contact"
import { storeProductRoute } from "@/constants/routes"
import { DEFAULT_PRODUCT_IMAGE } from "@/constants/uploads"
import type { StoreProductCard } from "@/services/catalog.service"
import { CURRENCY } from "@/utils/format"

type LandingJsonLdProps = {
  /** Absolute origin, or `null` — URL fields are omitted rather than relative. */
  origin: string | null
  /** The perfumes the page actually shows — structured data must match the page. */
  products: StoreProductCard[]
}

/** Absolute URL for a path or an already-absolute URL; `undefined` if impossible. */
function absolute(origin: string | null, pathOrUrl: string): string | undefined {
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl
  return origin ? `${origin}${pathOrUrl}` : undefined
}

/**
 * Structured data for `/`: one `Organization` (name, contact channels, the
 * social profiles from `constants/contact.ts`) and an `ItemList` of the
 * `Product`s rendered in the best-sellers row — each with an `AggregateOffer`
 * carrying the same low/high price and stock the card shows. Only what is on
 * the page is described; nothing here is invented for search engines.
 *
 * Rendered as a `<script type="application/ld+json">` in the page body, the
 * way Next's own JSON-LD guide recommends, with `<` escaped to `<` so a
 * product name can never close the script tag.
 */
export function LandingJsonLd({ origin, products }: LandingJsonLdProps) {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "مِسك",
    alternateName: "Mesk",
    url: origin ?? undefined,
    email: CONTACT.email,
    telephone: CONTACT.phone,
    sameAs: [CONTACT.instagramHref, CONTACT.facebookHref],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      telephone: CONTACT.phone,
      email: CONTACT.email,
      areaServed: "EG",
      availableLanguage: ["ar"],
    },
  }

  const productList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Product",
        name: product.name,
        description: product.description,
        image: absolute(origin, product.coverImageUrl ?? DEFAULT_PRODUCT_IMAGE),
        url: absolute(origin, storeProductRoute(product.slug)),
        category: product.category.name,
        brand: { "@type": "Brand", name: "مِسك" },
        ...(product.priceFrom !== null
          ? {
              offers: {
                "@type": "AggregateOffer",
                priceCurrency: CURRENCY,
                lowPrice: product.priceFrom,
                highPrice: product.priceTo ?? product.priceFrom,
                offerCount: product.variantCount,
                // Blended to order: zero stock means "made after you order",
                // not "gone" — the same reading the stock badge gives.
                availability:
                  product.totalStock > 0
                    ? "https://schema.org/InStock"
                    : "https://schema.org/PreOrder",
              },
            }
          : {}),
      },
    })),
  }

  const payload = products.length > 0 ? [organization, productList] : [organization]

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(payload).replace(/</g, "\\u003c"),
      }}
    />
  )
}
