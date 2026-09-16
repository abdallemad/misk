# Admin Access Control

How `/admin` is locked down.

## Related documents

- [`auth-callback.md`](./auth-callback.md) — where the role is mirrored into Postgres
- [`admin-dashboard.md`](./admin-dashboard.md) — what sits behind the gate

---

## Two gates, not one

```text
  request for /admin/products
        │
        ↓
  ┌─────────────────────────────────────────────┐
  │ src/app/admin/layout.tsx                    │
  │   await auth.protect()                      │   signed out
  │                                             │ ──────────────→ /sign-in
  └────────────────────┬────────────────────────┘
                       ↓ signed in
  ┌─────────────────────────────────────────────┐
  │ src/app/admin/layout.tsx                    │
  │   await isAdmin()                           │   not an admin
  │                                             │ ──────────────→ notFound()
  └────────────────────┬────────────────────────┘
                       ↓ admin
                  the console
```

Both gates now live in the same file, `admin/layout.tsx`. Gate 1 used to sit in
`src/proxy.ts` instead, matched by path (`createRouteMatcher(["/admin(.*)", …])`).
Clerk deprecated that pattern: a proxy decides access by matching the URL,
which can drift from how Next.js actually resolves a request and leave a
resource reachable that the matcher meant to cover. `proxy.ts` still exists —
`clerkMiddleware()` with no callback, kept because `auth()`/`auth.protect()`
need it running — but it no longer makes any admit/deny decision. See
`src/proxy.ts`'s own comment and
[Clerk's migration guide](https://clerk.com/docs/guides/development/upgrading/upgrade-guides/migrate-from-create-route-matcher).

### Gate 1 — `auth.protect()`: is there a session?

```tsx
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await auth.protect()
  if (!(await isAdmin())) notFound()
  …
}
```

Session only, and checked first — a signed-out visitor should be bounced to
sign-in, not told the page doesn't exist. That distinction is the reason this
stays a separate call rather than folding into `isAdmin()`, which fails closed
(`false`) for both "no session" and "session, wrong role" alike.

### Gate 2 — `isAdmin()`: is the session an admin?

Every route under `/admin` renders *inside* this layout, so there is no
`/admin/*` page that can be added later and forget to protect itself. That is
the property worth preserving: **the guard is structural, not per-page.**

`notFound()` rather than a redirect or a 403 — a non-admin should not learn
that `/admin` exists.

---

## Where the role actually lives

**Clerk `publicMetadata.role` is the source of truth.** The Postgres
`User.role` column is a mirror, refreshed on each pass through
`/auth-callback`.

`isAdmin()` reads from **Clerk**, not from the table:

```ts
export async function isAdmin(): Promise<boolean> {
  const clerkUser = await currentUser()
  if (!clerkUser) return false
  return resolveRole(clerkUser.publicMetadata) === Role.ADMIN
}
```

Revoking someone in the Clerk dashboard therefore takes effect on their
**next request**. Reading the mirror instead would leave a revoked admin
holding access until they happened to sign out and back in.

The mirror still earns its place: the admin users list can filter and sort by
role in SQL rather than making an API call per row.

### `resolveRole` fails closed

```ts
export function resolveRole(metadata: UserPublicMetadata | undefined): Role {
  return metadata?.role === Role.ADMIN ? Role.ADMIN : Role.USER
}
```

An allow-list, not a cast. `publicMetadata` is free-form JSON that a human
edits in a dashboard, so `"admin"`, `"Admin"`, `true` and a typo must all
land on `USER`. Never rewrite this as `(metadata?.role as Role) ?? Role.USER`.

`src/types/globals.d.ts` augments Clerk's `UserPublicMetadata` so
`.role` is typed `Role | undefined` across the whole app rather than
`unknown`. It is optional there on purpose — a brand-new Clerk user has no
metadata at all, and "absent" means the same as `USER`.

---

## Making someone an admin

```bash
npm run grant-admin -- someone@example.com
```

```bash
npm run grant-admin -- someone@example.com --revoke
```

The user must already exist in Clerk — sign up through `/sign-up` first. The
script changes an existing user's role; it does not create accounts.

Equivalent by hand: Clerk dashboard → **Users** → the user → **Metadata** →
**Public** →

```json
{ "role": "ADMIN" }
```

### The bootstrap rule, and the in-app control that keeps it

**The first admin must come from outside the app** — `grant-admin` or the
Clerk dashboard. An in-app "make me an admin" control is a privilege
escalation waiting to happen, and that is what this rule forbids.

Once a first admin exists, the customers console *does* have a UI to promote a
**second** — `customer-role-control.tsx` on `/admin/customers/[id]`, see
[`customers-feature.md`](./customers-feature.md). It does not weaken the rule,
because the escalation it guards against ("a logged-in non-admin makes
themselves an admin") is closed by two checks in
`actions/customer/set-role.ts`:

- `isAdmin()` — the caller is already an admin (re-checked here: the layout
  guard does not run for a Server Action POST);
- **not-self** — `getCurrentUser().id` must not be the target, so a lone admin
  cannot demote themselves into a locked-out console, and nobody promotes
  their own account.

The Clerk write is still the real one — `setCustomerRole` calls
`clerkClient().users.updateUserMetadata` first and only mirrors to Postgres if
that succeeds — so everything below about *where the role lives* is unchanged.

After granting (by any route), the change is live on the user's next request.
Their Postgres `User.role` catches up the next time they pass through
`/auth-callback`, or immediately if the change came through the console (which
writes the mirror itself).

---

## What is *not* protected

Three subtrees call `auth.protect()` in their own layout: `admin/layout.tsx`,
`account/layout.tsx`, and `checkout/layout.tsx` — the last two joined in
`docs/checkout-orders-feature.md`, on the same reasoning: an `Order` needs a
`User` row, so placing one has to be signed-in-only. Everything else is
public. When you add a Server Action that mutates admin data, **re-check
`isAdmin()` inside the action** — a Server Action is a POST endpoint, and the
layout guard does not run for it. The layout protects pages, not mutations.
(`placeOrderAction` follows the equivalent rule with `getCurrentUser()`
instead of `isAdmin()` — there is no role to check, only that someone is
signed in at all.)

The same applies to a Route Handler (`route.ts`) added under one of these
trees in the future: it does not render the layout either, so it would need
its own `auth.protect()` / `isAdmin()` call, same as an action. There are none
today — every mutation in this app goes through a Server Action instead.

---

## Optional: the session-token fast path

`src/types/globals.d.ts` also augments `CustomJwtSessionClaims` with
`metadata.role`. That is only populated if the Clerk session token is
customised in the dashboard (**Configure → Sessions → Customize session
token**) with:

```json
{ "metadata": "{{user.public_metadata}}" }
```

Nothing currently depends on it. It is declared so that if `/admin` ever wants
a cheap early redirect for signed-out visitors — read back in `proxy.ts`
without an API round trip — the type is already correct. Per Clerk's own
guidance, that would be a performance shortcut only, never the security
boundary: `auth.protect()` and `isAdmin()` in the layout would still have to
run and would still be what actually decides access.
