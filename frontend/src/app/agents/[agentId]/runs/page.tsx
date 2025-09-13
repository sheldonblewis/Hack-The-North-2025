import Link from "next/link";
import { RunsTable } from "~/components/runs/runsTable";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { CheckCircle } from "lucide-react";

export default function AgentRuns({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  return (
    <div className="space-y-6">
      {/* Status Cards Row */}
      <div className="flex flex-wrap gap-6">
        {/* Status Card */}
        <Card className="max-w-80 backdrop-blur overflow-hidden py-0 pt-6">
          <CardContent className="p-0 py-0 flex flex-col h-full">
            <div className="flex items-center gap-2 mb-4 px-6">
              <div className="inline-flex items-center gap-2 bg-green-100/80 text-black px-3 py-1 rounded-full text-sm font-medium">
                <CheckCircle className="h-4 w-4" />
                Active
              </div>
            </div>
            <h2 className="text-xl font-semibold mb-2 px-6">
              Your agent is ready to run
            </h2>
            <p className=" mb-6 px-6 te">
              Your last test run was recent and the models haven't changed.
            </p>
            
            <div className="space-y-3 bg-green-100/80 px-6 flex-1 flex flex-col py-6 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Status:</span>
                <span className="font-medium text-gray-900">All Systems Go</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Last Run:</span>
                <span className="font-medium text-gray-900">Recent (No Changes)</span>
              </div>
              {/* <Button variant="outline" className="w-full mt-auto justify-start text-black">
                View Test Results
              </Button> */}
            </div>
          </CardContent>
        </Card>

        {/* Recommended Tests Card */}
        <Card className="flex flex-col">

          <CardContent className="space-y-4 py-0 pt-0 min-w-2xl">
            <div>
              <CardTitle className="text-lg">Recommended Tests</CardTitle>
              <p className="text-sm text-muted-foreground">
                Run comprehensive security tests to ensure your agent is protected.
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" size="sm" className="h-auto p-3 py-2 text-left justify-start flex-col items-start bg-yellow-50 border-yellow-200">
                <span className="font-medium text-xs leading-tight">Jailbreak</span>
                <span className="text-xs text-muted-foreground leading-tight">Bypass AI safeguards</span>
              </Button>
              <Button variant="outline" size="sm" className="h-auto p-3 py-2 text-left justify-start flex-col items-start leading-tight">
                <span className="font-medium text-xs ">Base64</span>
                <span className="text-xs text-muted-foreground">Binary data encoding</span>
              </Button>
              <Button variant="outline" size="sm" className="h-auto p-3 py-2 text-left justify-start flex-col items-start leading-tight">
                <span className="font-medium text-xs">Caesar</span>
                <span className="text-xs text-muted-foreground">Character shift cipher</span>
              </Button>
              <Button variant="outline" size="sm" className="h-auto p-3 py-2 text-left justify-start flex-col items-start leading-tight">
                <span className="font-medium text-xs">UnicodeConfusable</span>
                <span className="text-xs text-muted-foreground">Similar-looking characters</span>
              </Button>
              <Button variant="outline" size="sm" className="h-auto p-3 py-2 text-left justify-start flex-col items-start leading-tight">
                <span className="font-medium text-xs">ROT13</span>
                <span className="text-xs text-muted-foreground">13-position substitution</span>
              </Button>
              <Button variant="outline" size="sm" className="h-auto p-3 py-2 text-left justify-start flex-col items-start bg-blue-50 border-blue-200 leading-tight">
                <span className="font-medium text-xs">Comprehensive</span>
                <span className="text-xs text-muted-foreground">Run all security tests</span>
              </Button>
            </div>
            <div className="">
              <Button asChild className="w-full">
                <Link href={`/agents/${(params as any).agentId}/runs/new`}>
                  Run New Test
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Runs Table */}
      <RunsTable />
    </div>
  );
}