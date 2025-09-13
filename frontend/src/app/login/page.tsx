import { signIn, auth } from "~/server/auth";
import { redirect } from "next/navigation";
import { Button } from "~/components/ui/button";

export default async function LoginPage() {
  const session = await auth();
  
  if (session?.user) {
    redirect("/agents");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Welcome to Red Team AI
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to access your AI agent platform
          </p>
        </div>
        
        <div className="space-y-4">
          <form
            action={async () => {
              "use server";
              await signIn("auth0", { redirectTo: "/agents" });
            }}
          >
            <Button type="submit" className="w-full">
              Sign in with Auth0
            </Button>
          </form>
        </div>
        
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Secure authentication powered by Auth0
          </p>
        </div>
      </div>
    </main>
  );
}