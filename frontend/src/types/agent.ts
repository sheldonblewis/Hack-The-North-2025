export interface Agent {
  id: string
  name: string
  description: string
  category: string
  status: string
  lastTested: string
  isActive: boolean
  prompt: string
}

export interface AgentContextType {
  selectedAgent: Agent | null
  setSelectedAgent: (agent: Agent | null) => void
  agents: Agent[]
  loading: boolean
  error: string | null
  refreshAgents: () => Promise<void>
}