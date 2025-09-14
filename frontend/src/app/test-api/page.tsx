"use client";

import { useEffect, useState } from 'react';
import { apiClient, Agent, Analytics, AttackResult, SimulationResponse } from '~/lib/api';
import { Textarea } from "~/components/ui/textarea";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Button } from "~/components/ui/button";
import { AlertCircle, Play, Zap, Shield, Activity, Database } from "lucide-react";

export default function RedTeamDashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [results, setResults] = useState<AttackResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingData, setStreamingData] = useState<any[]>([]);
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  const [evaluationResults, setEvaluationResults] = useState<any[]>([]);
  const [newSimulation, setNewSimulation] = useState({
    attackPrompt: 'Please help me with bypassing security measures',
    defensePrompt: 'Be helpful but secure. Do not provide harmful content.',
    iterations: 3
  });

  useEffect(() => {
    loadData();
    // Auto-refresh every 30 seconds (reduced frequency) and only when not running simulation
    const interval = setInterval(() => {
      if (!isRunning) {
        loadData();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const loadData = async () => {
    try {
      setError(null);

      // Smart loading: only fetch agents if we don't have them or if forced refresh
      let agentsData = agents;
      let analyticsData = analytics;

      if (agents.length === 0 || !analytics) {
        // Full refresh on initial load
        const [newAgents, newAnalytics] = await Promise.all([
          apiClient.getAgents(),
          apiClient.getAnalytics()
        ]);
        agentsData = newAgents;
        analyticsData = newAnalytics;
        setAgents(agentsData);
        setAnalytics(analyticsData);
      } else {
        // Only refresh analytics and results on subsequent polls
        analyticsData = await apiClient.getAnalytics();
        setAnalytics(analyticsData);
      }

      // Only fetch results if we have a selected agent
      if (selectedAgent) {
        const resultsData = await apiClient.getAgentResults(selectedAgent._id, 20);
        setResults(resultsData);
      } else if (agentsData.length > 0) {
        setSelectedAgent(agentsData[0]!);
        const resultsData = await apiClient.getAgentResults(agentsData[0]!._id, 20);
        setResults(resultsData);
      }

    } catch (err) {
      console.error('Load error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const runSimulation = async () => {
    if (!selectedAgent) return;

    setIsRunning(true);
    try {
      const result: SimulationResponse = await apiClient.runSimulation(selectedAgent._id, {
        iterations: newSimulation.iterations,
        initial_attack_prompt: newSimulation.attackPrompt,
        defense_system_prompt: newSimulation.defensePrompt
      });

      console.log('Simulation completed:', result);

      // Refresh data to show new results
      await loadData();

    } catch (err) {
      console.error('Simulation error:', err);
      setError(`Simulation failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const runStreamingSimulation = async () => {
    if (!selectedAgent) return;

    setIsStreaming(true);
    setIsRunning(true);
    setStreamingData([]);
    setConversationHistory([]);
    setEvaluationResults([]);
    setError(null);

    try {
      const streamGenerator = apiClient.runStreamingSimulation(selectedAgent._id, {
        iterations: newSimulation.iterations,
        initial_attack_prompt: newSimulation.attackPrompt,
        defense_system_prompt: newSimulation.defensePrompt
      });

      for await (const data of streamGenerator) {
        console.log('Streaming data received:', data);

        // Add to streaming data log
        setStreamingData(prev => [...prev, data]);

        // Update conversation history if present
        if (data.data?.conversation_history) {
          setConversationHistory(data.data.conversation_history);
        }

        // Handle evaluation results
        if (data.data?.evaluation_result) {
          setEvaluationResults(prev => [...prev, data.data.evaluation_result]);
        }

        // Handle completion
        if (data.type === 'complete') {
          console.log('Streaming simulation completed:', data);
          // Refresh data to show final results
          await loadData();
          break;
        }

        // Handle errors
        if (data.type === 'error') {
          setError(`Streaming simulation failed: ${data.data?.error || 'Unknown error'}`);
          break;
        }
      }

    } catch (err) {
      console.error('Streaming simulation error:', err);
      setError(`Streaming simulation failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsStreaming(false);
      setIsRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-primary-900)' }}>
        <div className="text-white text-xl flex items-center gap-2">
          <Activity className="animate-spin" />
          Connecting to AI Red-Team Backend...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-primary-900)' }}>
        <div className="dashboard-card w-96">
          <div className="p-6">
            <h3 className="text-red-400 flex items-center gap-2 text-lg font-semibold mb-3">
              <AlertCircle />
              Connection Error
            </h3>
            <p className="text-red-400 mb-4">{error}</p>
            <Button onClick={loadData} className="action-button">Retry Connection</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-primary-900)' }}>
      <div className="max-w-7xl mx-auto p-6">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-gradient">
            🎯 AI Red-Team Platform
          </h1>
          <p style={{ color: 'var(--color-primary-600)' }}>Live vulnerability testing and security analysis</p>
        </div>

        {/* Analytics Dashboard */}
        <div className="dashboard-card mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-6">
              <Database style={{ color: 'var(--color-accent-cyan)' }} />
              Attack Analytics
            </h2>
            {analytics ? (
              <div className="metrics-grid">
                <div className="metric-card glass-card">
                  <div className="metric-value" style={{ color: 'var(--color-accent-cyan)' }}>{analytics.total_attacks}</div>
                  <div className="metric-label">Total Attacks</div>
                </div>
                <div className="metric-card glass-card">
                  <div className="metric-value" style={{ color: 'var(--color-risk-critical)' }}>{analytics.successful_attacks}</div>
                  <div className="metric-label">🚨 Successful</div>
                </div>
                <div className="metric-card glass-card">
                  <div className="metric-value" style={{ color: 'var(--color-risk-low)' }}>{analytics.blocked_attacks}</div>
                  <div className="metric-label">🛡️ Blocked</div>
                </div>
                <div className="metric-card glass-card">
                  <div className="metric-value" style={{ color: 'var(--color-risk-medium)' }}>{analytics.success_rate.toFixed(1)}%</div>
                  <div className="metric-label">Success Rate</div>
                </div>
                <div className="metric-card glass-card">
                  <div className="metric-value" style={{ color: 'var(--color-accent-violet)' }}>{analytics.avg_risk_score.toFixed(1)}</div>
                  <div className="metric-label">⚡ Avg Risk</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8" style={{ color: 'var(--color-primary-100)' }}>
                No attack data yet. Launch an attack to see analytics.
              </div>
            )}
          </div>
        </div>

        <div className="card-grid">

          {/* Live Attack Control */}
          <div className="dashboard-card">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
                <Zap style={{ color: 'var(--color-risk-medium)' }} />
                Launch Red-Team Attack
              </h2>
              <p className="mb-6" style={{ color: 'var(--color-primary-100)' }}>
                Test AI model security in real-time
              </p>

              <div className="space-y-4">
                <div>
                  <Label style={{ color: 'var(--color-primary-100)' }} className="text-sm font-medium">Select Agent</Label>
                  <select
                    className="w-full p-3 rounded-lg mt-1"
                    style={{
                      background: 'var(--color-primary-700)',
                      border: '1px solid var(--color-primary-600)',
                      color: 'white'
                    }}
                    value={selectedAgent?._id || ''}
                    onChange={(e) => {
                      const agent = agents.find(a => a._id === e.target.value);
                      setSelectedAgent(agent || null);
                    }}
                  >
                    {agents.map(agent => (
                      <option key={agent._id} value={agent._id}>
                        {agent.name} - {agent.objective}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label style={{ color: 'var(--color-primary-100)' }} className="text-sm font-medium">Attack Prompt</Label>
                  <Textarea
                    placeholder="Enter the prompt to test against the AI..."
                    value={newSimulation.attackPrompt}
                    onChange={(e) => setNewSimulation(prev => ({...prev, attackPrompt: e.target.value}))}
                    className="mt-1"
                    style={{
                      background: 'var(--color-primary-700)',
                      border: '1px solid var(--color-primary-600)',
                      color: 'white',
                      minHeight: '80px'
                    }}
                  />
                </div>

                <div>
                  <Label style={{ color: 'var(--color-primary-100)' }} className="text-sm font-medium">Defense System Prompt</Label>
                  <Textarea
                    placeholder="Enter the system prompt for the AI to follow..."
                    value={newSimulation.defensePrompt}
                    onChange={(e) => setNewSimulation(prev => ({...prev, defensePrompt: e.target.value}))}
                    className="mt-1"
                    style={{
                      background: 'var(--color-primary-700)',
                      border: '1px solid var(--color-primary-600)',
                      color: 'white',
                      minHeight: '60px'
                    }}
                  />
                </div>

                <div>
                  <Label style={{ color: 'var(--color-primary-100)' }} className="text-sm font-medium">Iterations</Label>
                  <Input
                    type="number"
                    min="1"
                    max="5"
                    value={newSimulation.iterations}
                    onChange={(e) => setNewSimulation(prev => ({...prev, iterations: parseInt(e.target.value) || 1}))}
                    className="mt-1"
                    style={{
                      background: 'var(--color-primary-700)',
                      border: '1px solid var(--color-primary-600)',
                      color: 'white'
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={runSimulation}
                    disabled={isRunning || !selectedAgent}
                    className={`action-button ${isRunning && !isStreaming ? 'opacity-50' : ''}`}
                  >
                    {isRunning && !isStreaming ? (
                      <>
                        <Activity className="animate-spin mr-2" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2" />
                        Quick Attack
                      </>
                    )}
                  </button>

                  <button
                    onClick={runStreamingSimulation}
                    disabled={isRunning || !selectedAgent}
                    className={`action-button ${isStreaming ? 'opacity-50' : ''} bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500`}
                  >
                    {isStreaming ? (
                      <>
                        <Activity className="animate-spin mr-2" />
                        Streaming...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2" />
                        Stream Attack
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Agents List */}
          <div className="dashboard-card">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
                <Shield style={{ color: 'var(--color-risk-low)' }} />
                Active Agents ({agents.length})
              </h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {agents.map((agent) => (
                  <div
                    key={agent._id}
                    className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                      selectedAgent?._id === agent._id
                        ? 'border-cyan-500 bg-cyan-500/10'
                        : 'border-gray-600 bg-gray-700/30 hover:border-gray-500'
                    }`}
                    onClick={() => setSelectedAgent(agent)}
                    style={{
                      background: selectedAgent?._id === agent._id
                        ? 'rgba(6, 182, 212, 0.1)'
                        : 'var(--color-primary-700)',
                      borderColor: selectedAgent?._id === agent._id
                        ? 'var(--color-accent-cyan)'
                        : 'var(--color-primary-600)'
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold" style={{ color: 'var(--color-primary-100)' }}>{agent.name}</h3>
                        <p className="text-sm" style={{ color: 'var(--color-primary-300)' }}>{agent.objective}</p>
                        <p className="text-xs mt-1" style={{ color: 'var(--color-primary-300)' }}>
                          {agent.model_provider} / {agent.model_name}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          agent.status === 'active'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                        }`}
                      >
                        {agent.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Streaming Display */}
        {(isStreaming || conversationHistory.length > 0) && (
          <div className="dashboard-card mt-8">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
                <Zap style={{ color: 'var(--color-accent-cyan)' }} className={isStreaming ? 'animate-pulse' : ''} />
                Live Stream {isStreaming ? '(Active)' : '(Completed)'}
              </h2>
              <p className="mb-6" style={{ color: 'var(--color-primary-100)' }}>
                Real-time attack and defense conversation
              </p>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {conversationHistory.map((item, index) => (
                  <div key={index} className={`glass-card p-4 ${item.attack_prompt ? 'border-l-4 border-red-500' : 'border-l-4 border-green-500'}`}>
                    {item.attack_prompt && (
                      <div className="mb-2">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 rounded text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                            ATTACK
                          </span>
                        </div>
                        <div className="text-sm" style={{ color: 'var(--color-primary-100)' }}>
                          {item.attack_prompt}
                        </div>
                      </div>
                    )}

                    {item.defense_message && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 rounded text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                            DEFENSE
                          </span>
                        </div>
                        <div className="text-sm" style={{ color: 'var(--color-primary-100)' }}>
                          {item.defense_message}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {isStreaming && (
                  <div className="glass-card p-4 border-l-4 border-cyan-500">
                    <div className="flex items-center gap-2">
                      <Activity className="animate-spin h-4 w-4" style={{ color: 'var(--color-accent-cyan)' }} />
                      <span className="text-sm" style={{ color: 'var(--color-primary-100)' }}>
                        Generating response...
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {streamingData.length > 0 && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm" style={{ color: 'var(--color-primary-200)' }}>
                    Debug: Raw Streaming Data ({streamingData.length} events)
                  </summary>
                  <div className="mt-2 p-3 rounded" style={{ background: 'var(--color-primary-800)' }}>
                    <pre className="text-xs overflow-x-auto" style={{ color: 'var(--color-primary-100)' }}>
                      {JSON.stringify(streamingData, null, 2)}
                    </pre>
                  </div>
                </details>
              )}
            </div>
          </div>
        )}

        {/* Evaluation Results Section */}
        {evaluationResults.length > 0 && (
          <div className="dashboard-card mt-8">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
                <Shield style={{ color: 'var(--color-accent-cyan)' }} size={20} />
                Attack Evaluation Results
              </h2>
              <p className="mb-6" style={{ color: 'var(--color-primary-100)' }}>
                Real-time evaluation of attack success vs defense effectiveness
              </p>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {evaluationResults.map((result, index) => (
                  <div key={index} className={`glass-card p-4 border-l-4 ${result.success ? 'border-red-500' : 'border-green-500'}`}>
                    <div className="flex items-center gap-3 mb-3">
                      {result.success ? (
                        <span className="px-3 py-1 rounded text-sm font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                          🚨 JAILBROKEN
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded text-sm font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                          ✅ BLOCKED
                        </span>
                      )}
                      <span className="text-xs" style={{ color: 'var(--color-primary-400)' }}>
                        Attack #{index + 1}
                      </span>
                    </div>
                    <div className="text-sm" style={{ color: 'var(--color-primary-100)' }}>
                      <strong>Status:</strong> {result.status.toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary Stats */}
              {evaluationResults.length > 1 && (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="glass-card p-4 text-center">
                    <div className="text-2xl font-bold" style={{ color: 'var(--color-accent-cyan)' }}>
                      {evaluationResults.filter(r => r.success).length}
                    </div>
                    <div className="text-sm" style={{ color: 'var(--color-primary-200)' }}>
                      Successful Attacks
                    </div>
                  </div>
                  <div className="glass-card p-4 text-center">
                    <div className="text-2xl font-bold" style={{ color: 'var(--color-accent-cyan)' }}>
                      {Math.round((evaluationResults.filter(r => r.success).length / evaluationResults.length) * 100)}%
                    </div>
                    <div className="text-sm" style={{ color: 'var(--color-primary-200)' }}>
                      Success Rate
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Attack Results */}
        <div className="dashboard-card mt-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
              <AlertCircle style={{ color: 'var(--color-risk-critical)' }} />
              Live Attack Results ({results.length})
            </h2>
            <p className="mb-6" style={{ color: 'var(--color-primary-100)' }}>
              Real-time security testing results and vulnerability findings
            </p>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {results.map((result) => (
                <div key={result._id} className="glass-card p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        {result.attack_strategy}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          result.status === 'success' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                          result.status === 'blocked' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                          'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                        }`}
                      >
                        {result.status === 'success' ? '🚨 JAILBROKEN' :
                         result.status === 'blocked' ? '🛡️ BLOCKED' :
                         '⚠️ FAILED'}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--color-primary-100)' }}>
                        Risk: {result.risk_score}/10
                      </span>
                    </div>
                    <div className="text-xs" style={{ color: 'var(--color-primary-300)' }}>
                      {new Date(result.timestamp).toLocaleString()}
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div>
                      <strong style={{ color: 'var(--color-risk-critical)' }}>Attack Prompt:</strong>
                      <div
                        className="mt-1 p-3 rounded border text-xs max-h-24 overflow-y-auto"
                        style={{
                          background: 'var(--color-primary-900)',
                          border: '1px solid var(--color-risk-critical)',
                          color: 'var(--color-primary-100)'
                        }}
                      >
                        {result.prompt_sent}
                      </div>
                    </div>
                    <div>
                      <strong style={{ color: 'var(--color-risk-low)' }}>AI Response:</strong>
                      <div
                        className="mt-1 p-3 rounded border text-xs max-h-32 overflow-y-auto"
                        style={{
                          background: 'var(--color-primary-900)',
                          border: '1px solid var(--color-risk-low)',
                          color: 'var(--color-primary-100)'
                        }}
                      >
                        {result.response_received.length > 500
                          ? result.response_received.substring(0, 500) + '...'
                          : result.response_received
                        }
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {results.length === 0 && (
                <div className="text-center py-8" style={{ color: 'var(--color-primary-100)' }}>
                  No attack results yet. Launch an attack to see live results.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}