"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { useNavigation } from "~/contexts/navigation-context"
import { AgentProvider } from "~/contexts/agent-context"
import { AppSidebar } from "~/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
} from "~/components/ui/sidebar"

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname()
  const { getRouteName } = useNavigation()
  const hideSidebar = pathname === "/" || pathname === "/login"

  if (hideSidebar) {
    return (
      <AgentProvider>
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            {children}
          </div>
        </div>
      </AgentProvider>
    )
  }

  return (
    <AgentProvider>
      <SidebarProvider
        defaultOpen={true}
        style={
          {
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <div className="flex flex-1 flex-col justify-center">
            <div className="@container/main flex flex-col gap-2 py-16 min-h-[95%] mx-auto max-w-[70rem] w-[90%] ">
              <h1 className="text-5xl tracking-tight mb-3 border-b pb-4">
                {getRouteName()}
              </h1>
              {children}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AgentProvider>
  )
}