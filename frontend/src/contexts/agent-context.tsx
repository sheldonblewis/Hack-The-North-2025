"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import type { Agent, AgentContextType } from "~/types/agent"

const AgentContext = React.createContext<AgentContextType | undefined>(undefined)

const defaultAgents: Agent[] = [
  {
    id: "1",
    name: "Agent 01",
    description: "Customer service and support automation with advanced conversation handling",
    category: "Support",
    status: "Active",
    lastTested: "2 hours ago",
    isActive: true,
    prompt: "fefe"
  },
  {
    id: "2", 
    name: "Agent 02",
    description: "Sales outreach and lead qualification with personalized messaging",
    category: "Sales",
    status: "Active",
    lastTested: "4 hours ago", 
    isActive: true,
    prompt: "fefe"
  },
  {
    id: "3",
    name: "Agent 03",
    description: "Meeting coordination and calendar management with smart scheduling",
    category: "Productivity",
    status: "In Testing",
    lastTested: "1 day ago",
    isActive: false,
    prompt: "fefe"
  }
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