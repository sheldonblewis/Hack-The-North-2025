import Link from "next/link";

export default function AgentChat({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <main className="min-h-screen">
      <h1>Agent Chat</h1>
      <p>Chatting with Agent Id: {(params as any).agentId}</p>
      <Link href={`/agents/${(params as any).id}`}>Back to Dashboard</Link>
    </main>
  );
}