"use client"

import * as React from "react"
import { usePathname } from "next/navigation"

interface Agent {
  id: string
  name: string
}

interface AgentContextType {
  selectedAgent: Agent | null
  setSelectedAgent: (agent: Agent | null) => void
  agents: Agent[]
}

const AgentContext = React.createContext<AgentContextType | undefined>(undefined)

const defaultAgents: Agent[] = [
  { id: "1", name: "Agent 01" },
  { id: "2", name: "Agent 02" },
  { id: "3", name: "Agent 03" },
]

export function AgentProvider({ children }: { children: React.ReactNode }) {
  const [selectedAgent, setSelectedAgent] = React.useState<Agent | null>(null)
  const pathname = usePathname()
  React.useEffect(() => {
    const agentMatch = pathname.match(/^\/agents\/([^\/]+)/)
    if (agentMatch) {
      const agentId = agentMatch[1]
      const agent = defaultAgents.find(a => a.id === agentId)
      if (agent && selectedAgent?.id !== agentId) {
        setSelectedAgent(agent)
      }
    }
  }, [pathname, selectedAgent])

  const value = React.useMemo(() => ({
    selectedAgent,
    setSelectedAgent,
    agents: defaultAgents,
  }), [selectedAgent])

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