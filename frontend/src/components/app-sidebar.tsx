"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import {
  IconRobot,
  Play,
  IconAlertTriangle,
  IconHelp,
  IconSettings,
  IconHome,
  IconChevronDown,
  IconChartAreaLine,
  IconMessageCircle,
  IconCornerLeftUp,
  IconShield,
} from "@tabler/icons-react"

import { useAgent } from "~/contexts/agent-context"
import { NavDocuments } from "~/components/nav-documents"
import { NavMain } from "~/components/nav-main"
import { NavSecondary } from "~/components/nav-secondary"
import { NavUser } from "~/components/nav-user"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
  useSidebar,
} from "~/components/ui/sidebar"
import { PlayIcon } from "lucide-react"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { selectedAgent, setSelectedAgent, agents } = useAgent()
  const { setOpen } = useSidebar()
  const router = useRouter()
  const pathname = usePathname()
  const [currentTime, setCurrentTime] = React.useState('')

  // Update time every second
  React.useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }))
    }
    
    updateTime() // Initial call
    const timer = setInterval(updateTime, 1000)
    
    return () => clearInterval(timer)
  }, [])

  const handleAgentChange = (agent: typeof selectedAgent) => {
    setSelectedAgent(agent)
    if (agent) {
      setOpen(true) // Expand sidebar when agent is selected
      router.push(`/agents/${agent.id}/runs`)
    }
  }

  const handleGoToAgents = () => {
    router.push('/agents')
  }

  // Auto-collapse sidebar when no agent is selected or not on agent route
  React.useEffect(() => {
    const agentMatch = pathname.match(/^\/agents\/([^\/]+)/)
    const hasAgentInUrl = !!agentMatch
    const isAgentsPage = pathname === '/agents'
    
    if (hasAgentInUrl) {
      setOpen(true) // Keep sidebar open when on agent routes
    } else if (isAgentsPage || !selectedAgent) {
      setOpen(false) // Collapse when on agents page or no agent selected
    }
  }, [selectedAgent, pathname, setOpen])

  const data = {
    user: {
      name: "Agent Tester",
      email: "tester@example.com",
      avatar: "/avatars/agent-tester.jpg",
    },
    navMain: [
      // {
      //   title: "Dashboard",
      //   url: `/agents/${selectedAgent?.id}`,
      //   icon: IconHome,
      // },
      {
        title: "Test Runs",
        url: `/agents/${selectedAgent?.id}/runs`,
        icon: PlayIcon,
      },
      // {
      //   title: "Chat",
      //   url: `/agents/${selectedAgent?.id}/chat`,
      //   icon: IconMessageCircle,
      // },
      // {
      //   title: "Red Team Testing",
      //   url: "/test-api",
      //   icon: IconShield,
      // },
      // {
      //   title: "Analytics",
      //   url: `/agents/${selectedAgent?.id}/analytics`,
      //   icon: IconChartAreaLine,
      // },
      // {
      //   title: "Alerts",
      //   url: `/agents/${selectedAgent?.id}/alerts`,
      //   icon: IconAlertTriangle,
      // },
    ],
    navSecondary: [
      {
        title: "Settings",
        url: "#",
        icon: IconSettings,
      },
      {
        title: "Help",
        url: "#",
        icon: IconHelp,
      },
    ],
  }

  return (
    <Sidebar collapsible="offcanvas" {...props} className="px-8 pb-8">
      <SidebarHeader className="pb-4 pt-8 px-0">
        <div className="flex items-baseline ">
          <a href="/">
            <span className="text-5xl font-black inline-block" style={{ transform: "scaleX(1.45)", transformOrigin: "left center" }}>IN-IT</span>
          </a>
          <span className="ml-12 text-sm tabular-nums slashed-zero text-muted-foreground">
            {currentTime}
          </span>
        </div>

        <div className="flex items-center ">
          <SidebarMenuButton 
            onClick={handleGoToAgents}
            className="size-8 p-0 hover:bg-none accent items-center justify-center tabular-nums slashed-zero"
          >
            <IconCornerLeftUp className="size-4 text-muted-foreground" />
          </SidebarMenuButton>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="border tabular-nums slashed-zero flex-1">
              <SidebarMenuButton className="w-full justify-between tabular-nums slashed-zero">
                <div className="flex items-center gap-2 tabular-nums slashed-zero">
                  <span>{selectedAgent ? selectedAgent.name : "Select Agent"}</span>
                </div>
                <IconChevronDown className="size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] min-w-[17rem] tabular-nums slashed-zero">
              {agents.map((agent) => (
                <DropdownMenuItem
                  key={agent.id}
                  onClick={() => handleAgentChange(agent)}
                  className="flex items-center justify-between tabular-nums slashed-zero"
                >
                  <span>{agent.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="pt-2 ">
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto px-0" />
      </SidebarContent>
      <SidebarFooter className="px-0">
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
