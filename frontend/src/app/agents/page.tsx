import Link from "next/link";
import { auth } from "~/server/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Bot, ArrowRight, Plus, Circle } from "lucide-react";

const AGENTS = [
  {
    id: "1",
    name: "Agent 01",
    description: "Customer service and support automation with advanced conversation handling",
    category: "Support",
    status: "Active",
    lastTested: "2 hours ago",
    isActive: true
  },
  {
    id: "2", 
    name: "Agent 02",
    description: "Sales outreach and lead qualification with personalized messaging",
    category: "Sales",
    status: "Active",
    lastTested: "4 hours ago", 
    isActive: true
  },
  {
    id: "3",
    name: "Agent 03",
    description: "Meeting coordination and calendar management with smart scheduling",
    category: "Productivity",
    status: "In Testing",
    lastTested: "1 day ago",
    isActive: false
  }
];

export default async function AgentsPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }
  
  return (
    <div className="max-w-6xl mx-auto">


      {/* Stats */}
      <div className="grid grid-cols-3 gap-8 mb-12">
        <div className="space-y-2">
          <div className="text-2xl font-light">{AGENTS.length}</div>
          <div className="text-sm text-muted-foreground">Total Agents</div>
        </div>
        <div className="space-y-2">
          <div className="text-2xl font-light text-green-500">
            {AGENTS.filter(a => a.isActive).length}
          </div>
          <div className="text-sm text-muted-foreground">Active</div>
        </div>
        <div className="space-y-2">
          <div className="text-2xl font-light text-red-500">
            {AGENTS.filter(a => !a.isActive).length}
          </div>
          <div className="text-sm text-muted-foreground">In Testing</div>
        </div>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {AGENTS.map((agent) => (
          <Card key={agent.id} className="group border-border bg-card hover:bg-accent/5 transition-colors duration-200">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <Bot className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-medium">{agent.name}</CardTitle>
                    <div className="text-xs text-muted-foreground mt-1">{agent.category}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Circle 
                    className={`h-2 w-2 fill-current ${
                      agent.isActive ? 'text-green-500' : 'text-red-500'
                    }`} 
                  />
                  <span className="text-xs text-muted-foreground">
                    {agent.status}
                  </span>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <CardDescription className="text-sm text-muted-foreground leading-relaxed">
                {agent.description}
              </CardDescription>
              
              <div className="text-xs text-muted-foreground">
                Last tested: {agent.lastTested}
              </div>
              
              <div className="flex gap-2 pt-2">
                <Link href={`/agents/${agent.id}`} className="flex-1">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full border-border hover:bg-accent hover:text-accent-foreground"
                  >
                    View
                  </Button>
                </Link>
                <Link href={`/agents/${agent.id}/runs/new`}>
                  <Button 
                    size="sm" 
                    className="bg-red-600 hover:bg-red-700 text-white border-0"
                  >
                    Test
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add New Agent */}
      <div className="mt-12 pt-8 border-t border-border">
        <Link href="/agents/new">
          <Button
            variant="outline"
            className="w-full h-16 border-dashed border-border hover:bg-accent/5 hover:border-accent-foreground/20"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Agent
          </Button>
        </Link>
      </div>
    </div>
    
  );
}