# Categories Feature

Admin CRUD for the audience segments a shopper browses by — شبابي / نسائي /
رجالي, and whatever else the shop decides to sell by.

## Related documents

- [`folder-structure.md`](./folder-structure.md) — the layer architecture this follows
- [`admin-dashboard.md`](./admin-dashboard.md) — the console shell and shared components
- [`admin-access-control.md`](./admin-access-control.md) — why every action re-checks `isAdmin()`
- [`misk_business_analysis.md`](./misk_business_analysis.md) — section 3, the segments themselves

---

## Route

```text
/admin/categories     list, create, edit, delete — all on one page
```

There is no `/new` or `/[id]/edit` route. A category is six fields, and
staying on the list means the admin can add three segments in a row without
three navigations. Products need real routes for the reason this does not —
see [`products-feature.md`](./products-feature.md).

> **The dialog scrolls; it used to grow.** Six fields fit on a laptop and do
> not fit on a 13" screen with the browser zoomed, and a `position: fixed`
> popup centred on the viewport cannot be scrolled to reach the submit button
> that has slid off the bottom of it. The popup is now capped at `80svh` and
> laid out as three grid rows — header, `DialogBody`, footer — so «حفظ
> التعديلات» stays on screen and the fields scroll between them. The
> mechanism, and why `svh` rather than `vh`, is documented on `DialogBody` in
> [`dialog.tsx`](../src/components/ui/dialog.tsx); the product form uses the
> same three-row shape.

---

## The model was an enum, and had to stop being one

The schema originally had:

```prisma
enum Category { YOUTH WOMEN MEN }

model Product {
  category Category
}
```

An enum cannot be created, renamed or deleted at runtime — every change is a
migration and a deploy. That is fine for `BottleSize`, where the values are
facts about the bottles the shop actually owns, and wrong for categories,
which are a merchandising decision the shop should be able to make on a
Tuesday afternoon.

So `Category` is now a table, which is also what
[`folder-structure.md`](./folder-structure.md) had specified all along:

```prisma
model Category {
  id          String   @id @default(cuid())
  name        String   @unique   // "شبابي"
  slug        String   @unique   // "youth"
  description String?
  imageUrl    String?
  isActive    Boolean  @default(true)
  position    Int      @default(0)

  products    Product[]

  @@index([isActive, position])
}

model Product {
  category   Category @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  categoryId String
}
```

### Field notes

**`name` and `slug` are both unique, and they are not the same thing.**
`name` is the Arabic label a shopper reads; `slug` is the Latin URL segment
in `/shop/youth`. The slug is **typed by the admin, not generated** — names
here are Arabic, and slugifying "شبابي" gives either an empty string or a
transliteration ("shbaby") that nobody would recognise in an address bar. The
rule itself lives in [`utils/slug.ts`](../src/utils/slug.ts), because a
product slug answers to the same one and two copies of the regex would be two
chances for the two forms to disagree.

**`slug` is effectively immutable in practice.** Nothing stops an admin
changing it, but the form says so under the field: every link already shared
to `/shop/<old-slug>` breaks. It is also the key
`CATEGORY_ACCENT` in [`design-system.ts`](../src/constants/design-system.ts)
is keyed by, so changing it silently drops that segment's accent colour.

**`isActive` is the reversible alternative to deleting**, which is what makes
it acceptable for the delete to be a genuinely permanent hard delete.

**`position` orders the storefront's category nav.** Ties break by name so
two segments sharing a position do not swap places between renders. Leaving
the field blank on create means "append": the service resolves it to
`max(position) + 1` rather than `0`, which would otherwise send every new
segment to the front of the nav.

### `onDelete: Restrict`, deliberately

Deleting a segment must never take a shelf of perfumes with it. `Restrict`
makes the database refuse; the service reads the count first so the admin
gets *"12 perfumes still use this one"* instead of a foreign-key violation.

### Applying the change

The project has no `prisma/migrations/` — the schema was created with
`prisma db push`, and this change was applied the same way, so the two stay
consistent. `Product` had zero rows at the time, so dropping the enum column
in favour of `categoryId` cost nothing. **On a database with products, this
is not a `db push`**: it needs a real migration that adds `categoryId`
nullable, backfills it from the old enum column, then makes it required.

The three enum members were data before they were schema, so something has to
put them back:

```bash
npm run seed-categories
```

Idempotent — it upserts on `slug` with an empty `update`, so running it twice
changes nothing and running it against a live database will not overwrite a
name an admin has edited or an image they have uploaded.

---

## The layers

The feature follows the chain in
[`folder-structure.md`](./folder-structure.md), with one documented
substitution.

```text
  app/admin/categories/page.tsx          Server Component — reads
        │                                 listCategories() directly
        ↓
  components/admin/categories/           Client — dialogs need open state
   ├── categories-table.tsx
   ├── new-category-button.tsx
   ├── category-form-dialog.tsx          useActionState
   ├── category-image-field.tsx
   └── delete-category-dialog.tsx        useTransition
        │
        ↓
  actions/category/                      "use server" — authenticate,
   ├── save-category.ts                   validate, delegate, revalidate
   └── delete-category.ts
        │
        ↓
  schemas/category.schema.ts             Zod — the only definition of valid
        │
        ↓
  services/category.service.ts           every rule about categories
        │
        ├──→ lib/db.ts                   Prisma
        └──→ lib/uploads.ts              the image on disk
```

