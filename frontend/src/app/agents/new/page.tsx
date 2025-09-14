"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { useAgent } from "~/contexts/agent-context";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { IconRobot } from "@tabler/icons-react";

export default function NewAgentPage() {
  const router = useRouter();
  const { refreshAgents, setSelectedAgent, agents } = useAgent();

  // Agent creation form state
  const [agentName, setAgentName] = useState("");
  const [defensePrompt, setDefensePrompt] = useState("");
  const [attackPrompt, setAttackPrompt] = useState("");
  const [iterations, setIterations] = useState(5);

  // Submission control state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // tRPC mutation for creating agent
  const createAgent = api.agent.create.useMutation({
    onSuccess: async (data) => {
      setIsSubmitting(false);
      alert(`Agent "${agentName}" created successfully!`);

      // Reset form
      setAgentName("");
      setDefensePrompt("");
      setAttackPrompt("");
      setIterations(5);

      // Refresh agents list to include the new agent
      await refreshAgents();

      // Auto-select the newly created agent
      // The data should contain the agent ID
      if (data && typeof data === 'object' && 'id' in data) {
        // Wait a bit for the agents context to update
        setTimeout(() => {
          const newAgent = agents.find(a => a.id === data.id);
          if (newAgent) {
            setSelectedAgent(newAgent);
          }
        }, 100);

        // Redirect to the new agent's runs page
        router.push(`/agents/${data.id}/runs`);
      } else {
        router.push("/agents");
      }
    },
    onError: (error) => {
      setIsSubmitting(false);
      console.error("Failed to create agent:", error);
      alert("Failed to create agent. Please try again.");
    },
  });

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent duplicate submissions
    if (isSubmitting || createAgent.isPending) {
      return;
    }

    // Validate required fields
    if (!agentName || !defensePrompt || !attackPrompt || iterations < 1) {
      alert("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);

    createAgent.mutate({
      name: agentName,
      objective: attackPrompt, // Use attack prompt as objective
      defensePrompt,
      iterations,
    });
  };

  const handleCancel = () => {
    router.push("/agents");
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header with back button */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Agents
        </Button>
      </div>

      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Create a New Agent</h1>
        <p className="text-muted-foreground mt-2">
          Create a simple agent for red team testing with basic configuration
        </p>
      </div>

      {/* Agent Creation Form */}
      <form onSubmit={handleCreateAgent} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconRobot className="h-5 w-5" />
              Agent Configuration
            </CardTitle>
            <CardDescription>
              Configure your agent with the essential settings for red team testing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="agentName">Test Name *</Label>
                <Input
                  id="agentName"
                  placeholder="e.g., Safety Test v1.0"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="iterations">Number of Iterations *</Label>
                <Input
                  id="iterations"
                  type="number"
                  placeholder="5"
                  min="1"
                  max="20"
                  value={iterations}
                  onChange={(e) => setIterations(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="defensePrompt">Defense Prompt *</Label>
              <textarea
                id="defensePrompt"
                placeholder="You are a helpful assistant that follows safety guidelines..."
                value={defensePrompt}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDefensePrompt(e.target.value)}
                rows={3}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="attackPrompt">Attack Prompt *</Label>
              <textarea
                id="attackPrompt"
                placeholder="Test prompt or objective for jailbreaking..."
                value={attackPrompt}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAttackPrompt(e.target.value)}
                rows={3}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visual:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!agentName || !defensePrompt || !attackPrompt || iterations < 1 || isSubmitting || createAgent.isPending}
          >
            {(isSubmitting || createAgent.isPending) ? "Creating..." : "Create Agent"}
          </Button>
        </div>
      </form>
    </div>
  );
}