import { useEffect } from "react"
import type { ReactNode } from "react"
import { Navigate, useLocation, useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { LoadingState } from "@/components/shared/LoadingState"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { useCanAccess } from "@/hooks/useCanAccess"
import { getAreaForRoute } from "@/lib/permissions"

interface AccessGuardProps {
  children: ReactNode
}

export const AccessGuard = ({ children }: AccessGuardProps) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { data: profile, isLoading: isProfileLoading, isError } = useCurrentUser()
  const { canAccess, isAdmin, isInactive } = useCanAccess()

  const area = getAreaForRoute(location.pathname)
  const isAdminRoute = location.pathname.startsWith("/usuarios")

  useEffect(() => {
    if (isProfileLoading) return
    if (!profile) return

    if (isInactive) return

    if (isAdminRoute && !isAdmin) {
      toast.error("Acesso negado")
      navigate("/home", { replace: true })
      return
    }

    if (area && !canAccess(area)) {
      toast.error("Acesso negado")
      navigate("/home", { replace: true })
    }
  }, [area, canAccess, isAdmin, isAdminRoute, isInactive, isProfileLoading, navigate, profile])

  if (isProfileLoading) {
    return <LoadingState message="Carregando permissões..." />
  }

  if (isError || !profile) {
    return <Navigate to="/login" replace />
  }

  if (isInactive) {
    return <Navigate to="/acesso-negado" replace />
  }

  return <>{children}</>
}
