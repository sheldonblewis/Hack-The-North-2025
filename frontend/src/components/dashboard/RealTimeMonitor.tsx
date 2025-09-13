"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BoltIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CpuChipIcon
} from "@heroicons/react/24/outline";

interface AttackEvent {
  id: string;
  timestamp: Date;
  targetModel: string;
  attackType: 'jailbreak' | 'prompt_injection' | 'social_engineering' | 'toxicity' | 'context_manipulation';
  status: 'success' | 'partial' | 'blocked' | 'processing';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  payload?: string;
}

const attackTypes = {
  jailbreak: { label: 'Jailbreak Attempt', icon: BoltIcon },
  prompt_injection: { label: 'Prompt Injection', icon: ExclamationTriangleIcon },
  social_engineering: { label: 'Social Engineering', icon: CpuChipIcon },
  toxicity: { label: 'Toxicity Test', icon: ExclamationTriangleIcon },
  context_manipulation: { label: 'Context Manipulation', icon: BoltIcon }
};

const statusColors = {
  success: '#EF4444',    // Red - Attack succeeded
  partial: '#F97316',    // Orange - Partial success
  blocked: '#10B981',    // Green - Successfully blocked
  processing: '#06B6D4'  // Blue - Still processing
};

const riskLevelColors = {
  low: '#22C55E',
  medium: '#EAB308',
  high: '#F97316',
  critical: '#EF4444'
};

// Deterministic mock data generator to avoid hydration issues
let mockCounter = 0;
const generateMockAttack = (): AttackEvent => {
  const models = ['Command R+', 'Gemini Pro', 'GPT-4 Turbo', 'Claude-3 Opus', 'Llama-3.3 70B'];
  const attackTypeKeys = Object.keys(attackTypes) as Array<keyof typeof attackTypes>;
  const statuses: AttackEvent['status'][] = ['success', 'partial', 'blocked', 'processing'];
  const riskLevels: AttackEvent['riskLevel'][] = ['low', 'medium', 'high', 'critical'];

  // Use counter for deterministic selection to avoid hydration mismatch
  mockCounter += 1;

  return {
    id: `mock-${mockCounter}-${Date.now()}`,
    timestamp: new Date(),
    targetModel: models[mockCounter % models.length],
    attackType: attackTypeKeys[mockCounter % attackTypeKeys.length],
    status: statuses[mockCounter % statuses.length],
    riskLevel: riskLevels[mockCounter % riskLevels.length],
    payload: (mockCounter % 3) === 0 ? "Attempting role-play bypass..." : undefined
  };
};

export const RealTimeMonitor = () => {
  const [attacks, setAttacks] = useState<AttackEvent[]>([]);
  const [isActive, setIsActive] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Performance metrics
  const [metrics, setMetrics] = useState({
    attacksPerSecond: 0,
    avgResponseTime: 0,
    queueDepth: 0
  });

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      const newAttack = generateMockAttack();
      setAttacks(prev => [newAttack, ...prev].slice(0, 20)); // Keep only latest 20

      // Update metrics with deterministic values based on counter
      const metricsVariation = mockCounter % 10;
      setMetrics(prev => ({
        attacksPerSecond: 1 + (metricsVariation * 0.5),
        avgResponseTime: 50 + (metricsVariation * 20),
        queueDepth: 1 + (metricsVariation % 15)
      }));
    }, 2000); // Fixed interval to avoid hydration issues

    return () => clearInterval(interval);
  }, [isActive]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusIcon = (status: AttackEvent['status']) => {
    switch (status) {
      case 'success':
        return <ExclamationTriangleIcon className="w-4 h-4" />;
      case 'partial':
        return <ExclamationTriangleIcon className="w-4 h-4" />;
      case 'blocked':
        return <ShieldCheckIcon className="w-4 h-4" />;
      case 'processing':
        return <ClockIcon className="w-4 h-4" />;
    }
  };

  return (
    <motion.div
      className="dashboard-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.8 }}
      style={{ padding: '24px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">Real-time Attack Monitor</h3>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsActive(!isActive)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              isActive
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
            }`}
          >
            {isActive ? '● LIVE' : '● PAUSED'}
          </button>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--color-primary-700)' }}>
        <div className="text-center">
          <div className="text-lg font-bold font-mono text-cyan-400">
            {metrics.attacksPerSecond.toFixed(1)}
          </div>
          <div className="text-xs text-gray-400 uppercase tracking-wide">Attacks/sec</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold font-mono text-violet-400">
            {Math.round(metrics.avgResponseTime)}ms
          </div>
          <div className="text-xs text-gray-400 uppercase tracking-wide">Avg Response</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold font-mono text-emerald-400">
            {metrics.queueDepth}
          </div>
          <div className="text-xs text-gray-400 uppercase tracking-wide">Queue Depth</div>
        </div>
      </div>

      {/* Attack Stream */}
      <div className="space-y-2 max-h-96 overflow-y-auto" ref={containerRef}>
        <AnimatePresence>
          {attacks.map((attack) => {
            const AttackIcon = attackTypes[attack.attackType].icon;

            return (
              <motion.div
                key={attack.id}
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-4 p-3 rounded-lg transition-colors hover:bg-opacity-80"
                style={{
                  backgroundColor: `${statusColors[attack.status]}15`,
                  border: `1px solid ${statusColors[attack.status]}30`
                }}
              >
                {/* Timestamp */}
                <div className="font-mono text-xs text-gray-400 w-16 shrink-0">
                  {formatTime(attack.timestamp)}
                </div>

                {/* Status Icon */}
                <div className="w-6 h-6 shrink-0" style={{ color: statusColors[attack.status] }}>
                  {getStatusIcon(attack.status)}
                </div>

                {/* Attack Type */}
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <AttackIcon className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-sm text-white truncate">
                    {attackTypes[attack.attackType].label}
                  </span>
                </div>

                {/* Target Model */}
                <div className="text-sm text-gray-300 w-24 shrink-0 truncate">
                  {attack.targetModel}
                </div>

                {/* Risk Level */}
                <div
                  className="px-2 py-1 rounded text-xs font-medium uppercase tracking-wide w-16 text-center shrink-0"
                  style={{
                    backgroundColor: `${riskLevelColors[attack.riskLevel]}20`,
                    color: riskLevelColors[attack.riskLevel]
                  }}
                >
                  {attack.riskLevel}
                </div>

                {/* Status */}
                <div
                  className="px-2 py-1 rounded text-xs font-medium uppercase tracking-wide w-20 text-center shrink-0"
                  style={{
                    backgroundColor: `${statusColors[attack.status]}20`,
                    color: statusColors[attack.status]
                  }}
                >
                  {attack.status}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {attacks.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <ClockIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <div className="text-sm">Waiting for attack data...</div>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="mt-6 pt-4 border-t flex items-center justify-between text-sm" style={{ borderColor: 'var(--color-primary-700)' }}>
        <div className="text-gray-400">
          Showing latest {attacks.length} attacks
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-gray-400">Blocked</span>
            <span className="text-white font-mono">
              {attacks.filter(a => a.status === 'blocked').length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span className="text-gray-400">Success</span>
            <span className="text-white font-mono">
              {attacks.filter(a => a.status === 'success').length}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};