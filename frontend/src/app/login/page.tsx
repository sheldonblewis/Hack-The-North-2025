import { auth } from "~/server/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "~/components/login-form";
import { Card } from "~/components/ui/card";
import { FlickeringGrid } from "~/components/ui/flickering-grid";

export default async function LoginPage() {
  const session = await auth();
  
  if (session?.user) {
    redirect("/agents");
  }

  return (
    <div className="relative bg-background h-screen flex flex-col items-center overflow-hidden justify-center gap-6 p-6 md:p-10">
      <FlickeringGrid 
        className="absolute inset-0 z-0"
        squareSize={4}
        gridGap={6}
        flickerChance={0.3}
        color="rgb(148, 163, 184)"
        maxOpacity={0.2}
      />
      <div className="relative z-10 w-full max-w-sm">
        <Card className="px-6">
          <LoginForm />
        </Card>
      </div>
    </div>
  );
}