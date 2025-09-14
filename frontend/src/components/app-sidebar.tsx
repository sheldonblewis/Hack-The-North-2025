"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import {
  IconRobot,
  IconAlertTriangle,
  IconHelp,
  IconSettings,
  IconHome,
  IconChevronDown,
  IconChartAreaLine,
  IconMessageCircle,
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
} from "~/components/ui/sidebar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { selectedAgent, setSelectedAgent, agents } = useAgent()
  const router = useRouter()
  const pathname = usePathname()

  const handleAgentChange = (agent: typeof selectedAgent) => {
    setSelectedAgent(agent)
    if (agent) {
      router.push(`/agents/${agent.id}/runs`)
    }
  }

  const data = {
    user: {
      name: "Agent Tester",
      email: "tester@example.com",
      avatar: "/avatars/agent-tester.jpg",
    },
    navMain: selectedAgent ? [
      {
        title: "Metrics Dashboard",
        url: `/agents/${selectedAgent.id}`,
        icon: IconHome,
      },
      {
        title: "Chat",
        url: `/agents/${selectedAgent.id}/chat`,
        icon: IconMessageCircle,
      },
      {
        title: "Runs",
        url: `/agents/${selectedAgent.id}/runs`,
        icon: IconRobot,
      },
      {
        title: "Red Team Testing",
        url: "/test-api",
        icon: IconShield,
      },
      {
        title: "Analytics",
        url: `/agents/${selectedAgent.id}/analytics`,
        icon: IconChartAreaLine,
      },
      {
        title: "Alerts",
        url: `/agents/${selectedAgent.id}/alerts`,
        icon: IconAlertTriangle,
      },
    ] : [],
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
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/">
                <span className="text-base font-semibold">IN-IT</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="/agents">
                    <IconHome className="size-4" />
                    <span>Home</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild className="border tabular-nums">
                    <SidebarMenuButton className="w-full justify-between">
                      <div className="flex items-center gap-2">
                        <span>{selectedAgent ? selectedAgent.name : "Select Agent"}</span>
                      </div>
                      <IconChevronDown className="size-4" />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] min-w-64 tabular-nums">
                    {agents.map((agent) => (
                      <DropdownMenuItem
                        key={agent.id}
                        onClick={() => handleAgentChange(agent)}
                        className="flex items-center justify-between"
                      >
                        <span>{agent.name}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
