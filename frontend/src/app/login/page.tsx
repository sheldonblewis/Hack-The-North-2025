import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="min-h-screen">
      <h1>Login Page</h1>
      <Link href="/agents">Go to Agents</Link>
    </main>
  );
}