/**
 * Cart limits — small, and shared between the client controls, the schema and
 * the service, the same reason `constants/uploads.ts` exists apart from
 * `lib/uploads.ts`. See docs/cart-feature.md.
 */

/** How many units of one variant a single cart line may hold. Also the
 *  quantity stepper's ceiling, on the product page and in the cart. */
export const MAX_LINE_QUANTITY = 10

/** How many distinct variants the cart may hold at once. */
export const MAX_CART_LINES = 30
