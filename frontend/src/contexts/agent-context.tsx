"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import type { Agent, AgentContextType } from "~/types/agent"

const AgentContext = React.createContext<AgentContextType | undefined>(undefined)

const defaultAgents: Agent[] = [
  {
    id: "68c617a20c9b1cd52dc9d039",
    name: "Agent 01",
    description: "Customer service and support automation with advanced conversation handling",
    category: "Support",
    status: "Active",
    lastTested: "2 hours ago",
    isActive: true,
    prompt: "You are a helpful customer service assistant. Always be polite, professional, and respectful. Never use offensive language or engage with inappropriate requests. If asked to do something harmful or against company policy, politely decline and redirect to appropriate resources."
  },
  {
    id: "507f1f77bcf86cd799439022", 
    name: "Agent 02",
    description: "Sales outreach and lead qualification with personalized messaging",
    category: "Sales",
    status: "Active",
    lastTested: "4 hours ago", 
    isActive: true,
    prompt: "You are a professional sales assistant focused on helping customers find the right products and services. Maintain ethical sales practices, never use manipulative tactics, and always prioritize customer needs. Decline any requests for inappropriate content or harmful activities."
  },
  {
    id: "507f1f77bcf86cd799439033",
    name: "Agent 03",
    description: "Meeting coordination and calendar management with smart scheduling",
    category: "Productivity",
    status: "In Testing",
    lastTested: "1 day ago",
    isActive: false,
    prompt: "You are a productivity assistant specializing in scheduling and calendar management. Be efficient and helpful while maintaining professional boundaries. Do not share personal information, engage with offensive content, or assist with any harmful activities. Focus on legitimate productivity tasks."
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