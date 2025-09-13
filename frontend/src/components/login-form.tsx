import { cn } from "~/lib/utils"
import { Button } from "~/components/ui/button"
import { signIn } from "~/server/auth"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-xl font-medium">Welcome to <span className="font-extrabold font-stretch-150%">IN-IT</span></h1>
        </div>
        <div className="flex flex-col gap-4">
          <form
            action={async () => {
              "use server";
              await signIn("auth0", { redirectTo: "/agents" });
            }}
          >
            <Button type="submit" className="w-full bg-white/90 cursor-pointer">
              Sign in with Auth0
            </Button>
          </form>
          <div className="text-center text-xs">
            Don&apos;t have an account?{" "}
            <form
              action={async () => {
                "use server";
                await signIn("auth0", { redirectTo: "/agents" });
              }}
              className="inline"
            >
              <button type="submit" className="underline underline-offset-4">
                Sign up
              </button>
            </form>
          </div>
        </div>
      </div>
      <div className="text-muted-foreground text-center text-xs text-balance">
        Secure authentication powered by Auth0
      </div>
    </div>
  )
}