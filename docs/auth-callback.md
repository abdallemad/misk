# Auth Callback

`/auth-callback` — the landing strip between Clerk and the app.

## Related documents

- [`folder-structure.md`](./folder-structure.md) — the layer architecture this follows
- [`admin-access-control.md`](./admin-access-control.md) — how the `role` this syncs is used

---

## Why the route exists

Clerk owns identity. Postgres owns everything the catalog needs a foreign key
to. Something has to put a row in the second when a person appears in the
first, and this route is that something.

Two constraints force it into the redirect chain rather than somewhere more
convenient:

1. **`Order.userId` is a real foreign key.** A user who has never been
   mirrored cannot check out. The mirror has to happen before they can reach
   any page that assumes a row exists.
2. **A Clerk webhook is asynchronous and unordered.** `user.created` fires
   whenever it fires. A fast user can land on `/cart` before it arrives.
   Doing the sync inside the redirect makes the row's existence a
   precondition of ever seeing a signed-in page — there is no window.

The cost is one extra hop after sign-in. That hop is what the loader is for.

---

## The flow

```text
                    ┌──────────────────────────────┐
                    │  user clicks "دخول"           │
                    └───────────────┬──────────────┘
                                    ↓
   ┌────────────────────────────────────────────────────────────┐
   │  /sign-in   (Clerk <SignIn />)                             │
   │  forceRedirectUrl = /auth-callback?redirect_url=<original> │
   └───────────────────────────────┬────────────────────────────┘
                                   ↓  Clerk sets the session cookie
   ┌────────────────────────────────────────────────────────────┐
   │  /auth-callback                                            │
   │                                                            │
   │    loading.tsx  →  <BrandLoader /> streams immediately     │
   │    page.tsx     →  await syncUserAction()                  │
   │                       → syncCurrentUser()   (service)      │
   │                          → db.user.upsert() (prisma)       │
   │                    redirect(safeRedirect(redirect_url))    │
   └───────────────────────────────┬────────────────────────────┘
                                   ↓
                    ┌──────────────────────────────┐
                    │  /  ·  /admin  ·  /cart  …   │
                    └──────────────────────────────┘
```

### Files

| File | Role |
| --- | --- |
| `src/app/auth-callback/loading.tsx` | The Suspense fallback — the loader the user actually sees |
| `src/app/auth-callback/page.tsx` | Awaits the sync, then redirects; renders a retry on failure |
| `src/actions/auth/sync-user.ts` | Server Action — validates, delegates, returns a client-safe shape |
| `src/services/auth.service.ts` | `syncCurrentUser()`, `getCurrentUser()`, `isAdmin()`, `resolveRole()` |
| `src/constants/routes.ts` | `ROUTES`, `safeRedirect()`, `authCallbackUrl()` |
| `src/lib/db.ts` | The Prisma client |

This is the standard layering from
[`folder-structure.md`](./folder-structure.md): UI → Server Action → Service
→ Prisma. Nothing above the service touches the database.

---

## Where the loader comes from

`page.tsx` is an async Server Component that **never returns markup on the
happy path** — it syncs and then calls `redirect()`. So `loading.tsx` is not
a brief flash before the real page; it is the entire visible life of the
route.

That is why the loader is a real piece of design (`BrandLoader`) rather than
a spinner. The user has just handed over credentials and is looking at an
unfamiliar screen; it says the brand's name and what the wait is for.

`BrandLoader` lives in `components/shared` because `/admin` reuses it. It
renders `role="status"` + `aria-live="polite"`, so a screen reader announces
the message once without stealing focus, and the mark pulses under
`motion-safe:` so a reduced-motion user gets a still image.

---

## `forceRedirectUrl`, and the gap it closes

This is the subtle part, and it is worth understanding before changing
anything in `sign-in/page.tsx`.

When `proxy.ts` bounces a signed-out visitor off `/admin`, Clerk sends them
to sign-in with the original destination attached:

```text
/sign-in?redirect_url=http%3A%2F%2Flocalhost%3A3000%2Fadmin
```