### Where React Query would have gone

[`folder-structure.md`](./folder-structure.md) puts a React Query hook between
the UI and the action. There is no `hooks/use-categories.ts` here, and no
`@tanstack/react-query` in the project.

The reason is that there is nothing for it to cache. The table is rendered on
the server and handed down as a prop; after a mutation the action calls
`revalidatePath`, the page re-runs on the server, and a new array arrives.
Adding a client cache on top would create a **second copy of the same data**
that has to be invalidated in step with the first — the bug that layer is
supposed to prevent, reintroduced by the layer itself.

That is a judgement about *this* feature, not a repeal of the rule. A screen
with client-side pagination, filtering or optimistic reordering has real
client state, and that is when the hook layer earns its place.

### Reads skip the action layer

`page.tsx` calls `listCategories()` directly, the same exception
[`admin-dashboard.md`](./admin-dashboard.md) documents for the overview: the
list is read-only and belongs in the first paint. **Anything that writes goes
through a Server Action**, with no exceptions — a service is not reachable
from the browser and must not become so.

---

## The service owns the rules

`services/category.service.ts` is the only module that touches the `Category`
table, and every decision lives there rather than in the actions above it.

**Mutations return a result, they do not throw.** A thrown Prisma error
crossing the Server Action boundary reaches the browser as an opaque digest —
correct for a bug, useless for "that name is taken". So each mutation returns
either `{ ok: true, category }` or `{ ok: false, message, fieldErrors? }`, and
the action passes it through.

**A unique-constraint violation becomes a field error.** PostgreSQL reports
the *constraint* name (`Category_slug_key`), not the column, so the field is
recovered by substring — `slug` checked before `name`, since both constraint
names contain the table name and only the distinguishing half is trustworthy.

**There are two list functions, on purpose.** `listCategories()` carries a
per-row product count for the table; `listCategoryOptions()` carries four
columns for a `<select>`. The second exists because its caller is the
**product form**, a Client Component, and a count nobody renders would be
serialised into the page for nothing. It includes inactive segments and lets
the form label them: hiding them would make a product's own category vanish
out of its select the moment someone retires it.

**The delete guard counts first, then still catches `P2003`.** The count is
what produces a useful message; the catch is the backstop for the race where
a product is filed under the segment between the count and the delete.

---

## Images

Category pictures are written to `public/uploads` and stored on the row as a
`/uploads/<name>` URL. `lib/uploads.ts` is the only module that touches the
filesystem, and it is `server-only`.

### Ordering, because failures are asymmetric

The file is written **before** the row, and the old file is deleted **after**
the row commits:

| Step | Why that order |
| --- | --- |
| Save the new file first | A row pointing at a file that failed to save renders a broken image on the storefront. |
| Then write the row | If the row is rejected, the just-saved file is deleted explicitly — an orphaned file costs disk, and nothing else. |
| Delete the old file last, and only if it actually changed | Unlinking first would destroy the live image on a rollback. Unlinking unconditionally would delete the picture of a category whose name was the only thing that changed. |

Cleanup never throws. The row is already correct by the time it runs, and
failing a successful update because a stale JPEG could not be unlinked is the
wrong trade.

### The type is sniffed, not believed

`file.type` and `file.name` both come from the browser and are trivially
spoofed on a direct POST to the action. So `saveImage` reads the magic bytes,
derives the extension from **that**, and builds the stored filename entirely
out of values it chose itself — a timestamp and 8 random bytes. Nothing
attacker-controlled reaches the filesystem, which rules out traversal
(`../`), double extensions (`x.png.html`) and collisions between two admins
both uploading `rose.jpg`.

`deleteImage` ignores anything that is not one of our own `/uploads/` URLs, so
a hand-edited `imageUrl` of `../../.env` deletes nothing.

### The caveat worth knowing

**`public/uploads` is the right answer for local development and a
long-lived VPS or container, and the wrong one for a serverless deploy.** On
Vercel or Lambda the bundle is read-only and each invocation gets a fresh
container, so an upload written on one request is gone by the next.
`tech-stack.md` names Cloudflare R2 as the production target — swapping to it
is a change to `saveImage` and `deleteImage` and nothing else, because
nothing above the service layer knows where a URL points.

Uploads are also **not in git** (`.gitignore` keeps `public/uploads/*` and the
`.gitkeep`), so a fresh clone has categories whose `imageUrl` points at
nothing.

---

## Validation

`schemas/category.schema.ts` holds the Zod schema and is the **only**
definition of what a valid category is. The browser-side checks — `required`,
`maxLength`, `accept` — are a courtesy; a Server Action is a public POST
endpoint, so the schema is the actual gate.

