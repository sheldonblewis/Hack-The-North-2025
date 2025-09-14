"use client";

import { useState, useEffect, use, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Progress } from "~/components/ui/progress";
import { ArrowLeft, Play, Square, AlertTriangle, CheckCircle, XCircle, Bot, Shield, Clock, Activity, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { useAgent } from "~/contexts/agent-context";
import { AgentCard } from "~/components/agent-card";
import { apiClient } from "~/lib/api";
import { cn } from "~/lib/utils";
import { Label } from "~/components/ui/label";
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
  const hasStartedRef = useRef(false);

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
      console.log(config)

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

        // Update conversation history (handle both spelling variants from API)
        const conversationData = data.data?.conversation_history || data.data?.convesation_history;
        if (conversationData && Array.isArray(conversationData) && conversationData.length > 0) {
          const newConversationHistory = conversationData;
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

          // Debug logging
          console.log('Updated conversation history:', newConversationHistory);
          console.log('Current messages:', messages);
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
        if (data.type === 'complete') {
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
    if (config && selectedAgent && !hasStartedRef.current) {
      hasStartedRef.current = true;
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
      {isSimulating && (
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm text-gray-600">Running simulation...</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsSimulating(false);
              setError('Simulation stopped by user');
            }}
            className="ml-4"
          >
            <Square className="h-4 w-4 mr-2" />
            Stop
          </Button>
        </div>
      )}


      {/* Success Rate & Agent Card */}
      <div className="flex gap-6">
        {/* Success Rate Card */}
        <Card className="min-h-full min-w-1/6 flex items-center justify-center">
          <CardContent className="p-4 text-center">
            <div className="space-y-2">
              <div className="text-3xl font-bold ">
                {Math.round(stats.successRate)}%
              </div>
              <div className="text-xs text-muted-foreground font-medium">
                Success Rate
              </div>
              <div className="text-xs text-muted-foreground">
                {stats.totalExchanges - stats.successfulJailbreaks}/{stats.totalExchanges}
              </div>
            </div>
          </CardContent>
        </Card>

        

        {/* Agent Card */}
        {selectedAgent && (
          <div className="w-full">
            <AgentCard agent={selectedAgent} showActions={false} />
          </div>
        )}
      </div>

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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
        <div className="space-y-2">
        <Label htmlFor="testName">Live Results</Label>
        <Card className="py-0">
          <CardContent className="py-5 pb-0 px-1">
            <div className="space-y-6 max-h-screen overflow-y-auto px-5">
              <AnimatePresence>
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className={cn(
                      "flex",
                      message.role === 'defender' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div className={cn(
                      "max-w-[75%]",
                      message.role === 'defender' ? 'order-2' : 'order-1'
                    )}>
                      {/* Agent Avatar & Name */}
                      <div className={cn(
                        "flex items-center gap-3 mb-1 ml-1",
                        message.role === 'defender' ? 'justify-end' : 'justify-start'
                      )}>
                        <span className={cn(
                          "text-xs font-light",
                          message.role === 'attacker' ? 'text-primary' : 'text-primary'
                        )}>
                          {message.role === 'attacker' ? 'Attack Agent' : 'Defense Agent'}
                        </span>
                      </div>

                      {/* Message Bubble */}
                      <div className={cn(
                        "relative rounded-2xl px-4 py-3 shadow-sm border",
                        message.role === 'attacker'
                          ? 'bg-destructive/5 border-destructive/20 rounded-bl-none'
                          : 'bg-cyan-50 border-cyan-200 dark:bg-cyan-950/50 dark:border-cyan-800'
                      )}>


                        {/* Jailbreak Detection Banner */}
                        {message.role === 'attacker' && message.status === 'success' && (
                          <div className="mb-3 p-3 rounded-lg bg-destructive/10 border-2 border-destructive">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-destructive" />
                              <span className="text-xs font-bold text-destructive">
                                🚨 JAILBREAK DETECTED
                              </span>
                            </div>
                            <div className="text-xs mt-1 text-destructive">
                              This attack successfully bypassed the defense system
                            </div>
                          </div>
                        )}

                        <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">{message.content}</p>

                        {/* Message Footer */}
                        <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(message.timestamp)}
                          </div>

                          {message.status && (
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs font-medium",
                                message.role === 'attacker'
                                  ? message.status === 'success'
                                    ? 'bg-destructive/10 text-destructive border-destructive/20'
                                    : 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-400 dark:border-green-800'
                                  : message.status === 'success'
                                    ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-400 dark:border-green-800'
                                    : 'bg-destructive/10 text-destructive border-destructive/20'
                              )}
                            >
                              {message.role === 'attacker' ? (
                                message.status === 'success' ? '🚨 JAILBROKEN' : '🛡️ BLOCKED'
                              ) : (
                                message.status === 'success' ? '✅ DEFENDED' : '❌ COMPROMISED'
                              )}
                            </Badge>
                          )}
                        </div>

                        {/* Flag Details */}
                        {message.flag && (
                          <div className="mt-2 pt-2 border-t border-border">
                            <div className="text-xs text-muted-foreground leading-relaxed">
                              <span className="font-semibold">⚠️ :</span> {message.flag.description}
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
        </div>
      )}
    </div>
  );
}