"use client";

import { useState, useEffect, use, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Progress } from "~/components/ui/progress";
import { ArrowLeft, Play, Square, AlertTriangle, CheckCircle, XCircle, Bot, Shield, Clock, Activity } from "lucide-react";
import { useAgent } from "~/contexts/agent-context";
import { AgentCard } from "~/components/agent-card";
import { apiClient } from "~/lib/api";
import {
  ChatMessage,
  StreamingData,
  ConversationStats,
  transformStreamingToMessages,
  calculateStats,
  getFlagColor
} from '~/lib/chat-utils';


export default function SimulationResults({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { selectedAgent } = useAgent();

  const [isSimulating, setIsSimulating] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  const [evaluationResults, setEvaluationResults] = useState<any[]>([]);
  const [streamingData, setStreamingData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ConversationStats>({
    totalExchanges: 0,
    successfulJailbreaks: 0,
    successRate: 0,
    attackTypes: { jailbreakAttempts: 0, promptInjection: 0, rolePlaying: 0 },
    threatLevels: { high: 0, medium: 0, low: 0 }
  });
  const [progress, setProgress] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get simulation config from URL params
  const configParam = searchParams?.get('config');
  const testName = searchParams?.get('testName') || 'Untitled Test';
  const description = searchParams?.get('description') || '';
  const selectedRisk = searchParams?.get('selectedRisk') || '';

  const config = configParam ? JSON.parse(configParam) : null;

  // Add scroll to bottom effect
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Run the streaming simulation
  const runStreamingSimulation = async () => {
    if (!selectedAgent || !config || isSimulating) return;

    setIsSimulating(true);
    setMessages([]);
    setConversationHistory([]);
    setEvaluationResults([]);
    setStreamingData([]);
    setError(null);
    setProgress(0);

    try {
      const streamGenerator = apiClient.runStreamingSimulation(selectedAgent.id, {
        iterations: config.iterations,
        initial_attack_prompt: config.initial_attack_prompt,
        defense_system_prompt: config.defense_system_prompt
      });

      for await (const data of streamGenerator) {
        // Add to streaming data log for debugging
        setStreamingData(prev => [...prev, data]);

        // Update progress based on iterations or message count
        if (data.data?.current_iteration && config.iterations) {
          const progressPercent = (data.data.current_iteration / config.iterations) * 100;
          setProgress(progressPercent);
        } else if (conversationHistory.length > 0 && config.iterations) {
          // Estimate progress from conversation length
          const progressPercent = Math.min((conversationHistory.length / (config.iterations * 2)) * 100, 95);
          setProgress(progressPercent);
        }

        // Update conversation history
        if (data.data?.conversation_history && Array.isArray(data.data.conversation_history) && data.data.conversation_history.length > 0) {
          const newConversationHistory = data.data.conversation_history;
          setConversationHistory(newConversationHistory);

          // Transform messages using current evaluation results
          setEvaluationResults(currentEvaluationResults => {
            const chatMessages = transformStreamingToMessages(
              newConversationHistory,
              currentEvaluationResults
            );
            setMessages(chatMessages);
            setStats(calculateStats(chatMessages));
            return currentEvaluationResults;
          });
        }

        // Handle evaluation results
        if (data.data?.evaluation_result) {
          setEvaluationResults(prev => {
            const newResults = [...prev, data.data.evaluation_result];

            // Update messages with latest evaluation using current conversation history
            setConversationHistory(currentConversationHistory => {
              if (currentConversationHistory.length > 0) {
                const updatedMessages = transformStreamingToMessages(
                  currentConversationHistory,
                  newResults
                );
                setMessages(updatedMessages);
                setStats(calculateStats(updatedMessages));
              }
              return currentConversationHistory;
            });

            return newResults;
          });
        }

        // Handle completion or auto-complete based on iterations
        if (data.type === 'complete' || (config.iterations && stats.totalExchanges >= config.iterations)) {
          setProgress(100);
          break;
        }

        // Handle errors
        if (data.type === 'error') {
          setError(`Simulation failed: ${data.data?.error || 'Unknown error'}`);
          break;
        }
      }

    } catch (err) {
      console.error('Streaming simulation error:', err);
      setError(`Simulation failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSimulating(false);
    }
  };

  // Auto-start simulation on page load
  useEffect(() => {
    if (config && selectedAgent && !isSimulating) {
      runStreamingSimulation();
    }
  }, [config, selectedAgent]);

  // Add timeout to stop infinite simulations
  useEffect(() => {
    if (isSimulating) {
      const timeout = setTimeout(() => {
        setIsSimulating(false);
        setError('Simulation timed out after 5 minutes');
      }, 5 * 60 * 1000); // 5 minutes

      return () => clearTimeout(timeout);
    }
  }, [isSimulating]);

  if (!config) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Invalid Configuration</h1>
          <p className="text-gray-600 mt-2">No simulation configuration found.</p>
          <Button onClick={() => router.back()} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex items-center space-x-2">
          {isSimulating && (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-gray-600">Running simulation...</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsSimulating(false)}
                className="ml-4"
              >
                <Square className="h-4 w-4 mr-2" />
                Stop
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Agent Card */}
      {selectedAgent && (
        <AgentCard agent={selectedAgent} showActions={false} />
      )}

      {/* Test Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{testName}</span>
            <div className="flex items-center space-x-2">
              <Badge variant={selectedRisk === 'custom' ? 'default' : 'secondary'}>
                {selectedRisk === 'custom' ? 'Custom Attack' : selectedRisk}
              </Badge>
              {isSimulating ? (
                <Play className="h-4 w-4 text-blue-600" />
              ) : error ? (
                <XCircle className="h-4 w-4 text-red-600" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
            </div>
          </CardTitle>
          {description && (
            <p className="text-sm text-gray-600">{description}</p>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Progress */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.totalExchanges}</div>
                <div className="text-sm text-gray-600">Total Exchanges</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.successfulJailbreaks}</div>
                <div className="text-sm text-gray-600">Successful Jailbreaks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.totalExchanges - stats.successfulJailbreaks}</div>
                <div className="text-sm text-gray-600">Blocked</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{Math.round(stats.successRate)}%</div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-800">Simulation Error</h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat Interface */}
      {messages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Live Conversation</span>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3 px-4 py-2 rounded-lg" style={{ backgroundColor: 'var(--color-risk-critical, #ef4444)15', border: '2px solid var(--color-risk-critical, #ef4444)30' }}>
                  <Bot className="h-5 w-5" style={{ color: 'var(--color-risk-critical, #ef4444)' }} />
                  <span className="font-semibold text-sm">Attack Agent</span>
                </div>
                <div className="text-gray-400 font-bold text-lg">vs</div>
                <div className="flex items-center gap-3 px-4 py-2 rounded-lg" style={{ backgroundColor: 'var(--color-accent-cyan, #06b6d4)15', border: '2px solid var(--color-accent-cyan, #06b6d4)30' }}>
                  <Shield className="h-5 w-5" style={{ color: 'var(--color-accent-cyan, #06b6d4)' }} />
                  <span className="font-semibold text-sm">Defense Agent</span>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6 max-h-96 overflow-y-auto">
              <AnimatePresence>
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className={`flex ${message.role === 'defender' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[75%] ${message.role === 'defender' ? 'order-2' : 'order-1'}`}>
                      {/* Agent Avatar & Name */}
                      <div className={`flex items-center gap-3 mb-3 ${
                        message.role === 'defender' ? 'justify-end' : 'justify-start'
                      }`}>
                        {message.role === 'attacker' && <Bot className="h-4 w-4" style={{ color: 'var(--color-risk-critical, #ef4444)' }} />}
                        <span className={`text-sm font-semibold ${
                          message.role === 'attacker' ? 'text-red-600' : 'text-blue-600'
                        }`}>
                          {message.role === 'attacker' ? 'Attack Agent' : 'Defense Agent'}
                        </span>
                        {message.role === 'defender' && <Shield className="h-4 w-4" style={{ color: 'var(--color-accent-cyan, #06b6d4)' }} />}
                      </div>

                      {/* Message Bubble */}
                      <div className={`relative rounded-2xl px-4 py-3 shadow-sm`}
                        style={{
                          backgroundColor: message.role === 'attacker'
                            ? 'var(--color-risk-critical, #ef4444)15'
                            : 'var(--color-accent-cyan, #06b6d4)15',
                          border: message.role === 'attacker'
                            ? '1px solid var(--color-risk-critical, #ef4444)30'
                            : '1px solid var(--color-accent-cyan, #06b6d4)30'
                        }}>
                        {/* Flag Indicator */}
                        {message.flag && (
                          <div className="absolute -left-2 top-2">
                            <div className="rounded-full p-1" style={getFlagColor(message.flag.severity)}>
                              <AlertTriangle className="h-3 w-3" />
                            </div>
                          </div>
                        )}

                        {/* Jailbreak Detection Banner */}
                        {message.role === 'attacker' && message.status === 'success' && (
                          <div className="mb-3 p-2 rounded-lg" style={{
                            backgroundColor: 'var(--color-risk-critical, #ef4444)25',
                            border: '2px solid var(--color-risk-critical, #ef4444)'
                          }}>
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4" style={{ color: 'var(--color-risk-critical, #ef4444)' }} />
                              <span className="text-xs font-bold" style={{ color: 'var(--color-risk-critical, #ef4444)' }}>
                                🚨 JAILBREAK DETECTED
                              </span>
                            </div>
                            <div className="text-xs mt-1" style={{ color: 'var(--color-risk-critical, #ef4444)' }}>
                              This attack successfully bypassed the defense system
                            </div>
                          </div>
                        )}

                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>

                        {/* Message Footer */}
                        <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(message.timestamp)}
                          </div>

                          {message.status && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium`}
                              style={{
                                backgroundColor: message.role === 'attacker' ? (
                                  message.status === 'success' ? 'var(--color-risk-critical, #ef4444)20' :
                                  'var(--color-accent-emerald, #10b981)20'
                                ) : (
                                  message.status === 'success' ? 'var(--color-accent-emerald, #10b981)20' :
                                  'var(--color-risk-critical, #ef4444)20'
                                ),
                                color: message.role === 'attacker' ? (
                                  message.status === 'success' ? 'var(--color-risk-critical, #ef4444)' :
                                  'var(--color-accent-emerald, #10b981)'
                                ) : (
                                  message.status === 'success' ? 'var(--color-accent-emerald, #10b981)' :
                                  'var(--color-risk-critical, #ef4444)'
                                )
                              }}>
                              {message.role === 'attacker' ? (
                                message.status === 'success' ? '🚨 JAILBROKEN' : '🛡️ BLOCKED'
                              ) : (
                                message.status === 'success' ? '✅ DEFENDED' : '❌ COMPROMISED'
                              )}
                            </span>
                          )}
                        </div>

                        {/* Flag Details */}
                        {message.flag && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <div className="text-xs text-gray-600 leading-relaxed">
                              <span className="font-semibold">⚠️ Flag:</span> {message.flag.description}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}