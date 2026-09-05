# Business Analysis: Misk Perfume Brand

> This is an internal planning document — English, written to design the
> catalog's data model. The customer-facing translation of §2, §4 and §6
> below lives at [`landing-page.md`](./landing-page.md)'s `/about` page; that
> page does not quote this one, it restates the same substance as brand copy.

## 1. Executive Summary
Misk is a self-manufactured perfume brand. The owner personally produces every fragrance in-house, starting from raw materials (fragrance oils and pharmaceutical-grade ethanol/medical alcohol) and blending them into finished perfumes. The brand sells across multiple product lines, packaging formats, and price points, giving customers flexibility in scent type, bottle style, and bottle size.

This document analyzes the business model, product structure, and data requirements needed to build a website/catalog for Misk.

---

## 2. Business Model

- **Manufacturing:** In-house production. The owner sources:
  - Fragrance oils (available in different grades/qualities)
  - Medical-grade ethanol (alcohol) as the base/diluent
- **Value proposition:** Custom-blended, made-to-order perfumes with flexible packaging and concentration options, rather than mass-produced, pre-bottled fragrances.
- **Order customization:** Bottle size and bottle style are chosen per order, meaning the product catalog must support variant-based selling rather than fixed SKUs.

---

## 3. Product Categories

Misk's catalog is organized around **gender/audience segments**:

| Category | Description |
|---|---|
| Youth (Shabab) | Fragrances targeted at younger customers |
| Women's | Feminine fragrance line |
| Men's | Masculine fragrance line |

Each perfume within these categories has:
- **Name**
- **Description**
- **Image gallery** (multiple product photos)
- **Ingredients list**

---

## 4. Product Types & Packaging Variants

Misk sells two distinct product formats, which require different data models:

### 4.1 Alcohol-Based Perfumes (Eau de Parfum style)
- **Base:** Fragrance oil diluted in medical ethanol
- **Bottle sizes:** 30ml / 50ml / 100ml
- **Bottle style options:**
  - Luxury bottle (premium packaging)
  - Regular/standard bottle
- **Pricing logic:** Price should vary by combination of (size × bottle style × oil grade)

### 4.2 Concentrated Oil Perfume (Raw Oil / Attar-style — "Duhn")
- **Base:** Raw, undiluted fragrance oil (no alcohol)
- **Sold by weight**, not volume: 5g / 8g / 12g
- **Positioning:** Premium/concentrated line, likely higher price per gram than the alcohol-based line

---

## 5. Product Variant Matrix (Data Model Recommendation)

To support this on a website, each perfume should be modeled as a **parent product** with **variants**:

**Parent Product Attributes:**
- Product Name
- Description
- Category (Youth / Women / Men)
- Product Type (Alcohol-based / Raw Oil)
- Ingredients (list, e.g., oil grade used, alcohol type)
- Image Gallery (multiple images)

**Variant Attributes (Alcohol-based products):**
- Size: 30ml / 50ml / 100ml
- Bottle Style: Luxury / Regular
- Price (per combination)
- Stock/Availability

**Variant Attributes (Raw Oil products):**
- Weight: 5g / 8g / 12g
- Price (per weight)
- Stock/Availability

This structure allows one perfume (e.g., "Misk Rose") to have multiple purchasable options under a single product page.

---

## 6. Raw Materials (Behind-the-Scenes / Sourcing Info)

| Material | Notes |
|---|---|
| Fragrance Oil | Comes in different grades/qualities — affects cost and final scent strength |
| Medical Ethanol (Alcohol) | Used as the diluent base for standard perfumes |
| Bottles | Two style tiers (luxury / regular), three size options (30/50/100ml) for alcohol-based line |

This information can optionally be shown to customers as a "Quality & Ingredients" trust section (e.g., "made with pharmaceutical-grade alcohol and premium fragrance oils") to support brand credibility, without necessarily disclosing exact formulas.

---

## 7. Website/Catalog Requirements Summary

Based on the above, the website needs:

1. **Category navigation:** Youth / Women / Men
2. **Product detail page** per perfume including:
   - Name & description
   - Image gallery
   - Ingredients section
   - Variant selector (size + bottle style, OR weight for oil-based)
   - Dynamic price update based on selected variant
3. **Two product-type templates:**
   - Standard alcohol-based perfume (ml-based, bottle style choice)
   - Raw oil / Duhn perfume (gram-based, no bottle style choice, sold as concentrated oil)
4. **Admin/management need:** Since production is made-to-order and oil grades vary, the owner may want a simple backend to update prices per grade/batch.

---

## 8. Suggested Next Steps

- Decide final pricing per variant (size/style/grade combinations)
- Prepare high-quality photography for each perfume (bottle + lifestyle shots) for the image gallery requirement
- Standardize how "ingredients" will be described publicly (full transparency vs. general description)
- Decide on order/customization flow: does the customer pick bottle style at checkout, or is it pre-set per product listing?
- Consider whether raw oil (Duhn) products need special handling/shipping notes since they're undiluted oils

---

*Prepared as a foundational business/product analysis for building the Misk e-commerce catalog.*