The form has no client-side copy of the rules and no `react-hook-form`. Errors
come back from the server and render under the fields. The cost is a round
trip to see a message; the benefit is that the form and the action cannot
disagree about what is valid.

### Three FormData quirks the adapter absorbs

`parseCategoryForm()` sits between the raw `FormData` and the schema because
HTML forms and a type-checked object do not describe the world the same way:

1. **An untouched `<input type="file">` still submits a `File`** — an empty
   one, named `""`. Left alone it fails the MIME check on every edit where the
   admin did not change the picture, so a zero-byte file is read as "no file".
2. **An unchecked checkbox sends nothing at all.** `isActive` is therefore
   derived from *presence*, not value. Base UI's `Switch` renders its own
   hidden checkbox input, so it matches this behaviour natively — `name` is
   all it needs.
3. **An empty text box sends `""`,** which is not "unset". For `description`
   that means `null` (clear the column); for `position` it means "leave it to
   the service", which is why the field is `.optional()` and not coerced to
   `0`.

### Three states for the image, only two of them visible

The form has to distinguish *replace*, *clear* and *leave alone*:

| Admin did | `image` | `removeImage` | Service does |
| --- | --- | --- | --- |
| Picked a file | the file | absent | Replace, delete the old file |
| Pressed "إزالة الصورة" | empty | `"on"` | Set the column to `null`, delete the file |
| Neither | empty | absent | **Leave the current image exactly as it is** |

The third row is the common case on an edit, and the reason an empty file
input can never be read as "the image is now empty".

---

## A `"use server"` file may export only async functions

This cost an hour, so it is written down.

`CategoryFormState` and `IDLE_CATEGORY_FORM_STATE` live in the **schema**
module, not next to the action that returns them. Every export of a
`"use server"` file is turned into a server reference, so a plain object
exported from `save-category.ts` reaches the client as a stub. The failure is
a render-time `TypeError` that names neither the file nor the cause, and
`tsc` and `next build` both pass — only the dev server's module graph
catches it.

Types are fine to export from an action module; values are not.

---

## Access control

The `/admin` layout guard protects **pages**. A Server Action is a POST
endpoint that never renders that layout, so **both actions re-check
`isAdmin()` themselves** — see
[`admin-access-control.md`](./admin-access-control.md).

This is not theoretical: during development the form was rendered from a
route outside `/admin`, the proxy never ran, and submitting it returned
«ليست لديك صلاحية لتعديل الفئات» from the action's own check. That is the
guard doing its job.

---

## Files

| File | What it is |
| --- | --- |
| `prisma/schema.prisma` | `Category` model; `Product.categoryId` |
| `src/app/admin/categories/page.tsx` | The page — Server Component, reads the service |
| `src/components/admin/categories/index.ts` | Barrel — exports the two entry points only |
| `…/categories-table.tsx` | The table, and the dialogs it drives |
| `…/new-category-button.tsx` | The page-header action and its dialog |
| `…/category-form-dialog.tsx` | Create/edit form — `useActionState` |
| `…/category-image-field.tsx` | File picker, preview, and the remove flag |
| `…/delete-category-dialog.tsx` | Confirm-and-delete — `useTransition` |
| `src/actions/category/save-category.ts` | Create or update |
| `src/actions/category/delete-category.ts` | Delete |
| `src/schemas/category.schema.ts` | Zod rules, FormData adapter, form-state type |
| `src/services/category.service.ts` | Every rule about categories |
| `src/lib/uploads.ts` | Image storage — `server-only` |
| `src/constants/uploads.ts` | The limits, shared with the client |
| `src/utils/slug.ts` | The URL-segment rule, shared with products |
| `scripts/seed-categories.mts` | The three founding segments |

### Why the form is one component and one action

Create and edit render identical fields, and the only difference reaches the
server as a hidden `id` — empty means create. Splitting them would mean two
copies of six inputs to keep in step, and two actions whose bodies differ by
a single call.

### Why the dialogs are remounted with a `key`

There is one form dialog and one delete dialog for the whole table, not one
pair per row — thirty rows would otherwise mount sixty dialogs to show at
most one. Each open bumps a `formKey`, which remounts the form so the
previous submission's state and field errors never bleed into the next. The
*target* is deliberately left set when the dialog closes, so the exit
animation does not play against a blanked dialog.

---

## Extending this

**A new field** — add it to the Prisma model, the Zod schema, the FormData
adapter, the service's `create`/`update` data, and the form. Five edits, in
that order; the type checker will find the ones you miss.

**An accent colour for an admin-created segment** — add the slug to
`CATEGORY_ACCENT` in `design-system.ts` and the CSS custom property in
`globals.css`. Until then `categoryAccent(slug)` returns the neutral accent.
Never index `CATEGORY_ACCENT` directly with a slug from the database:
TypeScript will type the result as present, and an unknown slug hands
`undefined` to a `className`, which renders as the literal string
`"undefined"` in the class list rather than failing loudly.

**Drag-to-reorder** — this is the one change that would justify the React
Query layer, because optimistic reordering is real client state.

**Moving images to R2** — rewrite `saveImage` and `deleteImage`. Nothing else
should need to change.
