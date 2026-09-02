"use server"

import { syncCurrentUser } from "@/services/auth.service"

/**
 * Mirror the signed-in Clerk user into Postgres.
 *
 * The thin action layer the architecture asks for (UI → Action → Service →
 * Prisma): it authenticates, delegates, and returns a shape that is safe to
 * hand to a client component — no Prisma model, no Clerk object, no stack
 * trace. Everything it knows how to do lives in `auth.service.ts`.
 *
 * Called by `/auth-callback` during render. It is also safe to call from a
 * client component if a future screen needs to force a re-sync.
 */
export async function syncUserAction(): Promise<
  | { ok: true; created: boolean }
  | { ok: false; reason: "signed-out" | "failed" }
> {
  try {
    const result = await syncCurrentUser()

    if (result.status === "signed-out") {
      return { ok: false, reason: "signed-out" }
    }

    return { ok: true, created: result.created }
  } catch (error) {
    // The user is already authenticated at this point — the only failures
    // left are infrastructure (database unreachable, unique-constraint race).
    // Log the detail server-side and hand the caller a flat failure, so
    // `/auth-callback` can show a retry instead of an error screen.
    console.error("[syncUserAction] failed to sync Clerk user", error)
    return { ok: false, reason: "failed" }
  }
}
