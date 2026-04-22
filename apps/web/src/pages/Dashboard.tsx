import { Users, UserCheck, AlertTriangle, Percent, Lightbulb, CheckCircle2 } from "lucide-react"
import { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { endOfDay, format, parseISO, startOfDay } from "date-fns"
import { ptBR } from "date-fns/locale"

import { AlertItem } from "@/components/dashboard/AlertItem"
import { KpiCard } from "@/components/dashboard/KpiCard"
import { SectionCard } from "@/components/dashboard/SectionCard"
import { useCanAccess } from "@/hooks/useCanAccess"
import { useHallucinationAlerts } from "@/hooks/useHallucinationAlerts"
import { useHallucinationRate } from "@/hooks/useHallucinationRate"
import { useOrientacoes } from "@/hooks/useOrientacoes"

export function Dashboard() {
  const navigate = useNavigate()
  const { canAccess } = useCanAccess()
  const canViewHallucination = canAccess("insights")
  const { alerts, isLoading } = useHallucinationAlerts({ enabled: canViewHallucination })
  const { orientacoes, isLoading: orientacoesLoading } = useOrientacoes({
    enabled: canViewHallucination,
  })

  const { todayStart, todayEnd } = useMemo(() => {
    const now = new Date()
    return { todayStart: startOfDay(now), todayEnd: endOfDay(now) }
  }, [])
  const { data: todayRate } = useHallucinationRate(todayStart, todayEnd, {
    enabled: canViewHallucination,
  })

  const rateLabel =
    todayRate && todayRate.totalMessages > 0
      ? `${todayRate.rate.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`
      : "—"
  const incorrectLabel = todayRate ? todayRate.totalIncorrect.toString() : "—"

  const latestAlerts = useMemo(() => alerts.slice(0, 5), [alerts])
  const latestOrientacoes = useMemo(() => orientacoes.slice(0, 5), [orientacoes])

  return (
    <>
      <div
        className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${
          canViewHallucination ? "lg:grid-cols-4" : "lg:grid-cols-2"
        }`}
      >
        <KpiCard
          label="Leads Atendidos"
          value={0}
          subtitle="Total de leads"
          icon={Users}
          iconColor="text-secondary"
          iconBg="bg-secondary/10"
        />
        <KpiCard
          label="Clientes Enviados"
          value={0}
          subtitle="Para corretores"
          icon={UserCheck}
          iconColor="text-primary"
          iconBg="bg-primary/10"
        />
        {canViewHallucination && (
          <>
            <KpiCard
              label="Mensagens Incorretas"
              value={incorrectLabel}
              subtitle="Total registrado hoje"
              icon={AlertTriangle}
              iconColor="text-destructive"
              iconBg="bg-destructive/10"
            />
            <KpiCard
              label="Alucinação do Dia"
              value={rateLabel}
              subtitle="% de respostas incorretas"
              icon={Percent}
              iconColor="text-secondary"
              iconBg="bg-secondary/10"
            />
          </>
        )}
      </div>

      {!canViewHallucination ? (
        <div className="mt-6 rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Você não tem permissão para ver esses dados
          </p>
        </div>
      ) : (
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Últimos Alertas" onViewAll={() => navigate("/metricas")}>
          {isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Carregando...</p>
          ) : latestAlerts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhum alerta registrado
            </p>
          ) : (
            latestAlerts.map((alert) => (
              <AlertItem
                key={alert.id}
                message={alert.title?.trim() || "Alerta sem título"}
                date={
                  alert.created_at
                    ? format(parseISO(alert.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                    : "—"
                }
                severity={
                  alert.severity === "Alto"
                    ? "high"
                    : alert.severity === "Médio"
                      ? "medium"
                      : "low"
                }
              />
            ))
          )}
        </SectionCard>

        <SectionCard title="Orientações e Melhorias" onViewAll={() => navigate("/metricas")}>
          {orientacoesLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Carregando...</p>
          ) : latestOrientacoes.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma orientação registrada
            </p>
          ) : (
            latestOrientacoes.map((orientacao) => {
              const resolved = orientacao.is_resolved === true
              const Icon = resolved ? CheckCircle2 : Lightbulb
              const iconColor = resolved ? "text-green-700" : "text-primary"
              const iconBg = resolved ? "bg-green-100" : "bg-primary/10"
              return (
                <div
                  key={orientacao.id}
                  className="flex items-start gap-3 border-b border-border py-3 last:border-b-0"
                >
                  <div
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${iconBg}`}
                  >
                    <Icon className={`size-3.5 ${iconColor}`} />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm text-foreground">
                      {orientacao.problem_description?.trim() || "Orientação sem descrição"}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {orientacao.created_at
                        ? format(parseISO(orientacao.created_at), "dd/MM/yyyy 'às' HH:mm", {
                            locale: ptBR,
                          })
                        : "—"}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </SectionCard>
      </div>
      )}
    </>
  )
}

export default Dashboard
