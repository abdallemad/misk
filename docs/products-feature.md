# Products Feature

Admin CRUD for the thing the shop actually sells — a perfume, its gallery,
and the collection of sizes, bottle styles or weights it is bought in.

## Related documents

- [`folder-structure.md`](./folder-structure.md) — the layer architecture this follows
- [`categories-feature.md`](./categories-feature.md) — the worked example this is modelled on, and the one it deliberately departs from
- [`admin-dashboard.md`](./admin-dashboard.md) — the console shell and shared components
- [`admin-access-control.md`](./admin-access-control.md) — why every action re-checks `isAdmin()`
- [`misk_business_analysis.md`](./misk_business_analysis.md) — sections 4 and 5, the two product lines

---

## Routes

```text
/admin/products          the list
/admin/products/new      create
/admin/products/[id]     edit
```

Three routes, where [`categories-feature.md`](./categories-feature.md) got
away with one page and a dialog. That document said why, and it is worth
quoting the reason back: *"A category is six fields, so a dialog holds all of
it without scrolling… Products will need real routes; this does not."*

A perfume is a name, a slug, a description, a category, a type, a gallery of
up to eight photos and an unbounded list of variants. That is not a dialog.
It is also a thing an admin builds over several minutes, so it should have a
URL they can send to someone, and a back button that means something.

`new` is a **static** segment sitting beside a dynamic one. Next.js matches
static segments first, so `/admin/products/new` never reaches `[id]`. Cuids
never look like `new`, so nothing is shadowed by this.

---

## The two product lines, which is the whole design

Everything difficult about this feature comes from one line in
[`misk_business_analysis.md`](./misk_business_analysis.md): the shop sells two
things that are not the same shape.

| | Sold by | Variant columns |
| --- | --- | --- |
| `ALCOHOL_BASED` | volume × packaging | `bottleSize` + `bottleStyle` |
| `RAW_OIL` (دهن) | weight | `oilWeight` |

`ProductVariant` carries all three columns as nullable and the rule is
enforced in the application, because Prisma has no CHECK-constraint DSL —
the schema comment says as much. "Enforced in the application" is vague
enough to become "enforced nowhere", so it is worth being exact about where:

```text
constants/catalog.ts       VARIANT_AXES — which columns each type uses
        │
        ├──→ schemas/product.schema.ts    rejects a bad row with a message
        │                                  under the offending select
        │
        └──→ services/product.service.ts  rejects it again, and writes
                                           explicit nulls for the columns the
                                           type does not use
```

Both, not either. The schema is what an admin sees — in the browser *and* on
the way back from the server, since it runs in both. The service is what a
direct `POST` to the Server Action hits, and what a future seed script or
background job hits too. They are guarding different callers.

### Switching the type of an existing product

Changing a perfume from alcohol to raw oil invalidates every variant it has.
The form handles this honestly: the editor swaps the selects the moment the
type changes, so the rows submitted always match the new type, and the
service deletes the old ones.

Unless one has been ordered — see below.

---

## The layers

```text
  app/admin/products/
   ├── page.tsx                 Server Component — listProducts()
   ├── new/page.tsx             Server Component — listCategoryOptions()
   └── [id]/page.tsx            Server Component — getProduct() + options
        │
        ↓
  components/admin/products/
   ├── products-table.tsx       Client — the delete dialog needs open state
   ├── delete-product-dialog.tsx        useTransition
   ├── product-form.tsx         Client — useActionState + real form state
   ├── product-gallery-field.tsx
   ├── product-variants-field.tsx
   └── product-ingredients-field.tsx
        │                            ┌─────────────────────────────────┐
        ├───────────────────────────→│  schemas/product.schema.ts      │
        ↓                            │  Zod — the only definition of   │
  actions/product/                   │  valid, run on BOTH sides       │
   ├── save-product.ts  ────────────→└─────────────────────────────────┘
   └── delete-product.ts
        │
        ↓
  services/product.service.ts   every rule about products
        │
        ├──→ ingredient.service.ts   the raw-material master list
        ├──→ lib/db.ts               Prisma
        └──→ lib/uploads.ts          the gallery on disk
```

