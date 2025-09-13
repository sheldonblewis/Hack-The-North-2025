"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import Link from "next/link";
import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CpuChipIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon as TrendingUpIcon,
  ArrowTrendingDownIcon as TrendingDownIcon,
  MinusIcon,
  PlayIcon,
  PauseIcon,
  ArrowDownTrayIcon,
  ArrowLeftIcon
} from "@heroicons/react/24/outline";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { VulnerabilityHeatmap } from "../../../../components/dashboard/VulnerabilityHeatmap";
import { RealTimeMonitor } from "../../../../components/dashboard/RealTimeMonitor";

// Types
interface MetricData {
  label: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface RiskTrendData {
  date: string;
  cohere: number;
  gemini: number;
  gpt4: number;
  claude: number;
}

interface AttackTypeData {
  name: string;
  value: number;
  color: string;
}

// Mock Data
const mockMetrics: MetricData[] = [
  {
    label: "Overall Risk Score",
    value: 23,
    change: -12,
    trend: 'down',
    icon: ShieldCheckIcon,
    color: "var(--color-risk-low)"
  },
  {
    label: "Models Tested",
    value: 47,
    change: 8,
    trend: 'up',
    icon: CpuChipIcon,
    color: "var(--color-accent-cyan)"
  },
  {
    label: "Active Attacks",
    value: 156,
    change: 0,
    trend: 'neutral',
    icon: ExclamationTriangleIcon,
    color: "var(--color-accent-violet)"
  },
  {
    label: "Jailbreak Success Rate",
    value: 3.2,
    change: -1.5,
    trend: 'down',
    icon: ChartBarIcon,
    color: "var(--color-risk-critical)"
  }
];

const mockRiskTrendData: RiskTrendData[] = [
  { date: '2024-02-20', cohere: 25, gemini: 30, gpt4: 20, claude: 15 },
  { date: '2024-02-21', cohere: 28, gemini: 32, gpt4: 18, claude: 14 },
  { date: '2024-02-22', cohere: 22, gemini: 28, gpt4: 22, claude: 16 },
  { date: '2024-02-23', cohere: 20, gemini: 26, gpt4: 19, claude: 13 },
  { date: '2024-02-24', cohere: 18, gemini: 24, gpt4: 21, claude: 12 },
  { date: '2024-02-25', cohere: 15, gemini: 22, gpt4: 17, claude: 11 },
  { date: '2024-02-26', cohere: 12, gemini: 20, gpt4: 15, claude: 10 }
];

const mockAttackTypes: AttackTypeData[] = [
  { name: 'Jailbreak Attempts', value: 35, color: '#EF4444' },
  { name: 'Prompt Injection', value: 25, color: '#F97316' },
  { name: 'Social Engineering', value: 20, color: '#EAB308' },
  { name: 'Context Manipulation', value: 15, color: '#22C55E' },
  { name: 'Other', value: 5, color: '#06B6D4' }
];

// Components
const MetricCard = ({ metric }: { metric: MetricData }) => {
  const TrendIcon = metric.trend === 'up' ? TrendingUpIcon :
                   metric.trend === 'down' ? TrendingDownIcon : MinusIcon;

  return (
    <motion.div
      className="dashboard-card metric-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-start justify-between mb-4">
        <metric.icon className="w-8 h-8" style={{ color: metric.color }} />
        <div className={`metric-change ${metric.trend}`}>
          <TrendIcon className="w-4 h-4" />
          <span>{Math.abs(metric.change)}{metric.label.includes('Rate') ? '%' : ''}</span>
        </div>
      </div>

      <div className="metric-value">
        <CountUp
          end={metric.value}
          duration={2}
          decimals={metric.label.includes('Rate') ? 1 : 0}
          suffix={metric.label.includes('Rate') ? '%' : ''}
        />
      </div>

      <div className="metric-label">{metric.label}</div>
    </motion.div>
  );
};

const RiskTrendChart = () => {
  return (
    <motion.div
      className="dashboard-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      style={{ padding: '24px' }}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">Risk Trends by Model</h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#06B6D4' }}></div>
            <span className="text-gray-400">Cohere</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#8B5CF6' }}></div>
            <span className="text-gray-400">Gemini</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#10B981' }}></div>
            <span className="text-gray-400">GPT-4</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#F59E0B' }}></div>
            <span className="text-gray-400">Claude</span>
          </div>
        </div>
      </div>

      <div className="chart-container" style={{ height: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={mockRiskTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
            <Line
              type="monotone"
              dataKey="cohere"
              stroke="#06B6D4"
              strokeWidth={3}
              dot={{ fill: '#06B6D4', strokeWidth: 2, r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="gemini"
              stroke="#8B5CF6"
              strokeWidth={3}
              dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="gpt4"
              stroke="#10B981"
              strokeWidth={3}
              dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="claude"
              stroke="#F59E0B"
              strokeWidth={3}
              dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

const AttackDistribution = () => {
  return (
    <motion.div
      className="dashboard-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      style={{ padding: '24px' }}
    >
      <h3 className="text-xl font-semibold text-white mb-6">Attack Type Distribution</h3>

      <div className="flex items-center gap-8">
        <div className="chart-container" style={{ width: '200px', height: '200px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={mockAttackTypes}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                dataKey="value"
              >
                {mockAttackTypes.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-white font-mono">
                <CountUp end={1247} duration={2} />
              </div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">Total Attacks</div>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-4">
          {mockAttackTypes.map((type) => (
            <div key={type.name} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: type.color }}
                />
                <span className="text-sm text-gray-300">{type.name}</span>
              </div>
              <div className="text-sm font-mono text-white">{type.value}%</div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default function AgentAnalytics({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const [isSimulating, setIsSimulating] = useState(true);
  const [agentId, setAgentId] = useState<string>("");

  useEffect(() => {
    params.then(({ agentId }) => setAgentId(agentId));
  }, [params]);

  return (
    <main className="min-h-screen" style={{ background: 'var(--color-primary-900)' }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: 'var(--color-primary-700)', backgroundColor: 'var(--color-primary-800)' }}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/agents/${agentId}`}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                Back to Agent
              </Link>
              <div className="h-6 w-px bg-gray-600" />
              <div>
                <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
                <p className="text-gray-400 mt-1">Agent {agentId} • Real-time AI security monitoring</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSimulating(!isSimulating)}
                className={`action-button ${isSimulating ? 'secondary' : ''}`}
              >
                {isSimulating ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
                {isSimulating ? 'Pause' : 'Start'} Simulation
              </button>

              <button className="action-button secondary">
                <ArrowDownTrayIcon className="w-4 h-4" />
                Export Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Executive Metrics */}
        <div className="metrics-grid">
          {mockMetrics.map((metric, index) => (
            <MetricCard key={metric.label} metric={metric} />
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <RiskTrendChart />
          <AttackDistribution />
        </div>

        {/* Advanced Analytics */}
        <div className="space-y-6">
          <VulnerabilityHeatmap />
          <RealTimeMonitor />
        </div>
      </div>
    </main>
  );
}