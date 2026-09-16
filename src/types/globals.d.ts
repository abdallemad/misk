import type { Role } from "@prisma/client"

/**
 * Clerk ships `UserPublicMetadata` and `CustomJwtSessionClaims` as empty,
 * augmentable global interfaces. Declaring our shape here is what turns
 * `user.publicMetadata.role` from `unknown` into `Role | undefined` across
 * the entire app — services, layouts and `proxy.ts` alike.
 *
 * `role` is deliberately optional: a brand-new Clerk user has no metadata at
 * all until someone sets it, and "absent" means the same thing as `"USER"`.
 * Never treat a missing role as ADMIN — see `resolveRole()` in
 * `services/auth.service.ts`.
 */
declare global {
  interface UserPublicMetadata {
    role?: Role
  }

  /**
   * Only populated if the Clerk session token is customised to include
   * `{"metadata": "{{user.public_metadata}}"}` in the Clerk dashboard
   * (Configure → Sessions → Customize session token). The admin guard does
   * not depend on it — see docs/admin-access-control.md — but when it is
   * configured, `proxy.ts` could read it for a cheap early redirect without
   * an API round trip. That would only ever be a performance shortcut,
   * never the security boundary: `auth.protect()` and `isAdmin()` in
   * `admin/layout.tsx` are what actually decide access.
   */
  interface CustomJwtSessionClaims {
    metadata?: {
      role?: Role
    }
  }
}

export {}