The schema hangs off to the side because it is the one module both ends
depend on: the form runs it before dispatching, the action runs it on what
arrives. See [Validation](#validation).

### One save action, not `createVariant` / `updateVariant`

[`folder-structure.md`](./folder-structure.md) sketches `actions/product/` as
*"includes createVariant / updateVariant"*. It does not, and the reason is the
inline editor.

The admin adds a 50ml row, deletes the 30ml one, edits a price and presses
save **once**. Split into per-variant calls, the third of five failing leaves
a half-saved product, and the rule *"a product must have at least one
variant"* has no single call that can enforce it. So one action takes the
whole form, and one transaction writes the product, its images and its
variants together — a nested `create` on the way in, which Prisma already
runs as one; an explicit `$transaction` on update, which is several
statements.

### Reads skip the action layer

All three pages call the service directly — the same documented exception
[`admin-dashboard.md`](./admin-dashboard.md) takes for the overview and
[`categories-feature.md`](./categories-feature.md) for the list. The data is
read-only and belongs in the first paint. **Anything that writes goes through
a Server Action**, with no exceptions.

`/admin/products/[id]` issues its two reads with `Promise.all`. They do not
depend on each other, and awaiting them in sequence would add a round trip to
every load for nothing.

---

## The service owns the rules

`services/product.service.ts` is the only module that touches `Product`,
`ProductImage` or `ProductVariant`. Three rules live there and nowhere else.

### 1. A variant's shape follows its product's type

Covered above. `variantColumns()` writes **explicit nulls** rather than
omitting keys, because it is also used on update: an omitted key in a Prisma
`update` leaves the old value where it was, so switching a perfume to raw oil
would leave a stale `bottleSize` behind.

### 2. No two variants of one perfume may be the same thing

The schema has this index:

```prisma
@@unique([productId, bottleSize, bottleStyle, oilWeight, oilGrade])
```

**It does not do what it looks like it does.** PostgreSQL treats `NULL` as
distinct from every other `NULL`, so two raw-oil rows that are both
`(null, null, G_8, null)` do not violate it. The database cannot be the guard
here, which is why the check is written out in both the schema module and the
service.

Grades compare case-insensitively — "Grade A" and "grade a" are the same
shelf, and letting both exist would put two rows in front of a shopper that
they cannot tell apart.

### 3. A variant somebody has ordered is never deleted

`OrderItem.variantId` is `onDelete: Restrict`. An order has to keep being able
to say what was in it, so this refusal is correct rather than inconvenient.

It surfaces in three places, in increasing order of bluntness:

| Where | What happens |
| --- | --- |
| The variant editor | The row's delete button is disabled, with a tooltip saying why |
| `updateProduct` | Counts order lines on the rows that disappeared; refuses the whole save and names the number |
| The `P2003` catch | Backstop for the race where an order lands between the count and the delete |

`deleteProduct` does the same thing one level up: a perfume with any ordered
variant cannot be deleted at all. `isActive` is the reversible way to take it
off the storefront, which is what lets the delete stay honest about being
permanent — the same argument [`categories-feature.md`](./categories-feature.md)
makes for segments.

### Mutations return a result, they do not throw

Same as categories, for the same reason: a thrown Prisma error crossing the
Server Action boundary reaches the browser as an opaque digest. Correct for a
bug, useless for "that slug is taken".

`writeFailure()` names three failures specifically — `P2002` on `slug`,
`P2002` on `sku`, and `P2003` on the category — and lets everything else fall
through to a logged generic.

---

## SKUs are generated, never typed

`ProductVariant.sku` is `@unique` and NOT NULL, and the form never asks for
it. `mintSkus()` builds one per new row:

```text
MISK-ROSE-100ML-LUX      alcohol: slug + size + style
MISK-ROSE-8G             raw oil: slug + weight
MISK-ROSE-8G-GRADEA      …plus a grade code when there is one
```

The form already asks for six things per row; a seventh that the admin has to
keep globally unique is a job for a computer. Two properties carry the weight:

**Minted once.** An existing variant keeps its code through a rename, a
re-slug and a price change. The code is printed on a bottle somewhere and
quoted in somebody's order confirmation, so regenerating it would be a
silent lie. `updateProduct` explicitly does not write `sku`.

**Checked before insert, not after.** Codes are unique across the whole table,
so a perfume re-slugged onto a name another one used to hold can collide. One
query settles it for the batch, and a colliding code takes a short random
suffix instead of a retry loop.

An Arabic grade — «درجة أولى» — has no Latin characters and would collapse to
an empty segment, so `gradeCode()` falls back to a short hash. Deterministic,
stable across saves, and distinct from every other grade.

---

## Money is a string all the way down

`price` is `Decimal(10, 2)` in Postgres, and it is a **string** in the Zod
schema, in `ProductVariantRow`, in the form input and in the value handed to
Prisma.

```ts
export const PRICE_PATTERN = /^\d{1,7}(?:\.\d{1,2})?$/
```

A regex rather than `z.number().multipleOf(0.01)`, because `19.999 % 0.01` is
not `0` in IEEE-754 — the float check cannot reliably *detect* a third decimal
place, let alone preserve one. Prisma stores a string into a decimal column
exactly, so the value the admin typed is the value in the database and the
value that comes back into the input.

The one place it becomes a number is `toDisplayPrice()`, for the "from …"
column in the table. That is display-only: `Decimal(10,2)` fits inside a
double with room to spare, so a min/max over it is exact. Money that is
actually *charged* stays a `Decimal` all the way to Stripe.

The price the table shows is the cheapest **active** variant, so a retired row
with a stale price cannot quote a shopper a number they will never be offered.
A perfume with no active variant shows an em dash rather than an invented
figure.

---

## The gallery

Up to `MAX_GALLERY_IMAGES` (8) photos per perfume, stored by `lib/uploads.ts`
under `public/uploads` — the same module, the same magic-byte sniffing, and
the same serverless caveat [`categories-feature.md`](./categories-feature.md)
documents at length. None of it is repeated here; the difference is only that
there are several files instead of one.

### One field for order *and* removal

The form submits a repeated hidden `keepImage` input — one per surviving
photo, **in display order** — and the service reads `position` from the index.

That is deliberate. A separate `removeImage` list plus an order list can
contradict each other; a single ordered list of survivors cannot. Anything on
the row and missing from the list has been removed, and its absence *is* the
removal.

The first image is the cover. It is what the catalogue grid and the cart line
will show, so it is labelled in the editor rather than left to be inferred
from position.

### `DataTransfer`, because a `FileList` is read-only

The picked-files strip lets the admin drop one file out of a multi-file
selection. A `FileList` cannot be constructed by hand, so the only way to do
that is to rebuild the list through a `DataTransfer` and assign
`input.files`. Without it, "remove" could only ever clear the whole selection
— and the browser would still submit the file that was just taken out.

The same mechanism is what makes picking twice **additive**: the browser
replaces the entire selection on every trip to the file dialog, so the first
pick would otherwise vanish when the admin went back for a second.

### The 1 MB cliff, and why the limit is computed

**A Server Action's request body is capped at 1 MB by default**, and every
upload in this application goes through one — there are no upload route
handlers. The default silently contradicted the app's own limits: the form
offers 4 MB per image and eight of them, so anything past the first megabyte
was rejected by the framework *before the action ran*. The failure mode is
nasty precisely because nothing ran — there is no field error to render,
because the code that would produce one never executed.

`next.config.ts` now computes the ceiling from the same constants the form and
the schema read:

```ts
const UPLOAD_BODY_LIMIT = MAX_IMAGE_BYTES * MAX_GALLERY_IMAGES + 1024 * 1024
```

Derived rather than written out, so raising `MAX_GALLERY_IMAGES` cannot leave
the transport limit behind. The megabyte of slack covers the text fields and
the `multipart/form-data` boundaries and part headers — the Next.js docs put
those at 10–20 KB for a typical upload, so it is generous on purpose: being
over costs nothing, being under rejects a legitimate save.

It is still a real resource decision. The whole body is buffered before the
action runs, so this is also how much memory one POST can make the server
hold. Acceptable for an admin-only endpoint that re-checks `isAdmin()`;
**not** acceptable for a public one. If uploads ever move to a public surface
they should go straight to R2 with a presigned URL and stop passing through
the server at all.

The gallery field also checks file size at *pick* time and drops anything over
the per-image limit with a message naming the file. That is a deliberate
exception to this project's "the schema is the only gate" rule, for the reason
above: an oversized file never reaches the schema, so the pick is the only
moment the admin can be told which file was the problem.

### Ordering, because failures are asymmetric

Identical to categories, and for identical reasons:

| Step | Why that order |
| --- | --- |
| Save the new files first | A row pointing at a file that failed to save renders a broken image on the storefront |
| Then write the rows | If the transaction is rejected, the just-saved files are deleted explicitly — an orphan costs disk, and nothing else |
| Delete the old files last | Unlinking first would destroy the live image on a rollback |

`storeGallery()` writes files **sequentially**, not with `Promise.all`. On the
fourth file failing, the three already on disk have to be removed, and
awaiting them in order is what makes "what has been written so far" a knowable
list.

### `altText` is not in the form

`ProductImage.altText` exists and stays `null`. The right alt text for a
product photo is the product's name, which the storefront has; asking for one
per image would add eight inputs to earn nothing. If the gallery ever holds
something that is *not* the bottle — an ingredient shot, a size comparison —
that is when the field becomes worth its space.

---

## Validation

`schemas/product.schema.ts` is the only definition of what a valid product is,
and — unlike every other form in this project so far — it is also the only
thing enforcing it in the browser. **There is not one `required` attribute in
this form.**

### The same function runs twice

`parseProductForm(formData)` is called in two places:

```text
  product-form.tsx  onSubmit ──→ parseProductForm ──→ errors? show them, stop
        │                                             none? dispatch
        ↓
  save-product.ts   the action ──→ parseProductForm ──→ errors? return them
```

Same module, same messages, two callers. That is possible because nothing in
the schema touches the database or the filesystem — it reads a `FormData` and
returns either a parsed product or a map of errors, which a browser can do as
easily as a server.

The client pass is what makes a mistake visible without a round trip. The
server pass is what makes the rule *true*, because a Server Action is a public
POST endpoint and nothing stops someone calling it directly. Neither is
redundant.

### Why not HTML validation

`required`, `min`, `step` and `pattern` look like they do this for free, and
`<Form>` switches them off (`noValidate`) on purpose:

- They enforce a **second, weaker copy** of the rules. `required` cannot say
  "at most two decimal places", "this combination already exists", or "this
  row does not match the product type" — so the real rules had to live in the
  schema anyway, and the attributes were only ever a subset that could drift
  from it.
- They **stop the submit before the schema can give a better answer**, so the
  admin sees the browser's generic sentence instead of the one written for
  that field.
- The bubble is unstyleable, appears in the *browser's* language rather than
  the console's Arabic, and vanishes on the next click.

`maxLength` stays, because it is not validation: it stops the twenty-first
character from being typed rather than reporting it afterwards. So does
`accept` on the file input, for the same reason.

### One flat map, from field name to message

Errors are `Record<string, string>` keyed by the input's own `name`:

```ts
{
  "slug": "هذا المعرّف مستخدم في عطر آخر — اختر غيره.",
  "v.new-2.price": "سعر غير صالح — رقم بمنزلتين عشريتين كحد أقصى.",
  "ing.ing-1.name": "هذا المكوّن مذكور مرتين."
}
```

That shape is not an accident: it is exactly what `<Form errors>` takes, so a
parse result goes straight to the form with no adapter. Every `<Field>` has a
`name`, and every `<FieldError />` renders with **no props at all** — the
field knows its own name, the name is the key. `variantFieldName()` and
`ingredientFieldName()` build those keys in one place, so an input and the
error pointing at it cannot be renamed apart.

A nested `{ fields, variants, ingredients }` shape would have to be flattened
at the call site anyway, and every place that did the flattening would be a
place it could be done differently.

### What the admin actually sees

One submit with three mistakes in it produces three red fields, three
messages, and **not one lost keystroke**: focus jumps to the first bad field,
the rest of the form is exactly as it was typed, and each message disappears
as its own field is edited. The next section is the two decisions that make
the second half of that true.

### Variant rows arrive keyed, not indexed

```html
<input type="hidden" name="variantKey" value="new-2">
<input name="v.new-2.price" …>
<input name="v.new-2.stock" …>
```

Indexed names (`variants[2].price`) have to be renumbered in the browser every
time a row in the middle is deleted, and a renumbering bug there silently
moves one row's price onto another row. A key minted per row and never reused
cannot do that: `formData.getAll("variantKey")` gives the order, and every
field of a row is reachable from its key.

The key is also what carries an error message back to the right row. The
custom flattener in `collectErrors()` turns `["variants", 2, "price"]` into
the key `v.<the third row's key>.price`, which is literally the `name` of the
input that caused it — `z.flattenError` is no use, because it collapses
everything under `variants` into a single list and this form has six inputs
per row that each need their own line.

The same walk handles ingredients, and a row-level issue with no leaf falls
through to `v.<key>.row`, a `<Field>` that has a name and no control. It
exists so that "this combination is duplicated" — a problem belonging to the
row rather than to any one input in it — has somewhere to be said.

### Keys must not be random

`initialVariantRows()` and `initialIngredientRows()` use each row's **database
id** as its key, and rows added after mount are numbered `new-1`, `ing-2`. Never `crypto.randomUUID()`: the
form renders on the server and again in the browser, the two would disagree,
and the hydration mismatch would land on the very hidden input the server uses
to line an error up with a row.

### The four `FormData` quirks

Three are the ones [`categories-feature.md`](./categories-feature.md) already
documents — an untouched file input still submits a zero-byte `File`, an
unchecked switch submits nothing at all (so every `isActive`, including one
per variant row, is read by *presence*), and an empty text box submits `""`.

The fourth is Base UI's `Select`: it renders its own hidden input from the
`name` prop, and submits `""` when nothing is chosen, which the adapter reads
as `null`. There is no `placeholder` prop — an unselected select renders the
label of the item whose value is `null`, which is why every `items` array in
this feature starts with one.

---

## A rejected save keeps every value

This took two deliberate decisions, and both are easy to undo by accident.

### The action is dispatched from `onSubmit`, not from `<form action>`

**React resets an uncontrolled form after an action passed to the `action`
prop completes** — including when it completes with errors. On a form this
size that is twenty inputs, a gallery and every variant row wiped because one
price had a typo in it.

So `product-form.tsx` handles `submit` itself, calls `preventDefault()`, and
dispatches inside `startTransition`:

```tsx
function handleSubmit(event) {
  event.preventDefault()
  const formData = new FormData(event.currentTarget)
  const parsed = parseProductForm(formData)
  if (!parsed.success) { setClientErrors(parsed.errors); return }
  setClientErrors(null)
  startTransition(() => formAction(formData))
}
```

`useActionState`'s `pending` flag still works — it is the same dispatch
function — and the reset does not happen. The cost is that the form no longer
submits without JavaScript, which this one could never do anyway: the variant
editor *is* JavaScript.

> The category dialog still uses `<form action>`, and still resets on a failed
> submit. It is much less painful there — six fields, and the dialog is
> remounted with a fresh `key` on every open — but it is the same defect, and
> the fix is the same five lines.

### Nothing is in React state that does not have to be

Every value is an uncontrolled `defaultValue`, so a re-render after a failed
save has no opportunity to overwrite what is in the box. Three things are
state, because only they change structurally:

| State | Why it cannot be a `defaultValue` |
| --- | --- |
| `productType` | Decides which selects the variant editor renders |
| `variantRows` / `ingredientRows` | The *set* of rows, added and removed by hand |
| `clientErrors` | What the schema said here, before the network was touched |

The displayed errors are **derived**, not stored: `clientErrors ?? state.errors`.
A local refusal wins while it stands; otherwise the server's answer is read
straight out of the action state. Copying `state.errors` into state with an
effect would work too, and would add a render pass plus a window in which the
two disagreed about the same field.

[`folder-structure.md`](./folder-structure.md) predicted that this would be
the form to pull in `react-hook-form`: *"A form with dependent fields or live
cross-field validation (the product form, with its type-dependent variant
rows) is the one that should pull it in."*

It has not been, for two reasons. The dependency turned out to be on the
form's **structure**, not its values — `productType` decides which selects
exist, not what any field's value is — and structure is cheap to hold in
`useState`. And the "validated by the entity's Zod schema through
`standardSchemaResolver`, so the form and the Server Action enforce identical
rules" property that paragraph wanted from the library was already there for
free: the schema reads a `FormData`, and the browser has one.

There is still no `react-hook-form` and no `@tanstack/react-query` in the
project. The prediction becomes true the day this form needs validation *as
you type* across fields — a price that must exceed a cost field beside it —
rather than on submit.

### It navigates away on success

Both on create and on edit, and not for cosmetic reasons. After a save, rows
the admin added have real database ids that the mounted component has never
seen; a second submit from the same form would send them up as new rows again
and hit the duplicate check. Leaving the page is what guarantees the next edit
starts from the server's version.

---

## Access control

The `/admin` layout guard protects **pages**. A Server Action is a POST
endpoint that never renders that layout, so **both actions re-check
`isAdmin()` themselves** — see
[`admin-access-control.md`](./admin-access-control.md).

---

## Files

| File | What it is |
| --- | --- |
| `src/app/admin/products/page.tsx` | The list — Server Component, reads the service |
| `…/products/new/page.tsx` | Create. Refuses to render a form with no categories to pick |
| `…/products/[id]/page.tsx` | Edit. `notFound()` on a stale bookmark |
| `src/components/admin/products/index.ts` | Barrel — exports the two entry points only |
| `…/products-table.tsx` | The table and the delete dialog it drives |
| `…/product-form.tsx` | Create/edit — `useActionState`, `productType`, the row list |
| `…/product-gallery-field.tsx` | Up to eight photos: order, removal, previews |
| `…/product-variants-field.tsx` | The inline variant editor — the one component that branches on type |
| `…/product-ingredients-field.tsx` | The ingredient rows and their `<datalist>` |
| `…/delete-product-dialog.tsx` | Confirm-and-delete — `useTransition` |
| `src/actions/product/save-product.ts` | Create or update, product + gallery + variants |
| `src/actions/product/delete-product.ts` | Delete |
| `src/schemas/product.schema.ts` | Zod rules, the keyed-row FormData adapter, form state |
| `src/services/product.service.ts` | Every rule about products |
| `src/services/ingredient.service.ts` | The raw-material master list |
| `src/components/ui/form.tsx` | Base UI `Form` — `noValidate`, the error map, focus-first-invalid |
| `src/constants/catalog.ts` | The four enums, in order, with their Arabic |
| `src/utils/slug.ts` | The slug rule, shared with categories |

### `constants/catalog.ts`, and why the enums are written out twice

The arrays there are string literals, checked against the Prisma enum by
`satisfies` and by an `Exhaustive<>` type that fails the build if a member is
missing. They are not derived from the enum, because deriving them needs a
**value** import of `@prisma/client`, and that drags the query engine into
every Client Component that renders a size label.

So: types are imported, values are written out, and the type checker enforces
that the two agree — in both directions. Adding `ML_200` to the schema without
adding it here is a compile error at the line that omitted it, not an option
that silently never appears in the admin form.

`design-system.ts` re-exports `ProductType` from the same place. It used to
declare its own `"ALCOHOL" | "RAW_OIL"`, which disagreed with the schema's
`ALCOHOL_BASED` — two vocabularies for one concept, in the file whose whole
job is to stop exactly that.

---

## Ingredients

What is actually in the bottle — the raw materials behind the "Quality &
Ingredients" panel that [`misk_business_analysis.md`](./misk_business_analysis.md)
section 6 asks for.

The section is **optional and has no starting row**: a perfume is sellable
before anyone has written up its oils, and an empty ingredient row that must
be deleted before the form will save is a worse default than no row at all.

### Typed by name, resolved to an id

`Ingredient` is a table, not a text column, for the reason `schema.prisma`
gives: the same material appears on many perfumes, the shop wants to describe
it once, and it wants to be able to ask "which perfumes use grade A oud?"
without a `LIKE` query.

But the **form submits a name**, and `ingredient.service.ts` decides whether
that is a row that already exists or a new one. A hidden id would only be
trustworthy while the suggestion list matched the database, and would be wrong
the moment two admins added the same material in two tabs.

### The master list cannot be allowed to grow near-duplicates

`Ingredient.name` is `@unique`, and Postgres compares that byte for byte — so
"Oud Oil" and "oud  oil" would both be accepted and the list would sprout a
twin every time somebody typed with a different shift key. That is exactly the
place a typo must not reach: the panel it feeds is a *trust* panel.

So matching is case- and whitespace-insensitive, in two layers:

| Layer | What it does |
| --- | --- |
| `ingredientKey()` in the schema | Normalises for the duplicate check *within one product* |
| `resolveIngredientIds()` in the service | Matches the same way against the whole table, and reuses the existing row |

The spelling already in the table always wins. `createMany({ skipDuplicates })`
covers the race where two admins add the same new material at the same moment.

Resolution happens **inside the product's transaction**, and takes the
transaction client as an argument. An ingredient created for a product whose
save then failed would be a material nobody chose to add, sitting in the
master list forever.

### Suggestions come from a `<datalist>`

Not a combobox. A datalist filters as you type, is announced by screen
readers, mirrors correctly in RTL, costs nothing — and, crucially, does not
*stop* the admin entering a material that is not on the list yet, which is the
whole point of a list that grows. A combobox earns its place when the list is
long enough to need grouping, or when each entry needs a description beside
its name.

### Its own service

`ingredient.service.ts` owns the `Ingredient` table; `product.service.ts` owns
the `ProductIngredient` join rows that point at it. The split is not
ceremony — the table has a life beyond products, and an `/admin/ingredients`
console will want listing, renaming and a delete guard, none of which is a
product's business.

**Dropping an ingredient from a perfume never deletes the material.** The join
rows are replaced wholesale on every save, because they carry no identity
beyond `(product, ingredient)` and a note is cheap to rewrite. The materials
they point at belong to the shop.

---

## Search, filters and pagination

Added after the fact, when the customers and orders consoles needed the same
thing and the console settled on one pattern for all three — see
[`folder-structure.md`](./folder-structure.md), the "List pages" rule.

`listProducts` now takes `{ search, categoryId, productType, status, page }`
and returns `{ products, total, page, pageCount }`; the page reads those from
`searchParams`, and `products-table.tsx` takes a `filtered` flag so an empty
result reads as "nothing matched" rather than "add your first perfume".
`products-filters.tsx` is a `"use client"` bar — a search box (applies on
submit) plus category / type / status `<Select>`s (apply on change) — that
calls the shared `useListNavigation` hook to `router.push` new query params.

This is **not** the React Query moment [`folder-structure.md`](./folder-structure.md)
predicted. The list is still server-rendered on every navigation; the only
client code is the one component that turns an input event into a
`router.push`, and there is no client data cache. React Query still earns its
place only at *optimistic* client state — drag-to-reorder, edits that must
paint before the server answers.

---

## What is deliberately not here

**An ingredients *console*.** The product form can create a material, and that
is enough to build a catalogue with. What it cannot do is rename one across
thirty products, give it the description the trust panel wants, or retire one
nobody uses. That is `/admin/ingredients`, with its own delete guard — an
ingredient in use cannot be removed — and it is the next thing to build.

---

## Extending this

**A new field on the product** — Prisma model, Zod schema, the FormData
adapter, the service's `create`/`update` data, the form. Five edits in that
order; the type checker finds the ones you miss.

**A new bottle size** — add it to the Prisma enum, run the migration, then add
it to `BOTTLE_SIZES` and `BOTTLE_SIZE_LABEL`. The `Exhaustive<>` guard fails
the build until you do the second half, which is the point of it.

**A field on an ingredient** (a description, a supplier) — it belongs on
`Ingredient`, which means it belongs on `/admin/ingredients`, not on this
form. A material's description is the same on every perfume that uses it.

**Moving the gallery to R2** — rewrite `saveImage` and `deleteImage` in
`lib/uploads.ts`. Nothing in this feature knows where a URL points.
