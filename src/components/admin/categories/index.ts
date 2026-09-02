/**
 * The categories feature's components, behind one import path — the same
 * barrel convention `components/admin/shared` uses, so the page imports from
 * a single stable path and files can be split or renamed without touching it.
 *
 * `CategoryFormDialog`, `CategoryImageField` and `DeleteCategoryDialog` are
 * not exported: they are internals of the two entry points below, and nothing
 * outside this folder should mount them directly.
 */

export { CategoriesTable } from "./categories-table"
export { NewCategoryButton } from "./new-category-button"
