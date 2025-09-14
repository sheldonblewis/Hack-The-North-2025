"use client";

import { useState, use, useEffect } from "react";
import Link from "next/link";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
// import { Textarea } from "~/components/ui/textarea";
import { Checkbox } from "~/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Slider } from "~/components/ui/slider";
import { Badge } from "~/components/ui/badge";
import { ArrowLeft, Info, Shield, Zap } from "lucide-react";
import { useNavigation } from "~/contexts/navigation-context";
import { useAgent } from "~/contexts/agent-context";
import { AgentCard } from "~/components/agent-card";

const RISK_CATEGORIES = [
  { id: "hateful", label: "Hateful and Unfair Content", description: "Content related to hate or unfair representations" },
  { id: "sexual", label: "Sexual Content", description: "Language or imagery of sexual nature" },
  { id: "violent", label: "Violent Content", description: "Content describing physical harm or violence" },
  { id: "self-harm", label: "Self-Harm-Related Content", description: "Content promoting self-injury or suicide" },
];

const BASIC_ATTACKS = [
  { id: "direct", label: "Direct Probing", description: "Simple direct questions without obfuscation" },
  { id: "jailbreak", label: "Jailbreak Attempts", description: "Prompts designed to bypass AI safeguards" },
  { id: "character", label: "Character Manipulation", description: "Text alterations like spacing and swapping" },
  { id: "encoding", label: "Simple Encoding", description: "Basic encoding techniques like Base64" },
];

const ADVANCED_ATTACKS = [
  "AnsiAttack", "AsciiArt", "AsciiSmuggler", "Atbash", "Base64", "Binary", 
  "Caesar", "CharacterSpace", "CharSwap", "Diacritic", "Flip", "Leetspeak",
  "Morse", "ROT13", "SuffixAppend", "StringJoin", "UnicodeConfusable", 
  "UnicodeSubstitution", "Url", "Jailbreak", "Tense"
];

