import Link from "next/link";
import { auth } from "~/server/auth";
import { redirect } from "next/navigation";

export default async function AgentsPage() {
  const session = await auth();
  
  console.log("Agents page session:", session);
  
  if (!session?.user) {
    redirect("/login");
  }
  
  return (
    <main className="min-h-screen">
      <h1>Agents List</h1>
      <p>Welcome, {session.user.name || session.user.email}!</p>
      <div>
        <Link href="/agents/1">Agent 1</Link>
        <Link href="/agents/2">Agent 2</Link>
        <Link href="/agents/3">Agent 3</Link>
      </div>
    </main>
  );
}