Clerk gives that query parameter **priority over
`NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL`**. So configuring the
fallback alone is not enough: a user who arrives at sign-in by being bounced
would go straight back to `/admin` after signing in, skip `/auth-callback`
entirely, and never get a row in the database.

The fix is `forceRedirectUrl`, which outranks `redirect_url`:

```tsx
// src/app/sign-in/[[...sign-in]]/page.tsx
<SignIn forceRedirectUrl={authCallbackUrl(redirect_url)} />
```

`authCallbackUrl("http://localhost:3000/admin")` returns
`/auth-callback?redirect_url=%2Fadmin` — the sync goes back in the path, and
the original destination rides along to be honoured afterwards.

The env fallbacks still matter for the *other* entry point — a user who
navigates to `/sign-in` themselves, with no `redirect_url` at all:

```dotenv
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/auth-callback
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/auth-callback
```

Both paths lead through the callback. That is the invariant to preserve.

---

## `safeRedirect` — the open-redirect guard

`/auth-callback` forwards the browser to whatever `?redirect_url=` says, and
that value arrives from the address bar. Unchecked, it is an open redirect
in the sign-in flow: a link that signs a user in and drops them on a
lookalike site with a live session in hand.

The guard's trick is that **only the path of the input survives**. The origin
is discarded rather than validated, so a hostile absolute URL cannot escape
this origin at all — the worst it can do is name a page on our own site.

| Input | Output | Why |
| --- | --- | --- |
| `/admin` | `/admin` | ordinary case |
| `http://localhost:3000/admin` | `/admin` | the Clerk case — origin dropped |
| `https://evil.com/admin` | `/admin` | origin dropped, stays on our site |
| `//evil.com/x` | `/x` | protocol-relative, origin dropped |
| `/\evil.com` | `/` | backslash normalised, then origin dropped |
| `javascript:alert(1)` | `/` | not path-shaped |
| `""` / `null` / `undefined` | `/` | fallback |

The backslash normalisation is not decoration: browsers read `\` in a URL as
`/`, so `/\evil.com` navigates to `//evil.com`. Without the `replace()` the
value looks like a harmless path to a naive `startsWith("/")` check.

---

## Idempotency and the email collision

`syncCurrentUser()` runs on **every** visit to `/auth-callback`, not just the
first. That is deliberate — it means a name, avatar, email or role changed in
Clerk propagates on the user's next sign-in, with no webhook.

The upsert keys on `clerkId`, never on `email`. A user can change their
primary address in Clerk and stay the same person; matching on email would
either trip the unique constraint or silently graft one person's orders onto
another's row.

That leaves one case Prisma cannot express as a single upsert — the row whose
`email` matches but whose `clerkId` does not (someone deleted in Clerk who
signed up again). The service resolves it explicitly: the `clerkId` wins, and
the stale row is re-pointed at the new Clerk id.

A user with **no** email address at all is a hard error rather than a
synthesised placeholder — `email` is `UNIQUE NOT NULL`, and a placeholder
would collide on the second such user. This only arises on a Clerk instance
configured for username- or phone-only sign-up.

---

## Failure

If the sync throws — database unreachable, a unique-constraint race — the
user is already authenticated and there is no useful way to un-authenticate
them. Rendering a dead end would strand a paying customer, so `page.tsx`
renders a retry (this same route re-runs the sync) plus a way past it to the
storefront.

That state is styled as an **error**, not as a slow load: no spinner, or it
reads as "still working" and the user waits for nothing.

---

## Testing it by hand

```bash
npm run dev
```

1. Open `/admin` while signed out → bounced to `/sign-in?redirect_url=…`.
2. Sign in → the loader appears at `/auth-callback` → you land on `/admin`
   (or a 404, until someone grants you the role — see
   [`admin-access-control.md`](./admin-access-control.md)).
3. Check the row exists:

   ```bash
   npx prisma studio
   ```

To watch the loader for longer than the sync takes, add a
`await new Promise((r) => setTimeout(r, 3000))` at the top of
`syncCurrentUser()` — and take it out again.
