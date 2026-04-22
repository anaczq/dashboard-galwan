import { lazy, Suspense } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"

import { ErrorBoundary } from "@/components/shared/ErrorBoundary"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { AccessGuard } from "@/components/auth/AccessGuard"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { AuthProvider } from "@/components/auth/AuthProvider"
import { LoadingState } from "@/components/shared/LoadingState"
import { RouteErrorBoundary } from "@/components/shared/RouteErrorBoundary"
import { Login } from "@/pages/Login"
import { ResetPassword } from "@/pages/ResetPassword"
import { UpdatePassword } from "@/pages/UpdatePassword"
import { DefinirSenha } from "@/pages/DefinirSenha"
import { NotFound } from "@/pages/NotFound"
import { AcessoNegado } from "@/pages/AcessoNegado"

const Dashboard = lazy(() => import("@/pages/Dashboard"))
const Leads = lazy(() => import("@/pages/Leads"))
const Metricas = lazy(() => import("@/pages/Metricas"))
const Projetos = lazy(() => import("@/pages/Projetos"))
const Corretores = lazy(() => import("@/pages/Corretores"))
const Perfil = lazy(() => import("@/pages/Perfil"))
const Prompt = lazy(() => import("@/pages/Prompt"))
const Usuarios = lazy(() => import("@/pages/Usuarios"))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/update-password" element={<UpdatePassword />} />
                <Route path="/definir-senha" element={<DefinirSenha />} />
                <Route
                  path="/acesso-negado"
                  element={
                    <ProtectedRoute>
                      <AcessoNegado />
                    </ProtectedRoute>
                  }
                />
                <Route
                  element={
                    <ProtectedRoute>
                      <AccessGuard>
                        <DashboardLayout />
                      </AccessGuard>
                    </ProtectedRoute>
                  }
                >
                  <Route path="/home" element={<Suspense fallback={<LoadingState />}><Dashboard /></Suspense>} errorElement={<RouteErrorBoundary />} />
                  <Route path="/leads" element={<Suspense fallback={<LoadingState />}><Leads /></Suspense>} errorElement={<RouteErrorBoundary />} />
                  <Route path="/metricas" element={<Suspense fallback={<LoadingState />}><Metricas /></Suspense>} errorElement={<RouteErrorBoundary />} />
                  <Route path="/projetos" element={<Suspense fallback={<LoadingState />}><Projetos /></Suspense>} errorElement={<RouteErrorBoundary />} />
                  <Route path="/corretores" element={<Suspense fallback={<LoadingState />}><Corretores /></Suspense>} errorElement={<RouteErrorBoundary />} />
                  <Route path="/perfil" element={<Suspense fallback={<LoadingState />}><Perfil /></Suspense>} errorElement={<RouteErrorBoundary />} />
                  <Route path="/prompt" element={<Suspense fallback={<LoadingState />}><Prompt /></Suspense>} errorElement={<RouteErrorBoundary />} />
                  <Route path="/usuarios" element={<Suspense fallback={<LoadingState />}><Usuarios /></Suspense>} errorElement={<RouteErrorBoundary />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
