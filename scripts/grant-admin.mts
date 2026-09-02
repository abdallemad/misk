/**
 * Grant or revoke the ADMIN role.
 *
 *   npm run grant-admin -- someone@example.com
 *   npm run grant-admin -- someone@example.com --revoke
 *
 * Run through Node's own TypeScript stripping and `--env-file`, so it needs
 * no extra dependency and no build step. `.mts` rather than `.ts` so Node
 * treats it as ESM without guessing.
 *
 * `/admin` reads the role from Clerk's `publicMetadata`, so that is what
 * this writes — the Postgres `User.role` column is a mirror and is refreshed
 * on the user's next pass through `/auth-callback`. Writing only the mirror
 * would grant nothing.
 *
 * There is no UI for this on purpose: the first admin has to come from
 * outside the app, and an in-app "make me an admin" button is a privilege
 * escalation waiting to happen. The same job can be done by hand in the
 * Clerk dashboard (Users → the user → Metadata → Public).
 *
 * See docs/admin-access-control.md.
 */

// Imported from `@clerk/backend`, not `@clerk/nextjs/server`. The latter's
// ESM build uses extensionless imports meant for a bundler, which plain Node
// cannot resolve; `@clerk/backend` is the same client and loads directly.
// (`@clerk/nextjs/server` merely re-exports `createClerkClient` from here.)
import { createClerkClient } from "@clerk/backend"

/**
 * Wrapped in a function so failures can `return` after setting an exit code.
 * Calling `process.exit()` while Clerk's keep-alive socket is still open
 * trips a libuv assertion on Windows — the message prints, then Node dies
 * noisily. Letting the process end on its own avoids that entirely.
 */
async function main(): Promise<void> {
  const [email, ...flags] = process.argv.slice(2)
  const revoke = flags.includes("--revoke")

  if (!email) {
    console.error(
      [
        "Usage: npm run grant-admin -- <email> [--revoke]",
        "The email must be one Clerk already knows — sign up first, then run this.",
      ].join("\n")
    )
    process.exitCode = 1
    return
  }

  const secretKey = process.env.CLERK_SECRET_KEY
  if (!secretKey) {
    console.error("CLERK_SECRET_KEY is not set. Run this with the .env loaded.")
    process.exitCode = 1
    return
  }

  const clerk = createClerkClient({ secretKey })

  const { data: users } = await clerk.users.getUserList({
    emailAddress: [email],
  })

  const user = users[0]
  if (!user) {
    console.error(
      [
        `No Clerk user with the email ${email}.`,
        "They need to sign up through /sign-up first — this script changes an",
        "existing user's role, it does not create accounts.",
      ].join("\n")
    )
    process.exitCode = 1
    return
  }

  const role = revoke ? "USER" : "ADMIN"

  await clerk.users.updateUserMetadata(user.id, {
    publicMetadata: { role },
  })

  console.log(
    [
      `${email} (${user.id}) is now ${role}.`,
      "Takes effect on their next request. The User row in Postgres catches up",
      "the next time they pass through /auth-callback.",
    ].join("\n")
  )
}

await main()
