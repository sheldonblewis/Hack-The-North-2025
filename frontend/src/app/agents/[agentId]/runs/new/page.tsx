import Link from "next/link";

export default function NewRun({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  return (
    <main className="min-h-screen">
      <h1>Create New Test Run</h1>
      <p>Agent Id: {(params as any).agentId}</p>
      
      <div>
        <h2>Run Configuration</h2>
        <p>Test run configuration form would go here...</p>
      </div>

      <Link href={`/agents/${(params as any).agentId}/runs`}>Back to Runs</Link>
    </main>
  );
}