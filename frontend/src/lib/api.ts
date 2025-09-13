// frontend/src/lib/api.ts - API client for backend communication

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_DOMAIN || 'http://localhost:8000';

export interface Agent {
  _id: string;
  name: string;
  objective: string;
  model_provider: string;
  model_name: string;
  status: string;
  created_at: string;
}

export interface AttackResult {
  _id: string;
  agent_id: string;
  attack_strategy: string;
  prompt_sent: string;
  response_received: string;
  status: 'success' | 'blocked' | 'failed';
  risk_score: number;
  timestamp: string;
  evaluation_result: boolean;
}

export interface Analytics {
  total_attacks: number;
  successful_attacks: number;
  blocked_attacks: number;
  success_rate: number;
  avg_risk_score: number;
}

export interface SimulationRequest {
  iterations: number;
  initial_attack_prompt: string;
  defense_system_prompt: string;
}

export interface SimulationResponse {
  success: boolean;
  agent_id: string;
  run_id: string;
  total_attempts: number;
  successful_attempts: number;
}

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getAgents(): Promise<Agent[]> {
    const data = await this.request<{ agents: Agent[] }>('/api/agents');
    return data.agents;
  }

  async createAgent(agent: Omit<Agent, '_id' | 'created_at' | 'status'>): Promise<string> {
    const data = await this.request<{ agent_id: string }>('/api/agents', {
      method: 'POST',
      body: JSON.stringify(agent),
    });
    return data.agent_id;
  }

  async getAgentResults(agentId: string, limit: number = 50): Promise<AttackResult[]> {
    const data = await this.request<{ results: AttackResult[] }>(`/api/agents/${agentId}/results?limit=${limit}`);
    return data.results;
  }

  async getAnalytics(): Promise<Analytics> {
    return this.request<Analytics>('/api/analytics');
  }

  async getAgentAnalytics(agentId: string): Promise<Analytics> {
    return this.request<Analytics>(`/api/analytics/${agentId}`);
  }

  async runSimulation(agentId: string, config: SimulationRequest): Promise<SimulationResponse> {
    return this.request<SimulationResponse>(`/api/agents/${agentId}/simulate`, {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async healthCheck(): Promise<{ status: string; timestamp: string; service: string }> {
    return this.request<{ status: string; timestamp: string; service: string }>('/health');
  }
}

export const apiClient = new ApiClient();

// Utility functions for data transformation
export const formatTimestamp = (timestamp: string): string => {
  return new Date(timestamp).toLocaleString();
};

export const getRiskColor = (riskScore: number): string => {
  if (riskScore >= 8) return 'text-red-600';
  if (riskScore >= 5) return 'text-orange-600';
  if (riskScore >= 3) return 'text-yellow-600';
  return 'text-green-600';
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'success':
      return 'text-red-600 bg-red-100';
    case 'blocked':
      return 'text-green-600 bg-green-100';
    case 'failed':
      return 'text-gray-600 bg-gray-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};