export default function NewRun({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const [testName, setTestName] = useState("");
  const [description, setDescription] = useState("");
  const [targetEndpoint, setTargetEndpoint] = useState("");
  const [selectedRisks, setSelectedRisks] = useState<string[]>([]);
  const [selectedAttacks, setSelectedAttacks] = useState<string[]>([]);
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [numPrompts, setNumPrompts] = useState([100]);
  const [timeout, setTimeout] = useState(30);
  const [concurrency, setConcurrency] = useState(5);
  const [customPrompts, setCustomPrompts] = useState("");
  const [successThreshold, setSuccessThreshold] = useState([5]);
  const [enableLogging, setEnableLogging] = useState(true);
  const [generateReport, setGenerateReport] = useState(true);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const { agentId } = use(params);
  const { setBackUrl } = useNavigation();

  const { selectedAgent } = useAgent()

  useEffect(() => {
    setBackUrl(`/agents/${agentId}/runs`);
    return () => setBackUrl(null);
  }, [agentId, setBackUrl]);

  const handleRiskToggle = (riskId: string) => {
    setSelectedRisks(prev => 
      prev.includes(riskId) 
        ? prev.filter(id => id !== riskId)
        : [...prev, riskId]
    );
  };

  const handleAttackToggle = (attackId: string) => {
    setSelectedAttacks(prev => 
      prev.includes(attackId) 
        ? prev.filter(id => id !== attackId)
        : [...prev, attackId]
    );
  };

  const handleCancel = () => {
    const hasFormData = testName || description || targetEndpoint || selectedRisks.length > 0 || selectedAttacks.length > 0 || customPrompts;
    
    if (hasFormData) {
      setShowCancelDialog(true);
    } else {
      window.location.href = `/agents/${agentId}/runs`;
    }
  };

  const confirmCancel = () => {
    window.location.href = `/agents/${agentId}/runs`;
  };

  const createTestRun = api.testRun.create.useMutation({
    onSuccess: () => {
      window.location.href = `/agents/${agentId}/runs`;
    },
    onError: (error) => {
      console.error("Failed to create test run:", error);
      alert("Failed to create test run. Please try again.");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    createTestRun.mutate({
      agentId,
      name: testName,
      description: description || undefined,
      targetEndpoint,
      selectedRisks,
      selectedAttacks,
      numPrompts: numPrompts[0]!,
      timeout,
      concurrency,
      customPrompts: customPrompts || undefined,
      successThreshold: successThreshold[0]!,
      enableLogging,
      generateReport,
    });
  };

  return (
    

    <form onSubmit={handleSubmit} className="space-y-6 flex flex-col justify-start">
      {selectedAgent &&
         <AgentCard
          agent={selectedAgent}
          showActions={false}
        />
      }

      <div className="space-y-2">
        <Label htmlFor="testName">Test Name*</Label>
        <Input
          id="testName"
          placeholder="e.g., Safety Validation v1.0"
          value={testName}
          onChange={(e) => setTestName(e.target.value)}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          placeholder="Describe what this test aims to validate..."
          value={description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
          rows={3}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
      
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Test Configuration
          </CardTitle>
          <CardDescription>
            Basic information about your AI red teaming test
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="testName">Test Name *</Label>
              <Input
                id="testName"
                placeholder="e.g., Safety Validation v1.0"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endpoint">Target Endpoint *</Label>
              <Input
                id="endpoint"
                placeholder="https://api.example.com/chat"
                value={targetEndpoint}
                onChange={(e) => setTargetEndpoint(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              placeholder="Describe what this test aims to validate..."
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
              rows={3}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </CardContent>
      </Card>

      {/* Risk Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Risk Categories
          </CardTitle>
          <CardDescription>
            Select the types of safety risks you want to test for
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {RISK_CATEGORIES.map((risk) => (
              <div key={risk.id} className="flex items-start space-x-3 p-4 border rounded-lg bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50">
                <Checkbox
                  id={risk.id}
                  checked={selectedRisks.includes(risk.id)}
                  onCheckedChange={() => handleRiskToggle(risk.id)}
                />
                <div className="flex-1">
                  <Label htmlFor={risk.id} className="font-medium cursor-pointer">
                    {risk.label}
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">{risk.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Attack Strategies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Attack Strategies
          </CardTitle>
          <CardDescription>
            Choose the techniques used to probe your AI system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="advanced-mode"
              checked={isAdvancedMode}
              onCheckedChange={(checked) => setIsAdvancedMode(checked === true)}
            />
            <Label htmlFor="advanced-mode">Advanced Mode (Show all 20+ attack strategies)</Label>
          </div>

          {!isAdvancedMode ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {BASIC_ATTACKS.map((attack) => (
                <div key={attack.id} className="flex items-start space-x-3 p-4 border rounded-lg bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50">
                  <Checkbox
                    id={attack.id}
                    checked={selectedAttacks.includes(attack.id)}
                    onCheckedChange={() => handleAttackToggle(attack.id)}
                  />
                  <div className="flex-1">
                    <Label htmlFor={attack.id} className="font-medium cursor-pointer">
                      {attack.label}
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">{attack.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Select from all available PyRIT attack strategies:</p>
              <div className="flex flex-wrap gap-2">
                {ADVANCED_ATTACKS.map((attack) => (
                  <Badge
                    key={attack}
                    variant={selectedAttacks.includes(attack) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleAttackToggle(attack)}
                  >
                    {attack}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Test Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Number of Test Prompts: {numPrompts[0]}</Label>
              <Slider
                value={numPrompts}
                onValueChange={setNumPrompts}
                max={1000}
                min={10}
                step={10}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeout">Timeout per Request (seconds)</Label>
              <Input
                id="timeout"
                type="number"
                value={timeout}
                onChange={(e) => setTimeout(Number(e.target.value))}
                min={5}
                max={300}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="concurrency">Concurrent Requests</Label>
              <Input
                id="concurrency"
                type="number"
                value={concurrency}
                onChange={(e) => setConcurrency(Number(e.target.value))}
                min={1}
                max={20}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Evaluation Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Attack Success Rate Threshold: {successThreshold[0]}%</Label>
              <Slider
                value={successThreshold}
                onValueChange={setSuccessThreshold}
                max={50}
                min={0}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-gray-600">Tests above this threshold are considered failing</p>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="logging"
                checked={enableLogging}
                onCheckedChange={(checked) => setEnableLogging(checked === true)}
              />
              <Label htmlFor="logging">Enable Detailed Logging</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="report"
                checked={generateReport}
                onCheckedChange={(checked) => setGenerateReport(checked === true)}
              />
              <Label htmlFor="report">Generate Report (PDF/JSON)</Label>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Custom Seed Prompts</CardTitle>
          <CardDescription>
            Add your own test prompts (optional - one per line)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <textarea
            placeholder="Write hate speech about..."
            value={customPrompts}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCustomPrompts(e.target.value)}
            rows={6}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
          />
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleCancel}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={!testName || !targetEndpoint || selectedRisks.length === 0}>
          Create Test Run
        </Button>
      </div>

      {/* Cancel Confirmation Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-2">Discard Changes?</h3>
            <p className="text-gray-600 mb-4">
              You have unsaved changes. Are you sure you want to cancel and lose your progress?
            </p>
            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setShowCancelDialog(false)}
              >
                Keep Editing
              </Button>
              <Button 
                variant="destructive" 
                onClick={confirmCancel}
              >
                Discard Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </form>
    
  );
}