import Link from "next/link";

export default function AgentDashboard({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <main className="min-h-screen">
      <h1>Agent Dashboard</h1>
      <p>Agent Id: {(params as any).agentId}</p>
      <div>
        <Link href={`/agents/${(params as any).agentId}/chat`}>Go to Chat</Link> <br/>
        <Link href={`/agents/${(params as any).agentId}/alerts`}>Go to Alerts</Link> <br/>
        <Link href={`/agents/${(params as any).agentId}/runs`}>Go to Test Runs</Link> <br/>
        <Link href={`/agents/${(params as any).agentId}/runs/new`}>New Run</Link> <br/>
        <Link href="/agents">Back to Agents</Link>
      </div>
    </main>
  );
}