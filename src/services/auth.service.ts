import "server-only"

import { auth, currentUser } from "@clerk/nextjs/server"
import type { User as ClerkUser } from "@clerk/nextjs/server"
import { Role, type User } from "@prisma/client"

import { db } from "@/lib/db"

/**
 * Auth business logic — the only module in the app that writes the `User`
 * table, and the only one that decides what "admin" means.
 *
 * Two systems hold user state and they have different jobs:
 *
 *   Clerk    — source of truth for identity (credentials, email, name,
 *              avatar) *and* for `role`, because a session token can be
 *              checked without touching Postgres.
 *   Postgres — a mirror, so `Order.userId` has something to point at and so
 *              the admin can list and search users with normal SQL.
 *
 * The mirror is refreshed by `syncCurrentUser()`, which `/auth-callback`
 * calls on every sign-in. See docs/auth-callback.md.
 */

/* -------------------------------------------------------------------------
 * Role
 * ---------------------------------------------------------------------- */

/**
 * Read a role off a Clerk user, defaulting to `USER`.
 *
 * Written as an allow-list rather than a cast: `publicMetadata` is free-form
 * JSON, so a typo (`"admin"`, `"Admin"`) or a hand-edited dashboard value
 * must land on `USER`, never on `ADMIN`. Failing closed is the whole point.
 */
export function resolveRole(metadata: UserPublicMetadata | undefined): Role {
  return metadata?.role === Role.ADMIN ? Role.ADMIN : Role.USER
}

/* -------------------------------------------------------------------------
 * Sync
 * ---------------------------------------------------------------------- */

/** What `/auth-callback` needs to know once the sync has run. */
export type SyncResult =
  | { status: "signed-out" }
  | { status: "synced"; user: User; created: boolean }

/**
 * Mirror the currently signed-in Clerk user into Postgres.
 *
 * Idempotent by design — it runs on *every* visit to `/auth-callback`, not
 * just the first, so that a name, avatar, email or role changed in Clerk
 * propagates on the user's next sign-in without a webhook.
 *
 * The upsert keys on `clerkId`, never on `email`: Clerk lets a user change
 * their primary address, and matching on email would either fail the unique
 * constraint or silently graft one person's orders onto another's row.
 */
export async function syncCurrentUser(): Promise<SyncResult> {
  const clerkUser = await currentUser()
  if (!clerkUser) return { status: "signed-out" }

  const profile = toProfile(clerkUser)

  // `email` is unique and could already be held by a row with a *different*
  // clerkId — a user deleted in Clerk and signed up again, say. Prisma has no
  // "upsert on either of two unique keys", so the collision is resolved
  // explicitly: the clerkId row wins, and the stale row is re-pointed.
  const existingByEmail = await db.user.findUnique({
    where: { email: profile.email },
    select: { id: true, clerkId: true },
  })

  if (existingByEmail && existingByEmail.clerkId !== clerkUser.id) {
    const user = await db.user.update({
      where: { id: existingByEmail.id },
      data: { ...profile, clerkId: clerkUser.id },
    })
    return { status: "synced", user, created: false }
  }

  const existing = await db.user.findUnique({
    where: { clerkId: clerkUser.id },
    select: { id: true },
  })

  const user = await db.user.upsert({
    where: { clerkId: clerkUser.id },
    create: { clerkId: clerkUser.id, ...profile },
    update: profile,
  })

  return { status: "synced", user, created: !existing }
}

/** Flatten a Clerk user into the columns the `User` table actually stores. */
function toProfile(clerkUser: ClerkUser) {
  const email =
    clerkUser.primaryEmailAddress?.emailAddress ??
    clerkUser.emailAddresses[0]?.emailAddress

  // Clerk guarantees an identifier on every sign-up method it is configured
  // for, but an instance set up for username- or phone-only sign-up can hand
  // back a user with no address at all. There is nothing sane to store in a
  // unique NOT NULL column in that case, so it is a hard error rather than a
  // synthesised placeholder that would collide on the second such user.
  if (!email) {
    throw new Error(
      `Clerk user ${clerkUser.id} has no email address; cannot sync to the User table.`
    )
  }

  return {
    email,
    name: clerkUser.fullName ?? clerkUser.username ?? null,
    imageUrl: clerkUser.hasImage ? clerkUser.imageUrl : null,
    phone: clerkUser.primaryPhoneNumber?.phoneNumber ?? null,
    role: resolveRole(clerkUser.publicMetadata),
  }
}

/* -------------------------------------------------------------------------
 * Reads
 * ---------------------------------------------------------------------- */

/**
 * The signed-in user's mirrored row, or `null` when signed out.
 *
 * Returns `null` rather than throwing when the row is missing: a user can
 * hold a valid Clerk session and have no row yet (they signed in before
 * `/auth-callback` existed, or the sync failed). Callers that require a row
 * should send them through `/auth-callback` to create one.
 */
export async function getCurrentUser(): Promise<User | null> {
  const { userId } = await auth()
  if (!userId) return null

  return db.user.findUnique({ where: { clerkId: userId } })
}

/**
 * Is the current request from an admin?
 *
 * Reads the role from **Clerk**, not from the `User` table, so that revoking
 * someone's access in the Clerk dashboard takes effect on their next request
 * — it does not wait for them to sign out and back in through
 * `/auth-callback`. The Postgres `role` column is a reporting mirror only.
 */
export async function isAdmin(): Promise<boolean> {
  const clerkUser = await currentUser()
  if (!clerkUser) return false

  return resolveRole(clerkUser.publicMetadata) === Role.ADMIN
}
