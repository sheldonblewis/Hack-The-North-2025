import Link from "next/link";

export default function AlertDetails({
  params,
}: {
  params: Promise<{ id: string; runId: string; alertId: string }>;
}) {
  return (
    <main className="min-h-screen">
      <h1>Alert {(params as any).alertId}</h1>
      <p>Agent Id: {(params as any).agentId}</p>
      
      <div>
        <h2>Alert Details</h2>
        <p>Alert content and details would go here...</p>
      </div>

      <Link href={`/agents/${(params as any).id}/alerts`}>Back to Alerts</Link>
    </main>
  );
}