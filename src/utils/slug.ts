/**
 * What a URL segment is allowed to look like, for every entity that has one.
 *
 * Categories (`/shop/youth`) and perfumes (`/shop/youth/misk-rose`) answer to
 * the same rule, so it is written once here rather than twice in
 * `schemas/`. Two copies of a regex are two chances for the category form to
 * accept something the product form rejects.
 *
 * **There is no `slugify()` in this module, deliberately.** Names in this
 * catalogue are Arabic, and transliterating "شبابي" produces either an empty
 * string or "shbaby" — a URL nobody recognises and nobody chose. The admin
 * types the slug; see docs/categories-feature.md.
 */

/** Latin lowercase words joined by single hyphens — `misk-rose`, `oud-12`. */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** The rule, phrased for an admin reading it under an input. */
export const SLUG_RULE_MESSAGE =
  "حروف إنجليزية صغيرة وأرقام وشرطات فقط، مثل: youth أو oud-classics."
