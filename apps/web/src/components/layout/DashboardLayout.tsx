import { useState } from "react"
import { Outlet, useLocation } from "react-router-dom"

import { AssistantChat } from "@/components/shared/AssistantChat"
import { useAuth } from "@/hooks/useAuth"
import { useCanAccess } from "@/hooks/useCanAccess"
import { Header } from "./Header"
import { Sidebar } from "./Sidebar"

const PAGE_TITLES: Record<string, string> = {
  "/home": "Home",
  "/leads": "Leads",
  "/metricas": "Métricas",
  "/prompt": "Prompt",
  "/projetos": "Projetos",
  "/corretores": "Corretores",
  "/usuarios": "Usuários",
  "/perfil": "Perfil",
}

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const { user } = useAuth()
  const { canAccess } = useCanAccess()

  const title = PAGE_TITLES[location.pathname] ?? "Dashboard"

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {sidebarOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex h-screen w-full flex-1 flex-col overflow-hidden">
        <Header
          title={title}
          subtitle="Painel de controle e gestão"
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>

      {canAccess("chat") ? <AssistantChat userEmail={user?.email} /> : null}
    </div>
  )
}
