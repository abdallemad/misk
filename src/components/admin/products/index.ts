/**
 * The products feature's components, behind one import path — the same barrel
 * convention `components/admin/shared` and `components/admin/categories` use,
 * so the pages import from a single stable path and files can be split or
 * renamed without touching them.
 *
 * `DeleteProductDialog`, `ProductGalleryField` and `ProductVariantsField` are
 * not exported: they are internals of the two entry points below, and nothing
 * outside this folder should mount them directly.
 */

export { ProductForm } from "./product-form"
export { ProductsTable } from "./products-table"
