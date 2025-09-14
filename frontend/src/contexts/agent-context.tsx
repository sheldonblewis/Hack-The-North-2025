"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import type { Agent, AgentContextType } from "~/types/agent"
import { apiClient } from "~/lib/api"

const AgentContext = React.createContext<AgentContextType | undefined>(undefined)


export function AgentProvider({ children }: { children: React.ReactNode }) {
  const [selectedAgent, setSelectedAgent] = React.useState<Agent | null>(null)
  const [agents, setAgents] = React.useState<Agent[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const pathname = usePathname()

  const loadAgents = async () => {
    try {
      setLoading(true)
      const apiAgents = await apiClient.getAgents()

      // Transform API agents to frontend Agent type
      const transformedAgents: Agent[] = apiAgents.map(apiAgent => ({
        id: apiAgent._id,
        name: apiAgent.name,
        description: apiAgent.objective,
        category: `${apiAgent.model_provider}/${apiAgent.model_name}`,
        status: apiAgent.status,
        lastTested: new Date(apiAgent.created_at).toLocaleDateString(),
        isActive: apiAgent.status === "active",
        prompt: apiAgent.defense_system_prompt
      }))

      setAgents(transformedAgents)
      setError(null)
    } catch (error) {
      console.error('Failed to load agents:', error)
      setError(`Failed to load agents: ${error}`)
      setAgents([])
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    loadAgents()
  }, [])

  React.useEffect(() => {
    const agentMatch = pathname.match(/^\/agents\/([^\/]+)/)
    if (agentMatch && agents.length > 0) {
      const agentId = agentMatch[1]
      const agent = agents.find(a => a.id === agentId)
      if (agent && selectedAgent?.id !== agentId) {
        setSelectedAgent(agent)
      }
    }
  }, [pathname, selectedAgent, agents])

  const value = React.useMemo(() => ({
    selectedAgent,
    setSelectedAgent,
    agents,
    loading,
    error,
    refreshAgents: loadAgents
  }), [selectedAgent, agents, loading, error])

  return (
    <AgentContext.Provider value={value}>
      {children}
    </AgentContext.Provider>
  )
}

export function useAgent() {
  const context = React.useContext(AgentContext)
  if (context === undefined) {
    throw new Error('useAgent must be used within an AgentProvider')
  }
  return context
}