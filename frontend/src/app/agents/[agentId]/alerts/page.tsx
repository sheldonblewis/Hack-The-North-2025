import Link from "next/link";

export default async function AgentAlerts({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = await params;

  return (
    <main className="min-h-screen">
      <h1>Agent {agentId}: alerts </h1>
      <div>
        <h2>Alerts</h2>
        <Link href={`/agents/${agentId}/alerts/1`}>Alert 1 - Critical</Link> <br/>
        <Link href={`/agents/${agentId}/alerts/2`}>Alert 2 - Warning</Link> <br/>
        <Link href={`/agents/${agentId}/alerts/3`}>Alert 3 - Info</Link>
      </div>
      <Link href={`/agents/${agentId}`}>Back to Dashboard</Link>
    </main>
  );
}