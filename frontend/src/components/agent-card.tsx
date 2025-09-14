import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Bot, ArrowRight, Circle } from "lucide-react";
import type { Agent } from "~/types/agent";
import { cn } from "~/lib/utils";

interface AgentCardProps {
  agent: Agent;
  showActions?: boolean;
}

export function AgentCard({ agent, showActions = true }: AgentCardProps) {
  return (
    <Card
      className={cn(
        "border-border bg-card transition-colors duration-200 flex flex-col",
        showActions && "group hover:bg-accent/5"
      )}
    >
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* content */}
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
      
      <CardContent className="space-y-4 flex-1 flex flex-col">
        <CardDescription className="text-sm text-muted-foreground leading-relaxed">
          {agent.description}
        </CardDescription>
        
        <div className={`text-xs text-muted-foreground ${showActions ? 'flex-1' : ''}`}>
          Last tested: {agent.lastTested}
        </div>
        
        {showActions && (
          <div className="flex gap-2 pt-2 mt-auto">
            <Link href={`/agents/${agent.id}`} className="flex-1">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full border-border hover:bg-accent cursor-pointer hover:text-accent-foreground"
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
        )}
      </CardContent>
    </Card>
  );
}