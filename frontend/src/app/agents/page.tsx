"use client";

import { Card, CardContent } from "~/components/ui/card";
import { Plus } from "lucide-react";
import { useAgent } from "~/contexts/agent-context";
import { AgentCard } from "~/components/agent-card";

function AgentsContent() {
  const { agents } = useAgent();

  return (
    <div className="max-w-6xl mx-auto">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-8 mb-12">
        <div className="space-y-2">
          <div className="text-2xl font-light">{agents.length}</div>
          <div className="text-sm text-muted-foreground">Total Agents</div>
        </div>
        <div className="space-y-2">
          <div className="text-2xl font-light text-green-500">
            {agents.filter(a => a.isActive).length}
          </div>
          <div className="text-sm text-muted-foreground">Active</div>
        </div>
        <div className="space-y-2">
          <div className="text-2xl font-light text-red-500">
            {agents.filter(a => !a.isActive).length}
          </div>
          <div className="text-sm text-muted-foreground">In Testing</div>
        </div>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
        
        {/* Add New Agent Card */}
        <Card className="group h-full flex py-12 flex-col border-dashed border-border hover:bg-accent/5 hover:border-accent-foreground/20 transition-colors duration-200 cursor-pointer">
          <CardContent className="flex flex-col items-center justify-center flex-1 p-8">
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center mb-4 group-hover:border-accent-foreground/50 transition-colors">
              <Plus className="h-6 w-6 text-muted-foreground group-hover:text-accent-foreground transition-colors" />
            </div>
            <div className="text-center">
              <div className="font-medium text-muted-foreground group-hover:text-accent-foreground transition-colors mb-1">
                Add New Agent
              </div>
              <div className="text-sm text-muted-foreground/70">
                Create a new AI agent for testing
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AgentsPage() {
  return <AgentsContent />;
}