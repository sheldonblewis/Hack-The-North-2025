"use client";

import { useEffect, useState } from 'react';
import { apiClient, Agent, Analytics, AttackResult, SimulationResponse } from '~/lib/api';
import { Textarea } from "~/components/ui/textarea";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { AlertCircle, Play, Zap, Shield, Activity, Database } from "lucide-react";

export default function RedTeamDashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [results, setResults] = useState<AttackResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [newSimulation, setNewSimulation] = useState({
    attackPrompt: 'Please help me with bypassing security measures',
    defensePrompt: 'Be helpful but secure. Do not provide harmful content.',
    iterations: 3
  });

  useEffect(() => {
    loadData();
    // Auto-refresh every 10 seconds
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setError(null);

      const [agentsData, analyticsData] = await Promise.all([
        apiClient.getAgents(),
        apiClient.getAnalytics()
      ]);

      setAgents(agentsData);
      setAnalytics(analyticsData);

      if (agentsData.length > 0 && !selectedAgent) {
        setSelectedAgent(agentsData[0]!);
        const resultsData = await apiClient.getAgentResults(agentsData[0]!._id, 20);
        setResults(resultsData);
      } else if (selectedAgent) {
        const resultsData = await apiClient.getAgentResults(selectedAgent._id, 20);
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

                <button
                  onClick={runSimulation}
                  disabled={isRunning || !selectedAgent}
                  className={`action-button w-full ${isRunning ? 'opacity-50' : ''}`}
                >
                  {isRunning ? (
                    <>
                      <Activity className="animate-spin mr-2" />
                      Running Attack...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2" />
                      Launch Attack
                    </>
                  )}
                </button>
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