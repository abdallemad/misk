import { SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs"

import { buttonVariants } from "@/components/ui/button"

function AuthNav() {
  return (
    <div className="flex items-center gap-1">
      <Show when="signed-out">
        <SignInButton>
          <button
            type="button"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            دخول
          </button>
        </SignInButton>
        <SignUpButton>
          <button
            type="button"
            className={buttonVariants({ variant: "gold", size: "sm" })}
          >
            إنشاء حساب
          </button>
        </SignUpButton>
      </Show>
      <Show when="signed-in">
        <UserButton />
      </Show>
    </div>
  )
}

export { AuthNav }
