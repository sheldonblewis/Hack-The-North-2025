"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { usePathname } from "next/navigation"

interface NavigationContextType {
  backUrl: string | null
  setBackUrl: (url: string | null) => void
  getRouteName: () => string
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [backUrl, setBackUrl] = useState<string | null>(null)
  const pathname = usePathname()

  const getRouteName = () => {
    if (pathname === "/" || pathname === "/dashboard") return "Dashboard"
    if (pathname.includes("/chat")) return "Chat"
    if (pathname.includes("/runs")) return "Test Runs"
    if (pathname.includes("/analytics")) return "Analytics"
    if (pathname.includes("/alerts")) return "Alerts"
    if (pathname.match(/^\/agents\/[^\/]+$/)) return "Dashboard"
    if (pathname.includes("/agents")) return "Agents"
    return "Dashboard"
  }

  return (
    <NavigationContext.Provider value={{ backUrl, setBackUrl, getRouteName }}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (context === undefined) {
    throw new Error("useNavigation must be used within a NavigationProvider")
  }
  return context
}