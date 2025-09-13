import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <h1>Landing Page</h1>
      <Link href="/login">Go to Login</Link>
    </main>
  );
}
