import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  Home,
  Users,
  BarChart3,
  FileText,
  Folder,
  UserCheck,
  User,
  UserCog,
  LogOut,
  X,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { toast } from "sonner"

import galwanLogo from "@/assets/galwan-logo.png"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import { useCanAccess } from "@/hooks/useCanAccess"
import type { AreaSlug } from "@/lib/permissions"

interface MenuItem {
  title: string
  icon: LucideIcon
  path: string
  area?: AreaSlug
  adminOnly?: boolean
}

const MENU_ITEMS: MenuItem[] = [
  { title: "Home", icon: Home, path: "/home" },
  { title: "Leads", icon: Users, path: "/leads", area: "leads" },
  { title: "Métricas", icon: BarChart3, path: "/metricas", area: "insights" },
  { title: "Prompt", icon: FileText, path: "/prompt", area: "prompt" },
  { title: "Projetos", icon: Folder, path: "/projetos", area: "projects" },
  { title: "Corretores", icon: UserCheck, path: "/corretores", area: "brokers" },
  { title: "Usuários", icon: UserCog, path: "/usuarios", adminOnly: true },
  { title: "Perfil", icon: User, path: "/perfil" },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { canAccess, isAdmin } = useCanAccess()

  const visibleItems = MENU_ITEMS.filter((item) => {
    if (item.adminOnly) return isAdmin
    if (item.area) return canAccess(item.area)
    return true
  })

  const handleLogout = async () => {
    try {
      await signOut()
      toast.success("Você foi desconectado.")
      navigate("/login", { replace: true })
    } catch {
      navigate("/login", { replace: true })
    }
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow transition-transform duration-300 lg:static lg:transform-none ${
        open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}
    >
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex items-center justify-between p-6">
          <img src={galwanLogo} alt="Galwan" className="h-[42px] w-[152px]" />
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onClose}
          >
            <X className="size-5" />
          </Button>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto p-4">
          {visibleItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors ${
                  isActive
                    ? "bg-gradient-to-r from-primary to-secondary font-medium text-primary-foreground"
                    : "text-foreground/70 hover:bg-muted"
                }`}
              >
                <Icon className="size-5" />
                <span>{item.title}</span>
              </Link>
            )
          })}
        </nav>

        <div className="space-y-2 p-4">
          {user?.email ? (
            <div className="truncate px-4 py-2 text-sm text-muted-foreground">
              {user.email}
            </div>
          ) : null}
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start gap-3 text-destructive hover:bg-destructive/10"
          >
            <LogOut className="size-5" />
            <span>Sair</span>
          </Button>
        </div>
      </div>
    </aside>
  )
}
