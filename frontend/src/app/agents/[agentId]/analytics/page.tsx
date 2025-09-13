"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import Link from "next/link";
import {
  IconShield,
  IconAlertTriangle,
  IconCpu,
  IconChartBar,
  IconTrendingUp,
  IconTrendingDown,
  IconMinus,
  IconPlay,
  IconPlayerPause,
  IconDownload,
  IconArrowLeft
} from "@tabler/icons-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { VulnerabilityHeatmap } from "../../../../components/dashboard/VulnerabilityHeatmap";
import { RealTimeMonitor } from "../../../../components/dashboard/RealTimeMonitor";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../../components/ui/card";

// Types
interface MetricData {
  label: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
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
    trend: 'down'
  },
  {
    label: "Models Tested",
    value: 47,
    change: 8,
    trend: 'up'
  },
  {
    label: "Active Attacks",
    value: 156,
    change: 0,
    trend: 'neutral'
  },
  {
    label: "Jailbreak Success Rate",
    value: 3.2,
    change: -1.5,
    trend: 'down'
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
  const TrendIcon = metric.trend === 'up' ? IconTrendingUp :
                   metric.trend === 'down' ? IconTrendingDown : IconMinus;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>{metric.label}</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            <CountUp
              end={metric.value}
              duration={2}
              decimals={metric.label.includes('Rate') ? 1 : 0}
              suffix={metric.label.includes('Rate') ? '%' : ''}
            />
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendIcon className="size-4" />
              {Math.abs(metric.change)}{metric.label.includes('Rate') ? '%' : ''}
            </Badge>
          </CardAction>
        </CardHeader>
      </Card>
    </motion.div>
  );
};

const RiskTrendChart = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Risk Trends by Model</CardTitle>
          <CardDescription>
            Model vulnerability assessment over time
          </CardDescription>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <div className="flex items-center gap-4 text-sm mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-muted-foreground">Cohere</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span className="text-muted-foreground">Gemini</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-muted-foreground">GPT-4</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span className="text-muted-foreground">Claude</span>
            </div>
          </div>

          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockRiskTrendData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis tickLine={false} axisLine={false} />
                <Line
                  type="monotone"
                  dataKey="cohere"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="gemini"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="gpt4"
                  stroke="hsl(var(--chart-3))"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="claude"
                  stroke="hsl(var(--chart-4))"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const AttackDistribution = () => {
  const muttedAttackTypes = mockAttackTypes.map((type, index) => ({
    ...type,
    color: `hsl(var(--chart-${index + 1}))`
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Attack Type Distribution</CardTitle>
          <CardDescription>
            Breakdown of attack patterns and techniques
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-8">
          <div className="relative" style={{ width: '200px', height: '200px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={muttedAttackTypes}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="value"
                >
                  {muttedAttackTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold font-mono">
                  <CountUp end={1247} duration={2} />
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Total Attacks</div>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-4">
            {muttedAttackTypes.map((type) => (
              <div key={type.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: type.color }}
                  />
                  <span className="text-sm text-muted-foreground">{type.name}</span>
                </div>
                <div className="text-sm font-mono">{type.value}%</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
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
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/agents/${agentId}`}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <IconArrowLeft className="w-5 h-5" />
            Back to Agent
          </Link>
          <div className="h-6 w-px bg-border" />
          <div>
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            <p className="text-muted-foreground mt-1">Agent {agentId} • Real-time AI security monitoring</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsSimulating(!isSimulating)}
            variant={isSimulating ? "outline" : "default"}
          >
            {isSimulating ? <IconPlayerPause className="w-4 h-4 mr-2" /> : <IconPlay className="w-4 h-4 mr-2" />}
            {isSimulating ? 'Pause' : 'Start'} Simulation
          </Button>

          <Button variant="outline">
            <IconDownload className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Executive Metrics */}
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {mockMetrics.map((metric, index) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RiskTrendChart />
        <AttackDistribution />
      </div>

      {/* Advanced Analytics */}
      <div className="space-y-6">
        <VulnerabilityHeatmap />
        <RealTimeMonitor />
      </div>
    </div>
  );
}