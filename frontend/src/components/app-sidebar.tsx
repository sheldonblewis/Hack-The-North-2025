"use client"

import * as React from "react"
import {
  IconRobot,
  IconChartBar,
  IconDashboard,
  IconAlertTriangle,
  IconMessageCircle,
  IconFileDescription,
  IconPlayArrow,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
  IconHome,
  IconChevronDown,
} from "@tabler/icons-react"

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

const data = {
  user: {
    name: "Agent Tester",
    email: "tester@example.com",
    avatar: "/avatars/agent-tester.jpg",
  },
  agents: [
    { id: "1", name: "Security Agent" },
    { id: "2", name: "Performance Agent" },
    { id: "3", name: "Compliance Agent" },
  ],
  navMain: [
    {
      title: "Home",
      url: "/",
      icon: IconHome,
    },
    {
      title: "Agents",
      url: "/agents",
      icon: IconRobot,
    },
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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [selectedAgent, setSelectedAgent] = React.useState(data.agents[0]!)

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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild className="border">
                    <SidebarMenuButton className="w-full justify-between">
                      <div className="flex items-center gap-2">
                        <span>{selectedAgent.name}</span>
                      </div>
                      <IconChevronDown className="size-4" />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] min-w-64">
                    {data.agents.map((agent) => (
                      <DropdownMenuItem
                        key={agent.id}
                        onClick={() => setSelectedAgent(agent)}
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
