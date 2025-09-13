"use client";

import { useState, use } from "react";
import Link from "next/link";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
// import { Textarea } from "~/components/ui/textarea";
import { Checkbox } from "~/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Slider } from "~/components/ui/slider";
import { Badge } from "~/components/ui/badge";
import { ArrowLeft, Info, Shield, Zap } from "lucide-react";

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

  const { agentId } = use(params);

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
    <main className="min-h-screen p-6 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href={`/agents/${agentId}/runs`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Runs
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create New Test Run</h1>
            <p className="text-gray-600">Agent ID: {agentId}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="risks">Risk Categories</TabsTrigger>
              <TabsTrigger value="attacks">Attack Strategies</TabsTrigger>
              <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
            </TabsList>

            {/* Basic Information */}
            <TabsContent value="basic" className="space-y-4">
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
            </TabsContent>

            {/* Risk Categories */}
            <TabsContent value="risks" className="space-y-4">
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
                      <div key={risk.id} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-slate-50">
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
            </TabsContent>

            {/* Attack Strategies */}
            <TabsContent value="attacks" className="space-y-4">
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
                        <div key={attack.id} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-slate-50">
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
            </TabsContent>

            {/* Advanced Settings */}
            <TabsContent value="advanced" className="space-y-4">
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
            </TabsContent>
          </Tabs>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Link href={`/agents/${agentId}/runs`}>
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" disabled={!testName || !targetEndpoint || selectedRisks.length === 0}>
              Create Test Run
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}