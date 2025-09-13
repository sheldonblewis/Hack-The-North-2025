import Link from "next/link";

export default function RunDetails({
  params,
}: {
  params: Promise<{ agentId: string; runID: string }>;
}) {
  return (
    <main className="min-h-screen">
      <h1>Run {(params as any).runID} Details</h1>
      <p>Agent Id: {(params as any).agentId}</p>

      <Link href={`/agents/${(params as any).agentId}/runs`}>Back to Runs</Link>
    </main>
  );
}