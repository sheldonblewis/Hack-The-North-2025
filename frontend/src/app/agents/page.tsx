import Link from "next/link";

export default function AgentsPage() {
  return (
    <main className="min-h-screen">
      <h1>Agents List</h1>
      <div>
        <Link href="/agents/1">Agent 1</Link>
        <Link href="/agents/2">Agent 2</Link>
        <Link href="/agents/3">Agent 3</Link>
      </div>
    </main>
  );
}