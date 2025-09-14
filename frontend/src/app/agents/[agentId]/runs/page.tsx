import Link from "next/link";
import { RunsTable } from "~/components/runs/runsTable";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { CheckCircle, OctagonX, TriangleAlert, Info } from "lucide-react";

export default async function AgentRuns({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = await params;

  return (
    <div className="space-y-6">
      {/* Status Cards Row */}
      <div className="flex flex-wrap gap-6">
        {/* Status Card */}
        <Card className="max-w-72 backdrop-blur overflow-hidden py-0 pt-5 ">
          <CardContent className="p-0 py-0 flex flex-col h-full">
            <div className="flex items-center gap-1 mb-4 px-4">
              <div className="inline-flex items-center gap-2 bg-green-100/80 text-black px-3 py-1 rounded-full text-sm font-medium">
                <CheckCircle className="h-4 w-4" />
                Active
              </div>
            </div>
            <h2 className="text-lg font-semibold mb-2 px-4">
              Your agent is ready to run
            </h2>
            <p className=" mb-6 px-4 text-sm text-muted-foreground">
              Your last test run was recent and the models haven't changed.
            </p>
            
            <div className="space-y-3 bg-green-100/80 px-6 flex-1 flex flex-col py-6 text-sm">
              {/* <div className="flex justify-between items-center">
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
              <Button variant="outline" size="sm" className="h-auto p-3 py-2 text-left justify-start flex-col items-start relative">
                {/* <OctagonX className="absolute -top-1 -right-1 h-4 w-4 text-red-500 drop-shadow-lg animate-pulse" title="High Urgency" /> */}
                <span className="font-medium text-xs leading-tight">Jailbreak</span>
                <span className="text-xs text-muted-foreground leading-tight">Bypass AI safeguards</span>
              </Button>
              <Button variant="outline" size="sm" className="h-auto p-3 py-2 text-left justify-start flex-col items-start relative leading-tight">
                {/* <TriangleAlert className="absolute -top-1 -right-1 h-4 w-4 text-yellow-500 drop-shadow-lg" title="Medium Urgency" /> */}
                <span className="font-medium text-xs ">Base64</span>
                <span className="text-xs text-muted-foreground">Binary data encoding</span>
              </Button>
              <Button variant="outline" size="sm" className="h-auto p-3 py-2 text-left justify-start flex-col items-start relative leading-tight">
                {/* <Info className="absolute -top-1 -right-1 h-4 w-4 text-green-500 drop-shadow-lg" title="Low Urgency" /> */}
                <span className="font-medium text-xs">Caesar</span>
                <span className="text-xs text-muted-foreground">Character shift cipher</span>
              </Button>
              <Button variant="outline" size="sm" className="h-auto p-3 py-2 text-left justify-start flex-col items-start relative leading-tight">
                {/* <OctagonX className="absolute -top-1 -right-1 h-4 w-4 text-red-500 drop-shadow-lg animate-pulse" title="High Urgency" /> */}
                <span className="font-medium text-xs">UnicodeConfusable</span>
                <span className="text-xs text-muted-foreground">Similar-looking characters</span>
              </Button>
              <Button variant="outline" size="sm" className="h-auto p-3 py-2 text-left justify-start flex-col items-start relative leading-tight">
                {/* <TriangleAlert className="absolute -top-1 -right-1 h-4 w-4 text-yellow-500 drop-shadow-lg" title="Medium Urgency" /> */}
                <span className="font-medium text-xs">ROT13</span>
                <span className="text-xs text-muted-foreground">13-position substitution</span>
              </Button>
              <Button variant="outline" size="sm" className="h-auto p-3 py-2 text-left justify-start flex-col items-start relative leading-tight">
                {/* <Info className="absolute -top-1 -right-1 h-4 w-4 text-green-500 drop-shadow-lg" title="Low Urgency" /> */}
                <span className="font-medium text-xs">Comprehensive</span>
                <span className="text-xs text-muted-foreground">Run all security tests</span>
              </Button>
            </div>
            <div className="">
              <Button asChild className="w-full">
                <Link href={`/agents/${agentId}/runs/new`}>
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