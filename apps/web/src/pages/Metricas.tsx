import { useState, useMemo } from "react"
import {
  MessageSquare,
  AlertTriangle,
  AlertOctagon,
  Activity,
  Download,
  Pencil,
  CalendarIcon,
  FolderOpen,
  Lightbulb,
  Trash2,
  CheckCircle2,
} from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { format, subDays, isWithinInterval, parseISO, startOfDay, endOfDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { EmptyState } from "@/components/shared/EmptyState"
import { ErrorState } from "@/components/shared/ErrorState"
import { LoadingState } from "@/components/shared/LoadingState"
import { PaginationControls } from "@/components/shared/PaginationControls"
import { useHallucinationAlerts } from "@/hooks/useHallucinationAlerts"
import type { HallucinationAlertStatus } from "@/hooks/useHallucinationAlerts"
import { useHallucinationRate } from "@/hooks/useHallucinationRate"
import { useLeads } from "@/hooks/useLeads"
import { useOrientacoes } from "@/hooks/useOrientacoes"
import { generateMetricsReport } from "@/services/report"
import { cn } from "@/lib/utils"
import galwanLogo from "@/assets/galwan-logo.png"


const ITEMS_PER_PAGE = 10


export function Metricas() {
  const {
    alerts,
    isLoading: alertsLoading,
    isError: alertsError,
    error: alertsErr,
    refetch: refetchAlerts,
    deleteHallucinationAlert,
    updateHallucinationAlert,
  } = useHallucinationAlerts()
  const { leads, isLoading: leadsLoading, isError: leadsError, error: leadsErr, refetch: refetchLeads } = useLeads()
  const { orientacoes, isLoading: orientacoesLoading, isError: orientacoesError, error: orientacoesErr, refetch: refetchOrientacoes, deleteOrientacao, updateOrientacao } = useOrientacoes()

  const [editingAlert, setEditingAlert] = useState<(typeof alerts)[0] | null>(null)
  const [editedStatus, setEditedStatus] = useState<HallucinationAlertStatus | null>(null)
  const [selectedOrientacao, setSelectedOrientacao] = useState<(typeof orientacoes)[0] | null>(null)
  const [confirmDeleteOrientacao, setConfirmDeleteOrientacao] = useState(false)
  const [confirmDeleteAlert, setConfirmDeleteAlert] = useState(false)
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [currentPage, setCurrentPage] = useState(1)
  const [severityFilter, setSeverityFilter] = useState<string>("all")

  const { defaultRateStart, defaultRateEnd } = useMemo(() => {
    const now = new Date()
    return {
      defaultRateStart: startOfDay(subDays(now, 30)),
      defaultRateEnd: endOfDay(now),
    }
  }, [])
  const rateQueryStart = useMemo(
    () => (startDate ? startOfDay(startDate) : defaultRateStart),
    [startDate, defaultRateStart],
  )
  const rateQueryEnd = useMemo(
    () => (endDate ? endOfDay(endDate) : defaultRateEnd),
    [endDate, defaultRateEnd],
  )
  const { data: hallucinationData } = useHallucinationRate(rateQueryStart, rateQueryEnd)
  const isRateFilterActive = Boolean(startDate || endDate)
  const hallucinationTitle = isRateFilterActive
    ? `Alucinação de ${format(rateQueryStart, "dd/MM/yyyy")} até ${format(rateQueryEnd, "dd/MM/yyyy")}`
    : "Alucinação nos últimos 30 dias"

  const filteredLeadsByDate = useMemo(() => {
    if (!startDate && !endDate) return leads
    return leads.filter((lead) => {
      const leadDate = lead.created_at ? parseISO(lead.created_at) : null
      if (!leadDate) return false
      if (startDate && endDate)
        return isWithinInterval(leadDate, { start: startOfDay(startDate), end: endOfDay(endDate) })
      if (startDate) return leadDate >= startOfDay(startDate)
      if (endDate) return leadDate <= endOfDay(endDate)
      return true
    })
  }, [leads, startDate, endDate])

  const filteredAlertsByDate = useMemo(() => {
    if (!startDate && !endDate) return alerts
    return alerts.filter((alert) => {
      if (!alert.created_at) return false
      try {
        const alertDate = parseISO(alert.created_at)
        if (startDate && endDate)
          return isWithinInterval(alertDate, { start: startOfDay(startDate), end: endOfDay(endDate) })
        if (startDate) return alertDate >= startOfDay(startDate)
        if (endDate) return alertDate <= endOfDay(endDate)
        return true
      } catch {
        return false
      }
    })
  }, [alerts, startDate, endDate])

  const filteredOrientacoesByDate = useMemo(() => {
    if (!startDate && !endDate) return orientacoes
    return orientacoes.filter((orientacao) => {
      const d = orientacao.created_at ? parseISO(orientacao.created_at) : null
      if (!d) return false
      if (startDate && endDate)
        return isWithinInterval(d, { start: startOfDay(startDate), end: endOfDay(endDate) })
      if (startDate) return d >= startOfDay(startDate)
      if (endDate) return d <= endOfDay(endDate)
      return true
    })
  }, [orientacoes, startDate, endDate])

  const kpis = useMemo(() => {
    const totalAlerts = filteredAlertsByDate.length
    const highSeverityAlerts = filteredAlertsByDate.filter((a) => a.severity === "Alto").length
    const totalLeads = filteredLeadsByDate.length
    const rateLabel = hallucinationData && hallucinationData.totalMessages > 0
      ? `${hallucinationData.rate.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`
      : "—"
    return [
      { title: "Total de Leads", value: totalLeads.toString(), subtitle: undefined, icon: MessageSquare, iconBg: "bg-primary/10", iconText: "text-primary" },
      { title: "Alertas", value: totalAlerts.toString(), subtitle: undefined, icon: AlertTriangle, iconBg: "bg-amber-100", iconText: "text-amber-700" },
      { title: "Alertas Graves", value: highSeverityAlerts.toString(), subtitle: undefined, icon: AlertOctagon, iconBg: "bg-destructive/10", iconText: "text-destructive" },
      { title: hallucinationTitle, value: rateLabel, subtitle: "% de respostas incorretas", icon: Activity, iconBg: "bg-secondary/10", iconText: "text-secondary" },
    ]
  }, [filteredAlertsByDate, filteredLeadsByDate, hallucinationData, hallucinationTitle])

  const chartData = useMemo(() => {
    const alertsByDate = filteredAlertsByDate.reduce(
      (acc, alert) => {
        if (!alert.created_at) return acc
        const iso = parseISO(alert.created_at)
        const key = format(iso, "yyyy-MM-dd")
        if (!acc[key]) {
          acc[key] = { count: 0, label: format(iso, "dd/MM/yyyy", { locale: ptBR }) }
        }
        acc[key].count += 1
        return acc
      },
      {} as Record<string, { count: number; label: string }>,
    )
    return Object.entries(alertsByDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7)
      .map(([, { count, label }]) => ({ day: label, alerts: count }))
  }, [filteredAlertsByDate])

  const barData = useMemo(() => {
    const severityCounts = filteredAlertsByDate.reduce(
      (acc, alert) => {
        if (alert.severity) acc[alert.severity] = (acc[alert.severity] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )
    return [
      { severity: "Baixo", count: severityCounts["Baixo"] || 0 },
      { severity: "Médio", count: severityCounts["Médio"] || 0 },
      { severity: "Alto", count: severityCounts["Alto"] || 0 },
    ]
  }, [filteredAlertsByDate])

  const filteredAlerts = useMemo(() => {
    return filteredAlertsByDate.filter((alert) => {
      if (severityFilter === "all") return true
      return alert.severity === severityFilter
    })
  }, [filteredAlertsByDate, severityFilter])

  if (alertsLoading || leadsLoading || orientacoesLoading) {
    return <LoadingState message="Carregando métricas..." />
  }

  if (alertsError && leadsError && orientacoesError) {
    const firstError = alertsErr ?? leadsErr ?? orientacoesErr
    const handleRetry = () => {
      refetchAlerts()
      refetchLeads()
      refetchOrientacoes()
    }
    return <ErrorState error={firstError} title="Erro ao carregar métricas" onRetry={handleRetry} />
  }

  const totalPages = Math.ceil(filteredAlerts.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedAlerts = filteredAlerts.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleDownloadReport = async (overrideStart?: Date, overrideEnd?: Date) => {
    const reportStart = overrideStart ?? startDate ?? subDays(new Date(), 30)
    const reportEnd = overrideEnd ?? endDate ?? new Date()
    try {
      await generateMetricsReport({ startDate: reportStart, endDate: reportEnd, leads, alerts, orientacoes, logoUrl: galwanLogo })
      toast.success("Relatório PDF gerado com sucesso!")
    } catch {
      toast.error("Erro ao gerar relatório.")
    }
  }

  const handleEditAlert = (alert: (typeof alerts)[0]) => {
    setEditingAlert(alert)
    setEditedStatus(alert.status ?? null)
  }

  const handleCloseEditAlert = () => {
    setEditingAlert(null)
    setEditedStatus(null)
  }

  const handleSaveAlertStatus = () => {
    if (!editingAlert || editedStatus === null) return
    updateHallucinationAlert.mutate(
      { id: editingAlert.id, status: editedStatus },
      { onSuccess: () => handleCloseEditAlert() },
    )
  }

  const handleDeleteAlert = () => {
    if (!editingAlert) return
    deleteHallucinationAlert.mutate(editingAlert.id, {
      onSuccess: () => { handleCloseEditAlert(); setConfirmDeleteAlert(false) },
    })
  }

  const statusChanged = editingAlert && editedStatus !== (editingAlert.status ?? null)
  const STATUS_OPTIONS: HallucinationAlertStatus[] = [
    "pendente",
    "em andamento",
    "em testes",
    "resolvido",
    "cancelado",
  ]

  const handleDeleteOrientacao = () => {
    if (!selectedOrientacao) return
    deleteOrientacao.mutate(selectedOrientacao.id, {
      onSuccess: () => { setSelectedOrientacao(null); setConfirmDeleteOrientacao(false) },
    })
  }

  return (
    <>
      <div className="space-y-8">
        {/* Filtros de data + Download */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("justify-start text-left font-normal", !startDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "dd/MM/yyyy") : "Data inicial"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  className="pointer-events-auto"
                  disabled={(date) =>
                    date < new Date("2025-10-01") || date > new Date() || (endDate ? date > endDate : false)
                  }
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("justify-start text-left font-normal", !endDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "dd/MM/yyyy") : "Data final"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  className="pointer-events-auto"
                  disabled={(date) =>
                    date < new Date("2025-10-01") || date > new Date() || (startDate ? date < startDate : false)
                  }
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button
            onClick={() => handleDownloadReport()}
            className="gap-2 border-0 bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow hover:opacity-90 hover:shadow-md"
          >
            <Download className="h-4 w-4" />
            Baixar Relatório
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi) => {
            const Icon = kpi.icon
            return (
              <Card
                key={kpi.title}
                className="group overflow-hidden rounded-xl border-0 bg-card p-6 shadow transition-all hover:shadow-md"
              >
                <CardHeader className="flex flex-col items-start gap-3 p-0 pb-3">
                  <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${kpi.iconBg} ${kpi.iconText}`}>
                    <Icon className="size-5" />
                  </div>
                  <CardTitle className="text-sm font-semibold text-muted-foreground">{kpi.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="text-4xl font-bold tracking-tight text-foreground">{kpi.value}</div>
                  {kpi.subtitle && (
                    <div className="mt-1 text-xs text-muted-foreground">{kpi.subtitle}</div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="overflow-hidden rounded-xl border-0 shadow">
            <div className="bg-gradient-to-r from-primary to-secondary p-4">
              <CardTitle className="p-0 text-lg text-primary-foreground">Alertas por Dia</CardTitle>
            </div>
            <CardContent className="p-6 pt-4">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="alerts" stroke="hsl(244, 42%, 30%)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-xl border-0 shadow">
            <div className="bg-gradient-to-r from-primary to-secondary p-4">
              <CardTitle className="p-0 text-lg text-primary-foreground">Alertas por Gravidade</CardTitle>
            </div>
            <CardContent className="p-6 pt-4">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="severity" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(208, 35%, 46%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Alertas */}
        <Card className="overflow-hidden rounded-xl border-0 shadow">
          <div className="flex flex-col gap-3 bg-gradient-to-r from-primary to-secondary p-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="p-0 text-xl text-primary-foreground">Alertas de alucinação</CardTitle>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-full border-0 bg-primary-foreground/20 text-primary-foreground sm:w-[150px]">
                  <SelectValue placeholder="Gravidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="Alto">Alto</SelectItem>
                  <SelectItem value="Médio">Médio</SelectItem>
                  <SelectItem value="Baixo">Baixo</SelectItem>
                </SelectContent>
              </Select>

            </div>
          </div>

          <CardContent className="p-6 pt-4">
            {paginatedAlerts.length === 0 ? (
              <EmptyState
                icon={FolderOpen}
                title="Nenhum alerta encontrado"
                description="Não há alertas de alucinação que correspondam aos filtros selecionados."
              />
            ) : (
              <>
                <div className="overflow-x-auto rounded-xl shadow">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Data</TableHead>
                        <TableHead>Título</TableHead>
                        <TableHead>Gravidade</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedAlerts.map((alert) => (
                        <TableRow
                          key={alert.id}
                          className="cursor-pointer transition-colors hover:bg-accent/15"
                          onClick={() => handleEditAlert(alert)}
                        >
                          <TableCell>
                            {alert.created_at
                              ? format(parseISO(alert.created_at), "dd/MM/yyyy", { locale: ptBR })
                              : "N/A"}
                          </TableCell>
                          <TableCell>{alert.title?.trim() || "—"}</TableCell>
                          <TableCell>
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-medium ${
                                alert.severity === "Alto"
                                  ? "bg-red-100 text-red-700"
                                  : alert.severity === "Médio"
                                    ? "bg-amber-100 text-amber-800"
                                    : alert.severity === "Baixo"
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {alert.severity ?? "—"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-medium ${
                                alert.status === "resolvido"
                                  ? "bg-green-100 text-green-700"
                                  : alert.status === "em andamento"
                                    ? "bg-blue-100 text-blue-700"
                                    : alert.status === "em testes"
                                      ? "bg-purple-100 text-purple-700"
                                      : alert.status === "cancelado"
                                        ? "bg-muted text-muted-foreground line-through"
                                        : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {alert.status ?? "pendente"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditAlert(alert)
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {totalPages > 1 && (
                  <div className="mt-4 flex justify-center">
                    <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Orientações */}
        <Card className="overflow-hidden rounded-xl border-0 shadow">
          <div className="bg-gradient-to-r from-primary to-secondary p-4">
            <CardTitle className="p-0 text-xl text-primary-foreground">Orientações de Melhoria do Agente</CardTitle>
          </div>
          <CardContent className="p-6 pt-4">
            {filteredOrientacoesByDate.length === 0 ? (
              <EmptyState
                icon={Lightbulb}
                title="Nenhuma orientação registrada"
                description="As orientações para melhoria do agente aparecerão aqui."
              />
            ) : (
              <div className="space-y-4">
                {filteredOrientacoesByDate.map((orientacao) => (
                  <div
                    key={orientacao.id}
                    className={cn(
                      "cursor-pointer rounded-xl bg-card p-4 shadow transition-all hover:shadow-md",
                      orientacao.is_resolved ? "bg-green-50/50 hover:bg-green-100/50" : "hover:bg-accent/15",
                    )}
                    onClick={() => setSelectedOrientacao(orientacao)}
                  >
                    <div className="flex items-start gap-3">
                      {orientacao.is_resolved ? (
                        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-green-600" />
                      ) : (
                        <Lightbulb className="mt-0.5 size-5 shrink-0 text-primary" />
                      )}
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                            {orientacao.category}
                          </span>
                          {orientacao.is_resolved && (
                            <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                              Implementado
                            </span>
                          )}
                        </div>
                        <p className={cn("font-medium", orientacao.is_resolved && "text-muted-foreground")}>
                          {orientacao.problem_description}
                        </p>
                        <p className="line-clamp-2 text-sm text-muted-foreground">{orientacao.reason}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog editar alerta */}
      <Dialog open={!!editingAlert} onOpenChange={(open) => { if (!open) handleCloseEditAlert() }}>
        <DialogContent
          withGradientHeader
          className="mx-auto flex max-h-[calc(100vh-48px)] w-[calc(100%-32px)] max-w-lg flex-col p-0 sm:max-h-[85vh]"
        >
          <div className="shrink-0 rounded-t-xl bg-gradient-to-r from-primary to-secondary px-4 pb-4 pt-6 sm:px-6">
            <DialogHeader>
              <DialogTitle className="text-primary-foreground">Alerta de alucinação</DialogTitle>
              <DialogDescription className="text-primary-foreground/80">
                Apenas o status pode ser alterado
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
            {editingAlert && (
              <>
                <div>
                  <Label className="text-muted-foreground">Título</Label>
                  <p className="mt-1 text-base font-semibold">{editingAlert.title?.trim() || "—"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Registrado em</Label>
                  <p className="mt-1 text-sm">
                    {editingAlert.created_at
                      ? format(parseISO(editingAlert.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                      : "—"}
                  </p>
                </div>
                <div>
                  <Label htmlFor="alert-status">Status</Label>
                  <Select
                    value={editedStatus ?? undefined}
                    onValueChange={(value) => setEditedStatus(value as HallucinationAlertStatus)}
                    disabled={updateHallucinationAlert.isPending}
                  >
                    <SelectTrigger id="alert-status" className="mt-1">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-muted-foreground">Gravidade</Label>
                  <p className="mt-1 text-sm">{editingAlert.severity ?? "—"}</p>
                </div>
                {editingAlert.number_incorrect_messages != null ? (
                  <div>
                    <Label className="text-muted-foreground">Mensagens incorretas</Label>
                    <p className="mt-1 text-sm">{editingAlert.number_incorrect_messages}</p>
                  </div>
                ) : null}
                <div>
                  <Label className="text-muted-foreground">Descrição</Label>
                  <p className="mt-1 text-sm">{editingAlert.description || "Sem descrição"}</p>
                </div>
              </>
            )}
          </div>
          <DialogFooter className="shrink-0 flex-col gap-2 border-t border-border px-4 py-4 sm:flex-row sm:px-6">
            <Button variant="destructive" onClick={() => setConfirmDeleteAlert(true)} className="gap-2">
              <Trash2 className="h-4 w-4" />
              Deletar
            </Button>
            <div className="hidden sm:block sm:flex-1" />
            <Button variant="outline" onClick={handleCloseEditAlert} disabled={updateHallucinationAlert.isPending}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveAlertStatus}
              disabled={!statusChanged || updateHallucinationAlert.isPending}
            >
              {updateHallucinationAlert.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog orientação */}
      <Dialog open={!!selectedOrientacao} onOpenChange={() => setSelectedOrientacao(null)}>
        <DialogContent
          withGradientHeader
          className="mx-auto flex max-h-[calc(100dvh-32px)] w-[calc(100%-32px)] max-w-lg flex-col p-0 sm:max-h-[85vh]"
        >
          <div className="shrink-0 rounded-t-xl bg-gradient-to-r from-primary to-secondary px-4 pb-4 pt-6 sm:px-6">
            <DialogHeader>
              <DialogTitle className="text-primary-foreground">Detalhes da Orientação</DialogTitle>
              <DialogDescription className="text-primary-foreground/80">
                Informações sobre a melhoria sugerida para o agente
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
            {selectedOrientacao && (
              <>
                <div>
                  <Label className="text-muted-foreground">Categoria</Label>
                  <div className="mt-1">
                    <span className="rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
                      {selectedOrientacao.category}
                    </span>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Descrição do Problema</Label>
                  <p className="mt-1 text-base">{selectedOrientacao.problem_description}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Motivo e Solução</Label>
                  <p className="mt-1 text-base">{selectedOrientacao.reason}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Registrado em</Label>
                  <p className="mt-1 text-sm">
                    {selectedOrientacao.created_at
                      ? format(parseISO(selectedOrientacao.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                      : "—"}
                  </p>
                </div>
                <div className="border-t pt-2">
                  <Label className="text-muted-foreground">Status de Implementação</Label>
                  <div className="mt-2">
                    {selectedOrientacao.is_resolved ? (
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-2 rounded-full bg-green-100 px-3 py-1.5 text-sm font-medium text-green-700">
                          <CheckCircle2 className="h-4 w-4" />
                          Implementado
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            updateOrientacao.mutate({ id: selectedOrientacao.id, is_resolved: false })
                            setSelectedOrientacao({ ...selectedOrientacao, is_resolved: false })
                          }}
                          disabled={updateOrientacao.isPending}
                        >
                          Desfazer
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => {
                          updateOrientacao.mutate({ id: selectedOrientacao.id, is_resolved: true })
                          setSelectedOrientacao({ ...selectedOrientacao, is_resolved: true })
                        }}
                        disabled={updateOrientacao.isPending}
                        className="gap-2 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Marcar como Implementado
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter className="shrink-0 flex-col gap-2 border-t border-border px-4 py-4 sm:flex-row sm:px-6">
            <Button variant="destructive" onClick={() => setConfirmDeleteOrientacao(true)} className="gap-2">
              <Trash2 className="h-4 w-4" />
              Deletar
            </Button>
            <div className="hidden sm:block sm:flex-1" />
            <Button variant="outline" onClick={() => setSelectedOrientacao(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDeleteOrientacao}
        onOpenChange={setConfirmDeleteOrientacao}
        title="Deletar Orientação"
        description="Tem certeza que deseja deletar esta orientação? Esta ação não pode ser desfeita."
        confirmLabel={deleteOrientacao.isPending ? "Deletando..." : "Deletar"}
        onConfirm={handleDeleteOrientacao}
        variant="destructive"
      />

      <ConfirmDialog
        open={confirmDeleteAlert}
        onOpenChange={setConfirmDeleteAlert}
        title="Deletar alerta"
        description="Tem certeza que deseja deletar este alerta de alucinação? Esta ação não pode ser desfeita."
        confirmLabel={deleteHallucinationAlert.isPending ? "Deletando..." : "Deletar"}
        onConfirm={handleDeleteAlert}
        variant="destructive"
      />
    </>
  )
}

export default Metricas
