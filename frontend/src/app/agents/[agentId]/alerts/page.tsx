import Link from "next/link";

export default function AgentAlerts({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <main className="min-h-screen">
      <h1>Agent {(params as any).agentId}: alerts </h1>
      <div>
        <h2>Alerts</h2>
        <Link href={`/agents/${(params as any).agentId}/alerts/1`}>Alert 1 - Critical</Link> <br/>
        <Link href={`/agents/${(params as any).agentId}/alerts/2`}>Alert 2 - Warning</Link> <br/>
        <Link href={`/agents/${(params as any).agentId}/alerts/3`}>Alert 3 - Info</Link>
      </div>
      <Link href={`/agents/${(params as any).agentId}`}>Back to Dashboard</Link>
    </main>
  );
}