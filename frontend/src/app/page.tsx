import { auth } from "~/server/auth";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const session = await auth();
  
  console.log("Landing page session:", session);
  
  if (session?.user) {
    redirect("/agents");
  } else {
    redirect("/login");
  }
}
