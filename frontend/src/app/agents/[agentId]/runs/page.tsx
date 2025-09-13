import Link from "next/link";

export default function AgentRuns({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  return (
    <main className="min-h-screen">
      <h1>Test Runs for Agent {(params as any).agentId}</h1>
      <div>
        <Link href={`/agents/${(params as any).agentId}/runs/new`}>Create New Run</Link>
      </div>
      <div>
        <h2>Recent Runs</h2>
        <Link href={`/agents/${(params as any).agentId}/runs/1`}>Run 1 - Completed</Link> <br/>
        <Link href={`/agents/${(params as any).agentId}/runs/2`}>Run 2 - Failed</Link> <br/>
        <Link href={`/agents/${(params as any).agentId}/runs/3`}>Run 3 - Running</Link>
      </div>
      <Link href={`/agents/${(params as any).agentId}`}>Back to Agent Dashboard</Link>
    </main>
  );
}